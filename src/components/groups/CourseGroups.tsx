import { Trash2 } from 'lucide-react';
import type { CourseGroup } from '../../../api';
import type { ExtraCourse } from '../../lib/profile';
import { eventTone } from '../../lib/dates';

interface Props {
  courses: CourseGroup[];
  choices: Record<string, string>;
  extras: ExtraCourse[];
  busy: boolean;
  onSelect: (unitId: string, value: string) => void;
  onRemove: (courseId: string) => void;
}
const categoryNames = { language: 'Język obcy', sport: 'WF', other: 'Dodatkowy przedmiot' };

function GroupSelect({
  course,
  value,
  onChange,
}: {
  course: CourseGroup;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid items-center gap-3 py-4 sm:grid-cols-[1fr_220px]">
      <label htmlFor={'group-' + course.unitId} className="flex items-center gap-3">
        <span
          className={
            eventTone(course.classTypeName) +
            ' size-2.5 shrink-0 rounded-full bg-[var(--event-line)]'
          }
        />
        <span>
          <span className="block font-medium capitalize">{course.classTypeName ?? 'Zajęcia'}</span>
          <span className="block text-sm text-muted">{course.groupCount} dostępnych grup</span>
        </span>
      </label>
      <select
        id={'group-' + course.unitId}
        className="field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={!course.groupNumbers.length}
      >
        <option value="">
          {course.groupNumbers.length ? 'Wybierz grupę' : 'Brak grup w USOS'}
        </option>
        {course.groupNumbers.map((number) => (
          <option key={number} value={number}>
            Grupa {number}
          </option>
        ))}
        <option value="skip">Nie uczęszczam</option>
      </select>
    </div>
  );
}

export default function CourseGroups({
  courses,
  choices,
  extras,
  busy,
  onSelect,
  onRemove,
}: Props) {
  const ids = [...new Set(courses.map((course) => course.courseId))];
  return (
    <fieldset disabled={busy} className="space-y-4">
      {ids.map((id) => {
        const units = courses.filter((course) => course.courseId === id);
        const extra = extras.find((course) => course.courseId === id);
        return (
          <section key={id} className="panel px-5 sm:px-6">
            <div className="flex items-start justify-between gap-3 border-b border-line py-5">
              <div>
                <h3 className="text-lg">{units[0]?.name}</h3>
                {extra && (
                  <p className="mt-1 text-sm text-primary-text">{categoryNames[extra.category]}</p>
                )}
              </div>
              {extra && (
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => onRemove(id)}
                  aria-label={'Usuń ' + extra.name}
                >
                  <Trash2 size={19} />
                </button>
              )}
            </div>
            <div className="divide-y divide-line">
              {units.map((course) => (
                <GroupSelect
                  key={course.unitId}
                  course={course}
                  value={choices[course.unitId] ?? ''}
                  onChange={(value) => onSelect(course.unitId, value)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </fieldset>
  );
}
