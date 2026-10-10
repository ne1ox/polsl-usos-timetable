import type { CourseGroup, GroupTypeDTO, LoadOptions } from "../types";
import type { ResponseData, Transport } from "../usosFetch";

/** One representative per unit: every group of that unit has the same class type. */
export async function getClassTypes(transport: Transport, courses: CourseGroup[], ttlMs: number, options: LoadOptions) {
  const representatives = courses.filter(course => course.groupNumbers.length > 0)
    .sort((a, b) => a.unitId.localeCompare(b.unitId));
  const responses: ResponseData<Record<string, GroupTypeDTO>>[] = [];
  // Keep request URLs modest; this is a client batching choice, not an API limit.
  for (let offset = 0; offset < representatives.length; offset += 40) {
    const batch = representatives.slice(offset, offset + 40);
    responses.push(await transport.get<Record<string, GroupTypeDTO>>("groups/groups", {
      group_ids: batch.map(course => `(${course.unitId},${course.groupNumbers[0]})`).join("|"),
      fields: "course_unit_id|class_type|class_type_id",
    }, ttlMs, options));
  }
  return responses;
}
