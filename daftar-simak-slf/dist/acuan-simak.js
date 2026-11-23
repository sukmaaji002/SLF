"use strict";

// Nomor kategori, indeks kelompok, dan indeks butir mengikuti catalog.js.
const checklistPlacements = {
  "K.1-0": [4, "Peruntukan bangunan", "PP 16/2021 tentang fungsi bangunan. Bandingkan RTRW/RDTR, dokumen lokasi, PBG/IMB, dan kondisi aktual."],
  "K.1-1": [4, "Intensitas bangunan", "PP 16/2021 tentang intensitas dan tata bangunan. Gunakan peraturan setempat serta dokumen izin yang berlaku."],
  "K.1-2": [4, "Penampilan bangunan", "PP 16/2021, tata bangunan dan arsitektur. Bandingkan gambar terbangun dan spesifikasi."],
  "K.1-3": [4, "Tata ruang dalam", "PP 16/2021, tata bangunan dan kenyamanan. Tinjau denah dan spesifikasi yang disetujui."],
  "K.1-4": [4, "Keselarasan dengan lingkungan", "PP 16/2021, keselarasan dengan lingkungan. Cek gambar tapak dan ketentuan lokasi."],
  "K.2-0": [5, "Pemeriksaan elemen struktur", "PP 16/2021; SNI 2847:2019 untuk beton; SNI 1726:2019 dan SNI 1727:2020 untuk telaah desain."],
  "K.2-1": [6, "Proteksi kebakaran", "SNI 03-1736-2000 untuk proteksi pasif; klasifikasi dan detail sesuai desain proteksi."],
  "K.2-2": [6, "Proteksi kebakaran", "PP 16/2021, proteksi aktif; periksa spesifikasi, inventaris, dan bukti uji sesuai sistem."],
  "K.2-3": [6, "Proteksi kebakaran", "SNI 03-1746-2000 untuk sarana jalan keluar dan PP 16/2021 untuk keselamatan kebakaran."],
  "K.2-4": [6, "Proteksi kebakaran", "PP 16/2021, keselamatan kebakaran; periksa rencana pengelolaan, penugasan, SOP, dan bukti latihan."],
  "K.2-5": [6, "Penangkal petir", "PP 16/2021; SNI IEC 62305-1:2013, prinsip umum proteksi petir."],
  "K.2-6": [6, "Instalasi listrik", "Seri SNI 0225 / PUIL 2020; pilih bagian sesuai komponen, proteksi, dan verifikasi instalasi."],
  "K.2-7": [6, "Keselamatan", "Periksa relevansi pada fungsi dan kegiatan objek. Acuan teknis khusus dipilih sesuai lingkup pemeriksaan."],
  "K.3-0": [6, "Penghawaan dan pencahayaan", "SNI 6572-1:2024 untuk desain ventilasi nonresidensial; ketentuan kesehatan lingkungan yang berlaku untuk kualitas udara."],
  "K.3-1": [6, "Penghawaan dan pencahayaan", "PP 16/2021, pencahayaan. SNI 7062:2019 dan Ralat 1:2020 untuk metode ukur iluminansi kerja."],
  "K.3-2": [6, "Air bersih, air limbah, dan air hujan", "SNI 8153:2025, suplai dan distribusi air pada bangunan."],
  "K.3-3": [6, "Air bersih, air limbah, dan air hujan", "SNI 8153:2025, saniter dan pembuangan air limbah."],
  "K.3-4": [6, "Air bersih, air limbah, dan air hujan", "SNI 8153:2025, jaringan air limbah; pertimbangkan skema sambungan dan pengolahan kawasan."],
  "K.3-5": [6, "Air bersih, air limbah, dan air hujan", "SNI 8153:2025 dan desain jaringan air hujan."],
  "K.3-6": [6, "Kesehatan", "PP 16/2021, penggunaan bahan bangunan dan kesehatan; telaah spesifikasi material."],
  "K.3-7": [6, "Persampahan dan utilitas khusus", "Gunakan ketentuan fasilitas pelayanan kesehatan dan acuan sistem gas medik bila relevan dengan fungsi bangunan."],
  "K.4-0": [4, "Kenyamanan", "PP 16/2021, ruang gerak dan hubungan antarruang; cek denah, okupansi desain, dan tata letak."],
  "K.4-1": [6, "Kenyamanan", "PP 16/2021, kenyamanan kondisi udara dalam ruang; pengukuran sesuai fungsi dan kondisi representatif."],
  "K.4-2": [4, "Kenyamanan", "PP 16/2021, kenyamanan pandangan; telaah orientasi, bukaan, dan kondisi lokasi."],
  "K.4-3": [6, "Kenyamanan", "PP 16/2021, kenyamanan terhadap getaran dan kebisingan."],
  "K.5-0": [6, "Kemudahan", "Permen PUPR 14/PRT/M/2017, hubungan horizontal; ketentuan sesuai komponen yang ada."],
  "K.5-1": [6, "Kemudahan", "Permen PUPR 14/PRT/M/2017, hubungan vertikal; periksa persyaratan sesuai fungsi dan kondisi bangunan."],
  "K.5-2": [6, "Kemudahan", "Permen PUPR 14/PRT/M/2017, kelengkapan sarana dan prasarana bangunan."],
  "K.5-3": [7, "Verifikasi tindak lanjut", "Permen PU 24/PRT/M/2008, pedoman pemeliharaan dan perawatan bangunan gedung."],
};
const checklistSpecificReferences = {
  "K.1-4-7": "Permen PUPR 14/PRT/M/2017, jalur pedestrian.",
  "K.1-4-9": "Permen PUPR 14/PRT/M/2017 untuk penandaan akses; SNI 03-1746-2000 bila terkait rute keluar.",
  "K.2-0-0": "PP 16/2021, standar keselamatan struktur. Telaah dokumen struktur/geoteknik dan keterbatasan akses.",
  "K.2-0-4": "PP 16/2021; SNI 1727:2020 untuk dasar pembebanan. Cocokkan standar material dengan sistem rangka.",
  "K.2-2-0": "SNI 03-1745-2000 (pipa tegak dan slang), jika sistem dipersyaratkan.",
  "K.2-2-1": "SNI 3989-2:2024 (sprinkler bangunan nonhunian), jika sistem dipersyaratkan.",
  "K.2-2-2": "PP 16/2021, proteksi aktif; periksa spesifikasi desain dan bukti uji pompa jika sistem dipersyaratkan.",
  "K.2-2-3": "PP 16/2021, proteksi aktif; cek kebutuhan pasokan air menurut sistem proteksi yang dipersyaratkan.",
  "K.2-2-5": "SNI 03-3985-2000 (deteksi dan alarm).",
  "K.2-2-6": "SNI 03-3985-2000 (deteksi dan alarm).",
  "K.2-2-8": "PP 16/2021, proteksi kebakaran; SNI 03-6571-2001 jika komponen bagian pengendali asap.",
  "K.2-2-9": "SNI 03-6571-2001 (sistem pengendali asap), jika dipersyaratkan.",
  "K.2-3-2": "Cocokkan judul butir dengan formulir resmi; acuan spesifik menunggu konfirmasi objek.",
  "K.2-3-3": "PP 16/2021, kemudahan dan keselamatan kebakaran; cek kondisi yang mewajibkan lift kebakaran.",
  "K.3-2-2": "Permenkes 2/2023, ketentuan dan lampiran yang masih berlaku sesuai jenis penggunaan air.",
  "K.3-5-0": "SNI 8153:2025, plambing dan penyaluran air hujan.",
  "K.3-5-1": "SNI 8153:2025, plambing dan penyaluran air hujan.",
  "K.3-5-2": "SNI 8456:2025 untuk sumur dan parit resapan air hujan.",
  "K.4-0-0": "PP 16/2021, kenyamanan dan keselamatan; SNI 03-1746-2000 untuk kaitan beban penghuni dan sarana keluar.",
  "K.4-3-0": "PP 16/2021, kenyamanan terhadap getaran. Pilih standar pengukuran sesuai sumber dan kondisi objek.",
  "K.4-3-1": "SNI 7231:2009 untuk pengukuran intensitas kebisingan di tempat kerja bila konteksnya sesuai.",
  "K.5-2-3": "PP 16/2021 dan Permen PUPR 14/PRT/M/2017 untuk kelengkapan sarana; verifikasi kewajiban fasilitas laktasi pada skenario kegiatan aktual.",
  "K.5-2-5": "PP 16/2021, sarana pengelolaan sampah. Lengkapi dengan ketentuan pengelolaan setempat yang relevan.",
};
const tegalChecklistReferences = {
  "K.1-0": "Perbup Tegal 12/2026 Pasal 7, Lampiran peruntukan fungsi, dan Perda Kabupaten Tegal 2/2023. Periksa pola ruang, ketentuan zonasi, dan PBG/IMB.",
  "K.1-1-0": "Perbup 12/2026 Pasal 8; Lampiran III.A.",
  "K.1-1-1": "Perbup 12/2026 Pasal 8; Lampiran III.D (KTB).",
  "K.1-1-2": "Perbup 12/2026 Pasal 8; Lampiran III.B.",
  "K.1-1-3": "Perbup Tegal 12/2026 Pasal 9 dan Lampiran Bab III.A. Pilih zona, kelas jalan, dan fungsi untuk menentukan batas lapis.",
  "K.1-1-4": "Perbup 12/2026; Lampiran III.D (lapis basemen jika ada).",
  "K.1-1-5": "Perbup 12/2026 Pasal 9 dan Lampiran Bab III.A; cek tinggi fisik pada PBG dan gambar. KBG dinyatakan dalam jumlah lantai.",
  "K.1-1-6": "Perbup 12/2026 Pasal 8; Lampiran III.C.",
  "K.1-1-7": "Perbup 12/2026 Pasal 9; Lampiran Bab III.B.1.a–b (GSP dan GSB jalan). Untuk objek sempadan lain, lihat Pasal 9 dan bagian objek terkait.",
  "K.1-1-8": "Perbup Tegal 12/2026 Pasal 9 ayat (1) huruf j dan Lampiran Bab III.B.2. Konfirmasi penerapan pada fungsi, jumlah lantai, dan persil objek.",
  "K.1-1-9": "Perbup 12/2026 Pasal 9 ayat (1) huruf k; Lampiran Bab III.B.3 tentang jarak antarmassa dalam satu persil.",
  "K.1-2-5": "Perbup 12/2026 Pasal 9; Lampiran Bab III.B.1.a untuk pagar.",
  "K.1-4-1": "Perbup Tegal 12/2026 Lampiran III.C. Untuk Perkot-PPK, bedakan KDH persil dan RTH kawasan.",
  "K.1-4-2": "Perbup 12/2026 Pasal 9; Lampiran Bab III.B.1 sesuai jenis sempadan.",
  "K.1-4-3": "Perbup 12/2026 Lampiran III.C; cek ruang hijau yang dapat dihitung.",
  "K.1-4-5": "Perbup 12/2026 Lampiran III.A, perkerasan parkir terbuka; geometri dan drainase pada gambar tapak.",
  "K.3-5-2": "SNI 8456:2025 untuk sumur/parit resapan; lihat Perbup 12/2026 Lampiran Bab IV untuk skenario izin lama yang relevan.",
};

