export type LocalizedString = { pl?: string; en?: string };
export type DateString = `${number}-${number}-${number}`;
/** USOS wall time in Europe/Warsaw, without a UTC offset. */
export type DateTimeString = `${DateString} ${number}:${number}:${number}`;

export interface CoursesSearchDTO {
  items: { course_id: string; terms: { id: string }[] }[];
  next_page: boolean;
}

export interface CourseEditionDTO {
  course: { id: string; name: LocalizedString };
  course_units: { id: string; class_groups: { number: number }[] }[];
}

export interface GroupTypeDTO {
  course_unit_id: string | number;
  class_type_id: string;
  class_type: LocalizedString;
}

export interface ActivityDTO {
  type: string;
  name: LocalizedString;
  start_time: DateTimeString;
  end_time: DateTimeString;
  course_id?: string;
  course_name?: LocalizedString;
  unit_id?: string | number;
  group_number?: number;
  classtype_name?: LocalizedString;
  building_name?: LocalizedString;
  building_id?: string | number | null;
  room_number?: string;
  room_id?: string | number | null;
  lecturer_ids?: (string | number)[];
  frequency?: string;
  url?: string | null;
  sm_id?: string | number;
  cgwm_id?: string | number;
}

export interface CourseGroup {
  courseId: string;
  name: string;
  unitId: string;
  classTypeId: string | null;
  classTypeName: string | null;
  groupNumbers: number[];
  groupCount: number;
}

export interface Catalog {
  prefix: string;
  term: string;
  courses: CourseGroup[];
  /** USOS search exposes at most 100 matches; a narrower prefix may be needed. */
  searchMayBeTruncated: boolean;
  stale: boolean;
  /** Oldest response used to build this catalog. */
  fetchedAt: number;
}

export interface GroupSelection {
  unitId: string;
  groupNumber: number;
}

export interface TimetableEvent extends GroupSelection {
  id: string;
  term: string;
  courseId: string;
  name: string;
  activityName: string;
  type: string;
  classTypeName: string | null;
  /** Local ISO-like strings, deliberately without Z. Do not treat as UTC. */
  startTime: string;
  endTime: string;
  date: DateString;
  timeZone: 'Europe/Warsaw';
  buildingName: string | null;
  buildingId: string | null;
  roomNumber: string | null;
  roomId: string | null;
  lecturerIds: string[];
  frequency: string | null;
  /** Legacy 'once'/'other' entries may be candidates, not confirmed dates. */
  dateStatus: 'confirmed' | 'calculated' | 'uncertain';
  url: string | null;
}

export interface Timetable {
  term: string;
  events: TimetableEvent[];
  byDate: Record<string, TimetableEvent[]>;
  groups: (GroupSelection & { eventCount: number; fetchedAt: number; stale: boolean })[];
  failures: (GroupSelection & { message: string })[];
  complete: boolean;
  stale: boolean;
}

export interface LoadOptions {
  /** Concurrent explicit refreshes for the same resource are also shared. */
  refresh?: boolean;
}
