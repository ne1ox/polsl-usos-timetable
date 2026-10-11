# Kampus — POLSL USOS Timetable

Mobilna aplikacja React + TypeScript + Vite + Tailwind CSS do planu zajęć Politechniki Śląskiej.
Działa bez backendu, klucza API i logowania. Można ją zainstalować jako PWA na
Androidzie i iPhonie. Interfejs oraz wcześniej pobrany plan działają offline.

- Wyszukiwarka kierunków USOS; domyślnie Sztuczna inteligencja, 1. semestr, `2026/2027-Z`.
- Nazwy przedmiotów i rzeczywiste grupy wykładów, ćwiczeń i laboratoriów.
  Opcja „Nie uczęszczam” pomija zajęcia.
- Pionowy plan 07:00–21:00, rozszerzany do godzin zajęć; nakładające się spotkania
  obok siebie, zajęcia przez północ widoczne w obu dniach.
- Swipe między dniami, nawigacja tygodniowa, kalendarz miesięczny, dowolna data,
  szczegóły sal oraz linki do USOS.
- Zapis wyborów, edycja grup i kierunku, odświeżanie planu i katalogu, informacje
  o niepełnych lub nieaktualnych danych. Układ na telefon, tablet i komputer.
- Roboto, motyw jasny, ciemny i systemowy; większy tekst oraz kolory zajęć zgodne z USOS.
- Linia bieżącej godziny w dzisiejszym planie, aktualizowana co 15 sekund. Przy przewijaniu
  znacznik pozostaje przy krawędzi widocznego planu i wskazuje kierunek do aktualnej godziny.
- Konfiguracja w „Moich grupach”. „Mój plan” zawsze pokazuje kalendarz, także przed konfiguracją.
- Dodawanie języka, WF-u i innych przedmiotów spoza kierunku przez wyszukiwarkę USOS.

**[Jak otworzyć i zainstalować na telefonie →](docs/TELEFON.md)**

## Uruchomienie

```sh
bun install
bun run dev
# http://localhost:5173; adres Network z terminala można otworzyć w tym samym Wi-Fi.

bun run build
bun run preview
# http://localhost:4173 — build produkcyjny z service workerem.

bun test
bun run typecheck
bun run check
# ESLint, Prettier, testy i build produkcyjny.
```

Wymagany jest Bun; Vite wymaga Node.js 20.19+ lub 22.12+.
Instalacja PWA i offline na telefonie wymagają hostingu HTTPS. W repozytorium
jest ręcznie uruchamiany workflow GitHub Pages (`.github/workflows/pages.yml`).

## Organizacja kodu

- `src/App.tsx`: trasy React Router (`#/plan`, `#/groups`, `#/settings`). Hash routing
  działa na hostingu statycznym i GitHub Pages bez reguł przekierowań.
- `src/pages/`: strony planu, grup i ustawień.
- `src/components/groups/`, `src/components/schedule/`: komponenty poszczególnych funkcji.
- `src/state/TimetableProvider.tsx`: odtwarzanie, zapisywanie i odświeżanie planu.
- `src/hooks/`: edycja grup, motyw i zegar; `src/lib/`: operacje na datach, profilu i katalogach.
- `src/styles.css`: tokeny jasnego i ciemnego motywu oraz wspólne elementy Tailwinda.
- `api/`: niezależny od Reacta klient USOS, cache i normalizacja odpowiedzi.

`bun run lint` wymusza m.in. klamry, brak zagnieżdżonych operatorów warunkowych,
jedną instrukcję na linię, limity wielkości funkcji i plików oraz reguły hooków i dostępności.
`bun run format` formatuje kod i porządkuje klasy Tailwinda. CI sprawdza oba narzędzia.
Build PWA używa wariantu WASM Rollupa, aby nie zależeć od natywnego dodatku systemowego.

## Kierunki i grupy

Wyszukiwanie korzysta z `progs/search` (do 20 wyników — zawęź nazwę, jeśli brakuje
kierunku). Domyślny cykl jest jawnie ustawiony na `2026/2027-Z`; zmień go w formularzu,
gdy potrzebujesz innego. `Z` oznacza zimowy, `L` letni.

POLSL często używa schematu `SIAu-SI7` → `SIAu>SI1` dla 1. semestru, ale kod
programu **nie gwarantuje** takiego prefiksu przedmiotów. Możesz go poprawić w
„Kod przedmiotów i opcje zaawansowane”. Jeśli brakuje grup, sprawdź cykl,
semestr i początek kodu przedmiotu w USOS; specjalności i nabory mogą mieć inne kody.

W „Moje grupy” przycisk **Odśwież listę** omija cache katalogu.
W „Ustawienia” przycisk **Odśwież plan teraz** pobiera ponownie spotkania wybranych grup,
pozostawiając katalog i wybory. Błędy i limity USOS nadal mają cooldown.

