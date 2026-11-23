"use strict";

const byId = (id) => document.getElementById(id);
const projectId = new URLSearchParams(location.search).get("proyek");
const tegalReference = new URLSearchParams(location.search).get("acuan") === "tegal";
const projectMode = /^[a-zA-Z0-9-]{1,64}$/.test(projectId ?? "");
const storageKey = "daftar-simak-slf:v2" + (projectMode ? ":" + projectId : "");
const photoKey = (key) => projectMode ? projectId + ":" + key : key;
if (projectMode) {
  document.getElementById("project-editor").href = "./index.html?proyek=" + encodeURIComponent(projectId);
  if (new URLSearchParams(location.search).has("embed")) document.body.classList.add("embedded-checklist");
}
const legacyKey = "daftar-simak-slf:v1";
const yesNo = ["Ya", "Tidak"];
const existence = ["Ada", "Tidak ada"];
const damage = ["Tidak rusak", "Rusak ringan", "Rusak sedang", "Rusak berat"];
const available = ["Tersedia", "Tidak tersedia"];
const conformity = ["Sesuai", "Tidak sesuai"];
const ownerFields = [
  ["ownerNameStatus", "Ketersediaan nama pemilik", existence],
  ["ownerName", "Nama pemilik"],
  ["ownerAddressStatus", "Ketersediaan alamat pemilik", existence],
  ["ownerAddress", "Alamat pemilik"],
];
const conditionFields = [
  ["deformation", "Miring / deformasi", yesNo],
  ["damage", "Terdapat kerusakan", yesNo],
  ["severity", "Tingkat kerusakan", damage.slice(1)],
  ["inUse", "Bangunan dimanfaatkan", yesNo],
  ["maintained", "Bangunan terawat dengan baik", yesNo],
];
const buildingFields = [
  ["building", "Nama bangunan"],
  ["location", "Lokasi"],
  ["use", "Fungsi bangunan"],
  ["date", "Tanggal pemeriksaan", "date"],
];
const fields = {
  V: ["observation", "Pengamatan visual", "long"],
  D: ["damage", "Kondisi visual / kerusakan", damage],
  A: ["presence", "Keberadaan", existence],
  T: ["presence", "Ketersediaan", available],
  M: ["measurement", "Hasil pengukuran"],
  C: ["conformity", "Kesesuaian dengan rencana teknis dan gambar terbangun", conformity],
  E: ["conformity", "Kesesuaian dengan rencana teknis dan gambar terbangun", "long"],
  N: ["ndt", "Hasil pengujian peralatan non-destruktif", "long"],
  U: ["test", "Hasil pengetesan / pengujian jika diperlukan", "long"],
  G: ["view", "Hasil pengamatan", ["Tidak mengganggu", "Mengganggu"]],
  K: ["note", "Keterangan kondisi faktual", "long"],
};
const periodFields = [
  ["component", "Komponen bangunan gedung"],
  ["routine", "Rutin"],
  ["periodic", "Berkala"],
  ["unscheduled", "Tidak terjadwal"],
];
const nonconformity = ["nonconformity", "Uraian ketidaksesuaian", "long"];
const disruption = ["disruption", "Uraian gangguan", "long"];
const checklistExamples = {
  ownerName: "PT Pengelola Gedung Contoh",
  ownerAddress: "Jl. Melati No. 10, Kota Contoh",
  building: "Gedung Pelayanan Utama",
  use: "pelayanan kesehatan rawat jalan",
  location: "lantai 1, koridor timur, titik P-01",
  observation: "cat permukaan mengelupas pada dinding koridor timur",
  measurement: "90 cm, diukur pada titik yang dicatat",
  direction: "membuka ke arah koridor",
  conformity: "bandingkan kondisi aktual dengan gambar rujukan yang diperiksa",
  nonconformity: "lebar bukaan berbeda dari gambar A-03, lihat lembar ukur",
  ndt: "nomor laporan uji, lokasi titik uji, dan ringkasan hasil aktual",
  test: "fungsi diperiksa pada titik P-01, hasil dicatat di lembar uji",
  disruption: "sirkulasi terganggu oleh barang di depan pintu servis",
  note: "lihat Foto 2.3. Bagian di atas plafon belum dapat diakses",
  component: "saluran drainase sisi timur",
  routine: "pembersihan rutin sesuai catatan pemeliharaan",
  periodic: "pemeriksaan berkala sesuai jadwal dan buku log",
  unscheduled: "pembersihan tambahan setelah terjadi genangan, jika tercatat",
};
const categories = [];
const items = [];
let idb;
let photoWrites = 0;
let simakPrintReady = false;
let simakPhotoUrls = [];

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

