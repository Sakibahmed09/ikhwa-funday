# Event registration page

A one-page registration and payment flow for a community event. Built for the
IKHWA Active Family Fun Day, made to be reused for the next one.

## Running it

```bash
python3 -m http.server 5081
```

Then open http://localhost:5081

## Reusing it for another event

Edit `event.config.js`. Nothing else. That file holds the name, date, venue,
price, what's on, the payment link, and which form fields to show. Drop the new
poster in `assets/` and point `poster` at it.

## Connecting the Google Sheet

Without this, bookings only live in the visitor's own browser and you will not
see them. To get them into a sheet:

1. Make a new Google Sheet.
2. Extensions > Apps Script. Delete what's there, paste in `sheet-backend.gs`.
3. Deploy > New deployment > Web app. Execute as: me. Who has access: anyone.
4. Copy the `/exec` URL it gives you into `sheetEndpoint` in `event.config.js`.

Each booking writes one row. When someone taps "I've paid", the same row
updates rather than adding a second one.

## How payment works

The page shows the amount, the account details and a unique reference, each
with a copy button. People send a normal bank transfer from their banking app
and put the reference in the reference box.

The `paid` column says "said yes", not "confirmed". It records that the person
tapped the button, not that money arrived. Match the bank statement against the
reference column before the day.
