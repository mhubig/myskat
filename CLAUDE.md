# MySkat — Skat-AMRAP Challenge-Tool

Onepage-Web-App für den AMRAP-Teil der August-Challenge eines CrossFit-Clubs:
Ein 32-Blatt-Skat-Deck bestimmt Bodyweight-Übungen und Wiederholungen, ein
10-Minuten-Timer läuft, Ergebnisse werden lokal im Browser gespeichert.

Die Fachbegriffe und Spielregeln stehen in [CONTEXT.md](./CONTEXT.md) — dort
nachschlagen, bevor Regeln implementiert oder geändert werden.
Architektur-Entscheidungen stehen in [docs/adr/](./docs/adr/).

## Leitprinzip

**Simplizität.** Keine Features auf Vorrat, keine Historien-Ansichten, keine
Einstellungen. Wenn ein Feature verzichtbar ist, ist es verzichtbar.

## Technik-Entscheidungen

- **Vanilla HTML/CSS/JS, kein Build-Step, keine Dependencies.** Es gibt kein
  `npm install` und keine Toolchain — die Dateien werden exakt so ausgeliefert,
  wie sie im Repo liegen. Bitte kein Framework und keine externen Libraries
  einführen.
- **Minimale PWA:** `manifest.webmanifest` + kleiner Service Worker (`sw.js`,
  cache-first). Beim Deploy die `VERSION`-Konstante in `sw.js` hochzählen,
  sonst hängt die alte Version im Cache.
- **Grafiken sind hand-codierte Inline-SVGs** (muskulöse Alice-im-Wunderland-
  Kartensoldaten, ein Motiv pro Übung), keine Bilddateien für die Karten.
- **Persistenz:** ausschließlich `localStorage`. Gespeichert wird jedes
  abgeschlossene Workout als Roh-Datensatz; die UI zeigt nur Summen.
  Keys: `myskat.workouts` (Array), `myskat.current` (laufendes Workout).
- **Timer rechnet mit fester Endzeit** (`startedAt + 10 min`), nie mit
  Tick-Zählung — so überlebt er Tab-Wechsel und Reloads.

## Dateien

| Datei                 | Zweck                                    |
|-----------------------|------------------------------------------|
| `index.html`          | Alle Screens (Home, Countdown, Workout, Ergebnis) |
| `style.css`           | Mobile-first Styling                     |
| `app.js`              | Gesamte Logik inkl. SVG-Kartengenerierung |
| `sw.js`               | Service Worker (Version beim Deploy bumpen) |
| `manifest.webmanifest`| PWA-Manifest                             |
| `CNAME`               | Custom Domain für GitHub Pages           |

## Entwickeln & Testen

- Lokal: `python3 -m http.server 8000` im Repo-Root, dann `http://localhost:8000`.
- **Kurzer Timer zum Testen:** `?t=<sekunden>` an die URL hängen
  (z. B. `?t=10` für ein 10-Sekunden-Workout).
- Beim lokalen Testen ggf. den Service-Worker-Cache in den DevTools leeren.

## Deploy

GitHub Pages, Repo `mhubig/myskat`, Branch `main`, Root-Verzeichnis.
Deploy = `git push` (vorher `VERSION` in `sw.js` bumpen).
Domain: `myskat.hubig.it` (DNS-CNAME auf `mhubig.github.io`).
