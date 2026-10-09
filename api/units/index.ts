import type { CourseActivityDTO, DateTimeString, UnitsDateDTO } from "../types";
import usosFetch from "../usosFetch";

// Returns everything essential for displaying a course activity
export const getCourseActivityDetails = async(unitId: number, groupNumber: number) => {
  return await usosFetch<CourseActivityDTO>(
      "tt/classgroup", 
      {
        unit_id: unitId.toString(),
        group_number: groupNumber.toString(),
        fields: [
            "course_id",
            "type",
            "course_name",
            "classtype_name",
            "building_name",
            "room_number",
            "lecturer_ids",
            "frequency",
            "url"
        ].join("|"),
      }
  );
}

// Returns an array of start and end DateTimeString 
// for specific CourseActivity throughout the whole term
export const getCourseActivityDates = async (unitId: number, groupNumber: number) =>
  await usosFetch<UnitsDateDTO[]>(
    "tt/classgroup_dates2", 
    {
      unit_id: unitId.toString(),
      group_number: groupNumber.toString(),
      fields: [
          "start_time",
          "end_time",
      ].join("|"),
    }
);