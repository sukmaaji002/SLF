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
  { id: "K.1-1-0", key: "kdb", name: "KDB", areaLabel: "Luas lantai dasar", percent: true, direction: "Maks.", page: 54 },
  { id: "K.1-1-2", key: "klb", name: "KLB", areaLabel: "Luas total lantai", percent: false, direction: "Maks.", page: 56 },
  { id: "K.1-1-6", key: "kdh", name: "KDH", areaLabel: "Luas daerah hijau", percent: true, direction: "Min.", page: 60 },
];
const formatIntensity = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 });
const intensityOptions = (choices, id) => choices.find(([key]) => key === id)?.[1] || "";

function importIntensity(source = {}) {
  return {
    land: typeof source?.land === "string" ? source.land : "",
    region: source?.region === "tegal" ? "tegal" : "",
    zone: intensityOptions(intensityZones, source?.zone) ? source.zone : "",
    road: intensityOptions(intensityRoads, source?.road) ? source.road : "",
    use: intensityOptions(intensityFunctions, source?.use) ? source.use : "",
    diagram: source?.diagram === true,
  };
}

function parseArea(raw) {
  const input = raw?.trim().replace(/\s*m[²2]$/i, "").trim() || "";
  if (!input) return { value: null };
  let normalized = input;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(input) && !input.startsWith("0.")) {
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
  if (data.region !== "tegal") return { note: "Pilih Kabupaten Tegal untuk menampilkan pembanding umum Perbup 12/2026." };
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
    const tolerance = Number.EPSILON * Math.max(1, Math.abs(limit ?? 0)) * 8;
    const within = metric.percent && metric.key === "kdh" ? value >= limit - tolerance : value <= limit + tolerance;
    return { ...metric, area, value, limit, status: check?.na ? "Tidak berlaku" : area.error ? "Periksa format luas" :
      land.error || land.value === 0 ? "Periksa luas persil" : value === null ? "Data luas belum lengkap" :
      limit === undefined ? "Acuan belum ditentukan" : limits.conditional ? (within ? "Dalam batas angka bersyarat" : "Di luar batas angka bersyarat") :
      within ? "Dalam batas umum" : "Di luar batas umum" };
  });
  return { data, land, metrics, note: limits.note };
}

function intensityValue(value, suffix = "") {
  return value == null ? "—" : formatIntensity.format(value) + suffix;
}

const intensityReviewNote = "Bandingkan dengan RDTR apabila telah ditetapkan. Untuk IMB/PBG sebelum Perbup berlaku, periksa ketentuan peralihan Lampiran Bab IV. Angka perbandingan tidak menetapkan kelaikan fungsi.";
