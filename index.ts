import { getCoursesIds, getAllCourses } from "./api/courses";
import { getUnitsDates, getUnitsDetails, getUnitsGroupDetails } from "./api/units";
import { getAcademicTerm } from "./api/utils";

const courseGroupId = "SIAu>SI1";
const term = getAcademicTerm();

if (!term) {
    process.exit();
}

const coursesIds = await getCoursesIds(courseGroupId);

const courses = await getAllCourses(coursesIds, term);

if (courses && courses[1]) {
    const {unitId, groupNumbers} = courses[1];
    const groupNumber = groupNumbers[1]!;

    const groupData = await getUnitsGroupDetails(unitId, groupNumber);
    console.log(groupData);

    const unitDetails = await getUnitsDetails(unitId, groupNumber);
    console.log(unitDetails);

    const unitDates = await getUnitsDates(unitId, groupNumber);
    console.log(unitDates);
}