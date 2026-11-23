"use strict";

const perbupTegalUrl = "https://jdih.tegalkab.go.id/file-download/1782953548_2026pb3328012.pdf";
const rtrwTegalUrl = "https://jdih.tegalkab.go.id/index.php/ProdukHukum/detail/1252";
const intensityZones = [
  ["hk", "Pertahanan dan Keamanan (HK)"],
  ["pariwisata", "Pariwisata"],
  ["pd", "Permukiman Pedesaan (PD)"],
  ["kpi", "Peruntukan Industri (KPI)"],
  ["ppk", "Permukiman Perkotaan – Pusat Pelayanan Kawasan (Perkot-PPK)"],
  ["pkl", "Permukiman Perkotaan – Pusat Kegiatan Lokal (Perkot-PKL)"],
  ["bersyarat", "Zona dengan pembangunan bersyarat/terbatas (Lampiran III.A–C angka 2 huruf a)"],
  ["lain", "Zona lain / belum terpetakan"],
];
const intensityRoads = [
  ["arteri-primer", "Jalan Arteri Primer", 0], ["arteri-sekunder", "Jalan Arteri Sekunder", 0],
  ["kolektor-primer", "Jalan Kolektor Primer", 0], ["kolektor-sekunder", "Jalan Kolektor Sekunder", 0],
  ["lokal-primer", "Jalan Lokal Primer", 1], ["lokal-sekunder", "Jalan Lokal Sekunder", 1],
  ["lingkungan-primer", "Jalan Lingkungan Primer", 2], ["lingkungan-sekunder", "Jalan Lingkungan Sekunder", 2],
  ["lain", "Jalan lain / perlu verifikasi"],
];
const intensityFunctions = [
  ["hunian", "Hunian"], ["usaha", "Usaha nonindustri / nonpergudangan"],
  ["industri", "Usaha industri / pergudangan"], ["sosial", "Sosial dan budaya"],
  ["campuran", "Campuran"], ["keagamaan", "Keagamaan"],
  ["lain", "Fungsi lain / perlu verifikasi"],
];

// Kolom mengikuti urutan HK, Pariwisata, PD, KPI, Perkot-PPK, Perkot-PKL.
// Deret KLB mengikuti kelompok jalan arteri/kolektor, lokal, dan lingkungan.
const intensityLimits = {
  hunian: {
    kdb: [60, 60, 60, 60, 75, 75],
    klb: [[1.8, 1.8, 1.8, 1.8, 3.9, 5.0], [1.8, 1.8, 1.8, 1.8, 2.8, 3.9], [1.2, 1.2, 1.2, 1.2, 2.1, 2.8]],
  },
  usaha: {
    kdb: [60, 60, 60, 60, 70, 70],
    klb: [[1.8, 2.4, 1.8, 2.4, 3.9, 5.0], [1.8, 2.4, 1.8, 1.8, 2.8, 3.9], [1.2, 1.8, 1.2, 1.2, 2.1, 2.8]],
  },
  industri: {
    kdb: [60, 60, 60, 60, 60, 60], kdh: [25, 25, 25, 25, 25, 25],
    klb: [[1.2, 1.2, 1.2, 2.4, 1.2, 1.2], [1.2, 1.2, 1.2, 1.8, 1.2, 1.2], [0.6, 0.6, 0.6, 1.2, 0.6, 0.6]],
  },
  sosial: {
    kdb: [60, 60, 60, 60, 60, 60],
    klb: [[1.8, 1.8, 1.8, 1.8, 3.4, 4.3], [1.8, 1.8, 1.8, 1.8, 2.4, 3.4], [1.2, 1.2, 1.2, 1.2, 1.8, 2.4]],
  },
  campuran: {
    kdb: [60, 60, 60, 60, 70, 70],
    klb: [[1.8, 1.8, 1.8, 1.8, 3.9, 5.0], [1.8, 1.8, 1.8, 1.8, 2.8, 3.9], [1.2, 1.2, 1.2, 1.2, 2.1, 2.8]],
  },
  keagamaan: {
    kdb: [70, 70, 70, 70, 70, 70],
    klb: [[1.4, 2.1, 2.1, 2.1, 2.8, 2.8], [1.4, 2.1, 2.1, 2.1, 2.1, 2.1], [1.4, 1.4, 1.4, 1.4, 2.1, 2.1]],
  },
};
const standardKdh = [20, 25, 20, 25, 15, 10];
const areaMetrics = [
  { id: "K.1-1-0", key: "kdb", name: "KDB", areaLabel: "Luas lantai dasar", percent: true, page: 54 },
  { id: "K.1-1-2", key: "klb", name: "KLB", areaLabel: "Luas total lantai", percent: false, page: 56 },
  { id: "K.1-1-6", key: "kdh", name: "KDH", areaLabel: "Luas daerah hijau", percent: true, page: 60 },
];
const formatIntensity = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 });
const intensityOptions = (choices, id) => choices.find(([key]) => key === id)?.[1] || "";

const localIntensityKeys = ["municipality", "province", "zone", "road", "use", "source", "reference", "sourceUrl",
  ...areaMetrics.flatMap(({ key }) => [key + "Min", key + "Max"])];

function importIntensity(source = {}) {
  return {
    land: typeof source?.land === "string" ? source.land : "",
    region: ["tegal", "manual"].includes(source?.region) ? source.region : "",
    local: Object.fromEntries(localIntensityKeys.map((key) => [key, typeof source?.local?.[key] === "string" ? source.local[key] : ""])),
    zone: intensityOptions(intensityZones, source?.zone) ? source.zone : "",
    road: intensityOptions(intensityRoads, source?.road) ? source.road : "",
    use: intensityOptions(intensityFunctions, source?.use) ? source.use : "",
    diagram: source?.diagram === true,
  };
}

