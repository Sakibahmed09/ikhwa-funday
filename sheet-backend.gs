// Paste this into Extensions > Apps Script on the bookings Google Sheet,
// then Deploy > New deployment > Web app > Execute as me > Anyone has access.
// Copy the /exec URL into sheetEndpoint in event.config.js.

const HEADERS = [
  "ref", "registeredAt", "event", "name", "email", "phone",
  "tickets", "amount", "heardAbout", "paid", "confirmedAt",
];

function doPost(e) {
  const row = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  const refs = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
  const existing = refs.findIndex((r) => r[0] === row.ref);
  const values = HEADERS.map((h) => row[h] || "");

  if (existing >= 0) {
    sheet.getRange(existing + 2, 1, 1, HEADERS.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput("ok");
}
