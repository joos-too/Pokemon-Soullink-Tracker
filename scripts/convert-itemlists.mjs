import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const itemlistsDir = path.join(__dirname, "..", "Itemlists");
const outputDir = path.join(__dirname, "..", "Itemlists", "json");

fs.mkdirSync(outputDir, { recursive: true });

const files = fs.readdirSync(itemlistsDir).filter((f) => f.endsWith(".txt"));

for (const file of files) {
  const content = fs.readFileSync(path.join(itemlistsDir, file), "utf-8");
  const items = [];
  const seen = new Set();

  for (const line of content.split("\n")) {
    const deMatch = line.match(/\|de=([^|}]+)/);
    const enMatch = line.match(/\|en=([^|}]+)/);
    if (deMatch && enMatch) {
      const de = deMatch[1].trim().toLowerCase();
      const en = enMatch[1].trim().toLowerCase();
      const key = `${de}|||${en}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ de, en });
      }
    }
  }

  const outName = file.replace(/\.txt$/, ".json");
  fs.writeFileSync(
    path.join(outputDir, outName),
    JSON.stringify(items, null, 2),
    "utf-8",
  );
  console.log(`${outName}: ${items.length} items`);
}

console.log("Done!");
