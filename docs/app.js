// Λογική πλάνου + εμφάνιση. Τα δεδομένα (συνταγές κλπ.) είναι στο data.js.

const DAYS = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
const OFFER_TOLERANCE = 1.15; // προτιμάμε την προσφορά ακόμα κι αν είναι λίγο ακριβότερη
const STOP_WORDS = new Set(["με", "απο", "σε", "και", "για", "γεμιση"]);

// ---------------------------------------------------------------- βοηθητικά
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ς/g, "σ");
const eur = (x) => x.toFixed(2).replace(".", ",") + "€";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ddmm = (d) => String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

function fmtG(g, unit = "g") {
  if (unit === "ml") return (g / 1000).toFixed(1).replace(".", ",") + " λίτρα";
  if (g >= 1000) return (g / 1000).toFixed(2).replace(".", ",") + " kg";
  return Math.round(g) + " g";
}

function store(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { return null; }
}

// ---------------------------------------------------------------- τιμές
// Η λέξη πρέπει να είναι το ίδιο το προϊόν, όχι υλικό του ('Παριζάκι με ελαιόλαδο').
function isProduct(keyword, title) {
  let i = title.indexOf(keyword);
  while (i !== -1) {
    const before = title.slice(0, i).trim().split(/\s+/).filter(Boolean);
    if (!before.length || !STOP_WORDS.has(before[before.length - 1])) return true;
    i = title.indexOf(keyword, i + 1);
  }
  return false;
}

const matchOffers = (kw, ex, offers) => offers.filter((o) =>
  kw.some((k) => isProduct(norm(k), o.n)) && !ex.some((x) => o.n.includes(norm(x))));

function bestPrice(kw, ex, defKg, offers) {
  const hits = matchOffers(kw, ex, offers).filter((o) => o.price_kg);
  if (hits.length) {
    const best = hits.reduce((a, b) => (b.price_kg < a.price_kg ? b : a));
    if (best.price_kg <= defKg * OFFER_TOLERANCE) return [best.price_kg, best];
  }
  return [defKg, null];
}

const recipeCost = (rec, prices) =>
  Object.entries(rec.ings).reduce((s, [k, g]) => s + (g / 1000) * prices[k][0], 0);

// ---------------------------------------------------------------- πλάνο
function splitDays(sessions) {
  const base = Math.floor(7 / sessions), extra = 7 % sessions;
  const blocks = []; let start = 0;
  for (let i = 0; i < sessions; i++) {
    const size = base + (i >= sessions - extra ? 1 : 0);
    blocks.push([...Array(size).keys()].map((x) => x + start));
    start += size;
  }
  return blocks;
}

// Κάθε μαγείρεμα: το φθηνότερο φαγητό με κρέας + το φθηνότερο όσπριο/λαδερό,
// χωρίς επανάληψη φαγητού και, όσο γίνεται, χωρίς ίδιο βασικό υλικό.
function buildPlan(prices, sessions) {
  const byCost = [...RECIPES].sort((a, b) => recipeCost(a, prices) - recipeCost(b, prices));
  const used = new Set(), usedMains = new Set(), plan = [];
  for (const block of splitDays(sessions)) {
    const dishes = [];
    for (const group of ["meat", "veg"]) {
      const pool = byCost.filter((r) => r.group === group && !used.has(r.name));
      const pick = pool.find((r) => !usedMains.has(Object.keys(r.ings)[0])) || pool[0];
      dishes.push(pick);
      used.add(pick.name);
      usedMains.add(Object.keys(pick.ings)[0]);
    }
    dishes.sort((a, b) => a.keeps - b.keeps); // ό,τι κρατάει λιγότερο τρώγεται πρώτο
    const dishDays = new Map(dishes.map((d) => [d.name, []]));
    block.forEach((day, i) => dishDays.get(dishes[i % dishes.length].name).push(day));
    plan.push({ cookDay: block[0], dishes, dishDays });
  }
  return plan;
}