function parseArea(raw) {
  return parseIntensityNumber(raw?.trim().replace(/\s*m[²2]$/i, "").trim() || "", true);
}

function parseIntensityNumber(input, groupThousands = false) {
  if (!input) return { value: null };
  let normalized = input;
  if (groupThousands && /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(input) && !input.startsWith("0.")) {
    normalized = input.replaceAll(".", "").replace(",", ".");
  } else if (/^\d+(?:[.,]\d+)?$/.test(input)) {
    normalized = input.replace(",", ".");
  } else {
    return { value: null, error: true };
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? { value } : { value: null, error: true };
}

function getIntensityLimits(data) {
  if (data.region === "manual") return localIntensityLimits(data);
  if (data.region !== "tegal") return { note: "Pilih metode pembanding jika ingin menilai hasil terhadap acuan daerah." };
  if (data.zone === "bersyarat") return {
    values: { kdb: 15, klb: 0.15, kdh: 80 },
    conditional: true,
    note: "Pembanding ini hanya untuk kegiatan yang diperbolehkan bersyarat/terbatas oleh rencana tata ruang. Verifikasi peruntukan persil.",
  };
  const index = intensityZones.findIndex(([id]) => id === data.zone);
  const entry = Object.hasOwn(intensityLimits, data.use) ? intensityLimits[data.use] : undefined;
  if (index < 0 || index >= standardKdh.length || !entry) {
    return { note: "Pilih zona dan fungsi yang tercantum dalam tabel Perbup. Untuk pilihan di luar tabel, periksa dokumen tata ruang lokasi." };
  }
  const roadGroup = intensityRoads.find(([id]) => id === data.road)?.[2];
  const conditional = data.use === "industri" && index < 3;
  const notes = [];
  if (roadGroup === undefined) notes.push("Kelas jalan yang tercantum pada tabel diperlukan untuk membandingkan KLB.");
  if (conditional) notes.push("Angka industri pada zona ini hanya untuk usaha tertentu skala mikro–kecil sesuai hasil kesesuaian pemanfaatan ruang.");
  return {
    values: { kdb: entry.kdb[index], klb: entry.klb[roadGroup]?.[index], kdh: (entry.kdh || standardKdh)[index] },
    conditional, note: notes.join(" "),
  };
}


function localIntensityLimits(data) {
  const local = data.local;
  const sourced = Boolean(local.municipality.trim() && local.source.trim());
  return {
    bounds: Object.fromEntries(areaMetrics.map(({ key, percent }) => {
      const parse = (direction) => parseIntensityNumber((percent ? local[key + direction].trim().replace(/%$/, "") : local[key + direction]).trim());
      const minimum = parse("Min");
      const maximum = parse("Max");
      const min = minimum.value;
      const max = maximum.value;
      return [key, {
        min, max, invalid: minimum.error || maximum.error || (min !== null && max !== null && min > max),
        unsourced: !sourced,
      }];
    })),
    note: "Gunakan batas untuk persil dan fungsi yang diperiksa sesuai dokumen yang berlaku. Perbandingan angka tidak menetapkan kelaikan fungsi.",
  };
}

function compareIntensity(area, land, value, range, limits) {
  if (area.error) return "Periksa format luas";
  if (land.error || land.value === 0) return "Periksa luas persil";
  if (range?.invalid) return "Periksa batas acuan";
  if (value === null) return "Data luas belum lengkap";
  if (!range || (range.min == null && range.max == null)) return "Acuan belum ditentukan";
  if (range.unsourced) return "Isi daerah dan sumber acuan";
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(value)) * 8;
  const within = (range.min == null || value >= range.min - tolerance) && (range.max == null || value <= range.max + tolerance);
  if (limits.conditional) return within ? "Dalam batas angka bersyarat" : "Di luar batas angka bersyarat";
  if (limits.bounds) return within ? "Dalam batas acuan" : "Di luar batas acuan";
  return within ? "Dalam batas umum" : "Di luar batas umum";
}

function intensitySourceUrl(text) {
  try {
    const url = new URL(text.trim());
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}


function calculateIntensity(project, checklist) {
  const data = importIntensity(project.intensity);
  const land = parseArea(data.land);
  const limits = getIntensityLimits(data);
  const metrics = areaMetrics.map((metric) => {
    const check = checklist.checks[metric.id];
    const raw = !check?.na ? check?.rows.find((row) => row.measurement?.trim())?.measurement : "";
    const area = parseArea(raw);
    const calculated = land.value > 0 && area.value !== null ? area.value / land.value * (metric.percent ? 100 : 1) : null;
    const value = Number.isFinite(calculated) ? calculated : null;
    const limit = limits.values?.[metric.key];
    const range = limits.bounds?.[metric.key] ?? (limit === undefined ? undefined : metric.key === "kdh" ? { min: limit } : { max: limit });
    const status = check?.na ? "Tidak berlaku" : compareIntensity(area, land, value, range, limits);
    return { ...metric, area, value, range, status };
  });
  return { data, land, metrics, note: limits.note };
}

function intensityValue(value, suffix = "") {
  return value == null ? "—" : formatIntensity.format(value) + suffix;
}

const intensityReviewNote = "Bandingkan dengan RDTR apabila telah ditetapkan. Untuk IMB/PBG sebelum Perbup berlaku, periksa ketentuan peralihan Lampiran Bab IV. Angka perbandingan tidak menetapkan kelaikan fungsi.";
