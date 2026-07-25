const test = require("node:test");
const assert = require("node:assert/strict");
const { MIN_EXCEL_DATE, MAX_EXCEL_DATE, getExcelSerial, getDateFromExcel, parseDateString, excelToJson, dateToJson } = require("../date-utils.js");

test("getDateFromExcel: known serial -> date pairs", () => {
  // 45292 = 2024-01-01 is documented in README.md's JSON API examples.
  assert.equal(getDateFromExcel(45292).toISOString(), "2024-01-01T00:00:00.000Z");
  // 25569 = 1970-01-01 is the well-known Excel-serial <-> Unix-epoch anchor.
  assert.equal(getDateFromExcel(25569).toISOString(), "1970-01-01T00:00:00.000Z");
});

test("getExcelSerial: known date -> serial pairs", () => {
  // getExcelSerial reads the *local* date/time fields of the Date object
  // (by design - it mirrors what a date/time <input> contains, with no
  // timezone attached). Use the local Date constructor so this test is
  // independent of the machine's timezone.
  assert.equal(getExcelSerial(new Date(2024, 0, 1)), 45292);
  assert.equal(getExcelSerial(new Date(1970, 0, 1)), 25569);
});

test("round-trip: date -> serial -> date is stable for a range of values (from 1900-03-01 onward)", () => {
  // Only serials >= 61 (1900-03-01) are used: serials 1-60 intentionally
  // don't round-trip to the same real calendar date Excel would show,
  // because Excel's historical "1900 is a leap year" bug (fictitious
  // 1900-02-29 = serial 60) isn't reproduced here - see EXCEL_BASE_DATE
  // comment in date-utils.js.
  for (let serial = 61; serial <= MAX_EXCEL_DATE; serial += 137) {
    const date = getDateFromExcel(serial);
    // Mirror what the UI actually does: read the UTC fields (as
    // getDateFromExcel produces them) and rebuild a Date from those
    // same numbers as local fields, exactly like the date/time <input>
    // round-trip in script.js.
    const localEquivalent = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
    assert.equal(getExcelSerial(localEquivalent), serial, `round-trip failed for serial ${serial}`);
  }
});

test("getExcelSerial: rejects invalid input by returning 0", () => {
  assert.equal(getExcelSerial(new Date("not a date")), 0);
  assert.equal(getExcelSerial("not a date object"), 0);
});

test("getDateFromExcel: out-of-range input falls back to current date instead of throwing", () => {
  const before = Date.now();
  const result = getDateFromExcel(MAX_EXCEL_DATE + 1);
  assert.ok(result instanceof Date);
  assert.ok(result.getTime() >= before);
});

test("excelToJson: valid and invalid input", () => {
  assert.deepEqual(excelToJson("45292"), {
    input: { excel: 45292 },
    excel: 45292,
    iso: "2024-01-01T00:00:00.000Z",
    date: "2024-01-01",
    time: "00:00:00",
    milliseconds: 0,
  });

  // Comma decimal separator (DA/NO/SV/DE locales) is normalized.
  assert.equal(excelToJson("45292,5").excel, 45292.5);

  assert.match(excelToJson("not-a-number").error, /is not a number/);
  assert.match(excelToJson(String(MAX_EXCEL_DATE + 1)).error, /out of range/);
});

test("dateToJson: valid and invalid input", () => {
  assert.deepEqual(dateToJson("2024-01-01", null, null), {
    input: { date: "2024-01-01" },
    excel: 45292,
    iso: "2024-01-01T00:00:00.000Z",
    date: "2024-01-01",
    time: "00:00:00",
    milliseconds: 0,
  });

  assert.equal(dateToJson("2024-01-01", "13:30:00", "250").excel, 45292.5625 + 250 / 86400000);
  assert.match(dateToJson("2024-13-40", null, null).error, /Invalid date\/time/);
  assert.match(dateToJson("not-a-date", null, null).error, /Expected ISO format/);
  // Well-formed but out-of-range time (rolls over a day) is caught by the
  // rollover check, not the format regex, so it reports the generic error.
  assert.match(dateToJson("2024-01-01", "25:00", null).error, /Invalid date\/time/);
  assert.match(dateToJson("2024-01-01", "1PM", null).error, /Invalid "time" value/);
});

test("parseDateString: ISO, US and European formats", () => {
  assert.deepEqual(parseDateString("2024-01-31", "en"), { date: "2024-01-31", time: "00:00" });
  assert.deepEqual(parseDateString("01/31/2024", "en"), { date: "2024-01-31", time: "00:00" });
  assert.deepEqual(parseDateString("31-01-2024", "da"), { date: "2024-01-31", time: "00:00" });
  assert.deepEqual(parseDateString("31.01.2024 13:45", "de"), { date: "2024-01-31", time: "13:45" });
  assert.equal(parseDateString("not a date", "en"), null);
});

test("MIN_EXCEL_DATE / MAX_EXCEL_DATE match Excel's documented supported range", () => {
  assert.equal(MIN_EXCEL_DATE, 1);
  assert.equal(MAX_EXCEL_DATE, 2958465);
});