function compute(offers, people, sessions, start) {
  const prices = {};
  for (const [k, [, kw, ex, kg]] of Object.entries(ING)) prices[k] = bestPrice(kw, ex, kg, offers);
  const plan = buildPlan(prices, sessions);

  const lunch = {};
  plan.forEach((b) => b.dishDays.forEach((ds, name) => ds.forEach((d) => (lunch[d] = name))));
  const light = [...Array(7).keys()].map((i) => (i % 2 === 0 ? ["κορνφλέικς", "τοστ"] : ["τοστ", "κορνφλέικς"]));
  const fruits = FRUITS.map((f) => [f, ...bestPrice(f[1], f[2], f[3], offers)])
    .sort((a, b) => a[1] * a[0][4] - b[1] * b[0][4]).slice(0, 2);
  const fruitOf = [...Array(7).keys()].map((i) => fruits[i % fruits.length]);

  const days = [...Array(7).keys()].map((i) => {
    const d = addDays(start, i);
    return {
      label: DAYS[d.getDay()], date: ddmm(d),
      cook: plan.find((b) => b.cookDay === i) || null,
      breakfast: LIGHT[light[i][0]].name,
      snack: `${fruitOf[i][0][5]}`,
      lunch: lunch[i],
      dinner: LIGHT[light[i][1]].name,
    };
  });

  const need = {};
  const cooking = plan.map((b) => {
    const d = addDays(start, b.cookDay);
    return {
      label: DAYS[d.getDay()], date: ddmm(d),
      dishes: b.dishes.map((rec) => {
        const ds = b.dishDays.get(rec.name);
        const portions = ds.length * people;
        for (const [k, g] of Object.entries(rec.ings)) need[k] = (need[k] || 0) + g * portions;
        return {
          name: rec.name, how: rec.how, portions,
          eatDays: ds.map((x) => days[x].label).join(", "),
          freeze: ds.length > 0 && Math.max(...ds) - b.cookDay >= rec.keeps,
          costPortion: recipeCost(rec, prices),
          ings: Object.entries(rec.ings).map(([k, g]) => [ING[k][0], g * portions]),
          onOffer: Object.keys(rec.ings).filter((k) => prices[k][1]).map((k) => ING[k][0]),
        };
      }),
    };
  });

  const shop = [
    { title: "Για το μαγείρεμα", rows: [] },
    { title: "Δεκατιανό (φρούτα)", rows: [] },
    { title: "Πρωινό & βραδινό", rows: [] },
    { title: "Ντουλάπι (αν δεν έχεις ήδη)", rows: [], pantry: true },
  ];
  for (const [k, grams] of Object.entries(need)) {
    const [priceKg, offer] = prices[k];
    let buy, cost;
    if (offer && !offer.loose && offer.pack_g) {
      const packs = Math.ceil(grams / offer.pack_g);
      buy = `${packs} × ${offer.packaging}`; cost = packs * offer.price;
    } else {
      buy = "~" + fmtG(grams) + (offer ? " (χύμα)" : ""); cost = (grams / 1000) * priceKg;
    }
    shop[PANTRY.has(k) ? 3 : 0].rows.push({ item: ING[k][0], qty: fmtG(grams), buy, cost, offer });
  }
  for (const [f, priceKg, offer] of fruits) {
    const n = fruitOf.filter((x) => x[0] === f).length * people;
    shop[1].rows.push({ item: f[0], qty: `${n} × ${f[5]}`, buy: "~" + fmtG(n * f[4]), cost: (n * f[4] / 1000) * priceKg, offer });
  }
  const counts = { "τοστ": 0, "κορνφλέικς": 0 };
  light.forEach(([a, b]) => { counts[a]++; counts[b]++; });
  for (const [kind, n] of Object.entries(counts)) {
    for (const [item, per, unit, [pack, packLabel], defPrice, kw, ex] of LIGHT[kind].items) {
      const total = per * n * people;
      const packs = Math.ceil(total / pack);
      let offer = matchOffers(kw, ex, offers).filter((o) => o.price).sort((a, b) => a.price - b.price)[0] || null;
      if (offer && offer.price > defPrice * OFFER_TOLERANCE) offer = null;
      shop[2].rows.push({
        item, qty: unit === "φέτες" ? `${total} φέτες` : fmtG(total, unit),
        buy: `${packs} × ${packLabel}`, cost: packs * (offer ? offer.price : defPrice), offer,
      });
    }
  }
  const total = shop.filter((s) => !s.pantry).flatMap((s) => s.rows).reduce((s, r) => s + r.cost, 0);
  return { people, sessions, start, days, cooking, shop, total, perPersonDay: total / people / 7 };
}

// ---------------------------------------------------------------- εμφάνιση
const state = {
  people: store("people") || 2,
  sessions: store("sessions") || 2,
  tab: store("tab") || "week",
  offers: [], updated: null, data: null,
};

function nextMonday() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  return addDays(d, (8 - d.getDay()) % 7); // σήμερα αν είναι Δευτέρα
}

function renderWeek(data) {
  return data.days.map((d) => `
    <article class="day ${d.cook ? "cookday" : ""}">
      <header><h3>${d.label} <small>${d.date}</small></h3>${d.cook ? '<span class="badge cook">Μαγείρεμα</span>' : ""}</header>
      <dl>
        <dt>Πρωινό</dt><dd>${esc(d.breakfast)}</dd>
        <dt>Δεκατιανό</dt><dd>${esc(d.snack)}</dd>
        <dt>Μεσημεριανό</dt><dd class="lunch">${esc(d.lunch)}</dd>
        <dt>Βραδινό</dt><dd>${esc(d.dinner)}</dd>
      </dl>
    </article>`).join("");
}

