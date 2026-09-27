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

        // Récupérer le texte visible avec retours à la ligne et vider la cellule
        const source = (cell.innerText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        cell.innerHTML = "";

        let editorView = new EditorView({
            doc: source,
            extensions: [tabKeymap, basicSetup, python()],
            parent: wrapper
        });

        // Output element (une par bloc)
        let output = document.createElement("pre");
        output.className = "python-output";
        output.hidden = true;
        wrapper.appendChild(output);

        // Bouton d'exécution
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

                pyodide.setStdout({
                    batched: (text) => {
                        output.textContent += text+"\n";
                        output.scrollTop = output.scrollHeight;
                    }
                });
                pyodide.setStderr({
                    batched: (text) => {
                        output.textContent += text+"\n";
                        output.scrollTop = output.scrollHeight;
                    }
                });

                let result = await pyodide.runPythonAsync(editorView.state.doc.toString());
                if (result !== undefined && result !== null) {
                    output.textContent += String(result);
                    output.scrollTop = output.scrollHeight;
                }
                if (result && typeof result.destroy === "function") {
                    result.destroy();
                }
            } catch (error) {
                output.textContent += String(error);
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

        cell.appendChild(wrapper);
    });
});