const E = window.EVENT;
const $ = (id) => document.getElementById(id);

const money = (p) => "£" + (p / 100).toFixed(2).replace(/\.00$/, "");
const people = (n) => (n === 1 ? "1 person" : `${n} people`);

let adults = [{ gender: "", age: "" }];
let kids = [];

const isFree = (p) => p.age !== "" && Number(p.age) < E.freeUnderAge;
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
  const ages = kind === "adult"
    ? Array.from({ length: 82 }, (_, n) => n + 18)
    : Array.from({ length: 18 }, (_, n) => n);
  const label = `${kind === "adult" ? "Adult" : "Child"} ${i + 1}`;
  const free = kind === "child" && isFree(p) ? `<em class="free-tag">Free</em>` : "";
  return `
    <div class="person" data-kind="${kind}" data-i="${i}">
      <span class="person-n">${label}${free}</span>
      <div class="seg" role="group" aria-label="${label}: gender">
        ${genders.map((g) => `<button type="button" data-g="${g}" aria-pressed="${p.gender === g}">${g}</button>`).join("")}
      </div>
      <select aria-label="${label}: age" id="${kind}-age-${i}">
        <option value="">Age</option>
        ${ages.map((n) => `<option value="${n}"${String(p.age) === String(n) ? " selected" : ""}>${n === 0 ? "Under 1" : n === 99 ? "99+" : n}</option>`).join("")}
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
  b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
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

function reference() {
  return `${E.refPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function check() {
  const rules = [
    ["w-name", $("name").value.trim().length >= 2],
    ["w-email", /^\S+@\S+\.\S+$/.test($("email").value.trim())],
    ["w-tickets", adults.length >= 1],
    ["w-people", [...adults, ...kids].every((p) => p.gender && p.age !== "")],
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

let queue = Promise.resolve();

function record(row) {
  const saved = JSON.parse(localStorage.getItem("bookings") || "[]");
  saved.push(row);
  localStorage.setItem("bookings", JSON.stringify(saved));

  if (!E.sheetEndpoint) return queue;
  const body = JSON.stringify(row);
  queue = queue
    .then(() => fetch(E.sheetEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
    }))
    .catch(() => {});
  return queue;
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
      ...kids.map((p) => `${p.gender} ${p.age === "0" ? "under 1" : p.age}${isFree(p) ? " (free)" : ""}`),
    ].join("; "),
    amount: (paying() * E.pricePence) / 100,
    heardAbout: E.fields.heardAbout ? $("heard").value : "",
    paid: "no",
    registeredAt: new Date().toISOString(),
  };

  record(booking);

  fillPay();
  show("step-pay");
};

function fillPay() {
  $("p-amount").textContent = money(booking.tickets * E.pricePence);
  $("p-qty").textContent = party(booking);
  $("b-name").textContent = E.bank.accountName;
  $("b-bank").textContent = E.bank.bankName;
  $("b-sort").textContent = E.bank.sortCode;
  $("b-acc").textContent = E.bank.accountNumber;
  $("p-ref").textContent = booking.ref;
}

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

async function api(body) {
  const res = await fetch(E.sheetEndpoint, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });
  return res.json();
}

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
    const r = await api({ action: "checkout", ref: booking.ref, tickets: booking.tickets, email: booking.email, site: location.origin + location.pathname });
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
  $("d-line").textContent = {
    card: "Payment received. You're all set.",
    "card (unverified)": "Your place is held. We're just confirming your payment with the bank.",
  }[booking.paid] || "Your place is held. We'll confirm once the transfer lands.";
  $("d-name").textContent = booking.name;
  $("d-people").textContent = party(booking);
  $("d-amount").textContent = money(booking.tickets * E.pricePence);
  $("d-when").textContent = `${E.date}, ${E.time}`;
  $("d-where").textContent = E.venue;
  $("next").innerHTML = [
    `Your code is how we find your payment, so keep it.`,
    E.notes.join(" · ") + ".",
  ].map((l) => `<li>${l}</li>`).join("");
  $("d-ref").textContent = booking.ref;
  show("step-done");
}

$("paid").onclick = () => {
  booking.paid = "said yes (transfer)";
  booking.confirmedAt = new Date().toISOString();
  record(booking);
  ticket();
};

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
    $("pay-note").textContent = "Payment wasn't completed. Your place is still held, try again when you're ready.";
    $("pay-note").hidden = false;
    show("step-pay");
    return;
  }

  let r = {};
  try {
    r = await api({ action: "confirm", session });
  } catch (e) {}

  if (pending) {
    booking = JSON.parse(pending);
  } else if (r.paid) {
    booking = { ref: r.ref, name: r.name || "", email: r.email || "", tickets: Math.round(r.amount / E.pricePence) };
  } else {
    return;
  }

  booking.paid = r.paid ? "card" : "card (unverified)";
  booking.stripeSession = session;
  booking.confirmedAt = new Date().toISOString();
  if (!r.paid) record(booking);
  localStorage.removeItem("pending");
  ticket();
}

paint();
returnFromStripe();
