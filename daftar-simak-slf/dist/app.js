"use strict";

const byId = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const projectId = params.get("proyek");
const tegalReference = params.get("acuan") === "tegal";
const trialMode = params.has("trial");
const trialData = trialMode ? (window.parent !== window ? window.parent.slfTrialData?.(projectId) : undefined)
  ?? { checklist: { identity: {}, checks: {} } } : undefined;
const projectMode = /^[a-zA-Z0-9-]{1,64}$/.test(projectId ?? "");
const cloudChecklist = !trialMode && projectMode && params.has("cloud");
const cloudOwner = cloudChecklist && window.parent !== window ? window.parent.slfCloudOwner?.() || "" : "";
if (cloudChecklist && !cloudOwner) {
  const query = new URLSearchParams({ proyek: projectId, bagian: "simak", butir: location.hash.slice(7) });
  location.replace("./index.html?" + query);
}
const storageKey = slfChecklistKey(projectMode ? projectId : "", cloudOwner);
const photoKey = (key) => slfPhotoKey(projectMode ? projectId : "", key, cloudOwner);
const slfChecklistWriting = () => photoWrites > 0;
globalThis.slfChecklistWriting = slfChecklistWriting;
if (projectMode) {
  document.getElementById("project-editor").href = "./index.html?proyek=" + encodeURIComponent(projectId);
  if (params.has("embed")) document.body.classList.add("embedded-checklist");
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
  floor: "lantai 1",
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

let savedProjectCover;
if (projectMode && !trialMode && !cloudChecklist && window.parent === window) {
  try {
    const drafts = await storeValue(openStore("ruang-kajian-slf", "workspace"), "workspace", "drafts");
    savedProjectCover = drafts?.projects.find(({ id }) => id === projectId)?.cover;
  } catch { /* The checklist can still be used without a saved cover. */ }
}
function projectCover() {
  return (projectMode && window.parent !== window ? window.parent.slfChecklistCover?.(projectId) : undefined) ?? savedProjectCover;
}

const previous = projectMode || trialMode ? null : load(legacyKey);
let state = (trialData ? structuredClone(trialData.checklist) : load(storageKey)) ?? { identity: { ...previous?.building }, checks: {} };

function save() {
  if (trialData) {
    trialData.checklist = structuredClone(state);
    byId("save-status").textContent = "";
    return;
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    byId("save-status").textContent = "";
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
    const example = key === "location" && item?.outdoorUse ? "area parkir di depan bangunan" :
      key === "observation" && item?.outdoorUse ? "area luar digunakan untuk parkir kendaraan" :
      key === "location" && item?.indoorUse ? "Gudang utama, lantai 1" :
      key === "observation" && item?.indoorUse ? "ruang digunakan untuk menyimpan barang dalam rak" :
      key === "observation" && item?.buildingUse ? "bangunan digunakan sebagai gudang penyimpanan" :
      key === "measurement" && item?.unit ? "masukkan angka hasil ukur dalam " + item.unit :
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
  const saveInput = () => {
    data[key] = control.value;
    label.classList.toggle("has-value", Boolean(control.value.trim()));
    changed();
  };
  control.addEventListener("input", saveInput);
  if (type === "date") control.addEventListener("change", () => {
    if ((data[key] || "") !== control.value) saveInput();
  });
  label.append(control, output);
  refreshOutput();
  const editableText = (control.tagName === "TEXTAREA" || control.type === "text") &&
    key !== "measurement";
  return { label: editableText ? textFormatControl(label, control, data, key, changed) : label, control };
}

function renderIdentity() {
  const defaults = effectiveChecklistIdentity(projectCover());
  const ownerAddress = () => state.identity.ownerAddress?.trim() || "";
  let copyAddress;
  for (const [id, definitions] of [
    ["owner-fields", ownerFields], ["condition-fields", conditionFields], ["building-fields", buildingFields],
  ]) {
    const wrapper = byId(id);
    wrapper.replaceChildren();
    for (const definition of definitions) {
      const key = definition[0];
      const { label, control } = field(definition, state.identity, () => {
        if (key === "ownerAddress") copyAddress.disabled = !ownerAddress();
        save();
      });
      if (defaults[key]) control.placeholder = "Dari Sampul: " + defaults[key];
      if (key === "date") control.id = "tanggal-pemeriksaan";
      if (key === "location") {
        copyAddress = button("Sama dengan alamat pemilik", () => {
          const address = ownerAddress();
          if (!address) return;
          control.value = address;
          control.dispatchEvent(new Event("input", { bubbles: true }));
          focusTextField(control);
        });
        copyAddress.disabled = !ownerAddress();
        wrapper.append(dom("div", { className: "building-location-field" }, copyAddress, label));
      } else wrapper.append(label);
    }
  }
}

function startRows(item) {
  return (item.components || item.samples || [item.fields.includes("S") ? "Sampel 1" : ""])
    .map((label, index) => ({ key: String(index + 1), label }));
}

function getCheck(item) {
  const saved = state.checks[item.id];
  if (!saved) return { rows: startRows(item), nextRow: item.initialCount + 1 };
  if (item.components) {
    const missing = startRows(item).filter((row) => !saved.rows.some(({ key }) => key === row.key));
    if (missing.length) state.checks[item.id] = { ...saved, rows: [...saved.rows, ...missing],
      nextRow: Math.max(saved.nextRow, item.initialCount + 1) };
  }
  return state.checks[item.id];
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
        const check = item.locked ? undefined : state.checks[item.id];
        const { filled, issue, na } = check ? flags(check) : { filled: false, issue: false, na: false };
        const status = item.locked ? "locked" : na ? "na" : issue ? "issue" : filled ? "filled" : "empty";
        const labels = { locked: "Perlu login", na: "Tidak berlaku", issue: "Ada temuan", filled: "Sudah diisi", empty: "Belum diisi" };
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
  const available = trialMode ? trialChecklistItems.length : items.length;
  const percent = available ? Math.round(checked / available * 100) : 0;
  byId("percent").textContent = percent + "%";
  byId("progress").value = percent;
  byId("count").textContent = checked + " dari " + available + " butir ditinjau";
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
  if (trialMode) return;
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
  if (trialMode) return el("p", "photo-lock wide", labelText + " · Perlu login");
  const wrapper = el("div", "photo-field wide");
  wrapper.classList.toggle("has-value", Boolean(row[property]));
  const label = el("label", "", labelText);
  const input = el("input");
  input.type = "file";
  input.accept = "image/*";
  const upload = item.category.code === "K.1" ? button(labelText, () => input.click()) : undefined;
  input.hidden = Boolean(upload);
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
    if (cloudOwner && file && (!Object.hasOwn(slfCloudPhotoTypes, file.type) || file.size > 50_000_000 || !file.size)) {
      feedback.textContent = "Pilih foto JPEG, PNG, WebP, GIF, AVIF, BMP, atau TIFF dengan ukuran sampai 50 MB.";
      input.value = "";
      return;
    }
    version++;
    photoWrites++;
    input.disabled = remove.disabled = true;
    if (upload) upload.disabled = true;
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
      if (upload) upload.disabled = false;
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
  if (upload) wrapper.append(upload, input);
  else {
    label.append(input);
    wrapper.append(label);
  }
  wrapper.append(feedback, remove, preview);
  return wrapper;
}

function definitionsFor(item) {
  if (item.fields.includes("P")) return [...periodFields];
  const definitions = [];
  for (const code of "VDATMCENUGK") {
    if (!item.fields.includes(code)) continue;
    if (code === "M" && item.category.code === "K.5") {
      definitions.push(["measurement", "Dimensi"], ["direction", "Arah bukaan"]);
    } else if (code === "M" && item.lightSource) {
      definitions.push(["measurement", "Iluminansi (lux)"]);
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
  if (!projectMode && item.category.code !== "K.1" && !item.fields.includes("F")) return [];
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
  const tataBangunan = item.category.code === "K.1";
  const repeatable = item.fields.includes("S") || item.fields.includes("P") || (tataBangunan ? Boolean(item.components) : projectMode);
  const addLabel = item.indoorUse ? "Tambah ruang dalam" : item.outdoorUse ? "Tambah ruang luar" :
    item.fields.includes("P") || (tataBangunan && item.components) ? "Tambah komponen" : "Tambah sampel";
  const add = repeatable ? button(addLabel, () => {
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
  item.body.append(reference);
  if (item.lightSource) item.body.append(el("p", "inspection-reference",
    "Catat satu hasil ukur dalam lux untuk setiap lokasi dan kondisi pencahayaan. Pilih Gabungan jika kedua sumber menerangi lokasi saat diukur."));
  if (item.id === "K.3-8-0") item.body.append(el("p", "inspection-reference",
    "Catat keberadaan tempat sampah dan hasil pemeriksaan pemilahannya di sini. Catatan ini juga masuk ke aspek Kemudahan."));
  item.body.append(availability, reason, rows);
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
    if (item.sampleFloor) group.append(field(["floor", "Lantai"], row, onRowChange, context, item).label);
    if (repeatable && !item.fields.includes("P") && item.title !== "Jarak Antar Bangunan") {
      const locationLabel = item.indoorUse ? "Nama ruang dalam" : item.outdoorUse ? "Nama ruang luar" :
        item.sampleFloor ? "Lokasi" : item.components && tataBangunan ? "Nama komponen" : "Lokasi atau identitas sampel";
      group.append(field(["location", locationLabel], row, onRowChange, context, item).label);
    }
    if (item.title === "Jarak Antar Bangunan" && Number(row.key) > 3) {
      group.append(field(["location", "Nama bangunan pembanding"], row, onRowChange, context, item).label);
    }
    if (tataBangunan) {
      const previous = row.conformity?.trim();
      const choice = conformity.find(value => value.toLowerCase() === previous?.toLowerCase());
      if (previous && !choice) {
        if (!row.conformityNote) setTextFormat(row, "conformityNote", getTextFormat(row, "conformity"));
        row.conformityNote = [row.conformityNote, row.conformity].filter(Boolean).join("\n");
        setTextFormat(row, "conformity", undefined);
      }
      if (previous) row.conformity = choice || "";
      const explanation = field(nonconformity, row, onRowChange, context, item);
      const status = field(fields.C, row, () => {
        explanation.label.hidden = row.conformity !== "Tidak sesuai" && !row.nonconformity?.trim();
        onRowChange();
      }, context, item);
      explanation.label.hidden = row.conformity !== "Tidak sesuai" && !row.nonconformity?.trim();
      for (const definition of definitionsFor(item)) {
        if (!["conformity", "nonconformity"].includes(definition[0])) group.append(field(definition, row, onRowChange, context, item).label);
      }
      if (item.fields.includes("F")) group.append(attachPhoto(item, row, onRowChange, "Unggah foto dokumentasi"));
      group.append(status.label, explanation.label);
      const extras = dom("div", { className: "form-grid" });
      const optional = [
        ...(!repeatable && row.location?.trim() ? [["location", "Lokasi atau identitas sampel", "text"]] : []),
        ...(!item.fields.includes("M") && row.measurement?.trim() ? [["measurement", "Hasil ukur dan satuan", "long"]] : []),
        ...(row.conformityNote?.trim() ? [["conformityNote", "Catatan kesesuaian sebelumnya", "long"]] : []),
        fields.K, ["criterion", "Acuan yang digunakan", "long"], ["followUp", "Rekomendasi teknis", "long"],
      ];
      for (const definition of optional) extras.append(field(definition, row, onRowChange, context, item).label);
      if (!item.fields.includes("F")) extras.append(attachPhoto(item, row, onRowChange, "Unggah foto dokumentasi"));
      group.append(dom("details", { className: "wide" }, dom("summary", {}, "Catatan dan bukti tambahan"), extras));
    } else {
      const definitions = definitionsFor(item);
      if (item.lightSource) definitions.unshift(["lightSource", "Sumber cahaya saat pengukuran", ["Alami", "Buatan", "Gabungan"]]);
      if (projectMode) {
        if (!item.fields.includes("M") && !item.fields.includes("P")) definitions.push(["measurement", "Hasil ukur dan satuan", "long"]);
        definitions.push(["criterion", "Acuan yang digunakan (opsional)", "long"],
          ["followUp", "Rekomendasi teknis (opsional)", "long"]);
      }
      for (const definition of definitions) group.append(field(definition, row, onRowChange, context, item).label);
      for (const [property, label] of photosFor(item)) group.append(attachPhoto(item, row, onRowChange, label, property));
    }
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
  for (const source of catalogForChecklist(state.checks)) {
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
      if (sourceGroup.code === "K.5.3") {
        const wasteLink = el("a", "", "Pewadahan dan pemilahan sampah");
        wasteLink.href = "#butir-K.3-8-0";
        wasteLink.addEventListener("click", () => {
          byId("category").value = "";
          byId("status-filter").value = "";
          byId("search").value = "";
          refresh();
          const entry = items.find(item => item.id === "K.3-8-0");
          entry.group.node.open = true;
          entry.node.open = true;
        });
        const note = el("p", "inspection-reference", "Untuk tempat sampah, isi ");
        note.append(wasteLink, " di aspek Kesehatan.");
        group.node.append(note);
      }
      for (const [itemIndex, sourceItem] of sourceGroup.items.entries()) {
        const item = { ...sourceItem, category: section, group, id: checklistItemId(source, groupIndex, sourceItem, itemIndex) };
        item.locked = trialMode && !trialChecklistIds.has(item.id);
        if (!item.locked) item.initialCount = startRows(item).length;
        item.search = [sourceItem.title, sourceGroup.code, sourceGroup.title, title, ...(sourceItem.components || [])].join(" ").toLocaleLowerCase("id");
        item.node = item.locked ? el("div", "item locked-item") : el("details", "item");
        item.node.id = "butir-" + item.id;
        const summary = el(item.locked ? "div" : "summary", "item-summary");
        item.badge = el("span", "item-status");
        const name = el("span", "item-title", [item.no, item.title].filter(Boolean).join(". "));
        summary.append(name, item.badge);
        item.node.append(summary);
        if (!item.locked) {
          item.body = el("div", "item-body");
          item.node.append(item.body);
          summary.addEventListener("click", () => {
            if (!item.body.hasChildNodes()) renderItem(item);
          });
          item.node.addEventListener("toggle", () => {
            if (item.node.open && !item.body.hasChildNodes()) renderItem(item);
          });
        }
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
  const values = effectiveChecklistIdentity(projectCover(), state.identity);
  const rowFields = [
    ["location", "Lokasi atau identitas sampel"], ["floor", "Lantai"],
    ...Object.values(fields),
    nonconformity, ["conformityNote", "Catatan kesesuaian sebelumnya"], disruption, ["direction", "Arah bukaan"], ...periodFields,
    ["ndtPhoto", "Nama foto pengujian non-destruktif"], ["photo", "Nama foto"],
  ];
  if (projectMode) rowFields.push(["lightSource", "Sumber cahaya saat pengukuran"], ["criterion", "Acuan yang digunakan"], ["followUp", "Rekomendasi teknis"]);
  const uniqueFields = [...new Map(rowFields.map((definition) => [definition[0], definition])).values()];
  const lines = [
    [...identity.map(([, label]) => label), "Kategori", "Bagian", "Nomor", "Butir atau komponen", "Halaman PDF", "Sampel", "Tidak berlaku", ...uniqueFields.map(([, label]) => label), "Alasan tidak berlaku", "Acuan pemeriksaan"],
    ...items.filter((item) => !item.locked).flatMap((item) => {
      const check = getCheck(item);
      return check.rows.map((row) => [
        ...identity.map(([key]) => values[key]),
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

if (trialMode) {
  byId("check-title").after(el("p", "result", trialChecklistItems.length + " dari " + checklistItems.length +
    " butir dapat diisi. Butir lainnya · Perlu login."));
  byId("status-filter").add(new Option("Perlu login", "locked"));
  byId("export").hidden = true;
}
renderCatalog();
const requestedItem = items.find((item) => "#" + item.node.id === location.hash);
if (requestedItem) {
  if (!requestedItem.locked) requestedItem.node.open = true;
  requestAnimationFrame(() => requestedItem.node.scrollIntoView({ block: "start" }));
}
renderIdentity();
if (location.hash === "#tanggal-pemeriksaan") {
  const date = byId("tanggal-pemeriksaan");
  date.closest(".building-details").open = true;
  requestAnimationFrame(() => {
    date.scrollIntoView({ block: "center" });
    date.focus({ preventScroll: true });
  });
}
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
  const snapshot = { ...structuredClone(state), identity: effectiveChecklistIdentity(projectCover(), state.identity) };
  await renderSimakForm(draft, snapshot, {
    tegal: tegalReference, photoUrls: urls, loadPhoto: trialMode ? undefined : (key) => photoStore("get", key),
    items: trialMode ? trialChecklistItems : checklistItemsFor(snapshot),
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
      if (item.locked) continue;
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
