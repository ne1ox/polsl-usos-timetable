import { getCoursesDetails } from "./courses";
import type { AcademicTerm, CourseActivity, CourseEditionDTO, CourseGroup, DateTimeString } from "./types";
import { getCourseActivityDates, getCourseActivityDetails } from "./units";
import { getFirstTwoMondays } from "./utils";

// Usable for frontend
export async function buildAllCourses(courseIds: string[], term: AcademicTerm) {
  const mondays = getFirstTwoMondays(term);

  const [evenWeekStartDate, unevenWeekStartDate] = mondays;

  const evenWeekData = await getCoursesDetails(courseIds, term, evenWeekStartDate);
  const unevenWeekData = await getCoursesDetails(courseIds, term, unevenWeekStartDate);

  return toCourseGroups([...evenWeekData, ...unevenWeekData]);
}

function toCourseGroups(entries: CourseEditionDTO[]): CourseGroup[] {
  const groups = new Map<string, CourseGroup>();

  for (const entry of entries) {
    const key = JSON.stringify([entry.course_id, entry.unit_id]);

    if (!groups.has(key)) {
      groups.set(key, {
        courseId: entry.course_id,
        name: entry.course_name.pl,
        unitId: entry.unit_id,
        groupNumbers: [],
        classTypeName: entry.classtype_name.pl,
      });
    }

    const group = groups.get(key)!;

    if (!group.groupNumbers.includes(entry.group_number)) {
      group.groupNumbers.push(entry.group_number);
    }
  }

  return [...groups.values()].map(group => ({
    ...group,
    groupNumbers: group.groupNumbers.sort((a, b) => a - b),
  }));
}

// Usable for frontend
export async function buildCourseActivity(
  unitId: number, 
  groupNumber: number
): Promise<CourseActivity> {
  const unitData = (await getCourseActivityDetails(unitId, groupNumber))[0]!;
  const unitDates = await getCourseActivityDates(unitId, groupNumber);

  return {
    courseId: unitData.course_id,
    unitId: unitId,
    name: unitData.course_name.pl,
    classTypeName: unitData.classtype_name.pl,
    groupNumber: groupNumber,
    buildingName: unitData.building_name.pl,
    roomNumber: unitData.room_number,
    frequency: unitData.frequency,
    url: unitData.url,
    dates: unitDates.map((o) => ({ startTime: o.start_time, endTime: o.end_time}))
  }
}