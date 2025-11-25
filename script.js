const excelInput = document.getElementById('excelInput');
const dateInput = document.getElementById('dateInput');
const timeInput = document.getElementById('timeInput');
const langToggle = document.getElementById('langToggle');
const pastTableBody = document.getElementById('pastTableBody');
const futureTableBody = document.getElementById('futureTableBody');
const copyExcelBtn = document.getElementById('copyExcelBtn');

// Version (IMPORTANT: Also update VERSION in sw.js when changing this!)
const VERSION = '1.92';

// State
let currentLang = localStorage.language || 'en';
// If no stored language, detect from browser
if (!localStorage.language) {
    if (navigator.language.startsWith('da')) currentLang = 'da';
    else if (navigator.language.startsWith('no') || navigator.language.startsWith('nb') || navigator.language.startsWith('nn')) currentLang = 'no';
    else if (navigator.language.startsWith('sv')) currentLang = 'sv';
    else if (navigator.language.startsWith('de')) currentLang = 'de';
}

// Analytics Config
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScSDy6fpUQ6qRHeKkCBubmmWRaBYk62YSQTQgWi4OfjHip8yQ/formResponse';
const FORM_ENTRIES = {
    action: 'entry.120135522',
    userAgent: 'entry.270316851',
    language: 'entry.1449451373',
    screen: 'entry.119083653',
    appName: 'entry.98806864'
};

