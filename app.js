const E = window.EVENT;
const $ = (id) => document.getElementById(id);

const money = (p) => "£" + (p / 100).toFixed(2).replace(/\.00$/, "");
const people = (n) => (n === 1 ? "1 person" : `${n} people`);

let adults = [{ gender: "", age: "" }];
let womenLeft = null;
let showErrors = false;
const womenChosen = () => adults.filter((p) => p.gender === "Female").length;
let kids = [];

const isFree = (p) => p.age === E.childAges[0];
const paying = () => adults.length + kids.filter((k) => !isFree(k)).length;
const freeCount = () => kids.filter(isFree).length;

const party = (b) => {
  if (b.adults === undefined) return people(b.tickets);
  const parts = [`${b.adults} ${b.adults === 1 ? "adult" : "adults"}`];
  if (b.children) parts.push(`${b.children} ${b.children === 1 ? "child" : "children"}`);
  const s = parts.join(", ");
  return b.under5 ? `${s} (${b.under5} under ${E.freeUnderAge} free)` : s;
};

function paint() {
  document.title = `${E.name} — ${E.org}`;
  $("org").textContent = `${E.org} presents`;
  const [first, ...rest] = E.name.split(" ");
  $("ev-name").innerHTML = `<span>${first}</span>${rest.join(" ")}`;
  $("tagline").textContent = E.tagline;
  $("price-hint").textContent = `${E.priceLabel}. ${E.priceNote}.`;

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

  renderPeople();
  total();
}

function total() {
  const n = adults.length + kids.length;
  const pay = paying();
  const free = freeCount();
  $("t-count").textContent = party({ adults: adults.length, children: kids.length });
  $("t-free").textContent = free ? ` · ${free} under ${E.freeUnderAge} free` : "";
  $("t-total").textContent = money(pay * E.pricePence);
  $("submit").textContent = `Continue to pay ${money(pay * E.pricePence)}`;
  $("a-minus").disabled = adults.length <= 1;
  $("c-minus").disabled = kids.length === 0;
  $("a-plus").disabled = $("c-plus").disabled = n >= E.maxTicketsPerBooking;
  $("adults").value = adults.length;
  $("children").value = kids.length;
}

function resize(list, n) {
  while (list.length < n) list.push({ gender: "", age: "" });
  list.length = n;
}

function setCounts(a, c) {
  const max = E.maxTicketsPerBooking;
  a = Math.min(max, Math.max(1, a || 1));
  c = Math.min(max - a, Math.max(0, c || 0));
  resize(adults, a);
  resize(kids, c);
  renderPeople();
  total();
}

function personRow(p, kind, i) {
  const genders = kind === "adult" ? ["Male", "Female"] : ["Boy", "Girl"];
  const ages = kind === "adult" ? E.adultAges : E.childAges;
  const label = `${kind === "adult" ? "Adult" : "Child"} ${i + 1}`;
  const free = kind === "child" && isFree(p) ? `<em class="free-tag">Free</em>` : "";
  return `
    <div class="person" data-kind="${kind}" data-i="${i}">
      <span class="person-n">${label}${free}</span>
      <div class="seg" role="group" aria-label="${label}: gender">
        ${genders.map((g) => {
          const full = kind === "adult" && g === "Female" && womenLeft !== null && p.gender !== "Female" && womenChosen() >= womenLeft;
          return `<button type="button" data-g="${g}" aria-pressed="${p.gender === g}"${full ? " disabled title=\"Sisters' places are full\"" : ""}>${g}</button>`;
        }).join("")}
      </div>
      <select aria-label="${label}: age" id="${kind}-age-${i}">
        <option value="">Age</option>
        ${ages.map((n) => `<option value="${n}"${p.age === n ? " selected" : ""}>${n}</option>`).join("")}
      </select>
    </div>`;
}

function renderPeople() {
  $("people").innerHTML =
    adults.map((p, i) => personRow(p, "adult", i)).join("") +
    kids.map((p, i) => personRow(p, "child", i)).join("");
}

