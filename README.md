# Serial Date Converter

**Serial Date Converter** is a streamlined web utility designed for efficient conversion between Excel serial date numbers and standard date/time formats.

🔗 **Launch Application:** [https://mcronberg.github.io/serialdate/](https://mcronberg.github.io/serialdate/)

## Features

✅ **Bi-directional Conversion** - Convert dates to Excel serial numbers and vice versa  
✅ **Smart Date Paste** - Paste dates in multiple formats (ISO, European, American) with automatic parsing based on selected language  
✅ **Locale-Aware Decimal Handling** - Automatically normalizes comma decimal separators (45214,363 → 45214.363) for Danish/Nordic locales  
✅ **Copy to Clipboard** - Quick copy button for Excel values with visual feedback  
✅ **Dark Mode** - Automatic system preference detection with manual toggle  
✅ **Multi-Language** - 5 languages supported (EN, DA, NO, SV, DE)  
✅ **Offline Support** - Works without internet connection (PWA)  
✅ **Quick Reference** - Dynamic tables with common past/future dates  
✅ **Mobile Friendly** - Responsive design for all devices  
✅ **SEO Optimized** - Full meta tags and structured data

## Installation (PWA)

This tool is a Progressive Web App (PWA), enabling installation on your device for instant access and offline functionality.

### 📱 iOS (iPhone / iPad)
1.  Open the application in **Safari**.
2.  Tap the **Share** button (share icon).
3.  Select **"Add to Home Screen"** from the menu.
4.  Tap **Add**.

### 📱 Android
1.  Open the application in **Chrome**.
2.  Tap the **Menu** button (three dots).
3.  Select **"Install app"** or **"Add to Home screen"**.
4.  Confirm installation.

### 💻 Desktop (Chrome / Edge)
1.  Navigate to the application in your browser.
2.  Click the **Install icon** located in the address bar.
3.  Select **Install** to add the application to your desktop.

## Usage

*   **Date to Excel**: Input a specific date and time to generate the corresponding Excel serial number. You can also paste dates directly - the app intelligently parses various formats based on your selected language (e.g., `25-11-2025` for Danish, `11/25/2025` for English, or ISO `2025-11-25` for all).
*   **Excel to Date**: Enter a serial number (e.g., `45614.5`) to retrieve the human-readable date and time. Decimal separators are automatically normalized - you can paste `45614,5` and it will be converted to the correct format.
*   **Theme**: Toggle between light and dark mode (defaults to system preference).
*   **Localization**: Switch the interface language between English, Danish, Norwegian, Swedish, and German via the toggle button. The date format detection adapts to your selected language.
*   **Reference Table**: Consult the dynamic table for quick lookup of common past and future dates and their serial equivalents. Click any Excel value to copy it to clipboard.

## JSON output (query-string API)

You can get the conversion result as JSON by adding `format=json` to the URL. The page then skips the normal interface and renders the raw JSON response instead.

### Convert a serial number to a date

```
https://mcronberg.github.io/serialdate/?excel=45292&format=json
```

```json
{
  "input": { "excel": 45292 },
  "excel": 45292,
  "iso": "2024-01-01T00:00:00.000Z",
  "date": "2024-01-01",
  "time": "00:00:00",
  "milliseconds": 0
}
```

### Convert a date (and optional time) to a serial number

```
https://mcronberg.github.io/serialdate/?date=2024-01-01&format=json
https://mcronberg.github.io/serialdate/?date=2024-01-01&time=13:30:00&format=json
https://mcronberg.github.io/serialdate/?date=2024-01-01&time=13:30&ms=250&format=json
```

```json
{
  "input": { "date": "2024-01-01", "time": "13:30:00" },
  "excel": 45292.5625,
  "iso": "2024-01-01T13:30:00.000Z",
  "date": "2024-01-01",
  "time": "13:30:00",
  "milliseconds": 0
}
```

### Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `format`  | Must be `json` to enable JSON output. | `format=json` |
| `excel`   | Excel serial number to convert to a date. Comma decimals are accepted (`45614,5`). Takes precedence if both `excel` and `date` are given. | `excel=45292` |
| `date`    | Date to convert to a serial number, in ISO format `YYYY-MM-DD`. | `date=2024-01-01` |
| `time`    | Optional time of day, `HH:MM` or `HH:MM:SS`. Used with `date`. | `time=13:30:00` |
| `ms`      | Optional milliseconds (`0`–`999`). Used with `date`. | `ms=250` |

Invalid or missing input returns a JSON object with an `error` field, for example:

```json
{ "error": "Invalid \"date\" value: \"2024-13-40\". Expected ISO format YYYY-MM-DD." }
```

### Why this is not a "real" API

This is a **client-side pseudo-API**, not a true HTTP endpoint. The app is hosted on GitHub Pages, which serves only static files — there is no server-side code that can respond to a route with `Content-Type: application/json`. Instead, the JSON is produced **in the browser**: when `format=json` is present, the page's JavaScript reads the query string, performs the conversion, and replaces the page content with the JSON text.

The practical consequences:

*   **It requires a browser that runs JavaScript.** Command-line tools and server-to-server calls (e.g. `curl https://.../?excel=45292&format=json`) receive the static HTML shell, *not* the rendered JSON — the conversion never runs for them.
*   **The response is not served with the `application/json` content type.** It is `text/html` containing JSON text, so it should not be treated as a machine-readable HTTP API.
*   **It is intended for humans and quick, bookmarkable lookups in the browser**, or for embedding a result link — not for automated integrations.

If you need a real HTTP API (proper `application/json`, consumable by `curl`, servers, and integrations), the conversion logic would need to be deployed to a serverless function (e.g. Cloudflare Workers, Vercel, or Netlify Functions) in addition to this static site.
