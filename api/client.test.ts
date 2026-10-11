import { describe, expect, test } from 'bun:test';
import { IDBFactory } from 'fake-indexeddb';
import { createTimetableClient } from './builders';
import { createBrowserCache, createMemoryCache } from './cache';
import { createTransport } from './usosFetch';
import type { ActivityDTO, Catalog } from './types';

const term = '2026/2027-Z';
const selection = { unitId: '10', groupNumber: 3 };
const catalog: Catalog = {
  prefix: 'TEST-',
  term,
  fetchedAt: 1,
  stale: false,
  searchMayBeTruncated: false,
  courses: [
    {
      courseId: 'TEST-A',
      name: 'Algebra',
      unitId: '10',
      classTypeId: 'CW',
      classTypeName: 'ćwiczenia',
      groupNumbers: [1, 3],
      groupCount: 2,
    },
    {
      courseId: 'TEST-B',
      name: 'Bazy',
      unitId: '20',
      classTypeId: 'WYK',
      classTypeName: 'wykład',
      groupNumbers: [1],
      groupCount: 1,
    },
  ],
};

function meeting(overrides: Partial<ActivityDTO> = {}): ActivityDTO {
  return {
    type: 'classgroup',
    name: { pl: 'ćwiczenia' },
    start_time: '2026-11-02 10:30:00',
    end_time: '2026-11-02 12:00:00',
    course_id: 'TEST-A',
    course_name: { pl: 'Algebra' },
    frequency: 'every_week',
    room_number: '101',
    building_name: { pl: 'Budynek A' },
    lecturer_ids: [2, 1, 2],
    cgwm_id: 7,
    ...overrides,
  };
}

function fakeFetch(handler: (url: URL, init?: RequestInit) => unknown | Promise<unknown>) {
  const requests: URL[] = [];
  const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    requests.push(url);
    const result = await handler(url, init);
    return result instanceof Response ? result : Response.json(result);
  }) as typeof fetch;
  return { fetcher, requests };
}

function catalogResponse(url: URL): unknown {
  if (url.pathname.endsWith('/courses/search')) {
    return {
      next_page: false,
      items: [
        { course_id: 'TEST-A', terms: [{ id: term }] },
        { course_id: 'TEST-A', terms: [{ id: term }] },
        { course_id: 'TEST-B', terms: [{ id: term }] },
        { course_id: 'TEST-OLD', terms: [{ id: '2025/2026-Z' }] },
        { course_id: 'OTHER-TEST-A', terms: [{ id: term }] },
      ],
    };
  }
  if (url.pathname.endsWith('/courses/course_edition2')) {
    const id = url.searchParams.get('course_id')!;
    return {
      course: { id, name: { pl: id === 'TEST-A' ? 'Algebra' : 'Bazy' } },
      course_units:
        id === 'TEST-A'
          ? [{ id: '10', class_groups: [{ number: 3 }, { number: 1 }, { number: 3 }] }]
          : [
              { id: '20', class_groups: [{ number: 1 }] },
              { id: '30', class_groups: [] },
            ],
    };
  }
  if (url.pathname.endsWith('/groups/groups')) {
    expect(url.searchParams.get('group_ids')).toBe('(10,1)|(20,1)');
    return {
      '(10,1)': { course_unit_id: 10, class_type_id: 'CW', class_type: { pl: 'ćwiczenia' } },
      '(20,1)': { course_unit_id: 20, class_type_id: 'WYK', class_type: { pl: 'wykład' } },
    };
  }
  throw new Error(`Unexpected request ${url}`);
}

