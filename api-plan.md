# serialdate-api — Implementeringsplan (Cloudflare Workers)

Status: **Klar til opsætning.** Dette dokument er en selvstændig blueprint til det nye repo (`serialdate-api` eller lignende) — alt kode herunder kan kopieres direkte ind i det tomme projekt.

Formål: en *rigtig* HTTP JSON-API (curl-bar, rigtig `Content-Type: application/json`, rigtige statuskoder) til Excel serial-date-konvertering, hostet gratis på Cloudflare Workers. Erstatter ikke `?format=json`-pseudo-API'en på hovedsitet (mcronberg.github.io/serialdate) — den bliver stående som den er, til hurtige browser-opslag. Dette bliver den "rigtige" variant til programmatisk brug (curl, servere, integrationer).

---

## 1. Repo-struktur

```
serialdate-api/
├── src/
│   ├── date-utils.js     ← portet fra hovedrepoet (ren logik, ESM)
│   └── index.js          ← Worker entrypoint: routing, CORS, JSON, statuskoder
├── test/
│   └── date-utils.test.js
├── wrangler.toml
├── package.json
├── .gitignore
└── README.md
```

Ingen build-step, ingen framework — ren Worker med native ES modules, ligesom hovedsitet er ren HTML/CSS/JS uden framework.

---

## 2. `src/date-utils.js`

Direkte portering af [date-utils.js](date-utils.js) fra hovedrepoet. Samme logik, samme kendte epoke-kvirk (dokumenteret i kommentaren), men ESM-eksport i stedet for CommonJS-guard (Workers kører moderne ES modules nativt, og Node's `node:test` kan importere `.js` direkte når `"type": "module"` er sat i `package.json`).

```javascript
// ============================================================================
// Pure Excel serial date <-> calendar date conversion utilities.
// ----------------------------------------------------------------------------
// Ported from https://github.com/mcronberg/serialdate/blob/main/date-utils.js
// Keep in sync manually if the conversion logic ever changes there (rare -
// it's a stable, well-established formula).
//
// No I/O, no Workers-specific APIs - runs identically in the Worker runtime
// and in plain Node (used by test/date-utils.test.js via `node --test`).
// ============================================================================

export const MS_PER_DAY = 86400000;
export const MIN_EXCEL_DATE = 1; // 1900-01-01
export const MAX_EXCEL_DATE = 2958465; // 9999-12-31

// Epoch trick: using 1899-12-30 (two days before 1900-01-01) as day 0
// reproduces Excel's serial numbers correctly for every real calendar date
// from 1900-03-01 onward, because it happens to absorb Excel/Lotus 1-2-3's
// historical "1900 is a leap year" bug. Serials 1-60 (Dec 1899 - Feb 1900)
// are each one calendar day "behind" real Excel; they converge exactly from
// serial 61 (1900-03-01) onward. This is a well-known, accepted limitation
// of this epoch trick - see date-utils.js in the main serialdate repo.
export const EXCEL_BASE_DATE = Date.UTC(1899, 11, 30);

export function escapeHtml(str) {
    return str.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
}

export function formatDateParts(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return {
        iso: date.toISOString(),
        date: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
        time: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`,
        milliseconds: date.getUTCMilliseconds()
    };
}

export function excelToJson(rawValue) {
    const serial = parseFloat(String(rawValue).replace(',', '.'));
    if (isNaN(serial)) {
        return { error: `Invalid "excel" value: "${rawValue}" is not a number.` };
    }
    if (serial < MIN_EXCEL_DATE || serial > MAX_EXCEL_DATE) {
        return { error: `"excel" value ${serial} is out of range (${MIN_EXCEL_DATE}-${MAX_EXCEL_DATE}).` };
    }
    const date = new Date(EXCEL_BASE_DATE + serial * MS_PER_DAY);
    return { input: { excel: serial }, excel: serial, ...formatDateParts(date) };
}

