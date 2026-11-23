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

function reportParagraphs(text) {
  return text.split(/\n\s*\n/).filter((paragraph) => paragraph.trim())
    .map((paragraph) => dom("p", { className: "report-text" }, paragraph));
}

async function renderChecklist(target, project, urls, checklist) {
  const { checks } = checklist;
  const identity = { ...checklist.identity };
  for (const [key, value] of Object.entries({
    building: project.cover.building, location: project.cover.address,
    use: project.cover.use, ownerName: project.cover.owner,
  })) {
    if (!cleanValue(identity[key]) && cleanValue(value)) identity[key] = value;
  }
  const rows = Object.entries(checklistIdentityLabels).filter(([key]) => identity[key]?.trim())
    .map(([key, label]) => [label, identity[key]]);
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
        dom("table", {}, dom("thead", {}, dom("tr", {}, dom("th", {}, "Butir pemeriksaan"), dom("th", {}, "Hasil"))), body));
    }
    const check = checks[item.id];
    const result = dom("td");
    body.append(dom("tr", {}, dom("td", {}, [item.no, item.title].filter(Boolean).join(". ")), result));
    if (check?.na) {
      result.textContent = "Tidak berlaku";
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
        const definition = dom("dd", {}, row[key] + (key === "measurement" && item.unit ? " " + item.unit : ""));
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

async function buildReport(target, project, urls) {
  target.replaceChildren();
  const checklist = readChecklist(project.id);
  const sources = reportSources(project, checklist);
  const resolve = (text, links) => resolveReportText(text, sources, links);
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
    dom("h1", {}, title),
    dom("p", { className: "cover-building" }, data.building || project.name),
    dom("p", {}, data.address || data.city || ""));
  if (imageSource.test(data.image || "")) {
    cover.append(dom("img", { className: "cover-photo", src: data.image, alt: data.building || project.name }));
  }
  const coverDetails = coverFields.filter(([key]) => !["title", "building", "address"].includes(key) && data[key]?.trim());
  if (coverDetails.length) cover.append(reportTable(["Identitas laporan", "Keterangan"], coverDetails.map(([key, label]) => [label, data[key]])));
  target.append(cover);
  const contents = reportSection("Daftar isi", "report-contents");
  const sections = [];
  const tableEntries = [];
  const figureEntries = [];
  const checklistTargets = [];
  const attach = (section) => { sections.push(section); target.append(section); };
  for (const [key, label] of frontFields.slice(0, 2)) {
    if (!project.front[key]?.trim() && !(key === "approval" && project.front.signatory?.trim())) continue;
    const section = reportSection(label, "report-" + key);
    section.classList.add("front-doc");
    section.append(...reportParagraphs(resolve(project.front[key] || "", project.frontLinks?.[key])));
    if (key === "approval") section.append(dom("div", { className: "report-signoff" },
      dom("p", {}, project.front.location?.trim() || "[Tempat dan tanggal pengesahan]"),
      dom("p", {}, project.front.role?.trim() || "Direktur"),
      dom("div", { className: "signature-space", ariaHidden: "true" }),
      dom("p", { className: "signatory-name" }, project.front.signatory?.trim() || "[Nama Direktur]")));
    attach(section);
  }
  attach(contents);
  for (const [index, chapter] of project.chapters.entries()) {
    const section = reportSection(chapterLabel(project, index), "report-chapter-" + index);
    const headings = headingEntries(chapter, index);
    for (const [bi, block] of chapter.blocks.entries()) {
      const id = section.id + "-block-" + bi;
      if (block.type === "heading") {
        const { number, nested } = headings.get(bi);
        if (block.text.trim()) section.append(dom(nested ? "h4" : "h3", { id, className: "chapter-heading" }, number + " " + block.text));
        section.append(...reportParagraphs(resolve(block.body, block.links)));
      }
      if (block.type === "text") section.append(...reportParagraphs(resolve(block.text, block.links)));
      if (block.type === "table") {
        const label = "Tabel " + (tableEntries.length + 1) + " · " + (block.text || "Tabel kajian");
        tableEntries.push([id, label]);
        section.append(dom("div", { id, className: "report-block" }, dom("p", { className: "caption" }, label),
          reportTable(block.headers.map((text) => resolve(text)), block.rows.map((row) => row.map((text) => resolve(text))))));
      }
      if (block.type === "photo" && imageSource.test(block.image || "")) {
        const label = "Gambar " + (figureEntries.length + 1) + " · " + (block.text || "Dokumentasi");
        figureEntries.push([id, label]);
        section.append(dom("figure", { id }, dom("img", { src: block.image, alt: block.text || "Dokumentasi kajian" }),
          dom("figcaption", {}, label)));
      }
    }
    if (chapter.checklist) checklistTargets.push(section);
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
  await Promise.all(checklistTargets.map((section) => renderChecklist(section, project, urls, checklist)));
  await Promise.all(Array.from(target.querySelectorAll("img"), (image) => image.decode().catch(() => {})));
}
