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

function flattenChecklist(categories) {
  return categories.flatMap((category) => category.groups.flatMap((group, gi) =>
    group.items.map((item, ii) => ({ ...item, group, category, id: checklistItemId(category, gi, item, ii) }))));
}
function checklistItemsFor(checklist) {
  return flattenChecklist(catalogForChecklist(checklist?.checks));
}
const checklistItems = checklistItemsFor();
const allChecklistItems = [...checklistItems, ...flattenChecklist(catalog).filter(item => checklistHistoricalItems.has(item.id))];
const trialChapterCount = 2;
const trialChecklistItems = checklistItems.slice(0, Math.floor(checklistItems.length / 4));
const trialChecklistIds = new Set(trialChecklistItems.map(({ id }) => id));
const checklistLabels = {
  location: "Lokasi sampel", observation: "Pengamatan visual", damage: "Kerusakan", presence: "Ketersediaan",
  measurement: "Pengukuran", direction: "Arah bukaan", conformity: "Kesesuaian", nonconformity: "Uraian ketidaksesuaian",
  ndt: "Uji non-destruktif", test: "Pengetesan", view: "Hasil pengamatan", disruption: "Uraian gangguan",
  note: "Keterangan", component: "Komponen", routine: "Rutin", periodic: "Berkala", unscheduled: "Tidak terjadwal",
  ndtPhoto: "Foto uji non-destruktif", photo: "Foto pemeriksaan",
  criterion: "Acuan yang digunakan", followUp: "Rekomendasi teknis", lightSource: "Sumber cahaya saat pengukuran",
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
  for (const { id } of allChecklistItems) {
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

const fireLocationInspection = {
  key: "fireInspections", item: "sarana", customExample: "detektor asap",
  fields: [
    ["location", "Lokasi", "Koridor timur lantai 1"],
    ["observation", "Catatan temuan", "APAR tersedia, tetapi aksesnya terhalang kardus.", "area"],
    ["followUp", "Rekomendasi tindak lanjut", "Pindahkan penghalang, lalu cek kembali akses ke APAR.", "area"],
    ["reference", "Rujukan dokumen", "Berita acara uji alarm BA-01 atau nomor butir daftar simak"],
  ],
  legacyDefaults: () => [contextualNarrative("Proteksi kebakaran"), contextualNarratives["Proteksi kebakaran"].previous,
    "[Catat sistem pasif, aktif, dan sarana evakuasi yang diperiksa.]"],
};

const lightningLocationInspection = {
  locationsKey: "lightningLocations", photoKey: "lightning",
  fields: [
    ["location", "Lokasi", "Bak kontrol sisi timur"],
    ["observation", "Kondisi dan temuan", "Sambungan terlihat berkarat. Bagian tertanam belum bisa diperiksa.", "area"],
    ["followUp", "Rekomendasi tindak lanjut", "Periksa kondisi sambungan dan lakukan pengujian ulang setelah perbaikan.", "area"],
    ["component", "Komponen yang diperiksa", "Elektroda pembumian"],
    ["configuration", "Jenis atau susunan sistem", "Penangkap di atap terhubung ke dua kabel penyalur"],
    ["measurement", "Hasil uji atau pengukuran", "Tahanan pembumian 2,4 Ω, ukur 12 Mei 2026"],
    ["reference", "Rujukan dokumen", "Laporan pengukuran pembumian BA-02"],
  ],
  legacyDefaults: () => [lightningProtectionNarrative.body, lightningProtectionNarrative.previous],
};

const electricalLocationInspection = {
  locationsKey: "electricalLocations", photoKey: "electrical",
  fields: [
    ["location", "Lokasi", "Ruang panel lantai dasar"],
    ["observation", "Kondisi dan temuan", "Label beberapa sirkuit di panel belum terbaca.", "area"],
    ["followUp", "Rekomendasi tindak lanjut", "Cocokkan identitas sirkuit dengan diagram panel, lalu perbarui label.", "area"],
    ["component", "Komponen yang diperiksa", "Panel distribusi lantai dasar"],
    ["measurement", "Hasil uji atau pengukuran", "Hasil ukur tegangan 230 V pada titik yang diperiksa"],
    ["reference", "Rujukan dokumen", "Diagram satu garis atau berita acara pengujian panel"],
  ],
  legacyDefaults: () => [electricalInspectionNarrative.body, electricalInspectionNarrative.previous],
};

function mepLocationInspection(block) {
  if (block.type !== "heading") return;
  const name = mepSafetyKey(block.mepSafetyPreset ?? block.text);
  if (name === "proteksi kebakaran" || Array.isArray(block.fireInspections)) return fireLocationInspection;
  if (name === "penangkal petir" || Array.isArray(block.lightningInspections) || Array.isArray(block.lightningLocations)) return lightningLocationInspection;
  if (name === "instalasi listrik" || Array.isArray(block.electricalLocations)) return electricalLocationInspection;
}

function upgradeLightningLocations(block) {
  if (!Array.isArray(block.lightningInspections)) return;
  const locations = block.lightningLocations ??= [];
  for (const facility of block.lightningInspections) {
    for (const entry of facility.locations) {
      if (!hasMepLocationContent(entry, lightningLocationInspection)) continue;
      locations.push({ ...entry, component: entry.component || facility.name, excluded: !facility.selected });
    }
  }
  delete block.lightningInspections;
}

function hasLegacyMepLocationInspection(block, inspection) {
  const text = block.body?.trim();
  return Boolean(text && (!inspection.legacyDefaults().includes(text) ||
    Object.values(block.links ?? {}).some(link => link?.value?.trim() || link?.source)));
}

function hasMepLocationContent(entry, inspection) {
  return Boolean(entry.photos?.length || inspection.fields.some(([key]) => entry[key]?.trim()));
}

const structureComponentFields = [
  ["component", "Komponen", "Kolom K-03"],
  ["location", "Lokasi", "Koridor lantai dasar"],
  ["observation", "Hasil pengamatan", "Retak terlihat di sisi kolom dekat pintu"],
  ["analysis", "Analisis pengkaji", "Lokasi dan ukuran retak perlu diperiksa lebih lanjut"],
];

function hasStructureComponentContent(component) {
  return structureComponentFields.some(([key]) => component[key]?.trim()) || Boolean(component.photos?.length);
}

function hasLegacyStructureInspection(block) {
  const text = block.body?.trim();
  return Boolean(text && (text !== structuralInspectionNarrative ||
    Object.values(block.links ?? {}).some((link) => link?.value?.trim() || link?.source)));
}

const structureTestFields = [
  ["result", "Apa hasilnya?", "Contoh: hasil uji, satuan, dan lokasi pengujian"],
  ["reference", "Apa pembandingnya? (jika ada)", "Contoh: nilai rencana pada gambar struktur S-02"],
  ["assessment", "Apa arti hasilnya? (jika ada)", "Contoh: hasil hanya mewakili sampel kolom yang diuji"],
];

function isStructureTesting(block) {
  return tokenName(block.text) === "hasil pengujian dan analisis" ||
    block.body === structuralTestingNarrative || Boolean(block.structureTest);
}

function hasLegacyStructureTesting(block) {
  return Boolean(block.body?.trim() && (block.body !== structuralTestingNarrative ||
    Object.values(block.links ?? {}).some((link) => link?.value?.trim() || link?.source)));
}

function structureTestingItems(data) {
  if (!data) return [];
  const items = Array.isArray(data.items) ? data.items : [data];
  return items.filter((item) => item && typeof item === "object" && !Array.isArray(item)).map((item) => {
    if (!Object.hasOwn(item, "method") && item !== data) return item;
    const keys = ["parameter", ...structureTestFields.map(([key]) => key)];
    const migrated = item === data
      ? Object.fromEntries(keys.filter((key) => typeof item[key] === "string").map((key) => [key, item[key]]))
      : { ...item };
    const method = typeof item.method === "string" ? item.method.trim() : "";
    const reference = typeof migrated.reference === "string" ? migrated.reference.trim() : "";
    if (method && reference !== method) {
      migrated.reference = [reference, "Metode uji sebelumnya — " + method].filter(Boolean).join("\n");
    }
    delete migrated.method;
    return migrated;
  }).filter((item) => Array.isArray(data.items) || hasStructureTestItem(item));
}

const structureTestColumns = ["Item / parameter", "Hasil", "Pembanding", "Penilaian", "Foto"];

function hasStructureTestItem(item) {
  return Boolean(item.photos?.length || item.parameter?.trim() ||
    structureTestFields.some(([key]) => item[key]?.trim()));
}

function structureTestingContent(data) {
  if (data?.status === "unavailable") {
    const note = data.pendingNote?.trim();
    return reportParagraphs("Pengujian atau analisis struktur belum tersedia." + (note ? "\n\n" + note : ""));
  }
  if (data?.status !== "available") return [];
  const rows = structureTestingItems(data).filter(hasStructureTestItem).map((item, index) => {
    const photos = (item.photos ?? []).filter((photo) => imageSource.test(photo.image)).map((photo, photoIndex) => {
      const caption = photo.text?.trim() || "";
      return dom("div", {},
        dom("img", { className: "report-table-image", src: photo.image, alt: caption || "Foto hasil uji " + (photoIndex + 1) }),
        formattedValue(caption, getTextFormat(photo, "text")));
    });
    return [item.parameter?.trim() || "Item uji " + (index + 1),
      ...structureTestFields.map(([key]) => item[key]?.trim() || ""),
      dom("div", { className: "structure-test-photos" }, ...photos)];
  });
  return rows.length ? [reportTable(structureTestColumns, rows)] : [];
}

function isStructureRecap(block) {
  return tokenName(block.text) === "rekap hasil pemeriksaan struktur";
}

// Compare only a single reported value with an explicit minimum in the same notation.
function structureMinimumComparison(result, reference) {
  const reading = (text) => {
    const matches = [...(text || "").matchAll(/\bK\s*-\s*(\d+(?:[.,]\d+)?)\b|\b(\d+(?:[.,]\d+)?)\s*(MPa|mm|kN)\b/gi)];
    if (matches.length !== 1 || /[<>≤≥±%]|\d\s*[-–/]\s*\d/.test(text) ||
        (text.match(/\d+(?:[.,]\d+)?/g) || []).length !== 1) return null;
    const [, grade, measure, unit] = matches[0];
    return { value: Number((grade || measure).replace(",", ".")), unit: grade ? "K" : unit.toLowerCase(), label: matches[0][0] };
  };
  if (!/\b(?:minimal|minimum|paling rendah|sekurang-kurangnya)\b/i.test(reference) ||
      /\b(?:tidak|bukan|maksimum|maksimal|sekitar|antara|hingga)\b/i.test(reference + " " + result)) return "";
  if (/kurang dari|lebih dari|setidaknya|minimum|maksimal|minimal|±|[<>≤≥]/i.test(result)) return "";
  const actual = reading(result);
  const limit = reading(reference);
  if (!actual || !limit || actual.unit !== limit.unit) return "";
  return actual.label + (actual.value < limit.value ? " di bawah minimum " : " memenuhi minimum ") + limit.label;
}

function structureConclusionContent(chapter, conclusion, sources) {
  const field = (block, key) => resolveReportLink("", key, sources, block.links).value;
  const themes = new Map();
  const results = new Map();
  const actions = new Map();
  const limits = new Set();
  const systems = new Set();
  const basis = new Set();
  function group(map, text, subject) {
    if (!text?.trim()) return;
    const key = text.trim().replace(/[.]$/, "");
    if (!map.has(key)) map.set(key, new Set());
    if (subject?.trim()) map.get(key).add(subject.trim());
  }
  function addFinding(subject, observation, analysis) {
    if (!observation?.trim() && !analysis?.trim()) return;
    const observed = observation?.trim() || "";
    const assessed = analysis?.trim() || "";
    // Match affirmative field observations only. Ambiguous wording stays attributed to the assessor.
    const crack = /\bretak(?:an)?\b/i.test(observed) && !/\b(tidak|tak|tanpa|belum|bukan|nihil|bekas|sudah|telah|kemungkinan|diduga)\b/i.test(observed);
    const finish = crack && /\b(plester(an)?|acian)\b/i.test(observed);
    const reinforcement = /^(?:perlu |diperlukan |disarankan |direkomendasikan ).*\b(perkuatan|penguatan)\b/i.test(assessed) &&
      !/\b(tidak|belum|bukan|kecuali|jika|apabila)\b/i.test(assessed);
    if (crack) {
      const finding = finish ? "Retak teramati pada lapisan finishing" : "Retak teramati pada elemen";
      const position = observed.match(/\b(?:bagian|sisi|serat)\s+(bawah|atas|tarik|tekan)\b/i);
      const detail = position ? " di " + position[0].toLowerCase() : "";
      group(themes, finding + detail + (reinforcement ? ". Usulan pengkaji — " + assessed :
        assessed ? ". Penilaian pengkaji — " + assessed : ""), subject);
      group(actions, finish ? "Periksa apakah retak terbatas pada finishing. Jika terbatas pada lapisan tersebut, tangani penyebabnya sebelum memperbaiki permukaan" :
        "Petakan pola dan ukur lebar retak, lalu pantau perubahannya pada titik ukur yang sama", subject);
      if (/\d/.test(observed)) group(themes, observed, subject);
    } else {
      group(themes, [observed, assessed && assessed !== observed ? assessed : ""].filter(Boolean).join(". "), subject);
    }
    if (/^(?:terlihat |teramati |terdapat )?(?:korosi|karat)\b/i.test(observed)) {
      group(actions, "Petakan bagian yang terkorosi dan ukur penampang tersisa untuk menilai pengaruh kehilangan material terhadap kapasitas elemen", subject);
    }
    if (/^(?:terlihat |teramati |terdapat )?(?:lendutan|deformasi)\b/i.test(observed)) {
      group(actions, "Ukur perubahan geometri terhadap titik acuan tetap, catat kondisi beban saat pengukuran, lalu bandingkan dengan kriteria layan elemen", subject);
    }
    if (reinforcement) group(actions, "Verifikasi kebutuhan perkuatan terhadap beban aktual dan kapasitas elemen. Gunakan hasil verifikasi untuk menetapkan detail perkuatan sebelum pelaksanaan", subject);
  }
  function addTest(subject, result, reference, assessment) {
    if (!result?.trim() && !assessment?.trim()) return;
    const comparison = structureMinimumComparison(result || "", reference || "");
    const finding = comparison || result?.trim();
    let interpretation = assessment?.trim();
    // Condense an explicit load assessment only when no qualifications follow it.
    if (comparison && !/[;\n]|[.!?]\s+\D/.test(interpretation) && /(?:masih )?mampu menerima beban yang ada(?: sesuai dengan perencanaan)?[.]?$/i.test(interpretation) &&
        !/\b(tidak|belum|bukan|jika|apabila|asalkan|kecuali|namun|tetapi|hanya|terbatas|selama|syarat)\b/i.test(interpretation)) {
      interpretation = /perhitungan.*ulang/i.test(interpretation) ?
        "Menurut perhitungan ulang pengkaji, kapasitas masih mencukupi untuk beban yang ditelaah" :
        "Pengkaji menilai kapasitas mencukupi untuk beban yang ditelaah";
    }
    group(results, [finding, interpretation].filter(Boolean).join(". "), subject);
    if (comparison.includes(" di bawah minimum ")) {
      group(actions, "Telusuri elemen yang diwakili sampel dan dokumentasikan kapasitasnya berdasarkan mutu hasil uji, beban aktual, serta asumsi perhitungan", subject);
    } else if (!assessment?.trim()) {
      group(actions, reference?.trim() ? "Nilai hasil terhadap kriteria pembanding dan catat implikasinya untuk elemen yang diuji" :
        "Tetapkan acuan yang sesuai dengan metode dan satuan uji sebelum menilai hasilnya", subject);
    }
  }
  for (const block of chapter.blocks) {
    if (block === conclusion) break;
    if (block.type === "table" && isStructureRecap(block)) {
      for (const [ri, row] of block.rows.entries()) {
        const values = row.map((_, ci) => cleanValue(tableCellValue(block, ri, ci, sources)));
        addFinding(values[0], values[1], values[3]);
      }
    }
    if (block.type !== "heading") continue;
    if (tokenName(block.text) === "data sistem struktur" || reportTokens(block.body ?? "").has("sistem utama dan material")) {
      systems.add(field(block, "sistem utama dan material"));
      if (field(block, "gambar atau dokumen teknis")) basis.add("dokumen teknis");
      if (field(block, "daftar elemen yang dapat diakses")) basis.add("data elemen yang dapat diakses");
      const limitation = field(block, "batasan data");
      if (limitation) limits.add(limitation);
    }
    for (const entry of block.structureComponents ?? []) {
      addFinding([entry.component, entry.location].filter(Boolean).join(" · "), entry.observation, entry.analysis);
    }
    if (block.body === structuralInspectionNarrative || tokenName(block.text) === "pemeriksaan elemen struktur") {
      addFinding(field(block, "elemen dan lokasi sampel"), field(block, "kondisi, lokasi, dan ukuran kerusakan bila ada"), "");
    }
    if (isStructureTesting(block)) {
      const data = block.structureTest;
      if (data?.status === "unavailable") {
        limits.add(["Hasil uji atau analisis belum tersedia.", data.pendingNote?.trim()].filter(Boolean).join(" "));
        continue;
      }
      if (data?.status === "available") for (const item of structureTestingItems(data)) {
        addTest(item.parameter, item.result, item.reference, item.assessment);
      }
      addTest(field(block, "metode atau status pengujian"), field(block, "hasil dan satuan"),
        field(block, "parameter pembanding"), field(block, "interpretasi dan batasan"));
    }
  }
  for (const { subject, row } of sources.structureChecks ?? []) {
    const observation = [row.damage, row.observation, row.nonconformity].filter(value => value?.trim()).join(". ");
    addFinding(subject, observation, "");
    addTest(subject, [row.test, row.ndt].filter(value => value?.trim()).join(". "), row.criterion, "");
    group(actions, row.followUp, subject);
  }
  for (const ref of recommendationsFor(sources, true).values()) {
    if (!ref.assessment) group(actions, ref.action, ref.topic);
  }
  if (limits.size && [...limits].some(value => /\b(belum|tertutup|terbatas|tidak tersedia|tidak dapat)\b/i.test(value))) {
    group(actions, "Lengkapi bukti pada bagian yang belum terverifikasi dan tentukan kebutuhan inspeksi atau pengujian lanjutan pada bagian tersebut");
  }
  if (!actions.size && themes.size) group(actions, "Gunakan catatan lokasi dan kondisi elemen sebagai pembanding pada inspeksi berikutnya. Telaah penyebab dan pengaruhnya terhadap kapasitas bila kondisi berubah");

  function paragraphs(map) {
    return [...map].map(([text, subjects]) => {
      const labels = [...subjects];
      const subject = labels.length > 3 ? labels.slice(0, 2).join(", ") + " dan " + (labels.length - 2) + " titik lain" : scopeList.format(labels);
      return dom("p", { className: "report-text" }, subject ? dom("strong", {}, subject + ". ") : "", text + ".");
    });
  }
  const groups = [];
  function section(title, content) {
    if (content.length) groups.push(dom("div", { className: "structure-conclusion-group" }, dom("h4", {}, title), ...content));
  }
  const context = [...systems].filter(Boolean).join(", ");
  const summary = [];
  if (context || basis.size) summary.push(...reportParagraphs((context ? "Kajian mencakup " + context : "Kajian struktur disusun") +
    (basis.size ? " berdasarkan " + scopeList.format([...basis]) : "") + "."));
  summary.push(...paragraphs(themes));
  section("Ringkasan pemeriksaan", summary.length ? summary : !results.size && !limits.size ? reportParagraphs("Data struktur untuk menyusun kesimpulan belum tersedia.") : []);
  section("Makna hasil uji", paragraphs(results));
  section("Batas penilaian", [...limits].flatMap(value => reportParagraphs(value)));
  section("Rekomendasi teknis", actions.size ? paragraphs(actions) : reportParagraphs(results.size ?
    "Simpan hubungan antara sampel, lokasi elemen, hasil uji, dan penilaian pengkaji sebagai dasar evaluasi berikutnya." :
    "Belum ada rekomendasi struktur yang tercatat."));
  const additional = hasWrittenStructureConclusion(conclusion) ? writtenStructureConclusion(conclusion, sources) : [];
  if (conclusion.structureConclusionNote?.trim()) additional.push(...reportParagraphs(conclusion.structureConclusionNote));
  section("Catatan tambahan pengkaji", additional);
  return [dom("div", { className: "structure-conclusion" }, ...groups)];
}

function hasWrittenStructureConclusion(block) {
  return Boolean(block.body.trim() && block.body !== structuralConclusionNarrative ||
    Object.values(block.links ?? {}).some(link => link?.value?.trim() || link?.source));
}

function writtenStructureConclusion(block, sources) {
  const resolve = (original, name) => resolveReportLink(original, name, sources, block.links, true);
  if (block.body !== structuralConclusionNarrative) return reportParagraphs(block.body, getTextFormat(block, "body"), resolve);
  const paragraphs = [];
  for (const [key, name] of reportTokens(block.body)) {
    const link = block.links?.[key];
    if (!link) continue;
    const text = key === "nomor rekomendasi" ? link.value?.trim() : resolve("", name).value;
    if (text) paragraphs.push(...reportParagraphs(name[0].toUpperCase() + name.slice(1) + " — " + text));
  }
  return paragraphs;
}

function appearanceSectionParagraphs(block) {
  return (block.appearanceSections ?? []).flatMap(({ area, part, condition }) => {
    const location = area?.trim();
    const element = part?.trim();
    const title = [location, element].filter(Boolean).join(" — ");
    const note = condition?.trim();
    if (!title && !note) return [];
    const paragraph = dom("p", { className: "report-text" });
    if (title) paragraph.append(dom("strong", {}, title), note ? ". " : "");
    if (note) paragraph.append(note);
    return [paragraph];
  });
}

function areaObservationParagraphs(areas, referenceLabel) {
  return (areas ?? []).flatMap(({ area, selected, observation, reference, limitation }) => {
    if (!selected || !area?.trim()) return [];
    const details = [
      ["", observation],
      [referenceLabel + " — ", reference],
      ["Batasan — ", limitation],
    ].flatMap(([label, text]) => text?.trim() ? [label + text.trim()] : []);
    if (!details.length) return [];
    return [dom("p", { className: "report-text" }, dom("strong", {}, area.trim()),
      ...details.flatMap((line) => [dom("br"), line]))];
  });
}

function environmentObservationParagraphs(areas) {
  return (areas ?? []).flatMap(({ area, selected, location, observation, impact, reference, followUp, limitation }) => {
    if (!selected || !area?.trim()) return [];
    const details = [
      ["Lokasi", location],
      ["Kondisi teramati", observation],
      ["Dampak", impact],
      ["Bukti pendukung", reference],
      ["Tindak lanjut", followUp],
      ["Batasan pemeriksaan", limitation],
    ].flatMap(([label, text]) => text?.trim() ? [dom("br"), dom("strong", {}, label + " — "), text.trim()] : []);
    return details.length ? [dom("p", { className: "report-text" }, dom("strong", {}, area.trim()), ...details)] : [];
  });
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
  if (trial) project = { ...project, chapters: project.chapters.slice(0, trialChapterCount) };
  const checklist = readChecklist(project.id);
  const items = trial ? trialChecklistItems : checklistItemsFor(checklist);
  const sources = reportSources(project, checklist);
  const resolveToken = (links, structural) => (original, name) => resolveReportLink(original, name, sources, links, structural);
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
  const checklistSections = new Set();
  for (const item of items) {
    const keys = checklistDestinations(project, item).map(to => to.chapter + ":" + to.block);
    for (const key of keys) checklistSections.add(key);
    const summary = checklistSummary(item, checklist.checks[item.id]);
    if (!summary) continue;
    if (!keys.length) keys.push("fallback");
    const anchor = "report-summary-" + item.id;
    summaryAnchors.set(item.id, anchor);
    for (const [index, key] of keys.entries()) {
      if (!summaries.has(key)) summaries.set(key, []);
      summaries.get(key).push({ item, id: index ? anchor + "-" + index : anchor });
    }
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
    summaries.delete(key);
    const id = "report-checklist-summary-" + tableEntries.length;
    const caption = "Tabel " + (tableEntries.length + 1) + " · " + label;
    tableEntries.push([id, caption]);
    const table = reportTable(["Butir daftar simak", "Ringkasan hasil", "Dasar aturan atau acuan teknis"],
      rows.map(({ item }) => [reportJump("report-check-" + item.id, item.group.code + " · " + item.title),
        checklistReportResult(item, checklist.checks[item.id]),
        checklistReference(item.id, intensity.data.region === "tegal")]));
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
    section.append(...reportParagraphs(introductionText(chapter)));
    appendPhotos(section, (chapter.photos ?? []).map((photo, i) => [photo, section.id + "-photo-" + i]));
    const headings = headingEntries(chapter, index);
    appendSummary(section, index + ":-1", "Hasil daftar simak terkait");
    const pendingPhotos = [];
    for (const [bi, block] of chapter.blocks.entries()) {
      if (block.mepSafetySelected === false) continue;
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
        section.append(...reportParagraphs(introductionText(chapter, block)));
        const structureInspection = tokenName(block.text) === "pemeriksaan elemen struktur" || block.structureComponents;
        const structureTesting = isStructureTesting(block);
        const parameterGroup = mepParameterGroup(block);
        const locationInspection = mepLocationInspection(block);
        if (parameterGroup) {
          section.append(...mepParameterSummary(chapter, block, parameterGroup, resolveToken(block.links)));
        } else if (project.workflowVersion === 2 && block.checklistKey && checklistSections.has(index + ":" + bi)) {
          appendSummary(section, index + ":" + bi, "Hasil daftar simak · " + block.text);
          section.append(...reportParagraphs(block.body, getTextFormat(block, "body")));
        } else if (locationInspection) {
          const { locationsKey, photoKey } = locationInspection;
          const entries = locationsKey ?
            (block[locationsKey] ?? []).map((entry, index) => ({ entry, photoId: photoKey + "-" + index })) :
            (block.fireInspections ?? []).flatMap((facility, facilityIndex) => facility.selected ?
              facility.locations.map((entry, index) => ({ entry, facility: facility.name, photoId: "fire-" + facilityIndex + "-" + index })) : []);
          const visible = entries.filter(({ entry }) => !entry.excluded && hasMepLocationContent(entry, locationInspection));
          for (const [index, { entry, facility, photoId }] of visible.entries()) {
            const location = entry.location?.trim() || "Lokasi " + (index + 1);
            section.append(dom("h5", {}, facility ? facility + " · " + location : location));
            for (const [key, label] of locationInspection.fields.slice(1)) {
              if (locationsKey && key === "followUp") continue;
              const value = entry[key]?.trim();
              if (value) section.append(...reportParagraphs(label + " — " + value));
            }
            appendPhotos(section, (entry.photos ?? []).map((photo, photoIndex) =>
              [photo, id + "-" + photoId + "-photo-" + photoIndex]));
            if (locationsKey && entry.followUp?.trim()) {
              section.append(...reportParagraphs("Rekomendasi tindak lanjut — " + entry.followUp.trim()));
            }
          }
          if (hasLegacyMepLocationInspection(block, locationInspection)) {
            if (visible.length) section.append(dom("h5", {}, "Catatan pemeriksaan sebelumnya"));
            section.append(...reportParagraphs(block.body, getTextFormat(block, "body"), resolveToken(block.links)));
          }
        } else if (isStructureConclusion(block)) {
          section.append(...structureConclusionContent(chapter, block, sources));
        } else if ((!structureInspection || hasLegacyStructureInspection(block)) &&
            (!structureTesting || hasLegacyStructureTesting(block))) {
          if (structureTesting && block.structureTest?.status) section.append(dom("h4", {}, "Catatan pengujian sebelumnya"));
          section.append(...reportParagraphs(block.body, getTextFormat(block, "body"), resolveToken(block.links, isStructureConclusion(block))));
        }
        if (project.workflowVersion === 2 && chapter.checklistKey === "Rekomendasi" && block.checklistKey === "Rekomendasi dan prioritas") {
          const rows = checklistFollowUpRows(items, checklist, item => reportJump("report-check-" + item.id, item.title));
          if (rows.length) {
            const followUpId = id + "-checklist-follow-up";
            const caption = "Tabel " + (tableEntries.length + 1) + " · Rekomendasi dari daftar simak";
            tableEntries.push([followUpId, caption]);
            section.append(dom("div", { id: followUpId, className: "report-block" },
              dom("p", { className: "caption" }, caption), reportTable(checklistFollowUpColumns, rows)));
          }
        }
        if (structureTesting) {
          const content = structureTestingContent(block.structureTest);
          if (content[0]?.tagName === "TABLE") {
            const testId = id + "-tests";
            const caption = "Tabel " + (tableEntries.length + 1) + " · Hasil pengujian dan analisis struktur";
            tableEntries.push([testId, caption]);
            section.append(dom("div", { id: testId, className: "report-block" },
              dom("p", { className: "caption" }, caption), ...content));
          } else section.append(...content);
        }
        for (const [componentIndex, entry] of (block.structureComponents ?? []).filter(hasStructureComponentContent).entries()) {
          const name = [entry.component?.trim() || "Komponen " + (componentIndex + 1), entry.location?.trim()]
            .filter(Boolean).join(" · ");
          section.append(dom("h4", {}, name));
          for (const [key, label] of structureComponentFields.slice(2)) {
            if (entry[key]?.trim()) section.append(...reportParagraphs(label + " — " + entry[key].trim()));
          }
          appendPhotos(section, (entry.photos ?? []).map((photo, photoIndex) =>
            [photo, id + "-component-" + componentIndex + "-photo-" + photoIndex]));
        }
        section.append(...appearanceSectionParagraphs(block));
        section.append(...areaObservationParagraphs(block.roomLayoutAreas, "Denah"),
          ...environmentObservationParagraphs(block.environmentAreas));
        appendPhotos(section, (block.photos ?? []).map((photo, i) => [photo, id + "-photo-" + i]));
        if (showIntensity && intensityTarget?.chapter === index && intensityTarget.block === bi) appendIntensity(section);
        if (!architectureInspectionKind(chapter.blocks[bi + 1])) {
          appendSummary(section, index + ":" + bi, "Daftar simak terkait · " + block.text);
        }
      }
      if (block.type === "text") section.append(...reportParagraphs(block.text, getTextFormat(block, "text"), resolveToken(block.links)));
      if (block.type === "table") {
        const structureRecap = isStructureRecap(block);
        const prefix = "Tabel " + (tableEntries.length + 1) + " · ";
        const title = block.text || "Tabel kajian";
        const columns = block.headers.map((text, ci) => formattedValue(text, getTextFormat(block, "header:" + block.columnIds?.[ci]), resolveToken()));
        const documentReview = isDocumentReviewTable(block);
        const rows = block.rows.flatMap((row, ri) => {
          const values = row.map((_, ci) => {
            const value = tableCellValue(block, ri, ci, sources);
            return structureRecap && /^\[[^\[\]\r\n]+\]$/.test(value?.trim() ?? "") ? "" : value;
          });
          const measurement = block.healthMeasurements?.[block.rowIds?.[ri]];
          const reference = measurement?.healthSource && getHealthMeasurementReference(measurement, sources);
          const image = block.rowImages?.[block.rowIds?.[ri]];
          const hasImage = imageSource.test(image || "");
          if ((structureRecap || documentReview || block.healthMeasurements?.[block.rowIds?.[ri]]) &&
              !hasImage && !values.some((value) => value?.trim())) return [];
          return [values.map((text, ci) => {
            const key = tableCellKey(block, ri, ci);
            const sourceId = block.cellLinks?.[key];
            const source = sources.get(sourceId);
            const own = getTextFormat(block, "cell:" + key);
            const format = source?.format && own ? { base: { ...source.format.base, ...own.base }, block: own.block, runs: own.runs.length ? own.runs : source.format.runs } : own || source?.format;
            const body = formattedValue(text, format, resolveToken());
            const value = reference && ci === 3 ? dom("div", {}, body, dom("div", {},
              reportJump(reference.anchor, "Sumber hasil ukur · Kesehatan, baris " + reference.number))) :
              sourceId?.startsWith("finding:") ? dom("div", {}, body,
              dom("div", {}, source?.anchor ? reportJump(source.anchor, "Lihat sumber pemeriksaan") :
                "Sumber awal tidak tersedia · salinan tersimpan")) : body;
            return hasImage && ci === tableImageColumn(block) ?
              dom("div", {}, value, dom("img", { className: "report-table-image", src: image, alt: "Gambar baris " + (ri + 1) })) : value;
          })];
        });
        if (structureRecap && !rows.length) continue;
        tableEntries.push([id, prefix + title]);
        section.append(dom("div", { id, className: "report-block" },
          reportFormatted(dom("p", { className: "caption" }), title, getTextFormat(block, "text"), prefix), reportTable(columns, rows)));
        if (architectureInspectionKind(block) && chapter.blocks[bi - 1]?.type === "heading") {
          appendSummary(section, index + ":" + (bi - 1), "Daftar simak terkait · " + chapter.blocks[bi - 1].text);
        }
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
