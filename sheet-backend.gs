// Bookings sheet for the Fun Day. Only paid Stripe checkouts become rows.
// Script properties: STRIPE_KEY = restricted key with "Checkout Sessions: Write".
// Run installTrigger() once from the editor so payments sync every 5 minutes.

var HEADERS = ["ref", "registeredAt", "event", "name", "email", "phone", "tickets", "amount", "heardAbout", "paid", "confirmedAt", "stripeSession", "adults", "children", "under5", "attendees"];
var PRICE = "price_1UICNcRbS3vGEM13fsjBuRCJ";
var SITE = "https://funday.ikhwa.co.uk/";
var FIELDS = ["name", "phone", "heardAbout", "adults", "children", "under5", "attendees", "registeredAt", "women"];
var WOMEN_CAP = 40;

function womenIn_(attendees) { return (String(attendees || "").match(/(^|; )Female /g) || []).length; }

function paidWomen_() { var s = sheet_(); if (s.getLastRow() < 2) { return 0; } var col = HEADERS.indexOf("attendees") + 1; return s.getRange(2, col, s.getLastRow() - 1, 1).getValues().reduce(function (n, r) { return n + womenIn_(r[0]); }, 0); }

function heldWomen_(exceptRef) { var r = stripe_("get", "checkout/sessions?limit=100&status=open"); return (r.data || []).reduce(function (n, c) { var m = c.metadata || {}; return c.client_reference_id === exceptRef ? n : n + (parseInt(m.women, 10) || 0); }, 0); }

function womenLeft_(exceptRef) { return Math.max(0, WOMEN_CAP - paidWomen_() - heldWomen_(exceptRef)); }

function site_(s) { return /^https:\/\/(([a-z0-9-]+\.)?ikhwa\.co(\.uk)?|([a-z0-9-]+\.)?ikhwa-funday\.pages\.dev|sakib\.lol\/ikhwa-funday)\/$/.test(s || "") ? s : SITE; }

function sheet_() { var s = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; if (s.getLastRow() === 0) { s.appendRow(HEADERS); s.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold"); s.setFrozenRows(1); } else if (s.getLastColumn() < HEADERS.length) { s.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold"); } return s; }

function save_(row) { var lock = LockService.getScriptLock(); lock.waitLock(20000); try { var s = sheet_(); var refs = s.getRange(2, 1, Math.max(s.getLastRow() - 1, 1), 1).getValues(); var at = -1; for (var i = 0; i < refs.length; i++) { if (refs[i][0] === row.ref) { at = i; } } var old = at >= 0 ? s.getRange(at + 2, 1, 1, HEADERS.length).getValues()[0] : []; if (at >= 0 && old[HEADERS.indexOf("stripeSession")] === row.stripeSession && old[HEADERS.indexOf("paid")] === row.paid) { return; } var PAYMENT = ["paid", "confirmedAt", "stripeSession", "amount", "tickets"]; var values = HEADERS.map(function (h, j) { var nv = row[h] !== undefined && row[h] !== "" && row[h] !== null ? row[h] : ""; var ov = old[j] === undefined ? "" : old[j]; if (PAYMENT.indexOf(h) >= 0) { return nv !== "" ? nv : ov; } return ov !== "" ? ov : nv; }); if (at >= 0) { s.getRange(at + 2, 1, 1, HEADERS.length).setValues([values]); } else { s.appendRow(values); } } finally { lock.releaseLock(); } }

function stripe_(method, path, params) { var key = PropertiesService.getScriptProperties().getProperty("STRIPE_KEY"); var opts = { method: method, headers: { Authorization: "Bearer " + key }, muteHttpExceptions: true }; if (params) { opts.payload = params; } return JSON.parse(UrlFetchApp.fetch("https://api.stripe.com/v1/" + path, opts).getContentText()); }

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function rowFromSession_(c) { var m = c.metadata || {}; var cd = c.customer_details || {}; var qty = Math.round((c.amount_total || 0) / 500); return { ref: c.client_reference_id, registeredAt: m.registeredAt || new Date(c.created * 1000).toISOString(), event: "Active Family Fun Day", name: m.name || cd.name || "", email: cd.email || c.customer_email || "", phone: m.phone || cd.phone || "", tickets: qty, amount: (c.amount_total || 0) / 100, heardAbout: m.heardAbout || "", paid: "card (verified)", confirmedAt: new Date().toISOString(), stripeSession: c.id, adults: m.adults || "", children: m.children || "", under5: m.under5 || "", attendees: m.attendees || "" }; }

function record_(c, extra) { if (c && c.payment_status === "paid" && c.client_reference_id) { var row = rowFromSession_(c); if (extra) { FIELDS.forEach(function (f) { if (!row[f] && extra[f] !== undefined && extra[f] !== "") { row[f] = extra[f]; } }); } save_(row); return true; } return false; }

function sync() { var since = Math.floor(Date.now() / 1000) - 3 * 24 * 3600; var after = null; for (var page = 0; page < 20; page++) { var q = "checkout/sessions?limit=100&status=complete&created[gte]=" + since + (after ? "&starting_after=" + after : ""); var r = stripe_("get", q); if (!r.data) { return; } r.data.forEach(function (c) { if (/^FUN-/.test(c.client_reference_id || "")) { record_(c); } }); if (!r.has_more) { return; } after = r.data[r.data.length - 1].id; } }

function installTrigger() { ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "sync") { ScriptApp.deleteTrigger(t); } }); ScriptApp.newTrigger("sync").timeBased().everyMinutes(5).create(); sync(); return "sync every 5 minutes"; }

function doPost(e) { var body = JSON.parse(e.postData.contents); if (body.action === "checkout") { var q = Math.max(1, Math.min(12, parseInt(body.tickets, 10) || 1)); var home = site_(body.site); var women = womenIn_(body.attendees); body.women = women; if (women > 0) { var left = womenLeft_(body.ref); if (women > left) { return out_({ url: null, full: true, womenLeft: left, error: "women cap" }); } } var p = { "mode": "payment", "line_items[0][price]": PRICE, "line_items[0][quantity]": String(q), "customer_email": body.email, "client_reference_id": body.ref, "success_url": home + "?paid={CHECKOUT_SESSION_ID}", "cancel_url": home + "?cancelled=" + body.ref, "metadata[source]": "funday", "expires_at": String(Math.floor(Date.now() / 1000) + 31 * 60) }; FIELDS.forEach(function (f) { if (body[f] !== undefined && body[f] !== "") { p["metadata[" + f + "]"] = String(body[f]).slice(0, 490); } }); var r = stripe_("post", "checkout/sessions", p); return out_({ url: r.url || null, error: r.error ? r.error.message : null }); } if (body.action === "confirm") { var c = stripe_("get", "checkout/sessions/" + encodeURIComponent(body.session)); var ok = record_(c, body.booking); var cd = c.customer_details || {}; var m = c.metadata || {}; return out_({ paid: ok, ref: c.client_reference_id || null, name: m.name || cd.name || null, email: cd.email || null, amount: c.amount_total || 0, adults: m.adults || null, children: m.children || null, under5: m.under5 || null }); } return out_({ ok: false, error: "unpaid bookings are not stored" }); }

function doGet(e) { if (e && e.parameter && e.parameter.action === "availability") { return out_({ womenCap: WOMEN_CAP, womenLeft: womenLeft_(null) }); } return ContentService.createTextOutput("ok"); }
