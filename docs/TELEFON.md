# Kampus na Androidzie i iPhonie

## Szybkie otwarcie przez domowe Wi-Fi

1. Na komputerze, w katalogu projektu, wykonaj:

   ```sh
   bun install
   bun run dev
   ```

2. Podłącz telefon i komputer do tej samej sieci Wi-Fi.
3. W Chrome lub Safari na telefonie wpisz adres **Network** pokazany przez Vite,
   np. `http://192.168.0.230:5173`. Nie wpisuj `localhost` na telefonie.
4. Jeśli Windows zapyta o dostęp do sieci, zezwól Node.js na sieć prywatną.

Komputer musi być włączony, a serwer uruchomiony. Adres IP może się zmienić.
Zwykły adres LAN przez HTTP pozwala testować plan; **instalacja PWA i tryb offline
na telefonie wymagają HTTPS**. Wyjątkiem jest `localhost` tylko na samym komputerze.

## Stały link HTTPS — bez włączonego komputera

### Najkrótsza ścieżka: hosting plików

1. Wykonaj `bun run build`.
2. Opublikuj folder **`dist`** na hostingu statycznym z HTTPS, np. przez
   [Netlify Drop](https://app.netlify.com/drop).
3. Otrzymany link HTTPS otwórz na telefonie.

Gotową stroną jest `dist`, nie folder `src` ani całe repozytorium.
Aplikacja nie wymaga serwera, kluczy API ani sekretów.

### GitHub Pages — workflow jest już w projekcie

1. Wyślij zmiany do swojego repozytorium GitHub.
2. **Settings → Pages → Source → GitHub Actions**.
3. **Actions → Deploy Kampus to GitHub Pages → Run workflow**.
4. Adres HTTPS znajdziesz w wyniku wdrożenia i w **Settings → Pages**.

Workflow (`.github/workflows/pages.yml`) uruchamia się ręcznie. Instaluje zależności,
wykonuje testy, buduje aplikację i ustawia ścieżkę odpowiadającą nazwie repozytorium.
Przy kolejnych zmianach wyślij je do GitHub i uruchom workflow ponownie.

Dla innego hostingu w podkatalogu ustaw `VITE_BASE_PATH=/nazwa-katalogu/` podczas
budowania. Dla hostingu w głównej domenie używaj domyślnego `/`.
W PowerShell zmienną ustawisz przez `$env:VITE_BASE_PATH = '/nazwa-katalogu/'`.

## Instalacja na Androidzie

Otwórz link **HTTPS w Chrome** → **⋮ → Dodaj do ekranu głównego → Zainstaluj**.
Gdy Chrome udostępni instalację bezpośrednią, w ustawieniach Kampusu zobaczysz
również przycisk **Zainstaluj Kampus**.

## Instalacja na iPhonie / iPadzie

Otwórz link **HTTPS w Safari** → **Udostępnij → Do ekranu początkowego → Dodaj**.
Jeśli iOS pokaże opcję „Otwórz jako aplikację”, pozostaw ją włączoną.

Nie potrzebujesz APK ani App Store. Korzystaj z aktualnego Safari/Chrome;
starsze przeglądarki lub przeglądarki wewnątrz komunikatorów mogą nie obsługiwać instalacji.

## Pierwsze użycie i offline

1. Otwórz aplikację z nowej ikony, mając dostęp do internetu.
2. Wybierz kierunek (domyślnie Sztuczna inteligencja), semestr studiów i cykl USOS.
3. Wybierz grupę przy każdych zajęciach albo „Nie uczęszczam”.
4. Wybierz **Pokaż mój plan** i zaczekaj na zakończenie pobierania.
5. Od tej chwili możesz otwierać pobrany plan bez internetu.

Jeśli plan jest niepełny, aplikacja pokaże brakujące grupy. Zwróć uwagę na datę
ostatniej aktualizacji; USOS może zmienić terminy. **Ustawienia → Odśwież plan teraz**
pobiera najnowsze spotkania. **Moje grupy → Odśwież dostępne grupy** aktualizuje katalog.

Wybory i pobrane dane są lokalne. Wyczyszczenie danych strony usuwa je. Inny telefon
lub inny adres aplikacji wymaga ponownego wyboru grup. System może usunąć dane witryn,
których długo nie używasz; po dłuższej przerwie uruchom aplikację online.

Po wdrożeniu nowej wersji Kampus wyświetli przycisk **Zaktualizuj aplikację**.
To aktualizuje interfejs; odświeżanie planu aktualizuje dane USOS.
