import type { CourseEditionDTO, CoursesSearchDTO, LoadOptions } from '../types';
import type { ResponseData, Transport } from '../usosFetch';

export async function searchCourses(
  transport: Transport,
  prefix: string,
  ttlMs: number,
  options: LoadOptions,
) {
  const courses = new Map<string, CoursesSearchDTO['items'][number]>();
  const responses: ResponseData<CoursesSearchDTO>[] = [];
  let start = 0;
  let searchMayBeTruncated = false;
  while (start < 100) {
    const response = await transport.get<CoursesSearchDTO>(
      'courses/search',
      {
        lang: 'pl',
        name: prefix,
        num: '20',
        start: String(start),
        fields: 'course_id|terms',
      },
      ttlMs,
      options,
    );
    responses.push(response);
    for (const course of response.data.items) {
      // USOS matches names and fragments too; this application requires an ID prefix.
      if (course.course_id.startsWith(prefix)) {
        courses.set(course.course_id, course);
      }
    }
    start += response.data.items.length;
    if (start >= 100) {
      searchMayBeTruncated = true;
    }
    if (!response.data.next_page) {
      break;
    }
    if (response.data.items.length === 0) {
      throw new Error('USOS search returned an empty page with next_page=true');
    }
  }
  return { courses: [...courses.values()], responses, searchMayBeTruncated };
}

export function getCourseEdition(
  transport: Transport,
  courseId: string,
  term: string,
  ttlMs: number,
  options: LoadOptions,
) {
  return transport.get<CourseEditionDTO>(
    'courses/course_edition2',
    {
      course_id: courseId,
      term_id: term,
      fields: 'course[id|name]|course_units[id|class_groups[number]]',
    },
    ttlMs,
    options,
  );
}