const previous = projectMode ? null : load(legacyKey);
let state = load(storageKey) ?? { identity: { ...previous?.building }, checks: {} };

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    byId("save-status").textContent = "Tersimpan di browser ini";
  } catch {
    byId("save-status").textContent = "Penyimpanan browser gagal";
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function button(text, action) {
  const node = el("button", "", text);
  node.type = "button";
  node.addEventListener("click", action);
  return node;
}

function field([key, title, type], data, onChange, context, item) {
  const label = el("label", "", title);
  label.classList.toggle("has-value", Boolean(data[key]?.trim()));
  const output = el("span", "print-value", data[key] || "–");
  let control;
  if (Array.isArray(type)) {
    control = el("select");
    control.add(new Option("Pilih", ""));
    for (const option of type) control.add(new Option(option, option));
  } else if (type === "long") {
    control = el("textarea");
    control.rows = 2;
    label.classList.add("wide");
  } else {
    control = el("input");
    control.type = type || "text";
  }
  control.setAttribute("aria-label", context ? title + " — " + context : title);
  if (!Array.isArray(type) && type !== "date" && Object.hasOwn(checklistExamples, key)) {
    const example = key === "measurement" && item?.unit ? "masukkan angka hasil ukur dalam " + item.unit :
      key === "location" && !item ? "Jl. Melati No. 10, Kota Contoh" :
      title === "Nama bangunan pembanding" ? "gedung servis di sisi timur" : checklistExamples[key];
    control.placeholder = "Contoh: " + example;
  }
  control.value = data[key] || "";
  const refreshOutput = () => {
    const format = getTextFormat(data, key);
    output.removeAttribute("style");
    styleTextBlock(output, format);
    output.replaceChildren(formattedText(control.value || "–", format));
  };
  const changed = () => { refreshOutput(); onChange(); };
  control.addEventListener("input", () => {
    data[key] = control.value;
    label.classList.toggle("has-value", Boolean(control.value.trim()));
    changed();
  });
  label.append(control, output);
  refreshOutput();
  const editableText = (control.tagName === "TEXTAREA" || control.type === "text") &&
    key !== "measurement";
  return { label: editableText ? textFormatControl(label, control, data, key, changed) : label, control };
}

function renderIdentity() {
  for (const [id, definitions] of [
    ["owner-fields", ownerFields], ["condition-fields", conditionFields], ["building-fields", buildingFields],
  ]) {
    const wrapper = byId(id);
    wrapper.replaceChildren();
    for (const definition of definitions) {
      wrapper.append(field(definition, state.identity, save).label);
    }
  }
}

function startRows(item) {
  return (item.components || item.samples || [item.fields.includes("S") ? "Sampel 1" : ""])
    .map((label, index) => ({ key: String(index + 1), label }));
}

function getCheck(item) {
  return state.checks[item.id] ?? { rows: startRows(item), nextRow: item.initialCount + 1 };
}

function applyCheck(item, check) {
  state.checks[item.id] = check;
  save();
  refresh();
}

function hasData(row) {
  return Object.entries(row).some(([key, value]) => !["key", "label"].includes(key) && typeof value === "string" && Boolean(value.trim()));
}

function flags(check) {
  const filled = check.rows.some(hasData);
  const issue = !check.na && check.rows.some((row) =>
    row.conformity === "Tidak sesuai" || damage.slice(1).includes(row.damage) || row.view === "Mengganggu");
  return { filled, issue, na: Boolean(check.na) };
}

function refresh() {
  let checked = 0;
  let issues = 0;
  let visible = 0;
  const term = byId("search").value.trim().toLocaleLowerCase("id");
  const category = byId("category").value;
  const filter = byId("status-filter").value;
  for (const section of categories) {
    let sectionCount = 0;
    for (const group of section.groups) {
      let groupCount = 0;
      for (const item of group.items) {
        const check = state.checks[item.id];
        const { filled, issue, na } = check ? flags(check) : { filled: false, issue: false, na: false };
        const status = na ? "na" : issue ? "issue" : filled ? "filled" : "empty";
        const labels = { na: "Tidak berlaku", issue: "Ada temuan", filled: "Sudah diisi", empty: "Belum diisi" };
        item.badge.textContent = labels[status];
        item.badge.dataset.state = status;
        item.node.classList.toggle("has-data", filled && !na);
        const matchesFilter = filter === "" || filter === status || (filter === "filled" && filled && !na);
        item.node.hidden = !matchesFilter || (category !== "" && category !== section.code) || !item.search.includes(term);
        if (filled || na) checked++;
        if (issue) issues++;
        if (!item.node.hidden) groupCount++;
      }
      group.node.hidden = groupCount === 0;
      sectionCount += groupCount;
    }
    section.node.hidden = sectionCount === 0;
    visible += sectionCount;
  }
  const percent = Math.round(checked / items.length * 100);
  byId("percent").textContent = percent + "%";
  byId("progress").value = percent;
  byId("count").textContent = checked + " dari " + items.length + " butir ditinjau";
  byId("findings").textContent = issues + " butir dengan temuan";
  byId("result-count").textContent = visible ? visible + " butir ditampilkan" : "Tidak ada butir yang cocok dengan filter.";
}

function database() {
  if (!idb) {
    idb = new Promise((resolve, reject) => {
      const request = indexedDB.open("daftar-simak-slf", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("photos");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return idb;
}

async function photoStore(operation, key, value) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("photos", operation === "get" ? "readonly" : "readwrite");
    const store = tx.objectStore("photos");
    const request = operation === "put" ? store.put(value, photoKey(key)) : store[operation](photoKey(key));
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = () => reject(tx.error);
  });
}

function attachPhoto(item, row, onChange, labelText, property = "photo") {
  const wrapper = el("div", "photo-field wide");
  wrapper.classList.toggle("has-value", Boolean(row[property]));
  const label = el("label", "", labelText);
  const input = el("input");
  input.type = "file";
  input.accept = "image/*";
  const feedback = el("span", "photo-feedback", row[property] || "");
  feedback.setAttribute("role", "status");
  const preview = el("img", "photo-preview");
  preview.alt = labelText + " — " + item.title;
  preview.hidden = true;
  const key = item.id + ":" + row.key + ":" + property;
  let objectUrl;
  let version = 0;

  function show(file) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = file ? URL.createObjectURL(file) : undefined;
    preview.hidden = !objectUrl;
    if (objectUrl) preview.src = objectUrl;
    else preview.removeAttribute("src");
  }

  const remove = button("Hapus foto", () => changePhoto(null));
  remove.hidden = !row[property];

  async function changePhoto(file) {
    version++;
    photoWrites++;
    input.disabled = remove.disabled = true;
    try {
      await photoStore(file ? "put" : "delete", key, file);
      row[property] = file?.name || "";
      wrapper.classList.toggle("has-value", Boolean(file));
      feedback.textContent = row[property];
      remove.hidden = !file;
      show(file);
      onChange();
    } catch {
      feedback.textContent = "Foto gagal disimpan di browser. Coba lagi.";
    } finally {
      photoWrites--;
      input.disabled = remove.disabled = false;
      input.value = "";
    }
  }

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (file) changePhoto(file);
  });
  if (row[property]) {
    wrapper.photoReady = photoStore("get", key).then(async (file) => {
      if (file && !version && wrapper.isConnected) {
        show(file);
        await preview.decode();
      }
    }).catch(() => { feedback.textContent = "Foto gagal dibuka."; });
  }
  wrapper.dispose = () => show(null);
  label.append(input);
  wrapper.append(label, feedback, remove, preview);
  return wrapper;
}

