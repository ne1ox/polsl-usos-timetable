import type { AcademicTerm, CoursesSearchDTO, CourseEditionDTO, DateString } from "../types";
import usosFetch from "../usosFetch";

// Search for coursesIds [przedmioty] by coursePrefixId [przedrostek kursu ~ kod kierunku]
// e.g "SIAu>SI1" matches courses like "SIAu>SI1-Mat-26"
export const searchCoursesIds = async (coursePrefixId: string) => {
  const courseIds: string[] = [];
  let start = 0;
  let nextPage: boolean;

  do {
    const data = await usosFetch<CoursesSearchDTO>(
      "courses/search", 
      {
        lang: "pl", // forced for MVP
        name: coursePrefixId,
        num: "20", // max value
        start: String(start),
        // fields: "course_id" // doesn't work LOL
      }
    );

    courseIds.push(...data.items.map(item => item.course_id));
    start += data.items.length;
    nextPage = data.next_page;
  } while (nextPage);

  return courseIds;
}

// Get all courses details by ids [przedmioty] in provided term [semestr] 
// and only those occuring in 7 days (default and max value) since startDate 
// Target: "unit_id" and "group_number", which are essential for requesting units
export const getCoursesDetails = async(
  courseIds: string[], 
  term: AcademicTerm, 
  startDate: DateString
) => 
   await usosFetch<CourseEditionDTO[]>(
    "tt/course_editions",
    {
      course_edition_ids: courseIds
        .flatMap(id => [id, term])
        .join("|"),
      start: startDate,
      fields: [
        "course_id", "unit_id", "group_number", // essential
        "course_name", "classtype_name", // for frontend
        "name" // required for API otherwise status 500 (unknown reason, officialy described as optional)
      ].join("|")
    }
  );
