"use strict";

const healthSources = {
  lighting: ["SNI 6197:2020 · pencahayaan rata-rata minimum", "https://pesta.bsn.go.id/produk/detail/13243-sni61972020"],
  office: ["Permenkes 48/2016 · Lampiran Bab IV", "https://peraturan.bpk.go.id/Details/113097/permenkes-no-48-tahun-2016"],
  water: ["Permenkes 2/2023 · Lampiran Bab II A", "https://peraturan.bpk.go.id/Details/245563/permenkes-no-2-tahun-2023"],
  indoor: ["Permenkes 2/2023 · Lampiran Bab II B", "https://peraturan.bpk.go.id/Details/245563/permenkes-no-2-tahun-2023"],
  sanitation: ["Permenaker 5/2018 · Pasal 34", "https://jdih.kemnaker.go.id/peraturan/detail/1546/peraturan-menteri-nomor-5-tahun-2018"],
  ventilation: ["SNI 6572-1:2024 · ventilasi gedung nonresidensial", "https://pesta.bsn.go.id/produk/detail/14965-sni6572-12024"],
  building: ["PP 16/2021", "https://peraturan.bpk.go.id/Download/244292/PP%20Nomor%2016%20Tahun%202021-dikompresi.pdf"],
  liftingEquipment: ["Permenaker 8/2020", "https://jdih.kemnaker.go.id/asset/data_puu/Permen_8_Tahun_2020.pdf"],
  plumbing: ["SNI 8153:2025 · sistem plambing", "https://pesta.bsn.go.id/produk/by_ics/629"],
  accessibility: ["Permen PUPR 14/PRT/M/2017", "https://peraturan.bpk.go.id/Details/104477/permen-pupr-no-14prtm2017-tahun-2017"],
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
const indoorRange = (min, max) => ({ id: "public-indoor", label: "Permukiman, rekreasi, atau fasilitas umum · acuan umum",
  min, max, source: "indoor", section: "Tabel 13" });
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
      { id: "office-drafting", label: "Perkantoran · ruang gambar (K3)", min: 750, source: "office", section: "Tabel 6" },
      { id: "office-dining", label: "Perkantoran · ruang makan (K3)", min: 250, source: "office", section: "Tabel 6" },
    ],
    below: "Bersihkan armatur, ganti lampu yang redup atau mati, dan tambah atau atur ulang posisi armatur pada area yang gelap agar pencahayaan lebih merata.",
    above: "Kurangi keluaran lampu dengan pengatur intensitas atau pembagian zona. Pasang peneduh atau diffuser pada sumber cahaya yang menyilaukan.",
  },
  temperature: {
    label: "Suhu udara", unit: "°C", source: "office",
    categories: [...officeRange([[23, 26], [23, 28]]), indoorRange(18, 30)],
    below: "Pada ruang ber-AC, naikkan setelan suhu secara bertahap dan arahkan hembusan menjauh dari pengguna. Pada ruang tanpa AC, lindungi area pengguna dari hembusan dingin sambil mempertahankan ventilasi minimum.",
    above: "Kurangi panas matahari dengan peneduh. Pada ruang ber-AC, bersihkan filter atau koil dan seimbangkan distribusi udara dingin. Pada ruang tanpa AC, tingkatkan ventilasi silang jika udara luar lebih sejuk.",
  },
  humidity: {
    label: "Kelembapan relatif", unit: "% RH", source: "office",
    categories: [...officeRange([[40, 60], [30, 70]]), indoorRange(40, 60)],
    below: "Kurangi pengeringan berlebih dari sistem tata udara. Jika diperlukan, tambahkan humidifikasi yang dapat dikendalikan dan dirawat agar tidak terjadi kondensasi.",
    above: "Perbaiki kebocoran dan kondensasi, gunakan exhaust pada ruang basah, dan tingkatkan pengendalian kelembapan melalui AC atau dehumidifier sesuai beban ruang.",
  },
  airSpeed: {
    label: "Kecepatan udara", unit: "m/detik", source: "office",
    categories: [{ id: "office", label: "Perkantoran · udara dalam ruang", min: 0.15, max: 0.5 }, indoorRange(0.15, 0.25)],
    below: "Bebaskan jalur aliran udara, bersihkan kisi dan filter, lalu atur bukaan atau kecepatan kipas agar aliran mencapai zona pengguna.",
    above: "Kurangi kecepatan kipas atau atur ulang arah diffuser agar aliran tidak langsung mengenai pengguna. Jaga debit udara segar sesuai kebutuhan ruang.",
  },
  openings: {
    label: "Luas bukaan ventilasi", unit: "% luas lantai", source: "office",
    categories: [
      { id: "pp-natural", label: "Ventilasi alami · batas umum PP 16/2021", min: 5, source: "building",
        section: "Standar Teknis Ventilasi Alami, butir III.a, hlm. 583",
        guidance: "Hasil ukur (%) = luas bukaan ÷ luas lantai yang membutuhkan ventilasi × 100." },
      { id: "office-natural", label: "Khusus ruang kerja kantor tanpa AC · ventilasi silang", min: 15,
        section: "Ventilasi Udara, butir 12, hlm. 65" },
      { id: "nonresidential", label: "Ventilasi alami nonresidensial · desain SNI 6572-1:2024", manual: true,
        source: "ventilation", section: "Pasal 6.4.2", guidance: "Isi batas dari perhitungan desain zona. SNI menentukan ukuran bukaan berdasarkan konfigurasi bukaan dan kebutuhan aliran udara, antara lain melalui Tabel 7 atau 8 pada Jalur A." },
    ],
    below: "Singkirkan penghalang pada bukaan, pulihkan bukaan yang macet, dan tambah luas bebas bukaan pada sisi masuk dan keluar udara. Jika bukaan terbatas, rancang ventilasi mekanis sesuai kebutuhan ruang.",
    above: "Jika acuan menetapkan batas maksimum, gunakan kisi atau bukaan yang dapat diatur untuk mengendalikan luas efektif. Pertahankan kebutuhan udara segar.",
  },
  ventilationPerPerson: {
    label: "Pertukaran udara per orang", unit: "m³/menit/orang", source: "office",
    categories: [
      { id: "office-work", label: "Perkantoran · ruang kerja", min: 0.57, section: "Ventilasi udara" },
      { id: "office-meeting", label: "Perkantoran · ruang pertemuan", min: 1.05, section: "Ventilasi udara" },
    ],
    below: "Naikkan suplai udara segar dan seimbangkan suplai dengan pembuangan. Bila kapasitas sistem belum cukup, batasi hunian sementara sesuai debit yang tersedia.",
    above: "Setel damper atau kecepatan kipas sesuai jumlah pengguna dan acuan yang dipakai. Pertahankan kebutuhan minimum udara segar.",
  },
  outdoorAir: {
    label: "Debit udara luar", unit: "L/detik", source: "ventilation",
    categories: [{ id: "nonresidential", label: "Gedung nonresidensial · sesuai fungsi dan hunian", manual: true }],
    below: "Bersihkan filter dan intake, buka atau setel damper udara luar, lalu seimbangkan debit tiap zona. Evaluasi kapasitas kipas bila debit tetap kurang.",
    above: "Setel damper atau kendali kipas untuk mengurangi kelebihan debit sambil mempertahankan suplai minimum udara luar dan tekanan ruang yang disyaratkan.",
  },
  ph: {
    label: "pH air", unit: "pH", source: "water",
    categories: [
      ...waterCategories({ min: 6.5, max: 8.5 }),
      { id: "pool-chlorine", label: "Kolam renang · disinfeksi klorin", min: 7, max: 7.8, section: "Tabel 6" },
      { id: "pool-bromine", label: "Kolam renang · disinfeksi bromin", min: 7, max: 8, section: "Tabel 6" },
    ],
    below: "Untuk air minum atau higiene, evaluasi pengolahan untuk menaikkan pH secara terkendali. Untuk kolam, sesuaikan pengatur pH dan alkalinitas melalui operator pengolahan air.",
    above: "Periksa kemungkinan kelebihan bahan alkali pada sistem pengolahan. Sesuaikan proses atau pengatur pH secara bertahap melalui operator pengolahan air.",
  },
  turbidity: {
    label: "Kekeruhan air", unit: "NTU", source: "water",
    categories: [...waterCategories({ max: 3, exclusiveMax: true }),
      { id: "pool", label: "Kolam renang", max: 0.5, section: "Tabel 4" }],
    above: "Cegah masuknya sedimen, bersihkan tangki penampung, dan cuci balik atau ganti media filter. Untuk kolam, periksa juga debit sirkulasi melalui filter.",
  },
  tds: {
    label: "Zat padat terlarut (TDS)", unit: "mg/L", source: "water",
    categories: waterCategories({ max: 300, exclusiveMax: true }),
    above: "Telusuri sumber zat terlarut dan evaluasi penggunaan sumber alternatif atau unit pengolahan pengurang TDS berdasarkan hasil uji kualitas air.",
  },
  ecoli: {
    label: "E. coli dalam air", unit: "CFU/100 mL", source: "water",
    categories: waterCategories({ max: 0 }),
    above: "Jika digunakan untuk konsumsi, hentikan pemakaian untuk minum sementara. Lindungi sumber air, perbaiki jalur masuk kontaminasi, lalu bersihkan dan disinfeksi tandon serta pipa terdampak. Verifikasi mutu air sebelum digunakan kembali.",
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
    below: "Sediakan kembali perlengkapan yang kurang. Bila aliran air atau drainase bermasalah, perbaiki sambungan atau bersihkan sumbatan. Untuk temuan kebersihan, jadwalkan pembersihan rutin.",
  },
  plumbing: {
    label: "Plambing dan pembuangan air", unit: "status", source: "plumbing",
    categories: [{ id: "building", label: "Instalasi gedung · sesuai kriteria yang diperiksa", manual: true }],
    below: "Perbaiki komponen yang tidak memenuhi kriteria, seperti sambungan bocor, saluran tersumbat, atau perangkap bau yang tidak berfungsi. Uji fungsi bagian yang diperbaiki.",
  },
  noise: {
    label: "Kebisingan ruang", unit: "dBA", source: "office",
    categories: [
      ["open-office", "Perkantoran · kantor umum atau terbuka", 55, 65],
      ["private-office", "Perkantoran · kantor pribadi", 50, 55],
      ["canteen", "Perkantoran · ruang umum atau kantin", 65, 75],
      ["meeting", "Perkantoran · ruang rapat", 65, 75],
    ].map(([id, label, min, max]) => ({ id, label, min, max, section: "Tabel 6" })),
    below: "Identifikasi kebutuhan keterdengaran alarm atau pengumuman. Jika tingkat suara minimum memang disyaratkan untuk fungsi ruang, sesuaikan sistem pengumuman atau tata akustik sesuai kebutuhan pengguna.",
    above: "Redam kebisingan pada sumbernya dengan perawatan alat, dudukan isolasi getaran, atau penutup akustik. Bila suara masuk dari luar, rapatkan celah atau perbaiki pemisah antar-ruang.",
  },
  circulation: {
    label: "Lebar ruang gerak", unit: "cm", source: "building",
    categories: [
      { id: "furniture-near-door", label: "Jarak perabot dari bukaan daun pintu", min: 75,
        section: "Ketentuan pintu, hlm. 680 dan Gambar II.94",
        guidance: "Ukur jarak dari bukaan daun pintu ke perabot terdekat. Pastikan area ayunan pintu bebas hambatan." },
      { id: "gallery", label: "Selasar · kursi roda atau dua orang berpapasan", min: 140,
        section: "Ketentuan selasar, hlm. 690", guidance: "Ukur lebar efektif di bagian selasar yang paling sempit." },
      ...[
        ["corridor-one", "Koridor · 1 pengguna kursi roda", 92],
        ["corridor-pedestrian", "Koridor · 1 penyandang disabilitas dan 1 pejalan kaki", 152],
        ["corridor-two", "Koridor · 2 pengguna kursi roda", 184],
        ["corridor-railing-one", "Koridor dengan pegangan rambat · 1 pengguna kursi roda", 112],
        ["corridor-railing-two", "Koridor dengan pegangan rambat · 2 pengguna kursi roda", 204],
      ].map(([id, label, min]) => ({ id, label, min, section: "Ketentuan koridor, hlm. 692",
        guidance: "Ukur lebar bebas di titik tersempit dengan memperhitungkan penghalang dan pegangan rambat." })),
      { id: "layout", label: "Area sekitar perabot/rak · sesuai fungsi dan tata letak", manual: true,
        section: "Pasal 42", pending: "Batas mengikuti fungsi dan tata letak ruang",
        guidance: "Untuk jarak antarrak atau perabot, masukkan batas dari denah, standar teknis, atau ketentuan operasional yang berlaku untuk area tersebut." },
    ],
    below: "Atur ulang perabot dan pindahkan barang dari jalur gerak agar lebar efektif memenuhi acuan dari awal hingga akhir jalur.",
  },
  forkliftClearance: {
    label: "Jarak bebas lintasan forklift", unit: "cm", source: "liftingEquipment",
    categories: [
      { id: "one-way", label: "Forklift satu arah · jarak bebas sisi lintasan", min: 60, section: "Pasal 84 huruf a",
        guidance: "Ukur jarak bebas sisi lintasan dari sisi terluar alat atau muatan yang paling lebar." },
      { id: "two-way", label: "Forklift dua arah · jarak bebas antarkendaraan", min: 90, section: "Pasal 84 huruf b",
        guidance: "Ukur jarak bebas di antara sisi terluar kedua alat atau muatan terlebar pada kedua alat." },
    ],
    below: "Tambah jarak bebas dengan mengatur ulang rak, barang, atau lintasan. Sesuaikan pengaturan arah lalu lintas alat angkut sebelum lintasan digunakan.",
  },
  glare: {
    label: "Silau di area pengguna", unit: "status",
    categories: [{ id: "work", label: "Area kerja · isi kriteria", manual: true }],
    below: "Pasang peneduh pada jendela, gunakan diffuser pada armatur, atau ubah posisi meja agar pantulan cahaya tidak mengenai bidang kerja dan layar.",
  },
  vibration: {
    label: "Getaran ruang", unit: "mm/s",
    categories: [{ id: "occupied", label: "Ruang yang digunakan · isi kriteria dan metode", manual: true }],
    above: "Pisahkan sumber getaran dengan dudukan isolasi, periksa keseimbangan dan pengikat mesin, atau pindahkan peralatan agar getaran tidak merambat ke ruang pengguna.",
  },
  doorClear: {
    label: "Lebar efektif bukaan pintu", unit: "cm", source: "accessibility",
    categories: [
      { id: "main", label: "Gedung umum · pintu masuk/keluar utama", min: 90, section: "Lampiran II A.1" },
      { id: "other", label: "Gedung umum · pintu lain", min: 80, section: "Lampiran II A.1" },
    ],
    below: "Singkirkan penghalang pada bukaan dan atur arah serta sudut bukaan daun pintu. Jika celah efektif masih kurang, sesuaikan posisi kusen atau ganti rakitan pintu sesuai lebar minimum.",
  },
  rampSlope: {
    label: "Kelandaian ram aksesibel", unit: "°", source: "accessibility",
    categories: [
      { id: "indoor", label: "Ram di dalam bangunan", max: 6, section: "Lampiran II B.2" },
      { id: "outdoor", label: "Ram di luar bangunan", max: 5, section: "Lampiran II B.2" },
    ],
    above: "Perpanjang lintasan ram atau gunakan lintasan balik untuk mengurangi kemiringan. Rancang bordes datar dan sediakan ruang manuver serta pegangan rambat sesuai acuan.",
  },
  rampWidth: {
    label: "Lebar efektif ram aksesibel", unit: "cm", source: "accessibility",
    categories: [
      { id: "without-curb", label: "Ram tanpa tepi pengaman", min: 95, section: "Lampiran II B.2" },
      { id: "with-curb", label: "Ram dengan tepi pengaman", min: 120, section: "Lampiran II B.2" },
    ],
    below: "Singkirkan penghalang pada lintasan ram dan lebarkan permukaan yang dapat digunakan sesuai konfigurasi tepi pengaman serta pegangan rambat.",
  },
  accessibleToilet: {
    label: "Fasilitas toilet aksesibel", unit: "status", source: "accessibility",
    categories: [{ id: "features", label: "Toilet aksesibel · isi kriteria fasilitas", manual: true }],
    below: "Bebaskan ruang manuver, sesuaikan arah bukaan pintu, dan lengkapi pegangan rambat serta perlengkapan pada posisi yang dapat dijangkau sesuai kriteria.",
  },
  guidance: {
    label: "Jalur pemandu dan penunjuk arah", unit: "status", source: "accessibility",
    categories: [{ id: "route", label: "Jalur akses · isi kriteria", manual: true }],
    below: "Bebaskan jalur dari penghalang, sambungkan jalur pemandu yang terputus, dan letakkan rambu berkontras pada akses utama serta titik perubahan arah.",
  },
  custom: {
    label: "Aspek lain · isi sendiri", unit: "", categories: [],
    below: "Tingkatkan hasil hingga batas minimum acuan. Isi tindakan teknis sesuai komponen yang diperiksa.",
    above: "Kurangi hasil hingga batas maksimum acuan. Isi tindakan teknis sesuai komponen yang diperiksa.",
  },
};
const inspectionParameters = {
  health: ["lighting", "temperature", "humidity", "airSpeed", "openings", "ventilationPerPerson", "outdoorAir", "ph", "turbidity", "tds", "ecoli", "sanitation", "plumbing", "noise", "custom"],
  comfort: ["circulation", "forkliftClearance", "temperature", "humidity", "airSpeed", "lighting", "glare", "noise", "vibration", "custom"],
  ease: ["doorClear", "rampSlope", "rampWidth", "circulation", "accessibleToilet", "guidance", "custom"],
};
const defaultInspectionParameters = {
  health: ["lighting", "temperature", "humidity", "openings", "ph", "turbidity", "sanitation"],
  comfort: ["circulation", "temperature", "humidity", "noise", "glare"],
  ease: ["doorClear", "rampSlope", "accessibleToilet", "guidance"],
};
const healthMeasurementFields = ["parameter", "location", "category", "measured", "minimum", "maximum", "reference", "name", "unit", "recommendationMode"];
const healthNumberFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 6 });