function checklistReference(id, tegal = false) {
  const group = id.slice(0, id.lastIndexOf("-"));
  const base = checklistSpecificReferences[id] ?? checklistPlacements[group]?.[2] ?? "Verifikasi acuan sesuai fungsi dan sistem bangunan.";
  const local = tegal && (tegalChecklistReferences[id] || tegalChecklistReferences[group]);
  return local || base;
}

function checklistReason(check) {
  return check.reason?.trim() || check.rows[0]?.note?.trim() || "";
}

function checklistDestination(project, item) {
  const group = item.id.slice(0, item.id.lastIndexOf("-"));
  const [defaultIndex, headingTitle] = checklistPlacements[group];
  const compactHeadings = {
    "K.1": "Tata bangunan dan lingkungan", "K.2": "Keselamatan", "K.3": "Kesehatan", "K.4": "Kenyamanan", "K.5": "Kemudahan",
  };
  let templateIndex = defaultIndex;
  let title = headingTitle;
  if (project.template === "ringkas") {
    templateIndex = group === "K.5-3" ? 3 : 2;
    title = templateIndex === 3 ? "Resume daftar simak" : compactHeadings[item.category.code];
  }
  if (project.template === "simak") {
    templateIndex = 4;
    title = group === "K.5-3" ? "Tindak lanjut dan lampiran pendukung" : group === "K.2-0" ? "Bidang struktur" :
      item.category.code === "K.1" || item.category.code === "K.5" ? "Bidang arsitektur" : "Bidang mekanikal, elektrikal, dan plambing";
  }
  const originalTitle = reportTemplates[project.template].chapters[templateIndex]?.[0];
  const chapter = project.chapters.findIndex((entry) => !entry.checklist && entry.title === originalTitle);
  if (chapter < 0) return null;
  const block = project.chapters[chapter].blocks.findIndex((entry) => entry.type === "heading" && entry.text === title);
  return { chapter, block, title: block < 0 ? originalTitle : title };
}

