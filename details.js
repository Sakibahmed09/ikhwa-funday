// The only file you edit to run this again for a different event.
window.EVENT = {
  org: "IKHWA UK",
  name: "Active Family Fun Day",
  year: "2026",
  tagline: "A day out for the whole family at the London Stadium.",
  date: "Saturday 10 October 2026",
  time: "12:00pm – 4:30pm",
  venue: "London Marathon Community Track",
  venueLine2: "Stratford, London E20 2AE",
  mapsUrl: "https://maps.google.com/?q=London+Marathon+Community+Track+E20+2AE",
  notes: ["Segregated facilities for sisters", "Free parking"],

  poster: "assets/poster.jpg?v=5",

  pricePence: 500,
  priceLabel: "£5 per person",
  priceNote: "Under 5s go free",
  freeUnderAge: 5,
  childAges: ["Under 5", "5–8", "9–12", "13–17"],
  adultAges: ["18–24", "25–34", "35–44", "45–54", "55+"],
  maxTicketsPerBooking: 12,
  capacity: 200,

  highlights: [
    "Track & field activities",
    "Penalty shoot-out",
    "Bouncy castle",
    "Games & challenges",
    "Food, pancakes & drinks",
    "Iman-boosting naseeha",
    "Indoor games for women",
    "Prizes to be won",
  ],

  stripeLink: "https://buy.stripe.com/14A3cxex9bV2cTM80t4ko00",

  bank: {
    accountName: "ONE FOUNDATION EAST CIC",
    bankName: "The Co-operative Bank",
    sortCode: "08-92-99",
    accountNumber: "67427383",
  },

  // Paste the Apps Script /exec URL here once the Google Sheet is connected.
  // Left empty, the form still works and keeps bookings in this browser only.
  sheetEndpoint: "https://script.google.com/macros/s/AKfycbwmANx68DBbRVuL3H3jv8PD0ZS7NALnFw_tZf7w557gROY0Zrq25Jl6CQwy2O4Uus53qA/exec",

  refPrefix: "FUN",

  contact: {
    website: "https://ikhwa.co.uk",
    instagram: "https://instagram.com/ikhwa_uk",
    whatsapp: "https://ikhwa.co/whatsapp",
  },

  // Turn any of these off for a different event.
  fields: {
    phone: true,
    heardAbout: true,
    heardAboutOptions: [
      "A friend or family member",
      "WhatsApp",
      "Instagram",
      "At the masjid",
      "Poster or flyer",
      "Something else",
    ],
  },
};