Przycisk **Dodaj język, WF lub inny przedmiot** wyszukuje po nazwie lub kodzie.
USOS ogranicza wyszukiwanie do 100 wyników; aplikacja sprawdza dostępne strony i filtruje
je według cyklu. Jeśli brakuje przedmiotu, wpisz dokładniejszą nazwę lub jego kod.
Dodatkowe przedmioty mają własne grupy i są zapisywane w profilu wraz z pozostałymi wyborami.
Starsze profile bez dodatkowych przedmiotów pozostają obsługiwane.

## CLI

```sh

# Tylko katalog grup — bez pobierania spotkań.
bun run cli "SIAu>SI1" "2026/2027-Z"

# Katalog, następnie pełny plan wskazanych grup.
bun run cli "SIAu>SI1" "2026/2027-Z" 152006:1 152005:1

bun test
bun run typecheck

# Opcjonalny test żywego USOS-a: Matematyka, jedna grupa, zwykle 4 zapytania.
# Weryfikuje także nagłówki CORS, cache oraz budowanie modułu dla przeglądarki.
bun run smoke
```

Semestr jest podawany jawnie. Kod nie zgaduje kalendarza uczelni na podstawie miesiąca.
CLI używa cache'u w pamięci, który znika po zakończeniu procesu. W przeglądarce domyślnym
magazynem jest IndexedDB, więc cache przeżywa przeładowanie aplikacji.

## Przepływ i liczba zapytań

1. `courses/search`, po maksymalnie 20 wyników na stronę: pobiera `course_id` i `terms`.
   Odrzuca dopasowania spoza prefiksu identyfikatora i przedmioty bez wskazanego semestru.
2. `courses/course_edition2`, raz na pasujący przedmiot: zagnieżdżone
   `course_units[id|class_groups[number]]` zwraca jednostki i rzeczywiste numery grup,
   niezależnie od dat spotkań. Numery nie muszą być ciągłe: `[1, 3]` oznacza dwie grupy.
3. `groups/groups`, zbiorczo: nazwy i identyfikatory rodzajów zajęć do selektora grup.
   Wystarczy jedna reprezentatywna grupa na jednostkę. Jednostki bez grup pozostają
   w katalogu z `groupCount: 0` i nie wymagają tego zapytania.
4. Użytkownik wybiera grupy z katalogu. Do tej chwili nie pobieramy żadnych spotkań.
5. `tt/classgroup_dates2`, raz na unikalną wybraną grupę: wszystkie jej spotkania,
   od razu z godzinami, salą, budynkiem, identyfikatorami prowadzących i linkiem.
6. Normalizacja, usuwanie duplikatów, sortowanie i indeks po dniach odbywają się lokalnie.

Dla pustego cache'u koszt wynosi **P + C + B + G**:

- P — liczba stron wyszukiwania;
- C — liczba unikalnych przedmiotów pasujących do prefiksu i semestru;
- B — liczba paczek metadanych (do 40 jednostek mających grupy w jednej paczce);
- G — liczba unikalnych wybranych grup.

Limit 40 jest wyborem klienta ograniczającym długość URL, a nie limitem USOS-a.
Kolejny odczyt z ważnego cache'u kosztuje **0 zapytań**. Dodanie nowej grupy do
już pobranego planu kosztuje jedno zapytanie; odznaczenie grupy nie kosztuje nic.
Katalog i numery grup można wykorzystywać wielokrotnie, bez ponownego wyszukiwania.

`tt/classgroups` obsługuje wiele grup, ale tylko siedmiodniowe okno. Nie używamy go
do pełnego semestru, żeby nie skanować kolejnych tygodni. Może być przydatny w przyszłym
trybie pobierania pojedynczego tygodnia. Liczba żądań jest mierzalna; rzeczywisty koszt
obliczeń USOS-a nie jest znany, więc nie utożsamiamy jednego żądania z jedną operacją bazy.

## API dla Reacta

Importuj `api/index.ts`, nie główny `index.ts` zawierający demonstrację Bun.
Używaj jednej instancji klienta na aplikację — domyślny `timetableClient` jest współdzielony.

```ts
import { timetableClient, type GroupSelection } from './api';

const catalog = await timetableClient.getCatalog('SIAu>SI1', '2026/2027-Z');

// catalog.courses: przedmiot + jednostka (np. wykład lub ćwiczenia).
// Pola selektora: name, classTypeName, unitId, groupNumbers, groupCount.
// Wybrane wartości pochodzą z kontrolek użytkownika, nie z indeksów tablicy.
const selected: GroupSelection[] = [
  { unitId: '152006', groupNumber: 1 },
  { unitId: '152005', groupNumber: 1 },
];

const timetable = await timetableClient.getTimetable(catalog, selected);
// timetable.events: posortowane wydarzenia, event.id jako React key.
// timetable.byDate["2026-10-12"]: wydarzenia zaczynające się w tym dniu.
// Nieprawidłowy wybór jest odrzucany przed wysłaniem zapytań.

// Przycisk odświeżania planu nie musi odświeżać katalogu.
const refreshed = await timetableClient.getTimetable(catalog, selected, { refresh: true });
```

