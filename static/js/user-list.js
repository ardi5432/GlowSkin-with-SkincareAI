// ===== config =====
// bisa diganti ke endpoint API-mu. Atau set data-source via data-attr: <body data-users-url="/api/users">
const USERS_URL_DEFAULT = "/static/data/accounts.json";

// ===== state =====
let rawUsers = [];
let filtered = [];
let page = 1;
let pageSize = 10;
let sortAsc = true;

// ===== helpers DOM =====
const $ = (s) => document.querySelector(s);
const tbody = () => $("#userTableBody");
const searchEl = () => $("#searchInput");
const sizeEl = () => $("#pageSize");
const prevEl = () => $("#prevBtn");
const nextEl = () => $("#nextBtn");
const pageInfo = () => $("#pageInfo");
const summary = () => $("#summary");
const sortBtn = () => $("#sortUsername");
const sortIcon = () => $("#sortIcon");
const errorBox = () => $("#errorBox");

// ===== init =====
document.addEventListener("DOMContentLoaded", async () => {
  await loadUsers();
  bindEvents();
  applyAll();
});

async function loadUsers() {
  try {
    const url = document.body?.dataset?.usersUrl || USERS_URL_DEFAULT;
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data?.users)
      ? data.users
      : [];
    rawUsers = arr.map((u, i) => ({
      id_user: Number(u.id_user ?? i),
      username: String(u.username ?? "").trim(),
      loginTime: u.loginTime ? String(u.loginTime) : "-",
    }));
  } catch (e) {
    showError("Gagal memuat user list. Pastikan file/endpoint tersedia.");
    console.error(e);
    rawUsers = [];
  }
}

// ===== events =====
function bindEvents() {
  searchEl()?.addEventListener("input", () => {
    page = 1;
    applyAll();
  });

  sizeEl()?.addEventListener("change", () => {
    pageSize = parseInt(sizeEl().value, 10) || 10;
    page = 1;
    render();
  });

  prevEl()?.addEventListener("click", () => {
    if (page > 1) {
      page--;
      render();
    }
  });
  nextEl()?.addEventListener("click", () => {
    const mx = maxPage();
    if (page < mx) {
      page++;
      render();
    }
  });

  sortBtn()?.addEventListener("click", () => {
    sortAsc = !sortAsc;
    applySort();
    render();
  });
}

// ===== pipeline =====
function applyAll() {
  applySearch();
  applySort();
  render();
}

function applySearch() {
  const q = (searchEl()?.value || "").toLowerCase().trim();
  filtered = !q
    ? rawUsers.slice()
    : rawUsers.filter((u) => u.username.toLowerCase().includes(q));
  page = 1;
}

function applySort() {
  filtered.sort((a, b) => {
    const A = a.username.toLowerCase();
    const B = b.username.toLowerCase();
    return sortAsc ? A.localeCompare(B) : B.localeCompare(A);
  });
  if (sortIcon()) sortIcon().textContent = sortAsc ? "↑" : "↓";
}

function render() {
  if (!tbody()) return;

  if (!filtered.length) {
    tbody().innerHTML = `
      <tr><td colspan="3" class="px-4 py-8 text-center text-gray-500">Tidak ada data</td></tr>
    `;
    if (summary()) summary().textContent = "0 data";
    if (pageInfo()) pageInfo().textContent = "0 / 0";
    return;
  }

  const mx = maxPage();
  if (page > mx) page = mx;

  const start = (page - 1) * pageSize;
  const slice = filtered.slice(start, start + pageSize);

  tbody().innerHTML = slice
    .map(
      (u,i) => `
    <tr class="hover:bg-orange-50/50 transition">
      <td class="px-4 py-3 text-gray-700">${i+1}</td>
      <td class="px-4 py-3 font-medium text-gray-900">${escapeHtml(
        u.username
      )}</td>
      <td class="px-4 py-3 text-gray-700">${escapeHtml(u.loginTime)}</td>
    </tr>
  `
    )
    .join("");

  if (summary()) summary().textContent = `${filtered.length} data`;
  if (pageInfo()) pageInfo().textContent = `${page} / ${mx}`;
}

function maxPage() {
  return Math.max(1, Math.ceil(filtered.length / pageSize));
}

// ===== utils =====
function showError(msg) {
  const box = errorBox();
  if (!box) return;
  box.textContent = msg;
  box.classList.remove("hidden");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
