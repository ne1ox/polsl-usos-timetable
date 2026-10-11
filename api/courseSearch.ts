import { createTransport, type Transport } from './usosFetch';
import { localized } from './utils';
import type { LocalizedString } from './types';

export interface CourseSearchResult {
  courseId: string;
  name: string;
}
interface SearchResponse {
  items: { course_id: string; name: LocalizedString; terms: { id: string }[] }[];
  next_page: boolean;
}

export function createCourseSearch(transport: Transport = createTransport()) {
  return async function findCourses(query: string, term: string) {
    const courses = new Map<string, CourseSearchResult>();
    let start = 0;
    let more = false;
    // USOS caps search at 100 results. Inspect each page before filtering by term,
    // because the endpoint does not offer a term filter.
    while (start < 100) {
      const response = await transport.get<SearchResponse>(
        'courses/search',
        {
          lang: 'pl',
          name: query.trim(),
          num: '20',
          start: String(start),
          fields: 'course_id|name|terms',
        },
        24 * 60 * 60 * 1000,
      );
      for (const course of response.data.items) {
        if (course.terms.some((item) => item.id === term)) {
          courses.set(course.course_id, {
            courseId: course.course_id,
            name: localized(course.name)?.trim() || course.course_id,
          });
        }
      }
      start += response.data.items.length;
      more = start >= 100;
      if (!response.data.next_page) {
        break;
      }
      if (!response.data.items.length) {
        throw new Error('USOS returned an empty search page.');
      }
    }
    return { courses: [...courses.values()], more };
  };
}

export const findCourses = createCourseSearch();