describe('catalog and request budget', () => {
  test('discovers sparse groups without timetables, skips unrelated terms, and shares parallel/cache reads', async () => {
    const { fetcher, requests } = fakeFetch(catalogResponse);
    const client = createTimetableClient({ fetch: fetcher, cache: createMemoryCache() });
    const [first, second] = await Promise.all([
      client.getCatalog('TEST-', term),
      client.getCatalog('TEST-', term),
    ]);
    expect(first).toEqual(second);
    expect(requests).toHaveLength(4); // 1 search + 2 editions + 1 metadata batch.
    expect(first.courses.find((course) => course.unitId === '10')).toMatchObject({
      groupNumbers: [1, 3],
      groupCount: 2,
      classTypeName: 'ćwiczenia',
    });
    expect(first.courses.find((course) => course.unitId === '30')?.groupCount).toBe(0);
    await client.getCatalog('TEST-', term);
    expect(requests).toHaveLength(4);
  });

  test('paginates search and signals the 100-result cap', async () => {
    const { fetcher, requests } = fakeFetch((url) => ({
      next_page: true,
      items: Array.from({ length: 20 }, (_, index) => ({
        course_id: `TEST-${Number(url.searchParams.get('start')) + index}`,
        terms: [],
      })),
    }));
    const result = await createTimetableClient({ fetch: fetcher }).getCatalog('TEST-', term);
    expect(requests.map((url) => url.searchParams.get('start'))).toEqual([
      '0',
      '20',
      '40',
      '60',
      '80',
    ]);
    expect(result.searchMayBeTruncated).toBe(true);
    expect(result.courses).toEqual([]);
  });

  test('does not loop on a broken pagination response', async () => {
    const { fetcher, requests } = fakeFetch(() => ({ items: [], next_page: true }));
    await expect(
      createTimetableClient({ fetch: fetcher }).getCatalog('TEST-', term),
    ).rejects.toThrow('empty page');
    expect(requests).toHaveLength(1);
  });
});

describe('selected group meetings', () => {
  test('one request per unique selection; preserves per-meeting details and stable sorted events', async () => {
    const late = meeting({
      start_time: '2026-11-09 10:30:00',
      end_time: '2026-11-09 12:00:00',
      room_number: '202',
    });
    const { fetcher, requests } = fakeFetch((url) => {
      expect(url.pathname).toEndWith('/tt/classgroup_dates2');
      expect(url.searchParams.get('fields')).toContain('room_number');
      return [late, meeting(), meeting()];
    });
    const client = createTimetableClient({ fetch: fetcher });
    const [first, concurrent] = await Promise.all([
      client.getTimetable(catalog, [selection, selection]),
      client.getTimetable(catalog, [selection]),
    ]);
    expect(requests).toHaveLength(1);
    expect(first).toEqual(concurrent);
    expect(first.events).toHaveLength(2);
    expect(first.events.map((event) => event.roomNumber)).toEqual(['101', '202']);
    expect(first.events[0]).toMatchObject({
      startTime: '2026-11-02T10:30:00',
      timeZone: 'Europe/Warsaw',
      lecturerIds: ['1', '2'],
      dateStatus: 'calculated',
    });
    expect(Object.keys(first.byDate)).toEqual(['2026-11-02', '2026-11-09']);
    first.events[0]!.roomNumber = 'mutated';
    const cached = await client.getTimetable(catalog, [selection]);
    expect(cached.events[0]!.roomNumber).toBe('101');
    expect(cached.events[0]!.id).toBe(concurrent.events[0]!.id);
    expect(requests).toHaveLength(1);
  });

  test('selection changes only fetch newly selected groups; empty groups are cached', async () => {
    const { fetcher, requests } = fakeFetch((url) =>
      url.searchParams.get('unit_id') === '10' ? [meeting()] : [],
    );
    const client = createTimetableClient({ fetch: fetcher });
    await client.getTimetable(catalog, [selection]);
    const result = await client.getTimetable(catalog, [
      selection,
      { unitId: '20', groupNumber: 1 },
    ]);
    await client.getTimetable(catalog, [{ unitId: '20', groupNumber: 1 }]);
    expect(requests).toHaveLength(2);
    expect(result.groups[1]?.eventCount).toBe(0);
    expect(result.complete).toBe(true);
  });

  test('empty or invalid selections never fetch meetings', async () => {
    const { fetcher, requests } = fakeFetch(() => {
      throw new Error('Must not fetch');
    });
    const client = createTimetableClient({ fetch: fetcher });
    expect((await client.getTimetable(catalog, [])).events).toEqual([]);
    await expect(
      client.getTimetable(catalog, [selection, { unitId: '10', groupNumber: 2 }]),
    ).rejects.toThrow('not in the catalog');
    expect(requests).toHaveLength(0);
  });

  test('supports explicit meetings without frequency and marks uncertain legacy dates', async () => {
    const { fetcher } = fakeFetch(() => [
      meeting({
        type: 'classgroup2',
        sm_id: 42,
        frequency: undefined,
        building_name: {},
        room_number: '',
      }),
      meeting({ frequency: 'once' }),
    ]);
    const result = await createTimetableClient({ fetch: fetcher }).getTimetable(catalog, [
      selection,
    ]);
    expect(result.events.find((event) => event.type === 'classgroup2')).toMatchObject({
      frequency: null,
      buildingName: null,
      roomNumber: null,
      dateStatus: 'confirmed',
    });
    expect(result.events.find((event) => event.type === 'classgroup')?.dateStatus).toBe(
      'uncertain',
    );
  });

  test('reports partial failure instead of presenting a missing group as an empty plan', async () => {
    const { fetcher } = fakeFetch((url) =>
      url.searchParams.get('unit_id') === '20'
        ? new Response('down', { status: 503 })
        : [meeting()],
    );
    const result = await createTimetableClient({ fetch: fetcher }).getTimetable(catalog, [
      selection,
      { unitId: '20', groupNumber: 1 },
    ]);
    expect(result.complete).toBe(false);
    expect(result.events).toHaveLength(1);
    expect(result.failures).toMatchObject([{ unitId: '20', groupNumber: 1 }]);
  });
});

