const E = window.EVENT;
const $ = (id) => document.getElementById(id);

const money = (p) => "£" + (p / 100).toFixed(2).replace(/\.00$/, "");
const people = (n) => (n === 1 ? "1 person" : `${n} people`);

let tickets = 1;
let booking = null;
let showErrors = false;

function paint() {
  document.title = `${E.name} — ${E.org}`;
  $("org").textContent = `${E.org} presents`;
  $("ev-name").textContent = E.name;
  $("tagline").textContent = E.tagline;

  $("f-date").textContent = E.date;
  $("f-time").textContent = E.time;
  $("f-venue").textContent = E.venue;
  $("f-venue2").textContent = E.venueLine2;
  $("f-price").textContent = E.priceLabel;
  if (E.priceNote) $("f-pricenote").textContent = E.priceNote;
  else $("f-pricenote").remove();

  $("poster").src = E.poster;
  $("poster").alt = `${E.name} poster`;

  $("highlights").innerHTML = E.highlights.map((h) => `<li>${h}</li>`).join("");
  $("form-sub").textContent = `${E.date}, ${E.time} at the ${E.venue}. ${E.notes.join(" · ")}`;

  if (!E.fields.phone) $("w-phone").remove();

  if (E.fields.heardAbout) {
    const sel = $("heard");
    E.fields.heardAboutOptions.forEach((o) => sel.add(new Option(o, o)));
  } else {
    $("w-heard").remove();
  }

  const c = E.contact;
  $("links").innerHTML = [
    c.website && `<a href="${c.website}">Website</a>`,
    c.instagram && `<a href="${c.instagram}">Instagram</a>`,
    c.whatsapp && `<a href="${c.whatsapp}">WhatsApp</a>`,
  ].filter(Boolean).join("");

  total();
}

function total() {
  $("t-count").textContent = people(tickets);
  $("t-each").textContent = money(E.pricePence);
  $("t-total").textContent = money(tickets * E.pricePence);
  $("submit").textContent = `Continue to pay ${money(tickets * E.pricePence)}`;
  $("minus").disabled = tickets <= 1;
  $("plus").disabled = tickets >= E.maxTicketsPerBooking;
  $("tickets").value = tickets;
}

function setTickets(n) {
  tickets = Math.min(E.maxTicketsPerBooking, Math.max(1, n || 1));
  total();
}

function reference() {
  return `${E.refPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function check() {
  const rules = [
    ["w-name", $("name").value.trim().length >= 2],
    ["w-email", /^\S+@\S+\.\S+$/.test($("email").value.trim())],
    ["w-tickets", tickets >= 1],
  ];
  if (E.fields.phone) {
    rules.push(["w-phone", $("phone").value.replace(/\D/g, "").length >= 10]);
  }
  let ok = true;
  for (const [id, pass] of rules) {
    if (showErrors) $(id).classList.toggle("err", !pass);
    if (!pass) ok = false;
  }
  return ok;
}

async function record(row) {
  const saved = JSON.parse(localStorage.getItem("bookings") || "[]");
  saved.push(row);
  localStorage.setItem("bookings", JSON.stringify(saved));

  if (!E.sheetEndpoint) return;
  try {
    await fetch(E.sheetEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(row),
    });
  } catch (e) {
    /* the local copy above is the fallback */
  }
}

function show(step) {
  ["step-form", "step-pay", "step-done"].forEach((s) => $(s).classList.toggle("hidden", s !== step));

  $("dot1").className = step === "step-form" ? "dot on" : "dot done";
  $("dot2").className = step === "step-form" ? "dot" : step === "step-done" ? "dot done" : "dot on";
  $("track").classList.toggle("hidden", step === "step-done");

  $("booking").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("minus").onclick = () => setTickets(tickets - 1);
$("plus").onclick = () => setTickets(tickets + 1);
$("tickets").oninput = (e) => {
  const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
  if (!isNaN(n)) setTickets(n);
};

["name", "email", "phone"].forEach((id) => {
  const el = $(id);
  if (!el) return;
  el.onblur = () => { if (showErrors) check(); };
  el.oninput = () => { if (showErrors) check(); };
});

$("reg").onsubmit = async (e) => {
  e.preventDefault();
  showErrors = true;
  if (!check()) {
    document.querySelector(".field.err input")?.focus();
    return;
  }

  booking = {
    ref: reference(),
    event: E.name,
    name: $("name").value.trim(),
    email: $("email").value.trim(),
    phone: E.fields.phone ? $("phone").value.trim() : "",
    tickets: tickets,
    amount: (tickets * E.pricePence) / 100,
    heardAbout: E.fields.heardAbout ? $("heard").value : "",
    paid: "no",
    registeredAt: new Date().toISOString(),
  };

  record(booking);

  $("p-amount").textContent = money(tickets * E.pricePence);
  $("b-name").textContent = E.bank.accountName;
  $("b-bank").textContent = E.bank.bankName;
  $("b-sort").textContent = E.bank.sortCode;
  $("b-acc").textContent = E.bank.accountNumber;
  $("p-ref").textContent = booking.ref;
  $("p-ref2").textContent = booking.ref;
  show("step-pay");
};

document.querySelectorAll(".copy").forEach((btn) => {
  btn.onclick = async () => {
    const text = $(btn.dataset.copy).textContent.replace(/[-\s]/g, "");
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    btn.textContent = "Copied";
    btn.classList.add("ok");
    setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("ok"); }, 1600);
  };
});

$("back").onclick = () => show("step-form");

$("paid").onclick = () => {
  booking.paid = "said yes";
  booking.confirmedAt = new Date().toISOString();
  record(booking);

  $("d-line").textContent = "Your place is held. We'll confirm once the transfer lands.";
  $("d-name").textContent = booking.name;
  $("d-people").textContent = people(booking.tickets);
  $("d-amount").textContent = money(booking.tickets * E.pricePence);
  $("d-when").textContent = `${E.date}, ${E.time}`;
  $("d-where").textContent = E.venue;
  $("next").innerHTML = [
    `<strong>This screen is your ticket.</strong> Screenshot it and show it at the door.`,
    `Your code is how we find your payment, so keep it.`,
    E.notes.join(" · ") + ".",
  ].map((l) => `<li>${l}</li>`).join("");
  $("d-ref").textContent = booking.ref;
  show("step-done");
};

$("another").onclick = () => {
  $("reg").reset();
  showErrors = false;
  document.querySelectorAll(".field.err").forEach((f) => f.classList.remove("err"));
  setTickets(1);
  show("step-form");
  $("name").focus();
};

paint();
