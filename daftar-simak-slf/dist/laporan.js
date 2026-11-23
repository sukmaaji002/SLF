"use strict";

function dom(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  Object.assign(element, props);
  element.append(...children);
  return element;
}

function openStore(name, store) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeValue(database, storeName, key, value) {
  const db = await database;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, value === undefined ? "readonly" : "readwrite");
    const store = tx.objectStore(storeName);
    const request = value === undefined ? store.get(key) : store.put(value, key);
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = () => reject(tx.error);
  });
}

function readChecklist(id) {
  try {
    return JSON.parse(localStorage.getItem("daftar-simak-slf:v2:" + id)) ?? { identity: {}, checks: {} };
  } catch {
    return { identity: {}, checks: {} };
  }
}

const checklistItems = catalog.flatMap((category) => category.groups.flatMap((group, gi) =>
  group.items.map((item, ii) => ({ ...item, group, category, id: category.code + "-" + gi + "-" + ii }))));
const checklistLabels = {
  location: "Lokasi sampel", observation: "Pengamatan visual", damage: "Kerusakan", presence: "Ketersediaan",
  measurement: "Pengukuran", direction: "Arah bukaan", conformity: "Kesesuaian", nonconformity: "Uraian ketidaksesuaian",
  ndt: "Uji non-destruktif", test: "Pengetesan", view: "Hasil pengamatan", disruption: "Uraian gangguan",
  note: "Keterangan", component: "Komponen", routine: "Rutin", periodic: "Berkala", unscheduled: "Tidak terjadwal",
  ndtPhoto: "Foto uji non-destruktif", photo: "Foto pemeriksaan",
};
const checklistIdentityLabels = {
  ownerNameStatus: "Ketersediaan nama pemilik", ownerName: "Nama pemilik",
  ownerAddressStatus: "Ketersediaan alamat pemilik", ownerAddress: "Alamat pemilik",
  deformation: "Miring / deformasi", damage: "Terdapat kerusakan", severity: "Tingkat kerusakan",
  inUse: "Bangunan dimanfaatkan", maintained: "Bangunan terawat", building: "Nama bangunan",
  location: "Lokasi", use: "Fungsi bangunan", date: "Tanggal pemeriksaan",
};
const imageSource = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
let photoDatabase;

function checklistPhotos(checklist) {
  const photos = [];
  for (const { id } of checklistItems) {
    for (const row of checklist.checks[id]?.rows ?? []) {
      for (const property of ["photo", "ndtPhoto"]) {
        if (row[property]) photos.push(id + ":" + row.key + ":" + property);
      }
    }
  }
  return photos;
}

function checklistPhoto(id, key, blob) {
  photoDatabase ??= openStore("daftar-simak-slf", "photos");
  return storeValue(photoDatabase, "photos", id + ":" + key, blob);
}

function chapterLabel(project, index) {
  return "Bab " + roman(index + 1) + " · " + (project.chapters[index].title.trim() || "Bab tanpa judul");
}

function reportTable(headers, rows) {
  const table = dom("table");
  table.append(dom("thead", {}, dom("tr", {}, ...headers.map((text) => dom("th", { scope: "col" }, text)))));
  table.append(dom("tbody", {}, ...rows.map((row) => dom("tr", {}, ...row.map((value) => dom("td", {}, value))))));
  return table;
}

function reportSection(title, id) {
  return dom("section", { className: "report-section", id }, dom("h2", {}, title));
}

function contentsLink(id, title, className = "") {
  const page = dom("span", { className: "toc-page" });
  page.dataset.pageFor = id;
  return dom("a", { href: "#" + id, className: "toc-row " + className },
    dom("span", { className: "toc-title" }, title), dom("span", { className: "toc-leader", ariaHidden: "true" }), page);
}

function reportParagraphs(text, format, resolveToken) {
  const paragraphs = [];
  let offset = 0;
  for (const [index, part] of text.split(/(\n\s*\n)/).entries()) {
    if (index % 2 === 0 && part.trim()) {
      const paragraph = styleTextBlock(dom("p", { className: "report-text" }), format);
      paragraph.append(formattedText(part, format, resolveToken, offset));
      paragraphs.push(paragraph);
    }
    offset += part.length;
  }
  return paragraphs;
}

function reportFormatted(element, text, format, prefix = "") {
  element.replaceChildren(prefix, formattedText(text, format));
  return styleTextBlock(element, format);
}

