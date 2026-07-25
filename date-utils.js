// ============================================================================
// Pure Excel serial date <-> calendar date conversion utilities.
// ----------------------------------------------------------------------------
// No DOM access here - this file is loaded both in the browser (as a plain
// global <script>, before script.js) and in Node for automated tests (see
// test/date-utils.test.js). Keep it free of `document`/`window` references.
// ============================================================================

const MS_PER_DAY = 86400000;
const MIN_EXCEL_DATE = 1; // 1900-01-01
const MAX_EXCEL_DATE = 2958465; // 9999-12-31

// Epoch trick: using 1899-12-30 (two days before 1900-01-01) as day 0
// reproduces Excel's serial numbers correctly for every real calendar date
// from 1900-03-01 onward, because it happens to absorb Excel/Lotus 1-2-3's
// historical "1900 is a leap year" bug. The one exception is serial 60
// itself, which Excel displays as the fictitious, nonexistent "1900-02-29";
// this code (like real calendar math) resolves that value to 1900-03-01.
const EXCEL_BASE_DATE = Date.UTC(1899, 11, 30);

function escapeHtml(str) {
    return str.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
}

function formatDateParts(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return {
        iso: date.toISOString(),
        date: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
        time: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`,
        milliseconds: date.getUTCMilliseconds()
    };
}

function excelToJson(rawValue) {
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

function dateToJson(rawDate, rawTime, rawMs) {
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
            dateObj.getSeconds(),
            dateObj.getMilliseconds()
        );

        const baseDate = Date.UTC(1899, 11, 30);
        const diffTime = utcDate - baseDate;
        const serial = diffTime / MS_PER_DAY;

        return serial;
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

// CommonJS export for Node-based tests. Ignored by browsers (classic
// <script>, `module` is undefined there).
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MS_PER_DAY,
        MIN_EXCEL_DATE,
        MAX_EXCEL_DATE,
        EXCEL_BASE_DATE,
        escapeHtml,
        formatDateParts,
        excelToJson,
        dateToJson,
        getExcelSerial,
        getDateFromExcel,
        parseDateString
    };
}