export function dateToJson(rawDate, rawTime, rawMs) {
    const dateMatch = String(rawDate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) {
        return { error: `Invalid "date" value: "${rawDate}". Expected ISO format YYYY-MM-DD.` };
    }
    const [, year, month, day] = dateMatch.map(Number);

    let hours = 0, minutes = 0, seconds = 0;
    if (rawTime) {
        const timeMatch = String(rawTime).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (!timeMatch) {
            return { error: `Invalid "time" value: "${rawTime}". Expected HH:MM or HH:MM:SS.` };
        }
        hours = Number(timeMatch[1]);
        minutes = Number(timeMatch[2]);
        seconds = Number(timeMatch[3] || 0);
    }

    let ms = 0;
    if (rawMs) {
        ms = parseInt(rawMs, 10);
        if (isNaN(ms) || ms < 0 || ms > 999) {
            return { error: `Invalid "ms" value: "${rawMs}". Expected an integer between 0 and 999.` };
        }
    }

    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, ms));
    // Reject impossible dates/times (e.g. 2024-13-40 or 25:00) that Date rolled over.
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day || date.getUTCHours() !== hours ||
        date.getUTCMinutes() !== minutes || date.getUTCSeconds() !== seconds) {
        return { error: `Invalid date/time: "${rawDate}${rawTime ? ' ' + rawTime : ''}".` };
    }

    const serial = (date.getTime() - EXCEL_BASE_DATE) / MS_PER_DAY;
    if (serial < MIN_EXCEL_DATE || serial > MAX_EXCEL_DATE) {
        return { error: `Date "${rawDate}" is out of range (serial must be ${MIN_EXCEL_DATE}-${MAX_EXCEL_DATE}).` };
    }
    const input = { date: rawDate };
    if (rawTime) input.time = rawTime;
    if (rawMs) input.ms = ms;
    return { input, excel: serial, ...formatDateParts(date) };
}

export function getExcelSerial(dateObj) {
    try {
        if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
            throw new Error('Invalid date object');
        }
        const utcDate = Date.UTC(
            dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(),
            dateObj.getHours(), dateObj.getMinutes(), dateObj.getSeconds(), dateObj.getMilliseconds()
        );
        return (utcDate - EXCEL_BASE_DATE) / MS_PER_DAY;
    } catch (error) {
        return 0;
    }
}

export function getDateFromExcel(serial) {
    try {
        const numSerial = parseFloat(serial);
        if (isNaN(numSerial)) throw new Error('Invalid serial number');
        if (numSerial < MIN_EXCEL_DATE || numSerial > MAX_EXCEL_DATE) {
            throw new Error('Serial number out of valid range (1-2958465)');
        }
        const resultDate = new Date(EXCEL_BASE_DATE + (numSerial * MS_PER_DAY));
        if (isNaN(resultDate.getTime())) throw new Error('Invalid date calculation');
        return resultDate;
    } catch (error) {
        return new Date();
    }
}
```

> `getExcelSerial`/`getDateFromExcel` er ikke strengt nødvendige for selve API'en (kun `excelToJson`/`dateToJson` bruges af `index.js`), men er taget med for fuldstændighed/fremtidig brug og for at kunne genbruge testene 1:1.

---

## 3. `src/index.js` — Worker entrypoint

```javascript
import { excelToJson, dateToJson } from './date-utils.js';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body, status = 200) {
    return new Response(JSON.stringify(body, null, 2), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            // Pure function of the query string - safe to cache at the edge.
            'Cache-Control': 'public, max-age=3600',
            ...CORS_HEADERS,
        },
    });
}

const USAGE = {
    name: 'serialdate-api',
    description: 'Convert between Excel serial date numbers and calendar dates.',
    usage: {
        excelToDate: 'GET /?excel=45292',
        dateToExcel: 'GET /?date=2024-01-01&time=13:30:00&ms=250',
    },
    parameters: {
        excel: 'Excel serial number to convert to a date. Comma decimals accepted (45614,5). Takes precedence over "date" if both given.',
        date: 'Date to convert to a serial number, ISO format YYYY-MM-DD.',
        time: 'Optional time of day, HH:MM or HH:MM:SS. Used with "date".',
        ms: 'Optional milliseconds (0-999). Used with "date".',
    },
    source: 'https://github.com/<YOUR-GH-USER>/serialdate-api',
    relatedProject: 'https://mcronberg.github.io/serialdate/',
};