async function renderChecklist(target, project, urls, checklist, summaryAnchors, primary) {
  const { checks } = checklist;
  const identity = { ...checklist.identity };
  for (const [key, value] of Object.entries({
    building: project.cover.building, location: project.cover.address,
    use: project.cover.use, ownerName: project.cover.owner,
  })) {
    if (!cleanValue(identity[key]) && cleanValue(value)) identity[key] = value;
  }
  const rows = Object.entries(checklistIdentityLabels).filter(([key]) => identity[key]?.trim())
    .map(([key, label]) => [label, formattedValue(identity[key], getTextFormat(checklist.identity, key) || getTextFormat(project.cover, { ownerName: "owner", location: "address" }[key] ?? key))]);
  if (rows.length) target.append(reportTable(["Data pemeriksaan", "Isian"], rows));
  let currentCategory;
  let currentGroup;
  let body;
  const pendingPhotos = [];
  for (const item of checklistItems) {
    if (item.category !== currentCategory) {
      currentCategory = item.category;
      target.append(dom("h3", {}, item.category.code + " " + item.category.title));
    }
    if (item.group !== currentGroup) {
      currentGroup = item.group;
      body = dom("tbody");
      target.append(dom("h4", {}, item.group.code + " " + item.group.title),
        dom("table", {}, dom("thead", {}, dom("tr", {}, dom("th", {}, "Butir pemeriksaan"), dom("th", {}, "Hasil"), dom("th", {}, "Dasar aturan atau acuan teknis"))), body));
    }
    const check = checks[item.id];
    const result = dom("td");
    const name = [item.no, item.title].filter(Boolean).join(". ");
    const label = dom("td", {}, name);
    const summary = summaryAnchors.get(item.id);
    if (summary) label.append(dom("br"), reportJump(summary, "Ringkasan di bab"));
    body.append(dom("tr", primary ? { id: "report-check-" + item.id } : {}, label, result,
      dom("td", {}, checklistReference(item.id, project.intensity?.region === "tegal"))));
    if (check?.na) {
      result.append("Tidak berlaku");
      const reason = checklistReason(check);
      if (reason) result.append(". ", formattedValue(reason, getTextFormat(check, "reason") || getTextFormat(check.rows[0], "note")));
      continue;
    }
    const filled = check?.rows.filter((row) => Object.keys(checklistLabels).some((key) => row[key]?.trim()));
    if (!filled?.length) {
      result.textContent = "Belum diisi";
      continue;
    }
    for (const row of filled) {
      if (row.label) result.append(dom("strong", {}, row.label));
      const values = dom("dl", { className: "result-values" });
      for (const [key, label] of Object.entries(checklistLabels)) {
        if (!row[key]?.trim()) continue;
        const value = key === "measurement" ? formatChecklistMeasurement(row[key], item.unit) : row[key];
        const definition = reportFormatted(dom("dd"), value, getTextFormat(row, key));
        values.append(dom("dt", {}, label), definition);
        if (key === "photo" || key === "ndtPhoto") {
          pendingPhotos.push(checklistPhoto(project.id, item.id + ":" + row.key + ":" + key).then(async (blob) => {
            if (!blob) return;
            const src = URL.createObjectURL(blob);
            urls.push(src);
            const image = dom("img", { src, alt: label });
            try { await image.decode(); definition.append(image); } catch { /* The filename remains visible. */ }
          }).catch(() => {}));
        }
      }
      result.append(values);
    }
  }
  await Promise.all(pendingPhotos);
}

function reportJump(id, label) {
  const link = dom("a", { href: "#" + id }, label);
  link.dataset.reportJump = id;
  return link;
}