// Translations
const translations = {
    en: {
        title: `Serial Date Converter v${VERSION}`,
        labelExcel: 'Excel Serial Number',
        labelDate: 'Date & Time',
        quickReference: 'Quick Reference',
        quickReferenceHelp: '(click to copy serial date)',
        colDescription: 'Description',
        colExcel: 'Excel',
        colDate: 'Date',
        headerPast: 'Past',
        headerFuture: 'Future',
        refToday: 'Today',
        refLastMonday: 'Last Monday',
        refWeekAgo: 'A week ago',
        refMonthAgo: 'A month ago',
        refStartOfYear: 'Start of year',
        refTomorrow: 'Tomorrow',
        refNextMonday: 'Next Monday',
        refInWeek: 'In a week',
        refInMonth: 'In a month',
        refEndOfYear: 'End of year',
        refStartOfNextYear: 'Start of next year',
        refEndOfNextYear: 'End of next year',
        copied: 'Copied!'
    },
    da: {
        title: `Serial Date Converter v${VERSION}`,
        labelExcel: 'Excel Serienummer',
        labelDate: 'Dato & Tid',
        quickReference: 'Hurtig Reference',
        quickReferenceHelp: '(klik for at kopiere seriedato)',
        colDescription: 'Beskrivelse',
        colExcel: 'Excel',
        colDate: 'Dato',
        headerPast: 'Fortid',
        headerFuture: 'Fremtid',
        refToday: 'I dag',
        refLastMonday: 'Sidste mandag',
        refWeekAgo: 'For en uge siden',
        refMonthAgo: 'For en måned siden',
        refStartOfYear: 'Starten af året',
        refTomorrow: 'I morgen',
        refNextMonday: 'Næste mandag',
        refInWeek: 'Om en uge',
        refInMonth: 'Om en måned',
        refEndOfYear: 'Slutningen af året',
        refStartOfNextYear: 'Starten af næste år',
        refEndOfNextYear: 'Slutningen af næste år',
        copied: 'Kopieret!'
    },
    sv: {
        title: `Serial Date Converter v${VERSION}`,
        labelExcel: 'Excel Serienummer',
        labelDate: 'Datum & Tid',
        quickReference: 'Snabbreferens',
        quickReferenceHelp: '(klicka för att kopiera seriedatum)',
        colDescription: 'Beskrivning',
        colExcel: 'Excel',
        colDate: 'Datum',
        headerPast: 'Förflutet',
        headerFuture: 'Framtid',
        refToday: 'Idag',
        refLastMonday: 'Senaste måndag',
        refWeekAgo: 'För en vecka sedan',
        refMonthAgo: 'För en månad sedan',
        refStartOfYear: 'Årets början',
        refTomorrow: 'Imorgon',
        refNextMonday: 'Nästa måndag',
        refInWeek: 'Om en vecka',
        refInMonth: 'Om en månad',
        refEndOfYear: 'Årets slut',
        refStartOfNextYear: 'Nästa års början',
        refEndOfNextYear: 'Nästa års slut',
        copied: 'Kopierad!'
    },
    de: {
        title: `Serial Date Converter v${VERSION}`,
        labelExcel: 'Excel Seriennummer',
        labelDate: 'Datum & Uhrzeit',
        quickReference: 'Schnellreferenz',
        quickReferenceHelp: '(klicken um Seriennummer zu kopieren)',
        colDescription: 'Beschreibung',
        colExcel: 'Excel',
        colDate: 'Datum',
        headerPast: 'Vergangenheit',
        headerFuture: 'Zukunft',
        refToday: 'Heute',
        refLastMonday: 'Letzter Montag',
        refWeekAgo: 'Vor einer Woche',
        refMonthAgo: 'Vor einem Monat',
        refStartOfYear: 'Jahresbeginn',
        refTomorrow: 'Morgen',
        refNextMonday: 'Nächster Montag',
        refInWeek: 'In einer Woche',
        refInMonth: 'In einem Monat',
        refEndOfYear: 'Jahresende',
        refStartOfNextYear: 'Beginn nächstes Jahr',
        refEndOfNextYear: 'Ende nächstes Jahr',
        copied: 'Kopiert!'
    },
    no: {
        title: `Serial Date Converter v${VERSION}`,
        labelExcel: 'Excel Serienummer',
        labelDate: 'Dato & Tid',
        quickReference: 'Hurtigreferanse',
        quickReferenceHelp: '(klikk for å kopiere seriedato)',
        colDescription: 'Beskrivelse',
        colExcel: 'Excel',
        colDate: 'Dato',
        headerPast: 'Fortid',
        headerFuture: 'Fremtid',
        refToday: 'I dag',
        refLastMonday: 'Siste mandag',
        refWeekAgo: 'For en uke siden',
        refMonthAgo: 'For en måned siden',
        refStartOfYear: 'Årets begynnelse',
        refTomorrow: 'I morgen',
        refNextMonday: 'Neste mandag',
        refInWeek: 'Om en uke',
        refInMonth: 'Om en måned',
        refEndOfYear: 'Årets slutt',
        refStartOfNextYear: 'Neste års begynnelse',
        refEndOfNextYear: 'Neste års slutt',
        copied: 'Kopiert!'
    }
};

// Constants
const MS_PER_DAY = 86400000;
const DEBOUNCE_TIMEOUT_MS = 2000;
const MIN_EXCEL_DATE = 1; // 1900-01-01
const MAX_EXCEL_DATE = 2958465; // 9999-12-31
const LOCALE_MAP = {
    'en': 'en-GB',
    'da': 'da-DK',
    'no': 'nb-NO',
    'sv': 'sv-SE',
    'de': 'de-DE'
};

// Utils
function getExcelSerial(dateObj) {
    try {
        if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
            throw new Error('Invalid date object');
        }

        const utcDate = Date.UTC(
            dateObj.getFullYear(),
            dateObj.getMonth(),
            dateObj.getDate(),
            dateObj.getHours(),
            dateObj.getMinutes(),
            dateObj.getSeconds()
        );

        const baseDate = Date.UTC(1899, 11, 30);
        const diffTime = utcDate - baseDate;
        const serial = diffTime / MS_PER_DAY;

        // Round to 5 decimals (Excel precision for time component down to seconds)
        return Math.round(serial * 100000) / 100000;
    } catch (error) {
        return 0;
    }
}

