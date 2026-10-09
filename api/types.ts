// *********
// COURSES & UNITS
// ********
export type LocalizedString = { pl: string, en: string };

// yyyy-mm-dd
export type DateString = `${number}-${number}-${number}`

// yyyy-mm-dd hh:mm:ss
export type DateTimeString = `${DateString} ${number}:${number}:${number}`;

export type CoursesSearchDTO = {
    items: {
      course_id: string;
      match: string;
    }[];
    next_page: boolean;
};

export type CourseEditionDTO = {
  course_id: string;
  unit_id: number;
  group_number: number;
  course_name: LocalizedString;
  classtype_name: LocalizedString;
  name: LocalizedString; // redundancy with course_name, check out api/courses/index.ts
}

type CourseActivityFrequency =
  | "every_fortnight"
  | "every_fortnight_odd"
  | "every_fortnight_even"
  | "every_month"
  | "every_week"
  | "every_working_day"
  | "every_weekend"
  | "every_day"
  | "other"
  | "once"
  | (string & {});

export type CourseActivityDTO = {
  course_id: string;
  type: "classgroup" | "classgroup2" | "meeting" | "exam" | (string & {});
  course_name: LocalizedString;
  classtype_name: LocalizedString;
  building_name: LocalizedString;
  room_number: string;
  lecturer_ids: number[];
  frequency: CourseActivityFrequency;
  url: string | null;
}

export type UnitsDateDTO = {
  start_time: DateTimeString;
  end_time: DateTimeString;
}


// *********
// UTILS.TS
// ********

// getAcademicTerm()
export type AcademicYear = `${number}/${number}`;
export type Semester = "Z" | "L";
export type AcademicTerm = `${AcademicYear}-${Semester}`;


// *********
// BUILDERS.TS
// ********

export type CourseGroup = {
  courseId: string;
  name: string;
  unitId: number;
  groupNumbers: number[];
  classTypeName: string;
}

export type CourseActivity = {
    courseId: string;
    unitId: number;
    name: string;
    classTypeName: string;
    groupNumber: number;
    buildingName: string;
    roomNumber: string;
    frequency: CourseActivityFrequency;
    url: string | null;
    dates: { startTime: DateTimeString, endTime: DateTimeString }[];
}