function healthNumber(raw) {
  const text = raw?.trim() ?? "";
  if (!/^-?\d+(?:[.,]\d+)?$/.test(text)) return null;
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function ventilationWarehouse(row) {
  if (row.parameter !== "openings") return false;
  const location = row.location?.trim() || "";
  return /^(?:ruang\s+)?gudang\b/i.test(location) &&
    !/\b(?:kantor|perkantoran|ruang\s+kerja|administrasi|admin|office)\b/i.test(location);
}

function healthMeasurement(row) {
  const parameter = Object.hasOwn(healthParameters, row.parameter) ? healthParameters[row.parameter] : undefined;
  if (!parameter) return {};
  const officeMismatch = row.category === "office-natural" && ventilationWarehouse(row);
  const category = officeMismatch ? undefined : parameter.categories.find((entry) => entry.id === row.category);
  const custom = row.parameter === "custom";
  const manual = Boolean(custom || category?.manual || row.category === "manual");
  const source = category ? healthSources[category.source ?? parameter.source] : undefined;
  const reference = [source?.[0], category?.section, manual ? row.reference?.trim() : ""].filter(Boolean).join(" · ");
  const unit = custom ? row.unit?.trim() || "" : parameter.unit;
  const qualitative = parameter.unit === "status";
  const min = manual ? qualitative ? 1 : healthNumber(row.minimum) : category?.min ?? null;
  const max = manual ? (qualitative ? null : healthNumber(row.maximum)) : category?.max ?? null;
  const hasManualLimits = [row.minimum, row.maximum].every((value) => !value?.trim() || healthNumber(value) !== null);
  const comparable = Boolean((category || manual) && (!manual || (
    row.reference?.trim() && (!custom || row.name?.trim()) && (qualitative || hasManualLimits))) && (min !== null || max !== null) &&
    (min === null || max === null || min <= max));
  const number = qualitative ? (["0", "1"].includes(row.measured) ? Number(row.measured) : null) : healthNumber(row.measured);
  const valid = number !== null && (custom || unit === "°C" || number >= 0) &&
    (parameter.unit !== "pH" || number <= 14) && (parameter.unit !== "% RH" || number <= 100);
  const numberText = (value) => healthNumberFormat.format(value);
  const suffix = unit ? " " + unit : "";
  const threshold = comparable ? qualitative ? "Terpenuhi" :
    (min !== null && max !== null ? numberText(min) + "–" + numberText(max) :
      min !== null ? "≥ " + numberText(min) : (category?.exclusiveMax ? "< " : "≤ ") + numberText(max)) + suffix : "";
  const measured = valid ? qualitative ? (number === 1 ? "Terpenuhi" : "Belum terpenuhi") : numberText(number) + suffix : "";
  const below = valid && min !== null && number < min;
  const above = valid && max !== null && (number > max || (category?.exclusiveMax && number === max));
  const status = officeMismatch ? "Pilih acuan yang sesuai untuk gudang" :
    !row.category && !custom ? "Pilih kategori atau acuan" :
    !comparable ? "Lengkapi acuan pembanding" :
      !row.measured?.trim() ? "Belum diukur atau diperiksa" :
        !valid ? "Periksa kembali hasil ukur" : below || above ? "Di luar acuan" : "Memenuhi parameter ini";
  const recommendation = !comparable || !valid ? "" :
    below ? parameter.below ?? healthParameters.custom.below :
      above ? parameter.above ?? healthParameters.custom.above :
        "Pertahankan kondisi dan jadwal pemeliharaan. Catat hasil dan bukti pemeriksaan.";
  return { parameter, category, manual, source, reference, threshold, measured, status, recommendation, unit, officeMismatch };
}

function healthMeasurementValues(row) {
  const result = healthMeasurement(row);
  if (!result.parameter || ![row.location, row.name, row.measured, row.reference, row.parameter !== "custom" ? row.category : ""]
    .some((value) => value?.trim())) return ["", "", "", ""];
  return [row.parameter === "custom" ? row.name?.trim() || "Aspek lain" : result.parameter.label,
    [row.location, result.category?.label || (result.manual ? "Acuan lain" : "")].filter(Boolean).join(" · "),
    [result.threshold, result.reference].filter(Boolean).join(" · "),
    [result.measured || row.measured?.trim(), result.status].filter(Boolean).join(" · ")];
}

function inspectionRecommendation(row, value) {
  return row.recommendationMode === "manual" || value.trim() ? value : healthMeasurement(row).recommendation;
}

function initializeHealthMeasurements(project) {
  for (const chapter of project.chapters) for (const block of chapter.blocks) {
    const kind = architectureInspectionKind(block);
    if (!kind && !block.healthMeasurements) continue;
    if (block.headers[4] === "Bukti / gambar") block.headers[4] = architectureHealthColumns[4];
    if (!block.healthMeasurements && JSON.stringify(block.headers) !== JSON.stringify(architectureHealthColumns)) continue;
    block.inspectionKind = kind || "health";
    if (block.healthMeasurements) continue;
    ensureReportReferences({ chapters: [{ blocks: [block] }] });
    const blank = block.rows.findIndex((row, index) => !row.some((cell, column) =>
      cell.trim() || block.cellLinks?.[tableCellKey(block, index, column)] ||
      getTextFormat(block, "cell:" + tableCellKey(block, index, column))) && !block.rowImages?.[block.rowIds[index]]);
    block.healthMeasurements = {};
    for (const [index, parameter] of defaultInspectionParameters[kind || "health"].entries()) {
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

function healthMeasurementCells(row, locations, kind) {
  const choices = [...new Set([...inspectionParameters[kind], row.parameter])];
  const parameterSelect = dom("select", { ariaLabel: "Parameter pemeriksaan" },
    ...choices.map((id) => new Option(healthParameters[id].label, id)));
  parameterSelect.value = row.parameter;
  const categorySelect = dom("select", { ariaLabel: "Kategori ruang atau sistem" });
  let categoryParameter;
  let categoryWarehouse;
  const categoryField = dom("label", {}, "Kategori atau acuan", categorySelect);
  const customFields = dom("div", { className: "health-measurement" });
  const threshold = dom("p", { className: "health-threshold" });
  const source = dom("p", { className: "hint" });
  const guidance = dom("p", { className: "hint" });
  const manual = dom("div", { className: "health-measurement" });
  const generalVentilation = button("Pilih acuan PP 16/2021 (≥ 5%)", () => {
    categorySelect.value = "pp-natural";
    selectCategory();
  }, "quiet");
  const numericResult = dom("input", { inputMode: "decimal", ariaLabel: "Hasil pengukuran", placeholder: "Contoh · 325,5" });
  const visualResult = dom("select", { ariaLabel: "Hasil pemeriksaan" },
    new Option("Pilih hasil", ""), new Option("Terpenuhi", "1"), new Option("Belum terpenuhi", "0"));
  const resultLabel = dom("span", {}, "Hasil pengukuran");
  const numericField = dom("label", {}, resultLabel, numericResult);
  const visualField = dom("label", {}, "Hasil pemeriksaan", visualResult);
  const status = dom("p", { className: "health-status", role: "status" });
  const location = field("Nama ruang atau titik ukur", row.location, (value) => {
    row.location = value;
    locationSelect.value = locations.find((name) => tokenName(name) === tokenName(value)) || "";
    commit();
  });
  const locationInput = location.querySelector("input");
  const locationSelect = dom("select", { ariaLabel: "Ambil nama ruang dari isian sebelumnya" },
    new Option("Pilih dari isian sebelumnya", ""), ...locations.map((name) => new Option(name, name)));
  locationSelect.value = locations.find((name) => tokenName(name) === tokenName(row.location || "")) || "";
  locationSelect.addEventListener("change", () => {
    if (!locationSelect.value) return;
    locationInput.value = locationSelect.value;
    row.location = locationInput.value;
    commit();
  });
  function commit() {
    updateResult();
    refreshLinkedFields();
    save();
  }
  function selectCategory() {
    row.category = categorySelect.value;
    commit();
  }
  function updateResult() {
    const result = healthMeasurement(row);
    const warehouse = ventilationWarehouse(row);
    if (categoryParameter !== row.parameter || categoryWarehouse !== warehouse) {
      const categories = result.parameter.categories.filter(({ id }) => !warehouse || id !== "office-natural");
      categorySelect.replaceChildren(new Option("Pilih kategori atau acuan", ""),
        ...categories.map(({ id, label }) => new Option(label, id)), new Option("Acuan lain · isi sendiri", "manual"));
      categorySelect.value = result.officeMismatch ? "" : row.category || "";
      categoryParameter = row.parameter;
      categoryWarehouse = warehouse;
    }
    const ventilationDesign = row.parameter === "openings" && row.category === "nonresidential";
    threshold.textContent = result.threshold ||
      (result.officeMismatch ? "Acuan kantor khusus ruang kerja tanpa AC" :
        ventilationDesign ? "Batas mengikuti perhitungan desain" : result.category?.pending ?? "Acuan belum lengkap");
    source.replaceChildren(...(result.source ? [dom("a", { href: result.source[1], target: "_blank", rel: "noopener",
      title: [result.source[0], result.category?.section].filter(Boolean).join(" · ") },
      [result.source[0].split(" · ")[0], result.category?.section].filter(Boolean).join(" · "))] : []));
    source.hidden = !result.source;
    guidance.textContent = result.officeMismatch ? "Gunakan PP 16/2021 untuk batas umum luas bukaan gudang." :
      result.category?.guidance ?? "";
    guidance.hidden = !guidance.textContent;
    generalVentilation.hidden = !(ventilationDesign || result.officeMismatch || (warehouse && !row.category));
    manual.hidden = !result.manual;
    const qualitative = result.parameter.unit === "status";
    numericField.hidden = qualitative;
    visualField.hidden = !qualitative;
    resultLabel.textContent = result.unit ? "Hasil ukur (" + result.unit + ")" : "Hasil ukur";
    status.textContent = result.status;
    status.dataset.status = result.status === "Memenuhi parameter ini" ? "pass" : result.status === "Di luar acuan" ? "fail" : "";
  }
  function makeNumberField(key, label) {
    const control = field(label, row[key], (value) => { row[key] = value; commit(); });
    control.querySelector("input").inputMode = "decimal";
    return control;
  }
  function updateParameter() {
    const parameter = healthParameters[row.parameter];
    const custom = row.parameter === "custom";
    categoryField.hidden = custom;
    customFields.hidden = !custom;
    customFields.replaceChildren(...(custom ? [
      field("Jenis aspek", row.name, (value) => { row.name = value; commit(); }),
      field("Satuan (jika ada)", row.unit, (value) => { row.unit = value; commit(); }),
    ] : []));
    numericResult.value = row.measured || "";
    numericResult.placeholder = row.parameter === "openings" ? "Contoh · 5,5" : "Contoh · 325,5";
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
    for (const key of healthMeasurementFields) {
      if (!["location", "parameter", "recommendationMode"].includes(key)) delete row[key];
    }
    row.parameter = parameterSelect.value;
    updateParameter();
    commit();
  });
  categorySelect.addEventListener("change", selectCategory);
  numericResult.addEventListener("input", () => { row.measured = numericResult.value; commit(); });
  visualResult.addEventListener("change", () => { row.measured = visualResult.value; commit(); });
  updateParameter();
  return [
    dom("td", {}, dom("div", { className: "health-measurement" },
      dom("label", {}, "Parameter", parameterSelect), customFields)),
    dom("td", {}, dom("div", { className: "health-measurement" },
      locations.length ? dom("label", {}, "Ruang dari isian sebelumnya", locationSelect) : "",
      location,
      categoryField)),
    dom("td", {}, dom("div", { className: "health-measurement" },
      dom("span", { className: "health-field-label" }, "Acuan pembanding"), threshold, source, guidance, generalVentilation, manual)),
    dom("td", {}, dom("div", { className: "health-measurement" },
      numericField, visualField, status)),
  ];
}
