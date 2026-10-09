// const units = await usosFetch<Record<string, CourseUnit | null>>(
//   "courses/units",
//   {
//     unit_ids: "152005|152006",
//     fields: [
//       "id",
//       "course_id",
//       "course_name",
//       "term_id",
//       "classtype_id",
//     ].join("|"),
//   }
// );

// console.table(
//   Object.entries(units).map(([id, unit]) => ({
//     unit_id: id,
//     course_id: unit?.course_id,
//     przedmiot: unit?.course_name?.pl,
//     typ_id: unit?.classtype_id,
//     semestr: unit?.term_id,
//   }))
// );