export default {
    async fetch(request) {
        const url = new URL(request.url);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        if (request.method !== 'GET') {
            return json({ error: `Method ${request.method} not allowed. Use GET.` }, 405);
        }

        if (url.pathname !== '/' ) {
            return json({ error: `Not found: ${url.pathname}` }, 404);
        }

        const excelParam = url.searchParams.get('excel');
        const dateParam = url.searchParams.get('date');

        if (excelParam === null && dateParam === null) {
            return json(USAGE);
        }

        const result = excelParam !== null
            ? excelToJson(excelParam)
            : dateToJson(dateParam, url.searchParams.get('time'), url.searchParams.get('ms'));

        return json(result, result.error ? 400 : 200);
    },
};
```

**Designvalg værd at bemærke:**
- Samme parameternavne/response-shape som hovedsitets `?format=json` (`excel`, `date`, `time`, `ms` → `input`/`excel`/`iso`/`date`/`time`/`milliseconds`/`error`) — nem migrering for alle der allerede har brugt pseudo-API'en.
- Rigtige statuskoder: `200` success, `400` valideringsfejl, `404` ukendt path, `405` forkert metode (pseudo-API'en kan ikke gøre dette, da den kører i browseren uden en server).
- `Cache-Control: public, max-age=3600` — da svaret er en ren funktion af query-strengen, cacher Cloudflares edge det automatisk. Gratis performance-gevinst, ingen kode nødvendig ud over headeren.
- Roden (`/` uden parametre) returnerer en lille selv-dokumenterende usage-JSON i stedet for en fejl — rart for nye brugere/curl-udforskning.

---

## 4. `wrangler.toml`

```toml
name = "serialdate-api"
main = "src/index.js"
compatibility_date = "2026-07-25"

[observability]
enabled = true
```

`compatibility_date` sættes til datoen for første deploy — opdatér ikke bagudrettet uden at læse Cloudflares changelog for breaking changes.

---

## 5. `package.json`

```json
{
  "name": "serialdate-api",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "description": "Real HTTP JSON API for Excel serial date <-> calendar date conversion, on Cloudflare Workers.",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "node --test test/*.test.js"
  },
  "devDependencies": {
    "wrangler": "^4.114.0"
  }
}
```

---

## 6. `test/date-utils.test.js`

Samme tests som hovedrepoet, portet til ESM `import`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    MIN_EXCEL_DATE,
    MAX_EXCEL_DATE,
    excelToJson,
    dateToJson
} from '../src/date-utils.js';

test('excelToJson: valid and invalid input', () => {
    assert.deepEqual(excelToJson('45292'), {
        input: { excel: 45292 },
        excel: 45292,
        iso: '2024-01-01T00:00:00.000Z',
        date: '2024-01-01',
        time: '00:00:00',
        milliseconds: 0
    });

    // Comma decimal separator (DA/NO/SV/DE locales) is normalized.
    assert.equal(excelToJson('45292,5').excel, 45292.5);

    assert.match(excelToJson('not-a-number').error, /is not a number/);
    assert.match(excelToJson(String(MAX_EXCEL_DATE + 1)).error, /out of range/);
});

test('dateToJson: valid and invalid input', () => {
    assert.deepEqual(dateToJson('2024-01-01', null, null), {
        input: { date: '2024-01-01' },
        excel: 45292,
        iso: '2024-01-01T00:00:00.000Z',
        date: '2024-01-01',
        time: '00:00:00',
        milliseconds: 0
    });

    assert.equal(dateToJson('2024-01-01', '13:30:00', '250').excel, 45292.5625 + 250 / 86400000);
    assert.match(dateToJson('2024-13-40', null, null).error, /Invalid date\/time/);
    assert.match(dateToJson('not-a-date', null, null).error, /Expected ISO format/);
    assert.match(dateToJson('2024-01-01', '25:00', null).error, /Invalid date\/time/);
    assert.match(dateToJson('2024-01-01', '1PM', null).error, /Invalid "time" value/);
});

test('MIN_EXCEL_DATE / MAX_EXCEL_DATE match Excel\'s documented supported range', () => {
    assert.equal(MIN_EXCEL_DATE, 1);
    assert.equal(MAX_EXCEL_DATE, 2958465);
});
```

