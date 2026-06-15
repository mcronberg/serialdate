# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local Development

Serve locally with any static file server — no build step required:

```bash
python -m http.server 8000
# Then open http://localhost:8000
```

The service worker only activates over HTTPS or `localhost`. To test SW updates, use DevTools → Application → Clear Storage between version changes.

## Architecture

Single-page static PWA — no framework, no bundler, no dependencies installed locally.

- `index.html` — UI structure using Tailwind CSS (loaded from CDN)
- `script.js` — all application logic: date conversion, i18n, analytics, clipboard, reference tables
- `sw.js` — service worker for offline/cache support
- `style.css` — minimal custom styles (scrollbar, dark mode fixes only)
- `manifest.json` — PWA installability config

## Critical: Version Synchronization

**Always increment `VERSION` in both `script.js` AND `sw.js` for any change to HTML, CSS, or JS.** Cache invalidation depends on this — users won't see updates otherwise.

```javascript
// script.js line 10
const VERSION = '1.92';

// sw.js line 2
const VERSION = '1.92';
```

## Date Calculation

Excel serial dates use `1899-12-30` as Day 0. Always use UTC methods to avoid timezone bugs:

```javascript
const baseDate = Date.UTC(1899, 11, 30);
const serial = (utcDate - baseDate) / MS_PER_DAY;
```

## Internationalization

- Translations live in the `translations` object in `script.js`, keyed by `en`, `da`, `no`, `sv`, `de`
- HTML elements use `data-i18n` attributes; `updateLanguage()` applies translations and re-renders reference tables
- Language auto-detected from `navigator.language`, stored in `localStorage.language`

To add a new language:
1. Add a translation object to `translations` in `script.js`
2. Add a button to `#langMenu` in `index.html` with a `fi fi-XX` flag icon
3. Add detection logic and a `langMap` entry in `updateLanguage()`

## Theme System

- Tailwind `dark:` class-based mode toggled on `<html>`
- System preference detected via `window.matchMedia('(prefers-color-scheme: dark)')`
- User choice persisted in `localStorage.theme`

## Analytics

Google Forms used as analytics backend via `no-cors` POST. Debounced 2 seconds. Entry field IDs in `FORM_ENTRIES` must match the actual Google Form — changing them silently breaks logging.
