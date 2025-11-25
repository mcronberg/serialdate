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