> Bemærk: `getExcelSerial`/`getDateFromExcel`-testene fra hovedrepoet (med lokal-tid-kvirken) er bevidst udeladt her, da `index.js` ikke bruger dem. Portér dem 1:1 fra [test/date-utils.test.js](test/date-utils.test.js) hvis de tages i brug.

---

## 7. `.gitignore`

```
node_modules/
.wrangler/
.dev.vars
```

---

## 8. `README.md` (stub til det nye repo)

```markdown
# serialdate-api

Real HTTP JSON API for converting between Excel serial date numbers and calendar dates.
Companion project to [serialdate](https://github.com/mcronberg/serialdate) (the browser PWA) —
this is the `curl`-able, server-side equivalent for programmatic/integration use.

🔗 **Base URL:** https://serialdate-api.<your-subdomain>.workers.dev/

## Usage

    GET /?excel=45292
    GET /?date=2024-01-01
    GET /?date=2024-01-01&time=13:30:00&ms=250

Returns `application/json`. See root path (`/` with no params) for a self-describing usage payload.

## Development

    npm install
    npm test          # unit tests for the conversion logic
    npm run dev        # wrangler dev - local Worker at http://localhost:8787

## Deployment

Auto-deploys on push to `main` via Cloudflare Workers Builds (see api-plan.md in the
serialdate repo for full setup notes). Manual deploy: `npm run deploy` (requires `wrangler login` once).
```

---

## 9. Trin-for-trin opsætning (kør i det nye, tomme repo)

```powershell
# 1) Initialisér projektet (opret filerne fra denne plan i strukturen ovenfor)
npm init -y
npm install -D wrangler

# 2) Log ind på Cloudflare (åbner browser, klik "Allow")
npx wrangler login

# 3) Test lokalt
npm test
npm run dev
# -> åbn http://localhost:8787/?excel=45292 i browseren for at bekræfte

# 4) Første manuelle deploy (bekræfter alt virker end-to-end på Cloudflare)
npm run deploy
# -> giver dig URL'en: https://serialdate-api.<subdomain>.workers.dev
```

### Auto-deploy ved commit (Cloudflare Workers Builds)

1. Push repoet til GitHub
2. Gå til [Cloudflare dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Import a repository**
3. Vælg GitHub-repoet, autorisér Cloudflares GitHub App
4. Sæt:
   - **Build command:** `npm ci && npm test`  ← blokerer deploy hvis testene fejler
   - **Deploy command:** `npx wrangler deploy`
   - **Root directory:** `/` (eller subfolder hvis I laver et monorepo)
5. Gem — fra nu af bygger/deployer Cloudflare automatisk ved hvert push til `main`, med preview-URL'er på PR's

---

## 10. Fremtidige overvejelser (ikke nødvendige for v1)

- **Rate limiting**: gratis tier (100k requests/dag) er rigeligt til at starte. Hvis misbrug bliver et problem: Cloudflare Rate Limiting Rules, eller simpel per-IP-tælling i Workers KV.
- **Custom domain**: kan mappes senere hvis I får et domæne ind i Cloudflare — kræver ingen kodeændring, kun DNS + Worker route i dashboardet.
- **Versionering**: Workers Builds gemmer deployment-historik i dashboardet; overvej `git tag`s i dette repo hvis API-kontrakten nogensinde laver breaking changes (bør undgås — hold bagudkompatibilitet, tilføj i stedet nye felter).
- **Link fra hovedsitet**: når API'en er live og stabil, opdatér [README.md](README.md) i hoved-repoet til at pege programmatiske brugere derhen i stedet for `?format=json`.

---

## 11. Sammenhæng med hovedrepoet

|                 | serialdate (dette repo)                                            | serialdate-api (nyt repo)                   |
| --------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| Host            | GitHub Pages                                                       | Cloudflare Workers                          |
| Formål          | Browser-UI (PWA)                                                   | Rigtig HTTP JSON API                        |
| `date-utils.js` | Kilde (single source of truth)                                     | Manuel kopi, hold i sync ved ændringer      |
| Deploy-trigger  | Push til `main` (GitHub Pages)                                     | Push til `main` (Cloudflare Workers Builds) |
| Version         | `VERSION`-konstant, synkroniseret via `npm run check:version-sync` | Uafhængig — egen `package.json`-version     |