describe('cache and upstream protection', () => {
  test('TTL, forced refresh, offline fallback and cooldown preserve the last successful fetch time', async () => {
    let now = 1_000;
    let offline = false;
    const { fetcher, requests } = fakeFetch(() => {
      if (offline) {
        throw new TypeError('offline');
      }
      return [meeting()];
    });
    const client = createTimetableClient({
      fetch: fetcher,
      now: () => now,
      meetingsTtlMs: 100,
      errorCooldownMs: 50,
    });
    await client.getTimetable(catalog, [selection]);
    now = 1_010;
    await client.getTimetable(catalog, [selection]);
    expect(requests).toHaveLength(1);
    await client.getTimetable(catalog, [selection], { refresh: true });
    expect(requests).toHaveLength(2);
    now = 1_200;
    offline = true;
    const stale = await client.getTimetable(catalog, [selection]);
    expect(stale.stale).toBe(true);
    expect(stale.groups[0]?.fetchedAt).toBe(1_010);
    await client.getTimetable(catalog, [selection]);
    expect(requests).toHaveLength(3);
    now = 1_251;
    offline = false;
    expect((await client.getTimetable(catalog, [selection])).stale).toBe(false);
    expect(requests).toHaveLength(4);
  });

  test('bounds simultaneous HTTP requests', async () => {
    let active = 0;
    let peak = 0;
    const { fetcher } = fakeFetch(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return {};
    });
    const transport = createTransport({ fetch: fetcher, concurrency: 2 });
    await Promise.all(
      Array.from({ length: 7 }, (_, id) => transport.get('example', { id: String(id) }, 1_000)),
    );
    expect(peak).toBe(2);
  });

  test('429 Retry-After stops queued requests and does not cache errors as data', async () => {
    let now = 0;
    let limited = true;
    const { fetcher, requests } = fakeFetch(() =>
      limited ? new Response('busy', { status: 429, headers: { 'Retry-After': '120' } }) : {},
    );
    const transport = createTransport({ fetch: fetcher, concurrency: 1, now: () => now });
    await Promise.allSettled([transport.get('a', {}, 1_000), transport.get('b', {}, 1_000)]);
    expect(requests).toHaveLength(1);
    now = 119_999;
    await expect(transport.get('a', {}, 1_000)).rejects.toThrow('429');
    expect(requests).toHaveLength(1);
    now = 120_001;
    limited = false;
    expect((await transport.get('a', {}, 1_000)).data).toEqual({});
    expect(requests).toHaveLength(2);
  });

  test('persistent IndexedDB cache survives creation of a new client', async () => {
    const original = globalThis.indexedDB;
    globalThis.indexedDB = new IDBFactory();
    try {
      const { fetcher, requests } = fakeFetch(() => [meeting()]);
      await createTimetableClient({ fetch: fetcher, cache: createBrowserCache() }).getTimetable(
        catalog,
        [selection],
      );
      const second = await createTimetableClient({
        fetch: fetcher,
        cache: createBrowserCache(),
      }).getTimetable(catalog, [selection]);
      expect(second.events).toHaveLength(1);
      expect(requests).toHaveLength(1);
    } finally {
      globalThis.indexedDB = original;
    }
  });
});
