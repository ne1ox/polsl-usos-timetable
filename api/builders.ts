import { getCourseEdition, searchCourses } from './courses';
import { getClassTypes } from './groups';
import { getGroupMeetings } from './units';
import { groupKey, localized } from './utils';
import { createTransport, type TransportOptions } from './usosFetch';
import type {
  ActivityDTO,
  Catalog,
  CourseGroup,
  DateString,
  GroupSelection,
  LoadOptions,
  Timetable,
  TimetableEvent,
} from './types';

export interface TimetableClientOptions extends TransportOptions {
  catalogTtlMs?: number;
  meetingsTtlMs?: number;
}

export function createTimetableClient(options: TimetableClientOptions = {}) {
  const transport = createTransport(options);
  const catalogTtl = options.catalogTtlMs ?? 24 * 60 * 60 * 1_000;
  const meetingsTtl = options.meetingsTtlMs ?? 12 * 60 * 60 * 1_000;
  for (const ttl of [catalogTtl, meetingsTtl]) {
    if (!Number.isFinite(ttl) || ttl < 0) {
      throw new Error('Cache TTL must be nonnegative and finite');
    }
  }

  return {
    async getCatalog(prefix: string, term: string, load: LoadOptions = {}): Promise<Catalog> {
      prefix = prefix.trim();
      term = term.trim();
      if (!prefix || !term) {
        throw new Error('Provide a course prefix and an explicit academic term');
      }
      const search = await searchCourses(transport, prefix, catalogTtl, load);
      const applicable = search.courses.filter((course) =>
        course.terms.some((item) => item.id === term),
      );
      // The transport bounds concurrency across all calls on this client instance.
      const editions = await Promise.all(
        applicable.map((course) =>
          getCourseEdition(transport, course.course_id, term, catalogTtl, load),
        ),
      );
      const units = new Map<string, CourseGroup>();
      for (const { data } of editions) {
        for (const unit of data.course_units) {
          const groupNumbers = [...new Set(unit.class_groups.map((group) => group.number))].sort(
            (a, b) => a - b,
          );
          units.set(String(unit.id), {
            courseId: data.course.id,
            name: localized(data.course.name) ?? data.course.id,
            unitId: String(unit.id),
            classTypeId: null,
            classTypeName: null,
            groupNumbers,
            groupCount: groupNumbers.length,
          });
        }
      }
      const types = await getClassTypes(transport, [...units.values()], catalogTtl, load);
      for (const { data } of types) {
        for (const details of Object.values(data)) {
          const unit = units.get(String(details.course_unit_id));
          if (unit) {
            unit.classTypeId = details.class_type_id;
            unit.classTypeName = localized(details.class_type);
          }
        }
      }
      const responses = [...search.responses, ...editions, ...types];
      return {
        prefix,
        term,
        courses: [...units.values()].sort(
          (a, b) =>
            a.name.localeCompare(b.name, 'pl') ||
            (a.classTypeName ?? '').localeCompare(b.classTypeName ?? '', 'pl') ||
            a.unitId.localeCompare(b.unitId),
        ),
        searchMayBeTruncated: search.searchMayBeTruncated,
        stale: responses.some((response) => response.stale),
        fetchedAt: Math.min(...responses.map((response) => response.fetchedAt)),
      };
    },

    async getTimetable(
      catalog: Catalog,
      selections: GroupSelection[],
      load: LoadOptions = {},
    ): Promise<Timetable> {
      const units = new Map(catalog.courses.map((course) => [course.unitId, course]));
      const unique = new Map<string, GroupSelection>();
      // Validate the entire selection before issuing any requests.
      for (const selection of selections) {
        if (!units.get(selection.unitId)?.groupNumbers.includes(selection.groupNumber)) {
          throw new Error(
            `Group ${selection.unitId}/${selection.groupNumber} is not in the catalog`,
          );
        }
        unique.set(groupKey(selection.unitId, selection.groupNumber), { ...selection });
      }
      const groups = [...unique.values()];
      const results = await Promise.allSettled(
        groups.map(async (group) => {
          const response = await getGroupMeetings(transport, group, meetingsTtl, load);
          const course = units.get(group.unitId)!;
          const events = response.data.map((activity) =>
            normalizeEvent(activity, course, group, catalog.term),
          );
          return { response, events };
        }),
      );
      const events = new Map<string, TimetableEvent>();
      const successful: Timetable['groups'] = [];
      const failures: Timetable['failures'] = [];
      results.forEach((result, index) => {
        const group = groups[index]!;
        if (result.status === 'rejected') {
          failures.push({
            ...group,
            message: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
          return;
        }
        for (const event of result.value.events) {
          events.set(event.id, event);
        }
        successful.push({
          ...group,
          eventCount: new Set(result.value.events.map((event) => event.id)).size,
          fetchedAt: result.value.response.fetchedAt,
          stale: result.value.response.stale,
        });
      });
      const sorted = [...events.values()].sort(
        (a, b) =>
          a.startTime.localeCompare(b.startTime) ||
          a.endTime.localeCompare(b.endTime) ||
          a.id.localeCompare(b.id),
      );
      const byDate: Timetable['byDate'] = {};
      for (const event of sorted) {
        (byDate[event.date] ??= []).push(event);
      }
      return {
        term: catalog.term,
        events: sorted,
        byDate,
        groups: successful,
        failures,
        complete: failures.length === 0,
        stale: successful.some((group) => group.stale),
      };
    },
  };
}

function normalizeEvent(
  activity: ActivityDTO,
  course: CourseGroup,
  group: GroupSelection,
  term: string,
): TimetableEvent {
  if (
    !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(activity.start_time) ||
    !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(activity.end_time)
  ) {
    throw new Error('USOS returned an invalid meeting date');
  }
  const lecturerIds = [...new Set((activity.lecturer_ids ?? []).map(String))].sort();
  const identity = [
    term,
    group.unitId,
    group.groupNumber,
    activity.type,
    activity.sm_id ?? null,
    activity.cgwm_id ?? null,
    activity.start_time,
    activity.end_time,
    activity.room_id ?? activity.room_number ?? null,
    activity.building_id ?? localized(activity.building_name),
    lecturerIds,
  ];
  return {
    id: JSON.stringify(identity),
    ...group,
    term,
    courseId: activity.course_id ?? course.courseId,
    name: localized(activity.course_name) ?? course.name,
    activityName: localized(activity.name) ?? course.name,
    type: activity.type,
    classTypeName: localized(activity.classtype_name) ?? course.classTypeName,
    startTime: activity.start_time.replace(' ', 'T'),
    endTime: activity.end_time.replace(' ', 'T'),
    date: activity.start_time.slice(0, 10) as DateString,
    timeZone: 'Europe/Warsaw',
    buildingName: localized(activity.building_name),
    buildingId: activity.building_id == null ? null : String(activity.building_id),
    roomNumber: activity.room_number || null,
    roomId: activity.room_id == null ? null : String(activity.room_id),
    lecturerIds,
    frequency: activity.frequency ?? null,
    dateStatus: meetingDateStatus(activity),
    url: activity.url ?? null,
  };
}

function meetingDateStatus(activity: ActivityDTO): TimetableEvent['dateStatus'] {
  if (activity.type === 'classgroup2') {
    return 'confirmed';
  }
  const recurring = activity.frequency && !['once', 'other'].includes(activity.frequency);
  if (activity.type === 'classgroup' && recurring) {
    return 'calculated';
  }
  return 'uncertain';
}