async function buildReport(target, project, urls) {
  target.replaceChildren();
  const checklist = readChecklist(project.id);
  const sources = reportSources(project, checklist);
  const resolveToken = (links) => (original, name) => resolveReportLink(original, name, sources, links);
  const coverFormat = (key, token) => getTextFormat(project.cover, key) || (token ? sources.get(automaticSource(token, sources))?.format : undefined);
  const data = {
    ...project.cover,
    building: automaticValue("nama bangunan", sources) || project.cover.building,
    address: automaticValue("alamat bangunan", sources) || project.cover.address,
    use: automaticValue("fungsi bangunan", sources) || project.cover.use,
    owner: automaticValue("nama pemilik", sources) || project.cover.owner,
  };
  const title = data.title || "Laporan Kajian Teknis Sertifikat Laik Fungsi";
  const cover = dom("section", { className: "report-cover" },
    dom("p", { className: "paper-kicker" }, "Sertifikat Laik Fungsi"),
    reportFormatted(dom("h1"), title, coverFormat("title")),
    reportFormatted(dom("p", { className: "cover-building" }), data.building || project.name, data.building ? coverFormat("building", "nama bangunan") : getTextFormat(project, "name")),
    reportFormatted(dom("p"), data.address || data.city || "", data.address ? coverFormat("address", "alamat bangunan") : coverFormat("city")));
  if (imageSource.test(data.image || "")) {
    cover.append(dom("img", { className: "cover-photo", src: data.image, alt: data.building || project.name }));
  }
  const coverDetails = coverFields.filter(([key]) => !["title", "building", "address"].includes(key) && data[key]?.trim());
  if (coverDetails.length) cover.append(reportTable(["Identitas laporan", "Keterangan"], coverDetails.map(([key, label]) => [label, formattedValue(data[key], coverFormat(key, { use: "fungsi bangunan", owner: "nama pemilik" }[key]))])));
  target.append(cover);
  const contents = reportSection("Daftar isi", "report-contents");
  const sections = [];
  const tableEntries = [];
  const figureEntries = [];
  const checklistTargets = [];
  const summaryAnchors = new Map();
  const summaries = new Map();
  for (const item of checklistItems) {
    const summary = checklistSummary(item, checklist.checks[item.id]);
    if (!summary) continue;
    const to = checklistDestination(project, item);
    const key = to ? to.chapter + ":" + to.block : "fallback";
    if (!summaries.has(key)) summaries.set(key, []);
    const id = "report-summary-" + item.id;
    summaryAnchors.set(item.id, id);
    summaries.get(key).push({ item, summary, id });
  }
  const intensity = calculateIntensity(project, checklist);
  const showIntensity = Boolean(intensity.data.land.trim() || intensity.data.region || intensity.data.diagram ||
    intensity.metrics.some((metric) => metric.area.value !== null || metric.area.error));
  const intensityHeading = {
    disiplin: "Intensitas bangunan", ringkas: "Tata bangunan dan lingkungan", simak: "Tinjauan kesesuaian bangunan gedung",
  }[project.template];
  let intensityRendered = false;
  function appendIntensity(section) {
    intensityRendered = true;
    const id = "report-intensity-results";
    const label = "Tabel " + (tableEntries.length + 1) + " · Perhitungan KDB, KLB, dan KDH";
    tableEntries.push([id, label]);
    section.append(dom("div", { id, className: "report-block" }, dom("p", { className: "caption" }, label),
      intensityTable(project, checklist)));
    if (intensity.data.diagram) {
      const figure = siteDiagram();
      figure.id = "report-site-diagram";
      const caption = "Gambar " + (figureEntries.length + 1) + " · " + figure.lastElementChild.textContent;
      figure.lastElementChild.textContent = caption;
      figureEntries.push([figure.id, caption]);
      section.append(figure);
    }
  }
  function appendSummary(section, key, label) {
    const rows = summaries.get(key);
    if (!rows) return;
    const id = "report-checklist-summary-" + tableEntries.length;
    const caption = "Tabel " + (tableEntries.length + 1) + " · " + label;
    tableEntries.push([id, caption]);
    const table = reportTable(["Butir daftar simak", "Ringkasan hasil", "Dasar aturan atau acuan teknis"],
      rows.map(({ item, summary }) => [reportJump("report-check-" + item.id, item.group.code + " · " + item.title),
        checklistSummary(item, checklist.checks[item.id], true), checklistReference(item.id, intensity.data.region === "tegal")]));
    for (const [i, row] of [...table.tBodies[0].rows].entries()) row.id = rows[i].id;
    section.append(dom("div", { id, className: "report-block" }, dom("p", { className: "caption" }, caption), table));
  }
  const attach = (section) => { sections.push(section); target.append(section); };
  for (const [key, label] of frontFields.slice(0, 2)) {
    if (!project.front[key]?.trim() && !(key === "approval" && project.front.signatory?.trim())) continue;
    const section = reportSection(label, "report-" + key);
    section.classList.add("front-doc");
    section.append(...reportParagraphs(project.front[key] || "", getTextFormat(project.front, key), resolveToken(project.frontLinks?.[key])));
    if (key === "approval") section.append(dom("div", { className: "report-signoff" },
      reportFormatted(dom("p"), project.front.location?.trim() || "[Tempat dan tanggal pengesahan]", getTextFormat(project.front, "location")),
      reportFormatted(dom("p"), project.front.role?.trim() || "Direktur", getTextFormat(project.front, "role")),
      dom("div", { className: "signature-space", ariaHidden: "true" }),
      reportFormatted(dom("p", { className: "signatory-name" }), project.front.signatory?.trim() || "[Nama Direktur]", getTextFormat(project.front, "signatory"))));
    attach(section);
  }
  attach(contents);
  for (const [index, chapter] of project.chapters.entries()) {
    const section = reportSection(chapterLabel(project, index), "report-chapter-" + index);
    if (getTextFormat(chapter, "title")) reportFormatted(section.firstElementChild, chapter.title, getTextFormat(chapter, "title"), "Bab " + roman(index + 1) + " · ");
    const headings = headingEntries(chapter, index);
    appendSummary(section, index + ":-1", "Hasil daftar simak terkait");
    for (const [bi, block] of chapter.blocks.entries()) {
      const id = section.id + "-block-" + bi;
      if (block.type === "heading") {
        const { number, nested } = headings.get(bi);
        if (block.text.trim()) section.append(reportFormatted(dom(nested ? "h4" : "h3", { id, className: "chapter-heading" }), block.text, getTextFormat(block, "text"), number + " "));
        section.append(...reportParagraphs(block.body, getTextFormat(block, "body"), resolveToken(block.links)));
        if (showIntensity && !intensityRendered && block.text === intensityHeading) appendIntensity(section);
        appendSummary(section, index + ":" + bi, "Daftar simak terkait · " + block.text);
      }
      if (block.type === "text") section.append(...reportParagraphs(block.text, getTextFormat(block, "text"), resolveToken(block.links)));
      if (block.type === "table") {
        const prefix = "Tabel " + (tableEntries.length + 1) + " · ";
        const title = block.text || "Tabel kajian";
        tableEntries.push([id, prefix + title]);
        const columns = block.headers.map((text, ci) => formattedValue(text, getTextFormat(block, "header:" + block.columnIds?.[ci]), resolveToken()));
        const rows = block.rows.map((row, ri) => row.map((_, ci) => {
          const key = tableCellKey(block, ri, ci);
          const source = sources.get(block.cellLinks?.[key]);
          const own = getTextFormat(block, "cell:" + key);
          const format = source?.format && own ? { base: { ...source.format.base, ...own.base }, block: own.block, runs: own.runs.length ? own.runs : source.format.runs } : own || source?.format;
          return formattedValue(tableCellValue(block, ri, ci, sources), format, resolveToken());
        }));
        section.append(dom("div", { id, className: "report-block" },
          reportFormatted(dom("p", { className: "caption" }), title, getTextFormat(block, "text"), prefix), reportTable(columns, rows)));
      }
      if (block.type === "photo" && imageSource.test(block.image || "")) {
        const prefix = "Gambar " + (figureEntries.length + 1) + " · ";
        const title = block.text || "Dokumentasi";
        figureEntries.push([id, prefix + title]);
        section.append(dom("figure", { id }, dom("img", { src: block.image, alt: block.text || "Dokumentasi kajian" }),
          reportFormatted(dom("figcaption"), title, getTextFormat(block, "text"), prefix)));
      }
    }
    if (chapter.checklist) checklistTargets.push(section);
    attach(section);
  }
  if (summaries.has("fallback") || (showIntensity && !intensityRendered)) {
    const section = reportSection("Ringkasan teknis", "report-technical-summary");
    if (showIntensity && !intensityRendered) appendIntensity(section);
    appendSummary(section, "fallback", "Hasil daftar simak terkait");
    attach(section);
  }
  if (!checklistTargets.length) {
    const section = reportSection("Lampiran · Daftar simak kajian", "report-checklist");
    checklistTargets.push(section);
    attach(section);
  }
  for (const [entries, label, id] of [[tableEntries, "Daftar tabel", "report-tables"], [figureEntries, "Daftar gambar", "report-figures"]]) {
    if (!entries.length) continue;
    const list = reportSection(label, id);
    list.append(dom("ul", { className: "contents-index" }, ...entries.map(([anchor, text]) =>
      dom("li", {}, contentsLink(anchor, text)))));
    contents.append(list);
    const firstChapter = sections.findIndex((section) => section.id.startsWith("report-chapter-"));
    sections.splice(firstChapter < 0 ? 0 : firstChapter, 0, list);
  }
  const toc = dom("ul", { className: "toc" }, ...sections.map((section) => {
    const entry = dom("li", {}, contentsLink(section.id, section.firstElementChild.textContent));
    const headings = [...section.querySelectorAll(".chapter-heading")];
    if (headings.length) entry.append(dom("ul", { className: "sub-outline" }, ...headings.map((heading) =>
      dom("li", { className: heading.tagName === "H4" ? "nested-outline" : "" },
        contentsLink(heading.id, heading.textContent)))));
    return entry;
  }));
  contents.firstElementChild.after(toc);
  await Promise.all(checklistTargets.map((section, index) => renderChecklist(section, project, urls, checklist, summaryAnchors, index === 0)));
  await Promise.all(Array.from(target.querySelectorAll("img"), (image) => image.decode().catch(() => {})));
}
