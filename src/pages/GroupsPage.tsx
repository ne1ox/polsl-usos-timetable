import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Check, GraduationCap, LoaderCircle, Plus, RefreshCw } from 'lucide-react';
import PageHeading from '../components/PageHeading';
import StudyForm from '../components/groups/StudyForm';
import CourseGroups from '../components/groups/CourseGroups';
import ExtraCoursePicker from '../components/groups/ExtraCoursePicker';
import Modal from '../components/Modal';
import { useGroupEditor } from '../hooks/useGroupEditor';
import { useTimetable } from '../state/TimetableProvider';

function GroupEditor() {
  const editor = useGroupEditor();
  const navigate = useNavigate();
  const [studyOpen, setStudyOpen] = useState(!editor.catalog);
  const [extraOpen, setExtraOpen] = useState(false);
  const extras = editor.config.extraCourses ?? [];

  return (
    <>
      <PageHeading
        title="Moje grupy"
        description="Twoje studia, języki i WF. Wybierz zajęcia, które chcesz mieć w planie."
      />
      {editor.error && !extraOpen && (
        <p role="alert" className="notice notice-warning mb-5">
          {editor.error}
        </p>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          {studyOpen ? (
            <StudyForm
              initial={editor.config}
              busy={editor.busy}
              onSubmit={editor.load}
              onClose={() => setStudyOpen(false)}
              canCancel={Boolean(editor.catalog)}
            />
          ) : (
            <section className="panel flex flex-wrap items-center gap-4 p-5 sm:p-6">
              <span className="rounded-xl bg-primary-soft p-3 text-primary-text">
                <GraduationCap size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg">{editor.config.programme.name.split(',')[0]}</h2>
                <p className="text-sm text-muted">
                  {editor.config.semester}. semestr · {editor.config.term}
                </p>
              </div>
              <button
                className="btn btn-secondary"
                disabled={editor.busy}
                onClick={() => setStudyOpen(true)}
              >
                Zmień studia
              </button>
            </section>
          )}
          {editor.catalog && !studyOpen && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl">Przedmioty i grupy</h2>
                <button
                  className="btn btn-quiet"
                  disabled={editor.busy}
                  onClick={() => void editor.load(editor.config, true)}
                >
                  <RefreshCw size={17} className={editor.busy ? 'animate-spin' : ''} />
                  Odśwież listę
                </button>
              </div>
              {editor.catalog.stale && (
                <p className="notice notice-warning">
                  Katalog pochodzi z pamięci urządzenia. Dostępne grupy mogły się zmienić.
                </p>
              )}
              {editor.catalog.searchMayBeTruncated && (
                <p className="notice notice-warning">
                  USOS ograniczył wyniki do 100. Zawęź kod przedmiotów w ustawieniach studiów.
                </p>
              )}
              <CourseGroups
                courses={editor.catalog.courses}
                choices={editor.choices}
                extras={extras}
                busy={editor.busy}
                onSelect={editor.select}
                onRemove={editor.removeCourse}
              />
              <button
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-line bg-surface p-5 text-left transition-colors hover:border-primary-text hover:bg-primary-soft"
                disabled={editor.busy}
                onClick={() => setExtraOpen(true)}
              >
                <Plus size={24} className="shrink-0 text-primary-text" />
                <span>
                  <strong className="block">Dodaj język, WF lub inny przedmiot</strong>
                  <span className="text-sm text-muted">Także spoza Twojego kierunku.</span>
                </span>
              </button>
              <div className="sticky bottom-24 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-lg lg:bottom-4">
                <div>
                  <p className="font-medium">
                    {editor.completed} z {editor.total} wyborów gotowych
                  </p>
                  <p className="text-sm text-muted">
                    {editor.dirty ? 'Masz niezapisane zmiany' : 'Wybory są zapisane'}
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  disabled={editor.busy || editor.completed !== editor.total}
                  onClick={async () => {
                    if (await editor.save()) {
                      navigate('/plan');
                    }
                  }}
                >
                  {editor.busy ? (
                    <LoaderCircle className="animate-spin" size={19} />
                  ) : (
                    <Check size={19} />
                  )}
                  Zapisz i pokaż plan
                </button>
              </div>
            </>
          )}
        </div>
        <GroupGuide />
      </div>
      {extraOpen && (
        <Modal
          title="Dodaj zajęcia"
          onClose={() => {
            if (!editor.busy) {
              setExtraOpen(false);
            }
          }}
        >
          {editor.error && (
            <p role="alert" className="notice notice-warning mb-4">
              {editor.error}
            </p>
          )}
          <ExtraCoursePicker
            term={editor.config.term}
            existingIds={editor.catalog?.courses.map((course) => course.courseId) ?? []}
            busy={editor.busy}
            onAdd={async (course) => {
              const added = await editor.addCourse(course);
              if (added) {
                setExtraOpen(false);
              }
              return added;
            }}
          />
        </Modal>
      )}
    </>
  );
}

export default function GroupsPage() {
  const { restoring } = useTimetable();
  if (restoring) {
    return (
      <p role="status" className="notice">
        <LoaderCircle className="animate-spin" size={20} />
        Wczytuję zapisane grupy…
      </p>
    );
  }
  return <GroupEditor />;
}

function GroupGuide() {
  return (
    <aside className="panel p-6">
      <BookOpen size={25} className="mb-4 text-primary-text" />
      <h2 className="text-lg">Plan po Twojemu</h2>
      <ol className="mt-4 space-y-4 text-sm text-muted">
        <li>
          <strong className="block text-ink">1. Wybierz studia</strong>Kierunek i cykl pozwolą
          znaleźć Twoje przedmioty.
        </li>
        <li>
          <strong className="block text-ink">2. Dobierz grupy</strong>Wykład i ćwiczenia mogą mieć
          inne numery grup.
        </li>
        <li>
          <strong className="block text-ink">3. Dodaj pozostałe zajęcia</strong>Język i WF
          znajdziesz osobno. Wszystko trafi do jednego planu.
        </li>
      </ol>
      <p className="mt-5 border-t border-line pt-5 text-sm text-muted">
        Nie chodzisz na dane zajęcia? Wybierz „Nie uczęszczam”. Wybory tutaj nie zmieniają zapisów w
        USOS.
      </p>
    </aside>
  );
}
