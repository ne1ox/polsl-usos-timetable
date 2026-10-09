import { searchCoursesIds,  } from "./api/courses";
import { getGroupDetails } from "./api/groups";
import { getCourseActivityDates, getCourseActivityDetails } from "./api/units";
import { getCurrentAcademicTerm, getAllCourses } from "./api/utils";

const coursePrefixId = "SIAu>SI1";
const coursesIds = await searchCoursesIds(coursePrefixId);
console.log(coursesIds);

const term = getCurrentAcademicTerm();
if (!term) {
    process.exit();
}

const courses = await getAllCourses(coursesIds, term);
console.log(courses);

if (courses && courses[1]) {
    const {unitId, groupNumbers} = courses[1];
    const groupNumber = groupNumbers[1]!;

    const unitDetails = await getCourseActivityDetails(unitId, groupNumber);
    console.log(unitDetails);

    const unitDates = await getCourseActivityDates(unitId, groupNumber);
    console.log(unitDates);
}