function getDateFromExcel(serial) {
    try {
        const numSerial = parseFloat(serial);

        if (isNaN(numSerial)) {
            throw new Error('Invalid serial number');
        }

        if (numSerial < MIN_EXCEL_DATE || numSerial > MAX_EXCEL_DATE) {
            throw new Error('Serial number out of valid range (1-2958465)');
        }

        const baseDate = Date.UTC(1899, 11, 30);
        const targetTime = baseDate + (numSerial * MS_PER_DAY);
        const resultDate = new Date(targetTime);

        if (isNaN(resultDate.getTime())) {
            throw new Error('Invalid date calculation');
        }

        return resultDate;
    } catch (error) {
        return new Date();
    }
}

function parseDateString(str, locale) {
    try {
        str = str.trim();
        let datePart = str;
        let timePart = '00:00';

        // Extract time if present (formats: HH:mm or HH:mm:ss)
        const timeMatch = str.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/);
        if (timeMatch) {
            timePart = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            datePart = str.replace(timeMatch[0], '').trim();
        }

        // Try ISO formats first (universal): yyyy-MM-dd or yyyy-MM-ddTHH:mm
        const isoMatch = datePart.match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})/);
        if (isoMatch) {
            const [, year, month, day] = isoMatch;
            return { date: `${year}-${month}-${day}`, time: timePart };
        }

        // Locale-specific parsing
        if (locale === 'en') {
            // American: MM/dd/yyyy or MM-dd-yyyy
            const usMatch = datePart.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (usMatch) {
                const [, month, day, year] = usMatch;
                return { 
                    date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`, 
                    time: timePart 
                };
            }
        } else {
            // European (DA/NO/SV/DE): dd-MM-yyyy, dd.MM.yyyy, dd/MM/yyyy
            const euMatch = datePart.match(/^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{4})/);
            if (euMatch) {
                const [, day, month, year] = euMatch;
                return { 
                    date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`, 
                    time: timePart 
                };
            }
        }

        return null;
    } catch (error) {
        return null;
    }
}

function updateFromDateInputs() {
    const dateVal = dateInput.value;
    const timeVal = timeInput.value || '00:00';

    if (dateVal) {
        const fullDateStr = `${dateVal}T${timeVal}`;
        const date = new Date(fullDateStr);
        const serial = getExcelSerial(date);
        // Force US locale formatting with dot as decimal separator
        excelInput.value = Number(serial).toLocaleString('en-US', { 
            useGrouping: false, 
            minimumFractionDigits: 0,
            maximumFractionDigits: 20 
        });

        // Show copy button when value exists
        if (serial) {
            copyExcelBtn.classList.remove('opacity-0', 'pointer-events-none');
        }

        debouncedLog('DateToExcel');
    } else {
        excelInput.value = '';
        copyExcelBtn.classList.add('opacity-0', 'pointer-events-none');
    }
}

// Analytics Logger
function logToGoogle(action) {
    try {
        const data = new FormData();
        data.append(FORM_ENTRIES.action, action);
        data.append(FORM_ENTRIES.userAgent, navigator.userAgent);
        data.append(FORM_ENTRIES.language, navigator.language);
        data.append(FORM_ENTRIES.screen, `${window.screen.width}x${window.screen.height}`);
        data.append(FORM_ENTRIES.appName, 'SerialDateConverter');

        fetch(GOOGLE_FORM_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: data
        }).catch(() => { });
    } catch (error) {
        // Silent fail - analytics should not break the app
    }
}

// Debounce function to prevent spamming logs
let debounceTimer;
function debouncedLog(action) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        logToGoogle(action);
    }, DEBOUNCE_TIMEOUT_MS);
}

// Event Listeners

// Excel input: Normalize comma to dot for decimal separator (DA/NO/SV/DE locales)
function normalizeExcelInput() {
    if (excelInput.value) {
        excelInput.value = excelInput.value.replace(/,/g, '.');
    }
}

excelInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const normalized = pastedText.replace(/,/g, '.');
    excelInput.value = normalized;
    excelInput.dispatchEvent(new Event('input', { bubbles: true }));
});

