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

function readChecklist(id, owner = slfCloudOwner()) {
  const trial = globalThis.slfTrialData?.(id);
  if (trial) return trial.checklist;
  try {
    return JSON.parse(localStorage.getItem(slfChecklistKey(id, owner))) ?? { identity: {}, checks: {} };
  } catch {
    return { identity: {}, checks: {} };
  }
}

const checklistItems = catalog.flatMap((category) => category.groups.flatMap((group, gi) =>
  group.items.map((item, ii) => ({ ...item, group, category, id: category.code + "-" + gi + "-" + ii }))));
const trialChapterCount = 2;
const trialChecklistItems = checklistItems.slice(0, Math.floor(checklistItems.length / 4));
const trialChecklistIds = new Set(trialChecklistItems.map(({ id }) => id));
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

function checklistPhoto(id, key, blob, owner = slfCloudOwner()) {
  photoDatabase ??= openStore("daftar-simak-slf", "photos");
  return storeValue(photoDatabase, "photos", slfPhotoKey(id, key, owner), blob);
}

async function storeChecklistPhotos(id, files, owner) {
  const entries = Object.entries(files);
  if (!entries.length) return;
  photoDatabase ??= openStore("daftar-simak-slf", "photos");
  const db = await photoDatabase;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    const store = tx.objectStore("photos");
    for (const [key, blob] of entries) store.put(blob, slfPhotoKey(id, key, owner));
    tx.oncomplete = resolve;
    tx.onabort = () => reject(tx.error);
  });
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

function effectiveChecklistIdentity(cover = {}, stored = {}) {
  const identity = structuredClone(stored);
  for (const [key, coverKey] of Object.entries({ building: "building", location: "address", use: "use", ownerName: "owner" })) {
    const current = identity[key]?.trim();
    const fallback = cover[coverKey]?.trim();
    if ((!current || /^\[[^\[\]]+\]$/.test(current)) && fallback && !/^\[[^\[\]]+\]$/.test(fallback)) {
      identity[key] = cover[coverKey];
      setTextFormat(identity, key, getTextFormat(cover, coverKey));
    }
  }
  return identity;
}

async function renderChecklist(target, project, urls, checklist, summaryAnchors, primary, items) {
  const identity = effectiveChecklistIdentity(project.cover, checklist.identity);
  await renderSimakForm(target, { identity, checks: checklist.checks }, {
    tegal: project.intensity?.region === "tegal",
    anchors: primary, summaryAnchors, photoUrls: urls, items, figurePrefix: target.id,
    loadPhoto: items === trialChecklistItems ? undefined : (key) => checklistPhoto(project.id, key),
  });
}

function reportJump(id, label) {
  const link = dom("a", { href: "#" + id }, label);
  link.dataset.reportJump = id;
  return link;
}

function approvalSignoff(project) {
  const front = project.front;
  const individual = isIndividualConsultant(project);
  const signoff = dom("div", { className: "report-signoff" },
    reportFormatted(dom("p"), front.location?.trim() || "[Tempat dan tanggal pengesahan]", getTextFormat(front, "location")));
  if (individual) {
    signoff.append(dom("p", {}, "Pengkaji Teknis Perorangan"));
  } else {
    signoff.append(
      reportFormatted(dom("p"), project.cover.consultant?.trim() || "[Nama perusahaan pengkaji]", getTextFormat(project.cover, "consultant")),
      dom("p", {}, "Selaku Pengkaji Teknis"),
    );
  }
  const key = individual ? "individualName" : "signatory";
  signoff.append(dom("div", { className: "signature-space", ariaHidden: "true" }),
    reportFormatted(dom("p", { className: "signatory-name" }), front[key]?.trim() ||
      (individual ? "[Nama pengkaji teknis]" : "[Nama penandatangan]"), getTextFormat(front, key)));
  if (!individual) signoff.append(reportFormatted(dom("p"), front.role?.trim() || "Direktur", getTextFormat(front, "role")));
  return signoff;
}