function definitionsFor(item) {
  if (item.fields.includes("P")) return periodFields;
  const definitions = [];
  for (const code of "VDATMCENUGK") {
    if (!item.fields.includes(code)) continue;
    if (code === "M" && item.category.code === "K.5") {
      definitions.push(["measurement", "Dimensi"], ["direction", "Arah bukaan"]);
    } else if (code === "M" && item.unit) {
      definitions.push(["measurement", "Hasil pengukuran (" + item.unit + ")"]);
    } else if (code === "U" && item.group.code === "K.2.1" && item.fields.includes("N")) {
      definitions.push(["test", "Hasil pengujian kekuatan dan material jika diperlukan", "long"]);
    } else {
      definitions.push(fields[code]);
    }
    if (code === "C") definitions.push(nonconformity);
    if (code === "G") definitions.push(disruption);
  }
  return definitions;
}

function photosFor(item) {
  if (!item.fields.includes("F")) return [];
  if (item.fields.includes("N")) {
    return [["ndtPhoto", "Foto hasil pengujian non-destruktif"], ["photo", "Foto hasil pengujian kekuatan dan material"]];
  }
  return [["photo", item.fields.includes("U") ? "Foto hasil pengetesan / pengujian" : "Foto hasil pemeriksaan"]];
}

function renderItem(item) {
  for (const element of item.body.querySelectorAll(".photo-field")) element.dispose();
  item.body.replaceChildren();
  const check = getCheck(item);
  const change = () => applyCheck(item, check);
  const na = el("input");
  na.type = "checkbox";
  na.checked = Boolean(check.na);
  const availability = el("label", "applicable");
  availability.append(na, "Butir ini tidak berlaku");
  const reference = el("p", "inspection-reference", "Acuan: " + checklistReference(item.id, tegalReference));
  const naData = importTextFormats({ reason: check.na ? checklistReason(check) : check.reason }, check, ["reason"]);
  const reason = field(["reason", "Alasan tidak berlaku", "long"], naData, () => {
    check.reason = naData.reason;
    setTextFormat(check, "reason", getTextFormat(naData, "reason"));
    change();
  }, item.title, item).label;
  const rows = el("div", "sample-list");
  const repeatable = item.fields.includes("S") || item.fields.includes("P");
  const add = repeatable ? button(item.fields.includes("P") ? "Tambah komponen" : "Tambah sampel", () => {
    if (photoWrites) return;
    const key = String(check.nextRow++);
    check.rows.push({ key, label: item.fields.includes("P") ? key : (item.sampleTitle || "Sampel") + " " + key });
    change();
    renderItem(item);
    focusTextField(item.body.querySelector(".sample:last-child input, .sample:last-child select"));
  }) : null;
  const setAvailability = () => {
    rows.hidden = na.checked;
    reason.hidden = !na.checked;
    if (add) add.hidden = na.checked;
  };
  na.addEventListener("input", () => {
    check.na = na.checked;
    setAvailability();
    change();
  });
  item.body.append(reference, availability, reason, rows);
  if (add) item.body.append(add);
  setAvailability();

  for (const row of check.rows) {
    const sample = el("section", "sample");
    const group = el("div", "form-grid");
    sample.classList.toggle("has-data", hasData(row));
    const onRowChange = () => {
      sample.classList.toggle("has-data", hasData(row));
      change();
    };
    const context = [item.title, row.label].filter(Boolean).join(", ");
    if (row.label) sample.append(el("h4", "", row.label));
    if (repeatable && !item.fields.includes("P") && item.title !== "Jarak Antar Bangunan") {
      group.append(field(["location", "Lokasi atau identitas sampel"], row, onRowChange, context, item).label);
    }
    if (item.title === "Jarak Antar Bangunan" && Number(row.key) > 3) {
      group.append(field(["location", "Nama bangunan pembanding"], row, onRowChange, context, item).label);
    }
    for (const definition of definitionsFor(item)) group.append(field(definition, row, onRowChange, context, item).label);
    for (const [property, label] of photosFor(item)) group.append(attachPhoto(item, row, onRowChange, label, property));
    sample.append(group);
    if (Number(row.key) > item.initialCount) {
      const remove = button("Hapus " + (item.fields.includes("P") ? "komponen" : "sampel"), async () => {
        if (photoWrites || (hasData(row) && !window.confirm("Hapus baris beserta semua isian dan fotonya?"))) return;
        try {
          for (const [property] of photosFor(item)) {
            if (row[property]) await photoStore("delete", item.id + ":" + row.key + ":" + property);
          }
          check.rows = check.rows.filter((entry) => entry !== row);
          change();
          renderItem(item);
        } catch {
          byId("save-status").textContent = "Foto sampel gagal dihapus";
        }
      });
      remove.className = "remove-sample";
      sample.append(remove);
    }
    rows.append(sample);
  }
}