function renderCooking(data) {
  return data.cooking.map((s) => `
    <section class="session">
      <h3>${s.label} ${s.date}</h3>
      ${s.dishes.map((d) => `
        <article class="card">
          <h4>${esc(d.name)}</h4>
          <p class="meta">${d.portions} μερίδες · τρώγεται: ${esc(d.eatDays)} · ~${eur(d.costPortion)}/μερίδα</p>
          ${d.onOffer.length ? `<p><span class="badge offer">Σε προσφορά: ${esc(d.onOffer.join(", "))}</span></p>` : ""}
          <ul>${d.ings.map(([n, g]) => `<li>${esc(n)} <b>${fmtG(g)}</b></li>`).join("")}</ul>
          <p class="how">${esc(d.how)}</p>
          ${d.freeze ? '<p class="tip">Βάλε τις μερίδες των τελευταίων ημερών στην κατάψυξη την ίδια μέρα.</p>' : ""}
        </article>`).join("")}
    </section>`).join("");
}

function renderShop(data) {
  const checked = store("checked:" + data.start.toISOString().slice(0, 10)) || {};
  return data.shop.filter((s) => s.rows.length).map((s) => `
    <section class="shop">
      <h3>${esc(s.title)}</h3>
      ${s.rows.map((r) => {
        const id = s.title + "|" + r.item;
        const src = r.offer
          ? `<span class="badge offer">Προσφορά</span> ${esc(r.offer.title)} – ${r.offer.price != null ? eur(r.offer.price) : ""} ${esc(r.offer.packaging)}${r.offer.when ? ` · <i>${esc(r.offer.when)}</i>` : ""}`
          : '<span class="badge est">Εκτίμηση</span>';
        return `
        <label class="item ${checked[id] ? "done" : ""}">
          <input type="checkbox" data-id="${esc(id)}" ${checked[id] ? "checked" : ""}>
          <span class="body">
            <span class="row"><b>${esc(r.item)}</b><span class="cost">${eur(r.cost)}</span></span>
            <span class="sub">Αγόρασε: ${esc(r.buy)} · χρειάζεσαι ${esc(r.qty)}</span>
            <span class="src">${src}</span>
          </span>
        </label>`;
      }).join("")}
    </section>`).join("") + `<p class="total">Σύνολο (χωρίς ντουλάπι): <b>${eur(data.total)}</b></p>`;
}

function render() {
  const data = state.data = compute(state.offers, state.people, state.sessions, nextMonday());
  const end = addDays(data.start, 6);
  document.getElementById("people").textContent = state.people;
  document.querySelectorAll("[data-sessions]").forEach((b) =>
    b.classList.toggle("on", +b.dataset.sessions === state.sessions));
  document.getElementById("range").textContent = `${ddmm(data.start)} – ${ddmm(end)}`;
  document.getElementById("total").textContent = eur(data.total);
  document.getElementById("ppd").textContent = eur(data.perPersonDay);
  document.getElementById("week").innerHTML = renderWeek(data);
  document.getElementById("cooking").innerHTML = renderCooking(data);
  document.getElementById("shop").innerHTML = renderShop(data);
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === state.tab));
  document.querySelectorAll(".panel").forEach((p) => (p.hidden = p.id !== state.tab));
}

async function loadOffers() {
  const status = document.getElementById("status");
  try {
    const res = await fetch("offers.json", { cache: "no-cache" });
    const json = await res.json();
    state.offers = json.offers.map((o) => ({ ...o, n: norm(o.title) }));
    state.updated = new Date(json.updated);
    status.textContent = `Προσφορές Lidl: ${state.offers.length} · ενημέρωση ${ddmm(state.updated)} ` +
      state.updated.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    status.textContent = "Δεν φόρτωσαν οι προσφορές – χρησιμοποιούνται εκτιμώμενες τιμές.";
  }
}

function init() {
  document.getElementById("minus").onclick = () => { state.people = Math.max(1, state.people - 1); store("people", state.people); render(); };
  document.getElementById("plus").onclick = () => { state.people = Math.min(20, state.people + 1); store("people", state.people); render(); };
  document.querySelectorAll("[data-sessions]").forEach((b) => (b.onclick = () => {
    state.sessions = +b.dataset.sessions; store("sessions", state.sessions); render();
  }));
  document.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => {
    state.tab = b.dataset.tab; store("tab", state.tab); render(); window.scrollTo({ top: 0 });
  }));
  document.getElementById("pdf").onclick = () => window.print();
  document.getElementById("shop").addEventListener("change", (e) => {
    if (!e.target.dataset.id) return;
    const key = "checked:" + state.data.start.toISOString().slice(0, 10);
    const checked = store(key) || {};
    checked[e.target.dataset.id] = e.target.checked;
    store(key, checked);
    e.target.closest(".item").classList.toggle("done", e.target.checked);
  });
  render();
  loadOffers().then(render);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}

init();