async function buildReport(target, project, urls, { trial = false } = {}) {
  target.replaceChildren();
  const items = trial ? trialChecklistItems : checklistItems;
  if (trial) project = { ...project, chapters: project.chapters.slice(0, trialChapterCount) };
  const checklist = readChecklist(project.id);
  const sources = reportSources(project, checklist);
  const resolveToken = (links) => (original, name) => resolveReportLink(original, name, sources, links);
  const coverFormat = (key, token) => key === "consultant" ? sources.get("cover:consultant")?.format :
    getTextFormat(project.cover, key) || (token ? sources.get(automaticSource(token, sources))?.format : undefined);
  const data = {
    ...project.cover,
    building: automaticValue("nama bangunan", sources) || project.cover.building,
    address: automaticValue("alamat bangunan", sources) || project.cover.address,
    use: automaticValue("fungsi bangunan", sources) || project.cover.use,
    owner: automaticValue("nama pemilik", sources) || project.cover.owner,
    consultant: sources.get("cover:consultant")?.value,
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
  if (trial) cover.append(dom("p", { className: "paper-kicker" }, "Versi coba · " + items.length +
    " dari " + checklistItems.length + " butir Daftar Simak"));
  target.append(cover);
  const contents = reportSection("Daftar isi", "report-contents");
  const sections = [];
  const tableEntries = [];
  const checklistTargets = [];
  function appendPhotos(section, entries) {
    const photos = entries.filter(([photo]) => imageSource.test(photo.image || ""));
    for (let index = 0; index < photos.length; index += 2) {
      const row = photos.slice(index, index + 2);
      section.append(dom("div", { className: "report-photo-row" }, ...row.map(([photo, id]) => {
        const title = photo.text?.trim() || "Dokumentasi";
        const figure = dom("figure", { id, className: "report-photo" },
          dom("img", { src: photo.image, alt: title }),
          reportFormatted(dom("figcaption"), title, getTextFormat(photo, "text")));
        figure.dataset.reportFigure = "";
        return figure;
      })));
    }
  }
  const summaryAnchors = new Map();
  const summaries = new Map();
  for (const item of items) {
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
  const showIntensity = Boolean(intensity.data.land.trim() || intensity.data.region || intensity.data.diagram || intensity.data.additional.some((entry) => entry.name.trim()) ||
    intensity.metrics.some((metric) => metric.measurement.value !== null || metric.measurement.error));
  const intensityTarget = intensityDestination(project);
  let intensityRendered = false;
  function appendIntensity(section) {
    intensityRendered = true;
    const id = "report-intensity-results";
    const label = "Tabel " + (tableEntries.length + 1) + " · Perbandingan intensitas, sempadan, dan parameter tambahan";
    tableEntries.push([id, label]);
    section.append(dom("div", { id, className: "report-block" }, dom("p", { className: "caption" }, label),
      intensityTable(intensity)));
    if (intensity.data.diagram) {
      const figure = siteDiagram();
      figure.id = "report-site-diagram";
      figure.dataset.reportFigure = "";
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
    const signatoryKey = isIndividualConsultant(project) ? "individualName" : "signatory";
    if (!project.front[key]?.trim() && !(key === "approval" && project.front[signatoryKey]?.trim())) continue;
    const section = reportSection(label, "report-" + key);
    section.classList.add("front-doc");
    section.append(...reportParagraphs(project.front[key] || "", getTextFormat(project.front, key), resolveToken(project.frontLinks?.[key])));
    if (key === "approval") section.append(approvalSignoff(project));
    attach(section);
  }
  attach(contents);
  for (const [index, chapter] of project.chapters.entries()) {
    const section = reportSection(chapterLabel(project, index), "report-chapter-" + index);
    if (getTextFormat(chapter, "title")) reportFormatted(section.firstElementChild, chapter.title, getTextFormat(chapter, "title"), "Bab " + roman(index + 1) + " · ");
    section.dataset.chapterNumber = String(index + 1);
    appendPhotos(section, (chapter.photos ?? []).map((photo, i) => [photo, section.id + "-photo-" + i]));
    const headings = headingEntries(chapter, index);
    appendSummary(section, index + ":-1", "Hasil daftar simak terkait");
    const pendingPhotos = [];
    for (const [bi, block] of chapter.blocks.entries()) {
      const id = section.id + "-block-" + bi;
      if (block.type === "photo") {
        if (block.image) pendingPhotos.push([block, id]);
        pendingPhotos.push(...(block.photos ?? []).map((photo, i) => [photo, id + "-photo-" + i]));
        continue;
      }
      if (pendingPhotos.length) appendPhotos(section, pendingPhotos.splice(0));
      if (block.type === "heading") {
        const { number, nested } = headings.get(bi);
        if (block.text.trim()) section.append(reportFormatted(dom(nested ? "h4" : "h3", { id, className: "chapter-heading" }), block.text, getTextFormat(block, "text"), number + " "));
        section.append(...reportParagraphs(block.body, getTextFormat(block, "body"), resolveToken(block.links)));
        appendPhotos(section, (block.photos ?? []).map((photo, i) => [photo, id + "-photo-" + i]));
        if (showIntensity && intensityTarget?.chapter === index && intensityTarget.block === bi) appendIntensity(section);
        appendSummary(section, index + ":" + bi, "Daftar simak terkait · " + block.text);
      }
      if (block.type === "text") section.append(...reportParagraphs(block.text, getTextFormat(block, "text"), resolveToken(block.links)));
      if (block.type === "table") {
        const prefix = "Tabel " + (tableEntries.length + 1) + " · ";
        const title = block.text || "Tabel kajian";
        tableEntries.push([id, prefix + title]);
        const columns = block.headers.map((text, ci) => formattedValue(text, getTextFormat(block, "header:" + block.columnIds?.[ci]), resolveToken()));
        const documentReview = isDocumentReviewTable(block);
        const rows = block.rows.flatMap((row, ri) => {
          const values = row.map((_, ci) => tableCellValue(block, ri, ci, sources));
          const image = block.rowImages?.[block.rowIds?.[ri]];
          const hasImage = imageSource.test(image || "");
          if (documentReview && !hasImage && !values.some((value) => value?.trim())) return [];
          return [values.map((text, ci) => {
            const key = tableCellKey(block, ri, ci);
            const source = sources.get(block.cellLinks?.[key]);
            const own = getTextFormat(block, "cell:" + key);
            const format = source?.format && own ? { base: { ...source.format.base, ...own.base }, block: own.block, runs: own.runs.length ? own.runs : source.format.runs } : own || source?.format;
            const value = formattedValue(text, format, resolveToken());
            return hasImage && ci === row.length - 1 ?
              dom("div", {}, value, dom("img", { className: "report-table-image", src: image, alt: "Gambar baris " + (ri + 1) })) : value;
          })];
        });
        section.append(dom("div", { id, className: "report-block" },
          reportFormatted(dom("p", { className: "caption" }), title, getTextFormat(block, "text"), prefix), reportTable(columns, rows)));
      }
    }
    if (pendingPhotos.length) appendPhotos(section, pendingPhotos);
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
    const section = reportSection(trial ? "Daftar simak kajian (25%)" : "Lampiran · Daftar simak kajian", "report-checklist");
    checklistTargets.push(section);
    attach(section);
  }
  await Promise.all(checklistTargets.map((section, index) => renderChecklist(section, project, urls, checklist, summaryAnchors, index === 0, items)));
  const figureEntries = sections.flatMap((section) => {
    const prefix = section.dataset.chapterNumber ? section.dataset.chapterNumber + "." :
      section.id === "report-checklist" ? "Lampiran " : "Ringkasan ";
    return [...section.querySelectorAll("[data-report-figure]")].map((figure, index) => {
      const caption = figure.lastElementChild;
      caption.prepend("Gambar " + prefix + (index + 1) + " ");
      return [figure.id, caption.textContent];
    });
  });
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
  await Promise.all(Array.from(target.querySelectorAll("img"), (image) => image.decode().catch(() => {})));
}
