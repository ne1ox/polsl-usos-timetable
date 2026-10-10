// Explicit live check, deliberately excluded from bun test. Four requests for one course/group.
import { createTimetableClient, createMemoryCache } from "../api";

const requests: string[] = [];
const networkFetch = globalThis.fetch.bind(globalThis);
const client = createTimetableClient({
  cache: createMemoryCache(),
  fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    requests.push(url.pathname);
    const response = await networkFetch(input, init);
    if (response.headers.get("Access-Control-Allow-Origin") !== "*") {
      throw new Error(`Unexpected CORS response from ${url.pathname}`);
    }
    return response;
  }) as typeof fetch,
});

const catalog = await client.getCatalog("SIAu>SI1-Mat-26", "2026/2027-Z");
const unit = catalog.courses.find(course => course.groupCount > 0);
if (!unit) throw new Error("No groups found for the smoke-test course");
const selection = [{ unitId: unit.unitId, groupNumber: unit.groupNumbers[0]! }];
const timetable = await client.getTimetable(catalog, selection);
if (!timetable.complete || !timetable.events.length) throw new Error(JSON.stringify(timetable.failures));
const beforeCachedRead = requests.length;
await client.getCatalog(catalog.prefix, catalog.term);
await client.getTimetable(catalog, selection);
if (requests.length !== beforeCachedRead) throw new Error("Cached reads issued network requests");

const browserBuild = await Bun.build({ entrypoints: ["./api/index.ts"], target: "browser" });
if (!browserBuild.success) throw new Error(browserBuild.logs.join("\n"));
console.log(JSON.stringify({
  requests,
  cachedReadRequests: requests.length - beforeCachedRead,
  units: catalog.courses.map(({ unitId, classTypeName, groupNumbers }) => ({ unitId, classTypeName, groupNumbers })),
  events: timetable.events.length,
  firstEvent: timetable.events[0],
  browserBundleBytes: browserBuild.outputs[0]?.size,
}, null, 2));
