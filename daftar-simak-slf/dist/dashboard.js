"use strict";

const dashboardTimeZone = "Asia/Jakarta";
const dashboardDateParts = new Intl.DateTimeFormat("id-ID", { timeZone: dashboardTimeZone, year: "numeric", month: "numeric" });
const dashboardDate = new Intl.DateTimeFormat("id-ID", { timeZone: dashboardTimeZone, dateStyle: "medium" });
const dashboardMonths = new Intl.DateTimeFormat("id-ID", { timeZone: dashboardTimeZone, month: "short" });
const dashboardLongMonths = new Intl.DateTimeFormat("id-ID", { timeZone: dashboardTimeZone, month: "long" });
const dashboardNumbers = new Intl.NumberFormat("id-ID");
let dashboardPeriod = "monthly";
let dashboardYear;
let dashboardCopyProject;
let dashboardOpening = false;

function dashboardCalendar(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const parts = Object.fromEntries(dashboardDateParts.formatToParts(date).map(({ type, value }) => [type, value]));
  return { year: Number(parts.year), month: Number(parts.month) - 1 };
}

function dashboardEntries(state, rows) {
  const entries = new Map(rows.map((row) => [row.id, {
    id: row.id, name: row.name, createdAt: row.created_at, updatedAt: row.updated_at,
  }]));
  for (const project of state.projects) {
    const remote = entries.get(project.id);
    const saved = state.cloud?.[project.id];
    if (!remote && !saved?.revision && !saved?.dirty && !project.createdAt) continue;
    entries.set(project.id, {
      id: project.id,
      name: !remote || saved?.dirty ? project.name : remote.name,
      createdAt: project.createdAt || remote?.createdAt,
      updatedAt: remote?.updatedAt || saved?.updatedAt,
    });
  }
  const timestamp = (entry) => Date.parse(entry.updatedAt || entry.createdAt) || 0;
  return [...entries.values()].sort((a, b) => timestamp(b) - timestamp(a));
}

function dashboardChart(entries, first, current, year, yearly) {
  const counts = Array(yearly ? current - first + 1 : 12).fill(0);
  for (const entry of entries) {
    const calendar = dashboardCalendar(entry.createdAt || entry.updatedAt);
    if (!calendar || calendar.year < first || calendar.year > current) continue;
    if (yearly) counts[calendar.year - first]++;
    else if (calendar.year === year) counts[calendar.month]++;
  }
  return counts;
}

function slfRenderDashboard() {
  if ($("slf-dashboard").hidden || !slfAccount) return;
  const entries = dashboardEntries(workspace, slfCloudRows);
  const current = dashboardCalendar(new Date()).year;
  const first = Math.min(current, dashboardCalendar(slfAccount.created_at)?.year ?? current);
  dashboardYear = Math.min(current, Math.max(first, dashboardYear ?? current));
  $("dashboard-total").textContent = dashboardNumbers.format(entries.length);
  $("dashboard-list-count").textContent = dashboardNumbers.format(entries.length) + " kajian";
  $("dashboard-empty").hidden = Boolean(entries.length);
  const yearly = dashboardPeriod === "yearly";
  $("dashboard-monthly").setAttribute("aria-pressed", String(!yearly));
  $("dashboard-yearly").setAttribute("aria-pressed", String(yearly));
  const years = $("dashboard-year");
  if (years.options.length !== current - first + 1 || years.options[0]?.value !== String(current)) {
    years.replaceChildren(...Array.from({ length: current - first + 1 }, (_, index) => new Option(current - index, current - index)));
  }
  years.value = dashboardYear;
  years.hidden = yearly;
  const counts = dashboardChart(entries, first, current, dashboardYear, yearly);
  const total = counts.reduce((sum, count) => sum + count, 0);
  const period = yearly ? (first === current ? String(current) : first + "–" + current) : String(dashboardYear);
  $("dashboard-period").textContent = dashboardNumbers.format(total) + " kajian · " + period;
  $("dashboard-estimate").hidden = !entries.some((entry) => {
    const estimate = !entry.createdAt && dashboardCalendar(entry.updatedAt);
    return estimate && (yearly ? estimate.year >= first && estimate.year <= current : estimate.year === dashboardYear);
  });
  const peak = Math.max(1, ...counts);
  const chart = $("dashboard-chart");
  const chartKey = period + "/" + counts.join(",");
  const plot = dom("ul", { className: "dashboard-plot", ariaLabel: "Grafik jumlah kajian " + period });
  plot.style.setProperty("--bars", String(counts.length));
  counts.forEach((count, index) => {
    const month = new Date(Date.UTC(dashboardYear, index, 15));
    const label = yearly ? String(first + index) : dashboardMonths.format(month);
    const name = yearly ? label : dashboardLongMonths.format(month) + " " + dashboardYear;
    const value = dashboardNumbers.format(count);
    const column = dom("span", { className: "dashboard-bar" },
      dom("span", { className: "dashboard-bar-value" }, value), dom("span", { className: "dashboard-bar-fill" }));
    column.style.setProperty("--fill", 92 * count / peak + "%");
    const item = dom("li", { title: name + " · " + value + " kajian" },
      dom("span", { className: "dashboard-sr" }, name + ", " + value + " kajian"),
      dom("span", { className: "dashboard-bar-track", ariaHidden: "true" }, column),
      dom("span", { className: "dashboard-bar-label", ariaHidden: "true" }, label));
    plot.append(item);
  });
  if (chart.dataset.key !== chartKey) {
    chart.dataset.key = chartKey;
    chart.replaceChildren(plot);
  }
  const list = $("dashboard-list");
  const focused = list.contains(document.activeElement) ? document.activeElement.dataset : {};
  const ordered = entries.map((entry) => {
    const url = new URL(location.href);
    url.hash = "";
    url.searchParams.set("proyek", entry.id);
    const date = entry.updatedAt || entry.createdAt;
    const subtitle = date && dashboardCalendar(date) ?
      (entry.updatedAt ? "Diperbarui " : "Dibuat ") + dashboardDate.format(new Date(date)) : "Kajian SLF";
    const open = dom("a", { href: url.href, className: "dashboard-project-link" },
      dom("span", { className: "dashboard-document", ariaHidden: "true" }),
      dom("span", {}, dom("strong", {}, entry.name), dom("small", {}, subtitle)),
      dom("span", { className: "dashboard-open-arrow", ariaHidden: "true" }, "›"));
    open.dataset.project = entry.id;
    open.dataset.action = "open";
    open.addEventListener("click", (event) => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      slfOpenDashboardProject(entry.id);
    });
    const copy = button("Salin kajian", () => slfShowCopyDialog(entry), "dashboard-copy");
    copy.dataset.project = entry.id;
    copy.dataset.action = "copy";
    copy.setAttribute("aria-label", "Salin kajian " + entry.name);
    return dom("li", {}, open, copy);
  });
  list.replaceChildren(...ordered);
  if (focused.project) {
    [...list.querySelectorAll("[data-project]")]
      .find((control) => control.dataset.project === focused.project && control.dataset.action === focused.action)
      ?.focus({ preventScroll: true });
  }
}