excelInput.addEventListener('input', (e) => {
    normalizeExcelInput();
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
        const dateObj = getDateFromExcel(val);

        const year = dateObj.getUTCFullYear();
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        const hours = String(dateObj.getUTCHours()).padStart(2, '0');
        const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');

        dateInput.value = `${year}-${month}-${day}`;
        timeInput.value = `${hours}:${minutes}`;

        // Show copy button
        copyExcelBtn.classList.remove('opacity-0', 'pointer-events-none');

        debouncedLog('ExcelToDate');
    } else {
        dateInput.value = '';
        timeInput.value = '00:00';
        copyExcelBtn.classList.add('opacity-0', 'pointer-events-none');
    }
});

excelInput.addEventListener('blur', normalizeExcelInput);

// Date input: Smart paste parser
dateInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const parsed = parseDateString(pastedText, currentLang);
    
    if (parsed) {
        dateInput.value = parsed.date;
        timeInput.value = parsed.time;
        updateFromDateInputs();
    } else {
        // Fallback: let browser handle it
        dateInput.value = pastedText;
    }
});

// Time input: Also handle full datetime pastes
timeInput.addEventListener('paste', (e) => {
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const parsed = parseDateString(pastedText, currentLang);
    
    if (parsed && parsed.date) {
        e.preventDefault();
        dateInput.value = parsed.date;
        timeInput.value = parsed.time;
        updateFromDateInputs();
    }
    // If no date part, let browser handle time-only paste normally
});

dateInput.addEventListener('input', updateFromDateInputs);
timeInput.addEventListener('input', updateFromDateInputs);

const langToggleBtn = document.getElementById('langToggle');
const langMenu = document.getElementById('langMenu');
const currentLangSpan = document.getElementById('currentLang');

langToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = langMenu.classList.toggle('hidden');
    langToggleBtn.setAttribute('aria-expanded', !isHidden);
});

document.addEventListener('click', () => {
    if (!langMenu.classList.contains('hidden')) {
        langMenu.classList.add('hidden');
        langToggleBtn.setAttribute('aria-expanded', 'false');
    }
});

document.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedLang = btn.getAttribute('data-lang');
        if (selectedLang) {
            currentLang = selectedLang;
            localStorage.language = currentLang;
            updateLanguage();
            logToGoogle(`LanguageSwitch:${currentLang}`);
            langMenu.classList.add('hidden');
            langToggleBtn.setAttribute('aria-expanded', 'false');
        }
    });
});

function updateLanguage() {
    const langMap = {
        'en': { flag: 'fi-gb', text: 'EN' },
        'da': { flag: 'fi-dk', text: 'DA' },
        'no': { flag: 'fi-no', text: 'NO' },
        'sv': { flag: 'fi-se', text: 'SV' },
        'de': { flag: 'fi-de', text: 'DE' }
    };

    // Safe DOM manipulation without innerHTML
    const flagSpan = currentLangSpan.querySelector('.fi');
    const textNode = currentLangSpan.childNodes[currentLangSpan.childNodes.length - 1];

    if (flagSpan && langMap[currentLang]) {
        flagSpan.className = `fi ${langMap[currentLang].flag}`;
        textNode.textContent = ` ${langMap[currentLang].text}`;
    }

    // Update aria-expanded attribute
    const langToggleBtn = document.getElementById('langToggle');
    langToggleBtn.setAttribute('aria-expanded', 'false');

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.textContent = translations[currentLang][key];
        }
    });

    renderTables();
}

function getRelativeDate(type) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(today);

    switch (type) {
        case 'refToday': return d;
        case 'refLastMonday': d.setDate(today.getDate() - (today.getDay() + 6) % 7); return d;
        case 'refWeekAgo': d.setDate(today.getDate() - 7); return d;
        case 'refMonthAgo': d.setMonth(today.getMonth() - 1); return d;
        case 'refStartOfYear': return new Date(today.getFullYear(), 0, 1);
        case 'refTomorrow':
            d.setDate(today.getDate() + 1);
            return d;
        case 'refNextMonday':
            d.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);
            if (today.getDay() === 1) d.setDate(today.getDate() + 7);
            return d;
        case 'refInWeek': d.setDate(today.getDate() + 7); return d;
        case 'refInMonth': d.setMonth(today.getMonth() + 1); return d;
        case 'refEndOfYear': return new Date(today.getFullYear(), 11, 31);
        case 'refStartOfNextYear': return new Date(today.getFullYear() + 1, 0, 1);
        case 'refEndOfNextYear': return new Date(today.getFullYear() + 1, 11, 31);
        default: return d;
    }
}

