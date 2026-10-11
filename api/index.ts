export { createTimetableClient, type TimetableClientOptions } from './builders';
export {
  createBrowserCache,
  createMemoryCache,
  type ResponseCache,
  type CacheEntry,
} from './cache';
export { UsosError } from './usosFetch';
export type {
  Catalog,
  CourseGroup,
  GroupSelection,
  Timetable,
  TimetableEvent,
  LoadOptions,
} from './types';

import { createTimetableClient } from './builders';
/** Share this instance across React components (including StrictMode effect calls). */
export const timetableClient = createTimetableClient();
