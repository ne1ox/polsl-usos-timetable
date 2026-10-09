import { buildAllCourses, buildCourseActivity } from "./api/builders";
import { searchCoursesIds,  } from "./api/courses";
import { getCurrentAcademicTerm } from "./api/utils";

const coursePrefixId = "SIAu>SI1";
const coursesIds = await searchCoursesIds(coursePrefixId);
console.log("Searched by API function:\n", coursesIds);

const term = getCurrentAcademicTerm();
if (!term) {
    process.exit();
}

const courses = await buildAllCourses(coursesIds, term);
console.log("Built courses with all available groups:\n", courses);

if (courses && courses[1]) {
    const {unitId, groupNumbers} = courses[1];
    const groupNumber = groupNumbers[1]!;

    const courseActivity = await buildCourseActivity(unitId, groupNumber);
    console.log("Single CourseActivity:\n", courseActivity);
}