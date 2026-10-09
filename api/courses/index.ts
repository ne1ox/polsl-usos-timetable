import type { AcademicTerm, CoursesSearch, ScheduleEntry } from "../types";
import usosFetch from "../usosFetch";
import { getFirstTwoMondays, groupCourses } from "../utils";

export async function getCoursesIds(courseGroupId: string) {
  const courseIds: string[] = [];
  let start = 0;
  let nextPage: boolean;

  do {
    const data = await usosFetch<CoursesSearch>("courses/search", {
      lang: "pl",
      name: courseGroupId,
      num: "20",
      start: String(start),
    });

    courseIds.push(...data.items.map(item => item.course_id));
    start += data.items.length;
    nextPage = data.next_page;
  } while (nextPage);

  return courseIds;
}

async function getCourses(courseIds: string[], term: string, start: string) {
  const data = await usosFetch<ScheduleEntry[]>("tt/course_editions", {
    course_edition_ids: courseIds
      .flatMap(id => [id, term])
      .join("|"),
    start: start,
    fields: [ 
      "course_id", "unit_id", "group_number", // essential
      "course_name", "classtype_name", // for frontend
      "name", "start_time", "end_time" // requiered for API
    ].join("|")
  });

  return data;
}

export async function getAllCourses(courseIds: string[], term: AcademicTerm) {
  const mondays = getFirstTwoMondays(term);
  if (!mondays) return null;

  const [evenWeekStartDate, unevenWeekStartDate] = mondays;

  const evenWeekData = await getCourses(courseIds, term, evenWeekStartDate);
  const unevenWeekData = await getCourses(courseIds, term, unevenWeekStartDate);

  const data = [...evenWeekData, ...unevenWeekData]

  const grouped = groupCourses(data as any);
  return grouped;
}