function renderCatalog() {
  for (const source of catalog) {
    const section = { ...source, groups: [], node: el("section", "catalog-section") };
    section.node.id = "bagian-" + source.code.replace(".", "");
    const title = source.code + " " + source.title;
    section.node.append(el("h3", "catalog-title", title));
    byId("category").add(new Option(title, source.code));
    const link = el("a", "", title);
    link.href = "#" + section.node.id;
    link.addEventListener("click", () => {
      byId("category").value = "";
      byId("status-filter").value = "";
      byId("search").value = "";
      refresh();
    });
    byId("category-nav").append(link);
    for (const [groupIndex, sourceGroup] of source.groups.entries()) {
      const group = { ...sourceGroup, items: [], node: el("details", "group") };
      group.node.open = true;
      group.node.append(el("summary", "", sourceGroup.code + " " + sourceGroup.title));
      for (const [itemIndex, sourceItem] of sourceGroup.items.entries()) {
        const item = { ...sourceItem, category: section, group, id: source.code + "-" + groupIndex + "-" + itemIndex };
        item.initialCount = startRows(item).length;
        item.search = [sourceItem.title, sourceGroup.code, sourceGroup.title, title, ...(sourceItem.components || [])].join(" ").toLocaleLowerCase("id");
        item.node = el("details", "item");
        item.node.id = "butir-" + item.id;
        const summary = el("summary", "item-summary");
        item.badge = el("span", "item-status");
        const name = el("span", "item-title", [item.no, item.title].filter(Boolean).join(". "));
        summary.append(name, item.badge);
        item.body = el("div", "item-body");
        item.node.append(summary, item.body);
        summary.addEventListener("click", () => {
          if (!item.body.hasChildNodes()) renderItem(item);
        });
        item.node.addEventListener("toggle", () => {
          if (item.node.open && !item.body.hasChildNodes()) renderItem(item);
        });
        group.node.append(item.node);
        group.items.push(item);
        items.push(item);
      }
      section.node.append(group.node);
      section.groups.push(group);
    }
    byId("groups").append(section.node);
    categories.push(section);
  }
}

