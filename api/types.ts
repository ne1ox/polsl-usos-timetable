// *********
// COURSES & UNITS
// ********
export type CoursesSearch = {
    items: {
      course_id: string;
      match: string;
    }[];
    next_page: boolean;
};

// TODO: implement remaining types of other functions from courses/index.ts && units/index.ts

// *********
// UTILS.TS
// ********

// getAcademicTerm()
export type AcademicYear = `${number}/${number}`;
export type Semester = "Z" | "L";
export type AcademicTerm = `${AcademicYear}-${Semester}`

// groupCourses()
export type ScheduleEntry = {
  course_id: string;
  unit_id: number;
  group_number: number;
  course_name: { pl: string; en: string };
  classtype_name: { pl: string; en: string };
}

export type CourseGroup = {
  courseId: string;
  name: string;
  unitId: number;
  groupNumbers: number[];
  typeName: string;
}