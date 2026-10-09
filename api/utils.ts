import type { AcademicTerm, AcademicYear, CourseGroup, ScheduleEntry, Semester } from "./types";

// Funkcja zwracjąca rok akademicki z oznaczeniem semestru
// np. 2026/2027-Z
export function getAcademicTerm(date: Date = new Date()): AcademicTerm | null {
  const academicYear = getAcademicYear(date);
  const semester = getSemester(date);

  if (!academicYear || !semester) return null;

  return `${academicYear}-${semester}`;
}

function getAcademicYear(date: Date): AcademicYear | null {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month >= 10) {
    return `${year}/${year + 1}`;
  }

  if (month < 7 || (month === 7 && day <= 15)) {
    return `${year - 1}/${year}`;
  }

  return null;
}

function getSemester(date: Date): Semester | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month >= 10 || month <= 2) {
    return "Z";
  }

  if (month >= 3 && (month < 7 || (month === 7 && day <= 15))) {
    return "L";
  }

  return null;
}

// Funkcja, która zwraca dwa pierwsze poniedziałki semestru
export function getFirstTwoMondays(semester: AcademicTerm): [string, string] | null {
  const [years, type] = semester.split("-");
  if (!years || !type) return null;

  const [startYear, endYear] = years.split("/").map(Number);
  if (!startYear || !endYear) return null;

  const year = type === "Z" ? startYear : endYear;
  const month = type === "Z" ? 9 : 2; // 0-indexed: 9 = October, 2 = March

  const date = new Date(Date.UTC(year, month, 1));

  // Przesunięcie do pierwszego poniedziałku
  const offset = (8 - date.getUTCDay()) % 7;
  date.setUTCDate(1 + offset);

  const first = date.toISOString().slice(0, 10);

  date.setUTCDate(date.getUTCDate() + 7);
  const second = date.toISOString().slice(0, 10);

  return [first, second];
}

// Funkcja grupująca kursy ze względu na numery grup
export function groupCourses(entries: ScheduleEntry[]): CourseGroup[] {
  const groups = new Map<string, CourseGroup>();

  for (const entry of entries) {
    const key = JSON.stringify([entry.course_id, entry.unit_id]);

    if (!groups.has(key)) {
      groups.set(key, {
        courseId: entry.course_id,
        name: entry.course_name.pl,
        unitId: entry.unit_id,
        groupNumbers: [],
        typeName: entry.classtype_name.pl,
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