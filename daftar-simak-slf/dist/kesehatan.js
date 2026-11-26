"use strict";

const healthSources = {
  lighting: ["SNI 6197:2020 · pencahayaan rata-rata minimum", "https://pesta.bsn.go.id/produk/detail/13243-sni61972020"],
  office: ["Permenkes 48/2016 · Lampiran Bab IV", "https://peraturan.bpk.go.id/Details/113097/permenkes-no-48-tahun-2016"],
  water: ["Permenkes 2/2023 · Lampiran Bab II A", "https://peraturan.bpk.go.id/Details/245563/permenkes-no-2-tahun-2023"],
  sanitation: ["Permenaker 5/2018 · Pasal 34", "https://jdih.kemnaker.go.id/peraturan/detail/1546/peraturan-menteri-nomor-5-tahun-2018"],
  ventilation: ["SNI 6572-1:2024 · ventilasi gedung nonresidensial", "https://pesta.bsn.go.id/produk/detail/14965-sni6572-12024"],
  plumbing: ["SNI 8153:2025 · sistem plambing", "https://pesta.bsn.go.id/produk/by_ics/629"],
};
const roomLightingLevels = [
  ["office-work", "Perkantoran · ruang kerja", 350],
  ["office-reception", "Perkantoran · resepsionis", 300],
  ["office-meeting", "Perkantoran · ruang rapat", 300],
  ["office-archive", "Perkantoran · gudang arsip", 150],
  ["office-active-archive", "Perkantoran · ruang arsip aktif", 350],
  ["office-parking", "Perkantoran · ruang parkir", 100],
  ["school-class", "Pendidikan · ruang kelas", 350],
  ["school-library", "Pendidikan · ruang baca perpustakaan", 350],
  ["school-lab", "Pendidikan · laboratorium", 500],
  ["school-lobby", "Pendidikan · lobi", 100],
  ["home-bedroom", "Rumah tinggal · kamar tidur", 50],
  ["home-bath", "Rumah tinggal · kamar mandi", 100],
  ["home-kitchen", "Rumah tinggal · dapur", 250],
  ["restaurant-toilet", "Restoran · toilet", 200],
  ["shop-sales", "Pertokoan · area penjualan", 300],
  ["industry-warehouse", "Industri · gudang", 100],
  ["industry-rough", "Industri · pekerjaan kasar", 200],
  ["worship", "Rumah ibadah · ruang ibadah", 200],
];
const officeRooms = [["office-work", "Perkantoran · ruang kerja"], ["office-lobby", "Perkantoran · lobi atau koridor"]];
const officeRange = (ranges) => officeRooms.map(([id, label], index) => ({
  id, label, min: ranges[index][0], max: ranges[index][1], section: "Tabel 6",
}));
const waterCategories = (bounds) => [
  { id: "drinking", label: "Air minum", section: "Tabel 1", ...bounds },
  { id: "hygiene-home", label: "Air higiene dan sanitasi · sumber mandiri rumah tangga", section: "Tabel 3", ...bounds },
];
const healthParameters = {
  lighting: {
    label: "Pencahayaan rata-rata", unit: "lux", source: "lighting",
    categories: [
      ...roomLightingLevels.map(([id, label, min]) => ({ id, label, min })),
      { id: "office-work-k3", label: "Perkantoran · ruang kerja (K3)", min: 300, source: "office", section: "Tabel 6" },
    ],
    action: "Periksa sebaran cahaya, kondisi lampu dan penghalang cahaya, lalu ukur ulang rata-rata pencahayaan.",
  },
  temperature: {
    label: "Suhu udara", unit: "°C", source: "office", categories: officeRange([[23, 26], [23, 28]]),
    action: "Tinjau pengaturan tata udara dan sumber panas, lalu ukur ulang pada kondisi penggunaan ruang yang mewakili.",
  },
  humidity: {
    label: "Kelembapan relatif", unit: "% RH", source: "office", categories: officeRange([[40, 60], [30, 70]]),
    action: "Periksa sumber kelembapan serta pengaturan ventilasi atau tata udara, lalu ukur ulang.",
  },
  airSpeed: {
    label: "Kecepatan udara", unit: "m/detik", source: "office",
    categories: [{ id: "office", label: "Perkantoran · udara dalam ruang", min: 0.15, max: 0.5 }],
    action: "Periksa aliran udara di area pengguna dan pengaturan sistem ventilasi, lalu ukur ulang.",
  },
  openings: {
    label: "Luas bukaan ventilasi", unit: "% luas lantai", source: "office",
    categories: [{ id: "office-natural", label: "Ruang kerja kantor tanpa AC · ventilasi silang", min: 15 }],
    action: "Periksa luas bukaan efektif dan jalur ventilasi silang, lalu telaah kebutuhan penyesuaian bukaan.",
  },
  ventilationPerPerson: {
    label: "Pertukaran udara per orang", unit: "m³/menit/orang", source: "office",
    categories: [
      { id: "office-work", label: "Perkantoran · ruang kerja", min: 0.57, section: "Ventilasi udara" },
      { id: "office-meeting", label: "Perkantoran · ruang pertemuan", min: 1.05, section: "Ventilasi udara" },
    ],
    action: "Tinjau pertukaran udara dengan memperhitungkan jumlah pengguna ruang, lalu periksa ulang kinerja ventilasi.",
  },
  outdoorAir: {
    label: "Debit udara luar", unit: "L/detik", source: "ventilation",
    categories: [{ id: "nonresidential", label: "Gedung nonresidensial · sesuai fungsi dan hunian", manual: true }],
    action: "Periksa penyediaan udara luar, kondisi sistem, dan kebutuhan menurut fungsi serta jumlah pengguna, lalu ukur ulang.",
  },
  ph: {
    label: "pH air", unit: "pH", source: "water",
    categories: waterCategories({ min: 6.5, max: 8.5 }),
    action: "Periksa sumber dan pengolahan air, lalu lakukan uji ulang pada titik sampel yang sama.",
  },
  turbidity: {
    label: "Kekeruhan air", unit: "NTU", source: "water",
    categories: waterCategories({ max: 3, exclusiveMax: true }),
    action: "Periksa kondisi sumber air, filtrasi dan penampung, lalu lakukan uji ulang.",
  },
  tds: {
    label: "Zat padat terlarut (TDS)", unit: "mg/L", source: "water",
    categories: waterCategories({ max: 300, exclusiveMax: true }),
    action: "Tinjau sumber air dan sistem pengolahan, lalu lakukan uji ulang.",
  },
  ecoli: {
    label: "E. coli dalam air", unit: "CFU/100 mL", source: "water",
    categories: waterCategories({ max: 0 }),
    action: "Telusuri kemungkinan kontaminasi, koordinasikan tindak lanjut kualitas air, dan lakukan uji ulang laboratorium.",
  },
  sanitation: {
    label: "Kelengkapan sanitasi toilet", unit: "status", source: "sanitation",
    categories: [
      ["water", "Toilet tempat kerja · tersedia air bersih"],
      ["soap", "Toilet tempat kerja · tersedia sabun"],
      ["handwash", "Toilet tempat kerja · tersedia tempat cuci tangan"],
      ["drain", "Toilet tempat kerja · saluran pembuangan mengalir baik"],
      ["clean", "Toilet tempat kerja · bersih dan tidak berbau"],
    ].map(([id, label]) => ({ id, label, min: 1 })),
    action: "Lengkapi fasilitas atau perbaiki kondisi sanitasi yang belum terpenuhi, lalu periksa kembali.",
  },
  plumbing: {
    label: "Plambing dan pembuangan air", unit: "status", source: "plumbing",
    categories: [{ id: "building", label: "Instalasi gedung · sesuai kriteria yang diperiksa", manual: true }],
    action: "Periksa kondisi instalasi dan lakukan verifikasi ulang terhadap kriteria yang dipakai.",
  },
};
const defaultHealthParameters = ["lighting", "temperature", "humidity", "openings", "ph", "turbidity", "sanitation"];
const healthMeasurementFields = ["parameter", "location", "category", "measured", "minimum", "maximum", "reference"];
const healthNumberFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 6 });