Przykład integracji z efektem komponentu (zakłada stabilne referencje `catalog` i `selected`):

```tsx
useEffect(() => {
  if (!catalog) return;
  let active = true;
  setError(null);
  timetableClient.getTimetable(catalog, selected).then(
    (result) => {
      if (active) setTimetable(result);
    },
    (error) => {
      if (active) setError(String(error));
    },
  );
  return () => {
    active = false;
  };
}, [catalog, selected]);
```

Współdzielenie trwających zapytań chroni m.in. przed podwójnymi wywołaniami efektów
w React StrictMode. Odmontowanie komponentu nie przerywa żądania potrzebnego innym
komponentom. Interfejs zapisuje wybrane i pominięte grupy wraz z cyklem w localStorage.

## Model spotkania

- Osobne wydarzenie dla każdego spotkania, z własną salą, budynkiem i prowadzącymi.
- Identyfikatory jednostek, sal, budynków i prowadzących są normalizowane do stringów.
- `startTime` i `endTime` to lokalne ciągi, np. `2026-10-12T10:30:00`,
  z `timeZone: "Europe/Warsaw"`. Nie dopisuj `Z` ani nie interpretuj ich jako UTC.
  Do przeliczania na znacznik czasu użyj biblioteki obsługującej strefy i DST.
- `date` oraz `byDate` odnoszą się do dnia rozpoczęcia; wydarzenie przez północ zachowuje
  pełną datę końca. Interfejs może dzielić je na segmenty podczas rysowania kalendarza.
- `frequency` może być `null`, m.in. dla `classgroup2`.
- `dateStatus` odróżnia potwierdzone spotkania (`classgroup2`), daty wyliczone z reguł
  (`classgroup`) oraz daty niepewne. Dla legacy `once`/`other` USOS może generować
  możliwe terminy, których nie należy przedstawiać jako potwierdzonych.
- `lecturerIds` nie zawiera nazwisk: unikamy dodatkowych żądań o osoby.
- Brak sali lub budynku jest reprezentowany przez `null`.

## Cache, awarie i ograniczenia

Domyślnie katalog ma TTL 24 godziny, a spotkania 12 godzin. To kompromis MVP:
zmiana planu może pozostać niewidoczna do wygaśnięcia cache'u albo ręcznego odświeżenia.
Nie ma odpytywania w tle ani automatycznej pętli ponowień.

```ts
import { createTimetableClient } from './api';

const client = createTimetableClient({
  catalogTtlMs: 24 * 60 * 60 * 1000,
  meetingsTtlMs: 12 * 60 * 60 * 1000,
  concurrency: 2,
  timeoutMs: 20_000,
  errorCooldownMs: 60_000,
});
```

- Równoczesne żądania tego samego zasobu są współdzielone w obrębie instancji klienta.
- IndexedDB współdzieli zapisane odpowiedzi w obrębie originu; jednoczesne zimne starty
  w różnych kartach nie mają wspólnej blokady. Cache nie jest współdzielony między osobami.
- Błąd IndexedDB powoduje przejście na cache w pamięci.
- Przy braku sieci, HTTP 429 lub błędzie serwera zwracamy wcześniejsze dane, jeśli istnieją,
  z `stale: true` i oryginalnym `fetchedAt`. Interfejs powinien pokazać czas aktualizacji.
- HTTP 429 zatrzymuje także kolejne zapytania w kolejce na co najmniej czas `Retry-After`.
  Nieudane zasoby mają cooldown, także przy ręcznym odświeżaniu, aby nie odpytywać ich w pętli.
- Gdy grupa nie ma cache'u i pobranie zawiedzie, pojawia się w `timetable.failures`,
  a `complete` jest `false`. Inne grupy nadal są dostępne. Nie traktuj częściowego planu
  jako kompletnego. Prawidłowa pusta odpowiedź to grupa z zerem wydarzeń.
- `complete` dotyczy wybranych grup; nie oznacza aktualności danych (`stale` jest osobne).
- Błąd budowania katalogu odrzuca wywołanie, zamiast zwracać pozornie pełny katalog.
  Pomyślnie pobrane odpowiedzi zostają w cache'u na kolejną próbę.
- `courses/search` udostępnia najwyżej 100 wyników. Po osiągnięciu tego progu
  `searchMayBeTruncated` jest `true`; interfejs powinien poprosić o węższy prefiks.
- Dane offline wymagają wcześniejszego pobrania. Service worker zapisuje produkcyjny
  interfejs i lokalne fonty; klient IndexedDB zarządza odpowiedziami USOS.

## Dokumentacja USOS

- [Przedmioty, edycje i jednostki](https://usosapi.polsl.pl/developers/api/services/courses/)
- [Metadane grup](https://usosapi.polsl.pl/developers/api/services/groups/)
- [Spotkania i ograniczenia endpointów planu](https://usosapi.polsl.pl/developers/api/services/tt/)
- [CORS i zasady wywołań](https://usosapi.polsl.pl/developers/api/definitions/rules/)