const listFor = (row) => (row.dataset.kind === "adult" ? adults : kids);

$("people").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-g]");
  if (!b) return;
  const row = b.closest(".person");
  listFor(row)[+row.dataset.i].gender = b.dataset.g;
  if (row.dataset.kind === "adult" && womenLeft !== null) {
    renderPeople();
    showWomen();
  } else {
    b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
  }
  if (showErrors) check();
});

$("people").addEventListener("change", (e) => {
  if (e.target.tagName !== "SELECT") return;
  const row = e.target.closest(".person");
  listFor(row)[+row.dataset.i].age = e.target.value;
  const tag = row.querySelector(".free-tag");
  const free = row.dataset.kind === "child" && isFree({ age: e.target.value });
  if (free && !tag) row.querySelector(".person-n").insertAdjacentHTML("beforeend", `<em class="free-tag">Free</em>`);
  if (!free && tag) tag.remove();
  total();
  if (showErrors) check();
});

function showWomen() {
  const el = $("women-left");
  if (womenLeft === null) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = womenLeft === 0
    ? "Sisters' places are now full. Brothers and children can still book."
    : `${womenLeft} ${womenLeft === 1 ? "place" : "places"} left for sisters (18+).`;
  el.classList.toggle("full", womenLeft === 0);
}

async function loadAvailability() {
  try {
    const r = await (await fetch(`${E.sheetEndpoint}?action=availability`, { signal: AbortSignal.timeout(15000) })).json();
    if (typeof r.womenLeft === "number") {
      womenLeft = r.womenLeft;
      renderPeople();
      showWomen();
    }
  } catch (e) {}
}