const checklistSummaryOrder = ["nonconformity", "measurement", "note", "observation", "test", "ndt", "damage", "presence",
  "conformity", "view", "disruption", "direction", "routine", "periodic", "unscheduled", "component", "location", "photo", "ndtPhoto"];

function formatChecklistMeasurement(value, unit) {
  return unit && /^[-+−]?\d[\d.,\s]*$/.test(value.trim()) ? value.trim() + " " + unit : value;
}

function checklistSummary(item, check, rich = false) {
  if (!check) return "";
  if (check.na) {
    const reason = checklistReason(check);
    const format = getTextFormat(check, "reason") || getTextFormat(check.rows[0], "note");
    return rich && reason && format ? [document.createTextNode("Tidak berlaku. "), formattedValue(reason, format)].reduce((fragment, node) => {
      fragment.append(node);
      return fragment;
    }, document.createDocumentFragment()) : ["Tidak berlaku", reason].filter(Boolean).join(". ");
  }
  const available = check.rows.filter((row) => checklistSummaryOrder.some((key) => row[key]?.trim()));
  const first = available[0];
  if (!first) return "";
  const keys = checklistSummaryOrder.filter((key) => first[key]?.trim()).slice(0, 3);
  const value = (key) => key === "measurement" ? formatChecklistMeasurement(first[key], item.unit) : first[key].trim();
  const parts = keys.map((key) => checklistLabels[key] + ": " + value(key));
  const summary = parts.join("\n");
  const more = available.length > 1 ? "\n+" + (available.length - 1) + " baris di lampiran" : "";
  if (rich && summary.length <= 380 && keys.some((key) => getTextFormat(first, key))) {
    const fragment = document.createDocumentFragment();
    for (const key of keys) {
      const line = styleTextBlock(document.createElement("div"), getTextFormat(first, key));
      line.append(checklistLabels[key] + ": ", formattedText(value(key), getTextFormat(first, key)));
      fragment.append(line);
    }
    fragment.append(more);
    return fragment;
  }
  return (summary.length > 380 ? summary.slice(0, 377) + "…" : summary) + more;
}
