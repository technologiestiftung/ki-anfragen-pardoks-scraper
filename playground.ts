import fs from "node:fs";

const content = fs.readFileSync("data/pardok-wp19.json", "utf-8");
const json = JSON.parse(content);
console.log(json.Export.Vorgang[5]);
