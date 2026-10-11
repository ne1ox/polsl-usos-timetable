import { expect, test } from 'bun:test';
import { createCourseSearch } from './courseSearch';
import { createTransport } from './usosFetch';
import { createMemoryCache } from './cache';

test('additional course search uses real USOS name fields and checks later pages for the selected term', async () => {
  const requests: URL[] = [];
  const transport = createTransport({
    cache: createMemoryCache(),
    fetch: (async (input) => {
      const url = new URL(String(input));
      requests.push(url);
      const firstPage = url.searchParams.get('start') === '0';
      const terms = firstPage ? [{ id: '2025/2026-Z' }] : [{ id: '2026/2027-Z' }];
      return Response.json({
        next_page: firstPage,
        items: [{ course_id: firstPage ? 'OLD' : 'LANG', name: { pl: '  English  ' }, terms }],
      });
    }) as typeof fetch,
  });
  const find = createCourseSearch(transport);
  const result = await find('English', '2026/2027-Z');
  expect(result.courses).toEqual([{ courseId: 'LANG', name: 'English' }]);
  expect(requests.map((url) => url.searchParams.get('start'))).toEqual(['0', '1']);
  expect(requests[0]?.searchParams.get('fields')).toBe('course_id|name|terms');
  await find('English', '2026/2027-Z');
  expect(requests).toHaveLength(2);
});

test('additional course search stops on broken pagination', async () => {
  const transport = createTransport({
    cache: createMemoryCache(),
    fetch: (async (_input: RequestInfo | URL) =>
      Response.json({ items: [], next_page: true })) as typeof fetch,
  });
  await expect(createCourseSearch(transport)('English', '2026/2027-Z')).rejects.toThrow(
    'empty search page',
  );
});
