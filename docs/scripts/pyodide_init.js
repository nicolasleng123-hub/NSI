import { EditorView, basicSetup } from "https://esm.sh/codemirror";
import { python } from "https://esm.sh/@codemirror/lang-python";
import { keymap } from "https://esm.sh/@codemirror/view";

document.addEventListener("DOMContentLoaded", function () {
    let pyodidePromise;
    const getPyodide = function () {
        if (!pyodidePromise) {
        pyodidePromise = loadPyodide({indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/"} || {});
        }
        return pyodidePromise;
    };
    
    const resetKernel = function () {
        pyodidePromise = undefined;
        document.querySelectorAll(".python-output").forEach(function (output) {
            output.textContent = "";
            output.hidden = true;
        });
    };

    const tabKeymap = keymap.of([
    {
        key: "Tab",
        run: (view) => {
        view.dispatch(
            view.state.replaceSelection("    ")
        );
        return true;
        }
    }
    ]);

    let cells = document.querySelectorAll("#editor");

    cells.forEach(cell => {
        let wrapper = document.createElement("div");
        wrapper.className = "python-cell-wrapper";
        
        let editorView = new EditorView({
        doc: cell.textContent,
        extensions: [
            tabKeymap,
            basicSetup,
            python()
        ],
        parent: wrapper
        });
        
        
        let button = document.createElement("button");
        button.type = "button";
        button.className = "python-run-button";
        button.textContent = "Executer";
        wrapper.appendChild(button);

        button.addEventListener("click", async function () {
            button.disabled = true;
            button.textContent = "Chargement de Python...";
            output.hidden = false;
            output.textContent = "";

            try {
                let pyodide = await getPyodide();
                let capturedOutput = "";
                pyodide.setStdout({
                batched: function (text) {
                    capturedOutput += text + "\n";
                }
                });
                let result = await pyodide.runPythonAsync(editorView.state.doc.toString());
                let resultText = result === undefined ? "" : String(result);
                output.textContent = capturedOutput + resultText;
                if (result && typeof result.destroy === "function") {
                result.destroy();
                }
            } catch (error) {
                output.textContent = String(error);
            } finally {
                button.disabled = false;
                button.textContent = "Executer";
            }
        });

        let resetButton = document.createElement("button");
        resetButton.type = "button";
        resetButton.className = "python-reset-button";
        resetButton.textContent = "Réinitialiser Python";
        wrapper.appendChild(resetButton);

        resetButton.addEventListener("click", function () {
            resetButton.disabled = true;
            resetButton.textContent = "Réinitialisation...";
            resetKernel();
            resetButton.textContent = "Réinitialiser Python";
            resetButton.disabled = false;
        });

        let output = document.createElement("pre");
        output.className = "python-output";
        output.hidden = true;
        wrapper.appendChild(output);


        cell.appendChild(wrapper);


    });
});