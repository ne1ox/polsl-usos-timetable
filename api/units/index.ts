import usosFetch from "../usosFetch";

export async function getUnitsDetails(unitId: number, groupNumber: number) {
  const data = await usosFetch(
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
        ].join("|"),
      }
  );

  return data;
}

export async function getUnitsGroupDetails(unitId: number, groupNumber: number) {
  const data = await usosFetch(
      "groups/group", 
      {
        course_unit_id: unitId.toString(),
        group_number: groupNumber.toString(),
        fields: [
            "term_id",
            "course_unit_id",
            "group_number",
            "course_id",
            "course_name",
            "course_homepage_url",
            "course_profile_url",
            "course_is_currently_conducted",
            "course_fac_id",
            "course_lang_id",
            "lecturers"
            // "group_description",
            // "group_literature",
            // "course_learning_outcomes",
            // "course_description",
            // "course_bibliography",
            // "course_assessment_criteria",
            // "course_practical_placement"
        ].join("|"),
      }
  );

  return data;
}

export async function getUnitsDates(unitId: number, groupNumber: number) {
  const data = await usosFetch(
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

  return data;
}