function reference() {
  return `${E.refPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function check() {
  const rules = [
    ["w-name", $("name").value.trim().length >= 2],
    ["w-email", /^\S+@\S+\.\S+$/.test($("email").value.trim())],
    ["w-tickets", adults.length >= 1],
    ["w-people", [...adults, ...kids].every((p) => p.gender && p.age !== "") && (womenLeft === null || womenChosen() <= womenLeft)],
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

function show(step) {
  ["step-form", "step-pay", "step-done"].forEach((s) => $(s).classList.toggle("hidden", s !== step));

  $("dot1").className = step === "step-form" ? "dot on" : "dot done";
  $("dot2").className = step === "step-form" ? "dot" : step === "step-done" ? "dot done" : "dot on";
  $("track").classList.toggle("hidden", step === "step-done");

  $("booking").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("a-minus").onclick = () => setCounts(adults.length - 1, kids.length);
$("a-plus").onclick = () => setCounts(adults.length + 1, kids.length);
$("c-minus").onclick = () => setCounts(adults.length, kids.length - 1);
$("c-plus").onclick = () => setCounts(adults.length, kids.length + 1);
$("adults").oninput = (e) => {
  const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
  if (!isNaN(n)) setCounts(n, kids.length);
};
$("children").oninput = (e) => {
  const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
  if (!isNaN(n)) setCounts(adults.length, n);
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
    document.querySelector(".field.err input, .field.err select, .field.err button")?.focus();
    return;
  }

  booking = {
    ref: reference(),
    event: E.name,
    name: $("name").value.trim(),
    email: $("email").value.trim(),
    phone: E.fields.phone ? $("phone").value.trim() : "",
    tickets: paying(),
    adults: adults.length,
    children: kids.length,
    under5: freeCount(),
    attendees: [
      ...adults.map((p) => `${p.gender} ${p.age}`),
      ...kids.map((p) => `${p.gender} ${p.age}${isFree(p) ? " (free)" : ""}`),
    ].join("; "),
    amount: (paying() * E.pricePence) / 100,
    heardAbout: E.fields.heardAbout ? $("heard").value : "",
    registeredAt: new Date().toISOString(),
  };

  fillPay();
  show("step-pay");
};

function fillPay() {
  $("p-amount").textContent = money(booking.tickets * E.pricePence);
  $("p-qty").textContent = party(booking);
}

$("back").onclick = () => show("step-form");

$("another").onclick = () => {
  $("reg").reset();
  showErrors = false;
  document.querySelectorAll(".field.err").forEach((f) => f.classList.remove("err"));
  adults = [];
  kids = [];
  setCounts(1, 0);
  show("step-form");
  $("name").focus();
};

async function api(body, ms = 15000) {
  const res = await fetch(E.sheetEndpoint, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(ms),
  });
  return res.json();
}

const DETAILS = ["name", "phone", "heardAbout", "adults", "children", "under5", "attendees", "registeredAt"];
const details = (b) => Object.fromEntries(DETAILS.map((k) => [k, b[k]]));

function fallbackLink() {
  const url = new URL(E.stripeLink);
  url.searchParams.set("client_reference_id", booking.ref);
  url.searchParams.set("prefilled_email", booking.email);
  return url.toString();
}

$("card").onclick = async () => {
  localStorage.setItem("pending", JSON.stringify(booking));
  $("card").disabled = true;
  $("card").textContent = "Opening secure checkout…";
  try {
    const r = await api({ action: "checkout", ref: booking.ref, tickets: booking.tickets, email: booking.email, site: location.origin + location.pathname, ...details(booking) });
    if (r.full) {
      womenLeft = r.womenLeft;
      renderPeople();
      showWomen();
      show("step-form");
      showErrors = true;
      check();
      $("card").disabled = false;
      $("card").textContent = "Pay by card or Apple Pay";
      return;
    }
    if (!r.url) throw new Error(r.error || "no checkout");
    window.location.href = r.url;
  } catch (e) {
    $("pay-note").textContent = `On the next page, set the quantity to ${booking.tickets}.`;
    $("pay-note").hidden = false;
    $("card").disabled = false;
    $("card").textContent = "Continue to payment";
    $("card").onclick = () => { window.location.href = fallbackLink(); };
  }
};

function ticket() {
  $("d-line").textContent = booking.paid === "card"
    ? "Payment received. You're all set."
    : "Payment received. We're just finishing the paperwork, nothing more for you to do.";
  $("d-name").textContent = booking.name;
  $("d-people").textContent = party(booking);
  $("d-amount").textContent = money(booking.tickets * E.pricePence);
  $("d-when").textContent = `${E.date}, ${E.time}`;
  $("d-where").textContent = E.venue;
  $("next").innerHTML = [
    `Your code is how we find your booking, so keep it.`,
    E.notes.join(" · ") + ".",
  ].map((l) => `<li>${l}</li>`).join("");
  $("d-ref").textContent = booking.ref;
  show("step-done");
}

async function returnFromStripe() {
  const params = new URLSearchParams(location.search);
  const session = params.get("paid");
  const cancelled = params.get("cancelled");
  const pending = localStorage.getItem("pending");
  if (!session && !cancelled) return;
  history.replaceState(null, "", location.pathname);

  if (cancelled) {
    if (!pending) return;
    booking = JSON.parse(pending);
    fillPay();
    $("pay-note").textContent = "Payment wasn't completed, so you're not booked yet. Try again when you're ready.";
    $("pay-note").hidden = false;
    show("step-pay");
    return;
  }

  const saved = pending ? JSON.parse(pending) : null;
  let r = {};
  for (const ms of [15000, 25000]) {
    try {
      r = await api({ action: "confirm", session, booking: saved ? details(saved) : null }, ms);
      break;
    } catch (e) {}
  }

  if (saved) {
    booking = saved;
  } else if (r.paid) {
    booking = { ref: r.ref, name: r.name || "", email: r.email || "", tickets: Math.round(r.amount / E.pricePence), adults: r.adults ? +r.adults : undefined, children: r.children ? +r.children : 0, under5: r.under5 ? +r.under5 : 0 };
  } else {
    return;
  }

  booking.paid = r.paid ? "card" : "confirming";
  localStorage.removeItem("pending");
  ticket();
}

paint();
returnFromStripe();
loadAvailability();