function slfDashboardView(show, focus = false) {
  $("slf-dashboard").hidden = !show;
  $("slf-editor-view").hidden = show;
  $("dashboard-back").hidden = show || !slfAccount;
  if (show) slfRenderDashboard();
  if (focus) {
    window.scrollTo(0, 0);
    $(show ? "dashboard-title" : "page-title").focus({ preventScroll: true });
  }
}

function slfReturnToDashboard() {
  const url = new URL(location.href);
  for (const key of ["proyek", "bagian", "butir"]) url.searchParams.delete(key);
  url.hash = "";
  history.replaceState(null, "", url);
  slfDashboardView(true, true);
  slfRequestCloudSync();
}

async function slfOpenDashboardProject(id) {
  if (dashboardOpening || !slfAccount) return;
  const message = $("dashboard-action-status");
  dashboardOpening = true;
  message.hidden = false;
  message.textContent = "Membuka kajian…";
  try {
    await slfQueueCloud(async () => {
      if (!slfAccount) return;
      if (workspace.projects.some((project) => project.id === id)) {
        setCurrent(id);
        slfRequestCloudSync();
      } else if (!(await slfOpenDraft(id))) {
        throw Error("Kajian tidak tersedia.");
      }
    });
    message.hidden = true;
  } catch {
    message.textContent = "Kajian belum bisa dibuka. Periksa koneksi lalu coba lagi.";
  } finally {
    dashboardOpening = false;
  }
}

function slfShowCopyDialog(entry) {
  dashboardCopyProject = entry.id;
  const form = $("dashboard-copy-form");
  form.reset();
  form.elements.name.value = entry.name.slice(0, 110) + " (salinan)";
  $("dashboard-copy-original").textContent = "Kajian asal · " + entry.name;
  $("dashboard-copy-status").hidden = true;
  $("dashboard-copy-dialog").showModal();
  form.elements.name.select();
}

function initSlfDashboard() {
  const typeDialog = $("dashboard-type-dialog");
  for (const id of ["dashboard-add", "dashboard-add-first"]) {
    $(id).addEventListener("click", () => typeDialog.showModal());
  }
  $("dashboard-type-slf").addEventListener("click", () => {
    typeDialog.close();
    $("project-dialog").showModal();
  });
  $("dashboard-back").addEventListener("click", slfReturnToDashboard);
  $("dashboard-monthly").addEventListener("click", () => { dashboardPeriod = "monthly"; slfRenderDashboard(); });
  $("dashboard-yearly").addEventListener("click", () => { dashboardPeriod = "yearly"; slfRenderDashboard(); });
  $("dashboard-year").addEventListener("change", (event) => { dashboardYear = Number(event.target.value); slfRenderDashboard(); });
  const form = $("dashboard-copy-form");
  const copyDialog = $("dashboard-copy-dialog");
  const message = $("dashboard-copy-status");
  $("dashboard-copy-cancel").addEventListener("click", () => copyDialog.close());
  copyDialog.addEventListener("cancel", (event) => { if (form.elements.name.disabled) event.preventDefault(); });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = form.elements.name.value.trim();
    if (!name) { form.elements.name.focus(); return; }
    const controls = [...form.elements];
    for (const control of controls) control.disabled = true;
    message.hidden = false;
    message.textContent = "Menyalin kajian dan lampirannya…";
    try {
      const id = dashboardCopyProject;
      const owner = slfCloudOwner();
      await slfQueueCloud(() => slfDuplicateDraft(id, name, owner));
      copyDialog.close();
      $("page-title").focus({ preventScroll: true });
    } catch {
      message.textContent = "Salinan belum bisa dibuat. Periksa koneksi dan kelengkapan foto, lalu coba lagi.";
    } finally {
      for (const control of controls) control.disabled = false;
    }
  });
}