function csvCell(value) {
  const text = String(value ?? "");
  const safe = /^[\t\r\n]|^\s*[=+\-@]/u.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}

function downloadCsv(filename, lines) {
  const blob = new Blob(["\uFEFF", lines.map((line) => line.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = el("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCsv() {
  const identity = [...ownerFields, ...conditionFields, ...buildingFields];
  const rowFields = [
    ["location", "Lokasi atau identitas sampel"],
    ...Object.values(fields),
    nonconformity, disruption, ["direction", "Arah bukaan"], ...periodFields,
    ["ndtPhoto", "Nama foto pengujian non-destruktif"], ["photo", "Nama foto"],
  ];
  const uniqueFields = [...new Map(rowFields.map((definition) => [definition[0], definition])).values()];
  const lines = [
    [...identity.map(([, label]) => label), "Kategori", "Bagian", "Nomor", "Butir atau komponen", "Halaman PDF", "Sampel", "Tidak berlaku", ...uniqueFields.map(([, label]) => label), "Alasan tidak berlaku", "Acuan pemeriksaan"],
    ...items.flatMap((item) => {
      const check = getCheck(item);
      return check.rows.map((row) => [
        ...identity.map(([key]) => state.identity[key]),
        item.category.title, item.group.code + " " + item.group.title, item.no, item.title, item.page, row.label,
        check.na ? "Ya" : "",
        ...uniqueFields.map(([key]) => check.na ? "" : row[key]),
        check.na ? checklistReason(check) : "", checklistReference(item.id, tegalReference),
      ]);
    }),
  ];
  downloadCsv("daftar-simak-slf.csv", lines);
}

function toggleGroups() {
  const groups = categories.flatMap((category) => category.groups).filter((group) => !group.node.hidden);
  const expand = groups.some((group) => !group.node.open);
  for (const group of groups) group.node.open = expand;
  byId("toggle-groups").textContent = expand ? "Ciutkan bagian" : "Buka bagian";
}

renderCatalog();
const requestedItem = items.find((item) => "#" + item.node.id === location.hash);
if (requestedItem) {
  requestedItem.node.open = true;
  requestAnimationFrame(() => requestedItem.node.scrollIntoView({ block: "start" }));
}
renderIdentity();
refresh();
byId("search").addEventListener("input", refresh);
byId("category").addEventListener("change", refresh);
byId("status-filter").addEventListener("change", refresh);
byId("export").addEventListener("click", exportCsv);
byId("toggle-groups").addEventListener("click", toggleGroups);
const simakDialog = byId("simak-print-dialog");
const simakPaper = byId("simak-paper");
document.head.append(dom("style", { textContent: simakFormStyle }));

function clearSimakPaper() {
  simakPrintReady = false;
  simakPaper.replaceChildren();
  simakPhotoUrls.forEach((url) => URL.revokeObjectURL(url));
  simakPhotoUrls = [];
}

async function prepareSimakPaper() {
  clearSimakPaper();
  const urls = simakPhotoUrls;
  const draft = dom("div");
  simakPaper.append(draft);
  await renderSimakForm(draft, structuredClone(state), {
    tegal: tegalReference, photoUrls: urls, loadPhoto: (key) => photoStore("get", key),
  });
  if (urls !== simakPhotoUrls) {
    urls.forEach((url) => URL.revokeObjectURL(url));
    return;
  }
  simakPrintReady = true;
}

async function showSimakPaper(print) {
  const controls = [byId("simak-preview"), byId("print")];
  controls.forEach((button) => { button.disabled = true; });
  try {
    await prepareSimakPaper();
    simakDialog.showModal();
    if (print) window.print();
  } catch {
    byId("save-status").textContent = "Pratinjau formulir gagal disiapkan.";
  } finally {
    controls.forEach((button) => { button.disabled = false; });
  }
}
byId("simak-preview").addEventListener("click", () => showSimakPaper(false));
byId("print").addEventListener("click", () => showSimakPaper(true));
byId("simak-print-preview").addEventListener("click", () => window.print());
byId("simak-close").addEventListener("click", () => simakDialog.close());
simakDialog.addEventListener("close", clearSimakPaper);
window.addEventListener("beforeprint", () => { if (!simakPrintReady) prepareSimakPaper().catch(() => {}); });
window.addEventListener("afterprint", () => { if (!simakDialog.open) clearSimakPaper(); });
byId("legacy-export").hidden = !Object.keys(previous?.checks ?? {}).length;
byId("legacy-export").addEventListener("click", () => {
  const labels = { pending: "Belum diperiksa", ok: "Sesuai", issue: "Perlu tindak lanjut", na: "Tidak berlaku" };
  const legacyTitles = {
    permit: "Dokumen PBG atau IMB", drawings: "Gambar kondisi terbangun", report: "Dokumen pemeriksaan atau pengujian",
    structure: "Kondisi elemen struktur", fire: "Sarana proteksi kebakaran", egress: "Jalur evakuasi dan pintu keluar",
    electrical: "Kondisi instalasi dan panel listrik", ventilation: "Ventilasi dan pertukaran udara",
    water: "Air bersih dan sanitasi", waste: "Air limbah dan drainase", light: "Pencahayaan ruang",
    thermal: "Suhu dan kelembapan ruang", noise: "Kebisingan dan getaran", entrance: "Akses masuk dan sirkulasi",
    access: "Fasilitas akses pengguna disabilitas", signs: "Penunjuk arah dan informasi fasilitas",
  };
  downloadCsv("daftar-simak-slf-versi-awal.csv", [
    [...buildingFields.map(([, label]) => label), "Butir", "Status", "Catatan"],
    ...Object.entries(previous.checks).map(([key, row]) => [
      ...buildingFields.map(([id]) => previous.building[id]), legacyTitles[key] || key, labels[row.status], row.note,
    ]),
  ]);
});
byId("reset").addEventListener("click", async () => {
  if (photoWrites || !window.confirm("Hapus identitas, hasil pemeriksaan, dan foto untuk formulir ini dari browser?")) return;
  try {
    if (Object.values(state.checks).some((check) => check.rows.some((row) => row.photo || row.ndtPhoto))) {
      for (const [id, check] of Object.entries(state.checks)) {
        for (const row of check.rows) {
          for (const property of ["photo", "ndtPhoto"]) {
            if (row[property]) await photoStore("delete", id + ":" + row.key + ":" + property);
          }
        }
      }
    }
    state = { identity: {}, checks: {} };
    for (const item of items) {
      for (const photo of item.body.querySelectorAll(".photo-field")) photo.dispose();
      item.body.replaceChildren();
      item.node.open = false;
    }
    for (const id of ["search", "category", "status-filter"]) byId(id).value = "";
    renderIdentity();
    save();
    refresh();
  } catch {
    byId("save-status").textContent = "Data gagal dihapus";
  }
});
