import { mkdir, writeFile } from "node:fs/promises";

const metrics = [
  { label: "Pages publiées", value: 12, change: "+3" },
  { label: "Visiteurs cette semaine", value: 248, change: "+18%" },
  { label: "Temps moyen de lecture", value: "4 min", change: "+12%" },
];

const rows = metrics
  .map(
    ({ label, value, change }) =>
      `| ${label} | **${value}** | <span class="change">${change}</span> |`,
  )
  .join("\n");

const report = `| Indicateur | Valeur | Évolution |\n|:--|--:|--:|\n${rows}`;

await mkdir("data", { recursive: true });
await writeFile("data/metrics.json", JSON.stringify(metrics, null, 2) + "\n");
await writeFile("data/metrics.md", report + "\n");
console.log("Données générées dans data/metrics.json et data/metrics.md");