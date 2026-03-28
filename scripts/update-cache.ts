import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fetchCcfddl } from "../src/lib/data/fetch-ccfddl";
import { fetchHfDeadlines } from "../src/lib/data/fetch-hf";
import { mergeSources } from "../src/lib/data/merge-sources";

async function main() {
  console.log("Fetching ccfddl...");
  const ccfddl = await fetchCcfddl();
  console.log(`  → ${ccfddl.length} entries`);

  console.log("Fetching HF deadlines...");
  const hf = await fetchHfDeadlines();
  console.log(`  → ${hf.length} entries`);

  const merged = mergeSources(ccfddl, hf);
  console.log(`Merged: ${merged.length} conferences`);

  const outPath = resolve(__dirname, "../src/lib/data/cache.json");
  writeFileSync(outPath, JSON.stringify(merged, null, 2));
  console.log(`Cache written to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
