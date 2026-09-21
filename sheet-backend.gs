// Paste into Extensions > Apps Script on the bookings sheet.
// Deploy > Manage deployments > edit > New version, so the /exec URL stays the same.
// Project Settings > Script properties: STRIPE_KEY = a restricted key with
// "Checkout Sessions: Write" only.

function setup() { return UrlFetchApp.fetch("https://api.stripe.com/v1/", { muteHttpExceptions: true }).getResponseCode(); }

var HEADERS = ["ref", "registeredAt", "event", "name", "email", "phone", "tickets", "amount", "heardAbout", "paid", "confirmedAt", "stripeSession", "adults", "children", "under5", "attendees"];
var PRICE = "price_1UICNcRbS3vGEM13fsjBuRCJ";
var SITE = "https://sakib.lol/ikhwa-funday/";

function site_(s) { return /^https:\/\/(([a-z0-9-]+\.)?ikhwa\.co(\.uk)?|([a-z0-9-]+\.)?ikhwa-funday\.pages\.dev|sakib\.lol\/ikhwa-funday)\/$/.test(s || "") ? s : SITE; }

function sheet_() { var s = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; if (s.getLastRow() === 0) { s.appendRow(HEADERS); s.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold"); s.setFrozenRows(1); } else if (s.getLastColumn() < HEADERS.length) { s.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold"); } return s; }

function save_(row) { var lock = LockService.getScriptLock(); lock.waitLock(20000); try { save__(row); } finally { lock.releaseLock(); } }

function save__(row) { var s = sheet_(); var refs = s.getRange(2, 1, Math.max(s.getLastRow() - 1, 1), 1).getValues(); var at = -1; for (var i = 0; i < refs.length; i++) { if (refs[i][0] === row.ref) { at = i; } } var old = at >= 0 ? s.getRange(at + 2, 1, 1, HEADERS.length).getValues()[0] : []; var values = HEADERS.map(function (h, j) { if (h === "paid" && row.paid === "no" && old[j] && old[j] !== "no") { return old[j]; } return row[h] !== undefined && row[h] !== "" ? row[h] : (old[j] || ""); }); if (at >= 0) { s.getRange(at + 2, 1, 1, HEADERS.length).setValues([values]); } else { s.appendRow(values); } }

function stripe_(method, path, params) { var key = PropertiesService.getScriptProperties().getProperty("STRIPE_KEY"); var opts = { method: method, headers: { Authorization: "Bearer " + key }, muteHttpExceptions: true }; if (params) { opts.payload = params; } return JSON.parse(UrlFetchApp.fetch("https://api.stripe.com/v1/" + path, opts).getContentText()); }

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doPost(e) { var body = JSON.parse(e.postData.contents); if (body.action === "checkout") { var q = Math.max(1, Math.min(12, parseInt(body.tickets, 10) || 1)); var home = site_(body.site); var r = stripe_("post", "checkout/sessions", { "mode": "payment", "line_items[0][price]": PRICE, "line_items[0][quantity]": String(q), "customer_email": body.email, "client_reference_id": body.ref, "success_url": home + "?paid={CHECKOUT_SESSION_ID}", "cancel_url": home + "?cancelled=" + body.ref }); return out_({ url: r.url || null, error: r.error ? r.error.message : null }); } if (body.action === "confirm") { var c = stripe_("get", "checkout/sessions/" + encodeURIComponent(body.session)); var ok = c.payment_status === "paid"; if (ok) { save_({ ref: c.client_reference_id, paid: "card (verified)", confirmedAt: new Date().toISOString(), stripeSession: c.id }); } var cd = c.customer_details || {}; return out_({ paid: ok, ref: c.client_reference_id || null, name: cd.name || null, email: cd.email || null, amount: c.amount_total || 0 }); } save_(body); return out_({ ok: true }); }

function doGet(e) { return ContentService.createTextOutput("ok"); }
