import { timetableClient } from "./api";

const [prefix, term, ...groupArgs] = Bun.argv.slice(2);
if (!prefix || !term) {
  console.log('Usage: bun run index.ts "SIAu>SI1" "2026/2027-Z" [152006:1 152005:1]');
  process.exitCode = 1;
} else {
  try {
    const selections = groupArgs.map(value => {
      const match = /^(\d+):(\d+)$/.exec(value);
      if (!match) throw new Error(`Invalid group: ${value}; expected unitId:groupNumber`);
      return { unitId: match[1]!, groupNumber: Number(match[2]) };
    });
    const catalog = await timetableClient.getCatalog(prefix, term);
    console.log(JSON.stringify(catalog, null, 2));
    if (catalog.searchMayBeTruncated) console.warn("Search reached USOS's 100-result limit; use a narrower prefix.");
    if (selections.length) {
      const timetable = await timetableClient.getTimetable(catalog, selections);
      console.log(JSON.stringify(timetable, null, 2));
      if (!timetable.complete) process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
