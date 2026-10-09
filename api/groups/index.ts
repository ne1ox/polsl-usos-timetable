import type { AcademicTerm, LocalizedString } from "../types";
import usosFetch from "../usosFetch";

type Lecturer = {
  id: string;
  first_name: string;
  last_name: string;
  user_id: string;
};

type GroupDetailsDTO = {
  term_id: AcademicTerm;
  course_unit_id: number;
  group_number: number;
  course_id: string;
  course_name: LocalizedString;
  course_homepage_url: string;
  course_profile_url: string;
  course_is_currently_conducted: 0 | 1;
  course_fac_id: string;
  course_lang_id: string;
  lecturers: Lecturer[];
//   group_description: LocalizedString;
//   group_literature: LocalizedString;
//   course_learning_outcomes: LocalizedString;
//   course_description: LocalizedString;
//   course_bibliography: LocalizedString;
//   course_assessment_criteria: LocalizedString;
//   course_practical_placement: LocalizedString;
};

// Currently unused, however greatly valuable for enriched frontend experience
export const getGroupDetails = async (unitId: number, groupNumber: number) =>
  await usosFetch<GroupDetailsDTO>(
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
            
            // Quite heavy and partially empty fields however very valuable \/

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