function healthNumber(raw) {
  const text = raw?.trim() ?? "";
  if (!/^-?\d+(?:[.,]\d+)?$/.test(text)) return null;
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function healthMeasurement(row) {
  const parameter = Object.hasOwn(healthParameters, row.parameter) ? healthParameters[row.parameter] : undefined;
  if (!parameter) return {};
  const category = parameter.categories.find((entry) => entry.id === row.category);
  const manual = Boolean(category?.manual || row.category === "manual");
  const source = category ? healthSources[category.source ?? parameter.source] : undefined;
  const reference = [source?.[0], category?.section, manual ? row.reference?.trim() : ""].filter(Boolean).join(" · ");
  const unit = parameter.unit;
  const qualitative = unit === "status";
  const min = manual ? qualitative ? 1 : healthNumber(row.minimum) : category?.min ?? null;
  const max = manual ? (qualitative ? null : healthNumber(row.maximum)) : category?.max ?? null;
  const hasManualLimits = [row.minimum, row.maximum].every((value) => !value?.trim() || healthNumber(value) !== null);
  const comparable = Boolean((category || row.category === "manual") && (!manual || (
    row.reference?.trim() && (qualitative || hasManualLimits))) && (min !== null || max !== null) &&
    (min === null || max === null || min <= max));
  const number = qualitative ? (["0", "1"].includes(row.measured) ? Number(row.measured) : null) : healthNumber(row.measured);
  const valid = number !== null && (unit === "°C" || number >= 0) &&
    (unit !== "pH" || number <= 14) && (unit !== "% RH" || number <= 100);
  const numberText = (value) => healthNumberFormat.format(value);
  const threshold = comparable ? qualitative ? "Terpenuhi" :
    (min !== null && max !== null ? numberText(min) + "–" + numberText(max) :
      min !== null ? "≥ " + numberText(min) : (category?.exclusiveMax ? "< " : "≤ ") + numberText(max)) + " " + unit : "";
  const measured = valid ? qualitative ? (number === 1 ? "Terpenuhi" : "Belum terpenuhi") : numberText(number) + " " + unit : "";
  const below = valid && min !== null && number < min;
  const above = valid && max !== null && (number > max || (category?.exclusiveMax && number === max));
  const status = !row.category ? "Pilih kategori atau acuan" :
    !comparable ? "Lengkapi acuan pembanding" :
      !row.measured?.trim() ? "Belum diukur atau diperiksa" :
        !valid ? "Periksa kembali hasil ukur" : below || above ? "Di luar acuan" : "Memenuhi parameter ini";
  const recommendation = comparable && valid ? below || above ? parameter.action :
    "Pertahankan kondisi dan catat bukti pemeriksaan." : "";
  return { parameter, category, manual, source, reference, threshold, measured, status, recommendation };
}

function healthMeasurementValues(row) {
  const result = healthMeasurement(row);
  if (!result.parameter || ![row.location, row.category, row.measured].some((value) => value?.trim())) return ["", "", "", ""];
  return [result.parameter.label, [row.location, result.category?.label || (result.manual ? "Acuan lain" : "")].filter(Boolean).join(" · "),
    [result.threshold, result.reference].filter(Boolean).join(" · "),
    [result.measured || row.measured?.trim(), result.status, result.recommendation].filter(Boolean).join(" · ")];
}

function initializeHealthMeasurements(project) {
  for (const chapter of project.chapters) for (const block of chapter.blocks) {
    if (!isArchitectureHealthTable(block) || block.healthMeasurements ||
        JSON.stringify(block.headers) !== JSON.stringify(architectureHealthColumns)) continue;
    ensureReportReferences({ chapters: [{ blocks: [block] }] });
    const blank = block.rows.findIndex((row, index) => !row.some((cell, column) =>
      cell.trim() || block.cellLinks?.[tableCellKey(block, index, column)] ||
      getTextFormat(block, "cell:" + tableCellKey(block, index, column))) && !block.rowImages?.[block.rowIds[index]]);
    block.healthMeasurements = {};
    for (const [index, parameter] of defaultHealthParameters.entries()) {
      const reused = index === 0 && blank >= 0;
      const id = reused ? block.rowIds[blank] : crypto.randomUUID();
      if (!reused) {
        block.rows.push(block.headers.map(() => ""));
        block.rowIds.push(id);
      }
      block.healthMeasurements[id] = { parameter };
    }
  }
}

function healthMeasurementCells(row) {
  const parameterSelect = dom("select", { ariaLabel: "Parameter kesehatan" },
    ...Object.entries(healthParameters).map(([id, parameter]) => new Option(parameter.label, id)));
  parameterSelect.value = row.parameter;
  const categorySelect = dom("select", { ariaLabel: "Kategori ruang atau sistem" });
  const threshold = dom("p", { className: "health-threshold" });
  const source = dom("p", { className: "hint" });
  const manual = dom("div", { className: "health-measurement" });
  const numericResult = dom("input", { inputMode: "decimal", ariaLabel: "Hasil pengukuran", placeholder: "Contoh · 325,5" });
  const visualResult = dom("select", { ariaLabel: "Hasil pemeriksaan" },
    new Option("Pilih hasil", ""), new Option("Terpenuhi", "1"), new Option("Belum terpenuhi", "0"));
  const resultLabel = dom("span", {}, "Hasil pengukuran");
  const numericField = dom("label", {}, resultLabel, numericResult);
  const visualField = dom("label", {}, "Hasil pemeriksaan", visualResult);
  const status = dom("p", { className: "health-status", role: "status" });
  const recommendation = dom("p", { className: "hint" });
  function commit() {
    updateResult();
    refreshLinkedFields();
    save();
  }
  function updateResult() {
    const result = healthMeasurement(row);
    threshold.textContent = result.threshold || "Acuan belum lengkap";
    source.replaceChildren(...(result.source ? [dom("a", { href: result.source[1], target: "_blank", rel: "noopener" },
      [result.source[0], result.category?.section].filter(Boolean).join(" · "))] : []));
    source.hidden = !result.source;
    manual.hidden = !result.manual;
    const qualitative = result.parameter.unit === "status";
    numericField.hidden = qualitative;
    visualField.hidden = !qualitative;
    resultLabel.textContent = "Hasil pengukuran (" + result.parameter.unit + ")";
    status.textContent = result.status;
    status.dataset.status = result.status === "Memenuhi parameter ini" ? "pass" : result.status === "Di luar acuan" ? "fail" : "";
    recommendation.textContent = result.recommendation ? "Rekomendasi · " + result.recommendation : "";
    recommendation.hidden = !result.recommendation;
  }
  function makeNumberField(key, label) {
    const control = field(label, row[key], (value) => { row[key] = value; commit(); });
    control.querySelector("input").inputMode = "decimal";
    return control;
  }
  function updateParameter() {
    const parameter = healthParameters[row.parameter];
    categorySelect.replaceChildren(new Option("Pilih kategori atau acuan", ""),
      ...parameter.categories.map(({ id, label }) => new Option(label, id)), new Option("Acuan lain · isi sendiri", "manual"));
    categorySelect.value = row.category || "";
    numericResult.value = row.measured || "";
    visualResult.value = row.measured || "";
    const reference = field("Nomor acuan dan kriteria", row.reference, (value) => { row.reference = value; commit(); });
    manual.replaceChildren(reference, ...(parameter.unit === "status" ? [] :
      [makeNumberField("minimum", "Batas minimum"), makeNumberField("maximum", "Batas maksimum")]));
    updateResult();
  }
  parameterSelect.addEventListener("change", () => {
    if (row.measured?.trim() && !confirm("Ganti parameter dan kosongkan hasil ukur serta acuan pada baris ini?")) {
      parameterSelect.value = row.parameter;
      return;
    }
    for (const key of ["category", "measured", "minimum", "maximum", "reference"]) delete row[key];
    row.parameter = parameterSelect.value;
    updateParameter();
    commit();
  });
  categorySelect.addEventListener("change", () => { row.category = categorySelect.value; commit(); });
  numericResult.addEventListener("input", () => { row.measured = numericResult.value; commit(); });
  visualResult.addEventListener("change", () => { row.measured = visualResult.value; commit(); });
  updateParameter();
  return [
    dom("td", {}, dom("label", {}, "Parameter", parameterSelect)),
    dom("td", {}, dom("div", { className: "health-measurement" },
      field("Nama ruang atau titik ukur", row.location, (value) => { row.location = value; commit(); }),
      dom("label", {}, "Kategori ruang atau sistem", categorySelect))),
    dom("td", {}, dom("div", { className: "health-measurement" }, threshold, source, manual)),
    dom("td", {}, dom("div", { className: "health-measurement" },
      numericField, visualField, status, recommendation)),
  ];
}