function createRow(key) {
    const date = getRelativeDate(key);
    const excel = getExcelSerial(date);
    const locale = LOCALE_MAP[currentLang] || 'en-GB';
    const dateStr = date.toLocaleDateString(locale);

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 dark:hover:bg-white/5 transition-colors';

    // Safe DOM creation without innerHTML to prevent XSS
    const td1 = document.createElement('td');
    td1.className = 'px-4 py-3 text-slate-700 dark:text-slate-300';
    td1.textContent = translations[currentLang][key];

    const td2 = document.createElement('td');
    td2.className = 'px-4 py-3 text-right font-mono text-teal-600 dark:text-teal-400 cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors';
    td2.textContent = excel;
    td2.title = 'Copy to clipboard';
    
    // Add click event to copy Excel value
    td2.addEventListener('click', async function() {
        await copyToClipboardFromTable(excel, this);
    });

    const td3 = document.createElement('td');
    td3.className = 'px-4 py-3 text-right text-slate-600 dark:text-slate-400';
    td3.textContent = dateStr;

    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);

    return tr;
}

function renderTables() {
    pastTableBody.innerHTML = '';
    futureTableBody.innerHTML = '';

    const pastRows = [
        'refToday',
        'refLastMonday',
        'refWeekAgo',
        'refMonthAgo',
        'refStartOfYear',
        'refEndOfYear'
    ];

    const futureRows = [
        'refTomorrow',
        'refNextMonday',
        'refInWeek',
        'refInMonth',
        'refStartOfNextYear',
        'refEndOfNextYear'
    ];

    pastRows.forEach(key => pastTableBody.appendChild(createRow(key)));
    futureRows.forEach(key => futureTableBody.appendChild(createRow(key)));
}

// Copy to Clipboard Function
async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);

        // Visual feedback - change to checkmark
        const originalHTML = button.innerHTML;
        button.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        `;
        button.classList.add('text-teal-600', 'dark:text-teal-400');

        // Reset after 1.5s
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('text-teal-600', 'dark:text-teal-400');
        }, 1500);

        logToGoogle('CopyToClipboard');
    } catch (error) {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
    }
}

// Copy to Clipboard from Table Cell
async function copyToClipboardFromTable(text, cell) {
    try {
        await navigator.clipboard.writeText(text);

        // Visual feedback - store original content and temporarily show checkmark
        const originalText = cell.textContent;
        const originalClasses = cell.className;
        
        // Show checkmark icon
        cell.innerHTML = `
            <svg class="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        `;
        cell.className = 'px-4 py-3 text-right font-mono text-teal-600 dark:text-teal-400 transition-colors';

        // Reset after 1s
        setTimeout(() => {
            cell.textContent = originalText;
            cell.className = originalClasses;
        }, 1000);

        logToGoogle('CopyFromQuickReference');
    } catch (error) {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        
        // Still show visual feedback on fallback
        const originalText = cell.textContent;
        cell.textContent = '✓';
        setTimeout(() => {
            cell.textContent = originalText;
        }, 1000);
    }
}

// Copy Button Event Listener
copyExcelBtn.addEventListener('click', () => {
    if (excelInput.value) {
        copyToClipboard(excelInput.value, copyExcelBtn);
    }
});

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
    logToGoogle(`ThemeSwitch:${isDark ? 'dark' : 'light'}`);
});

// Init
updateLanguage();
dateInput.focus();
logToGoogle('AppLoad');
