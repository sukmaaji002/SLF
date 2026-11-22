"use strict";

const reportTemplates = {
  disiplin: {
    label: "Kajian per disiplin · 8 bab",
    description: "Pisahkan arsitektur, struktur, dan mekanikal–elektrikal–plambing. Daftar simak ditempatkan setelah rekomendasi.",
    chapters: [
      ["Pendahuluan", "Latar belakang", "Maksud, tujuan, dan sasaran", "Lingkup pekerjaan", "Tim pengkaji teknis"],
      ["Metode dan landasan hukum", "Metode pemeriksaan", "Alat dan bahan", "Standar dan referensi yang digunakan"],
      ["Gambaran umum", "Identitas dan fungsi bangunan", "Kondisi eksisting", "Data teknis bangunan"],
      ["Tinjauan aspek dokumen administrasi", "Dokumen pemilik dan pertanahan", "PBG / IMB dan dokumen teknis", "Temuan administrasi"],
      ["Pengkajian teknis bidang arsitektur", "Peruntukan dan intensitas bangunan", "Penampilan dan tata ruang", "Kesesuaian dengan lingkungan"],
      ["Pengkajian teknis bidang struktur", "Data struktur dan metode pengujian", "Hasil pemeriksaan", "Temuan dan tindak lanjut"],
      ["Pengkajian teknis bidang MEP", "Mekanikal, elektrikal, dan plambing", "Proteksi kebakaran dan keselamatan", "Kesehatan, kenyamanan, dan kemudahan"],
      ["Kesimpulan dan rekomendasi", "Kesimpulan pengkajian", "Rekomendasi dan tindak lanjut"],
    ],
  },
  ringkas: {
    label: "Pemeriksaan terpadu · 4 bab",
    description: "Gabungkan pemeriksaan persyaratan bangunan dalam satu bab, dengan kesimpulan per aspek dan lampiran daftar simak.",
    chapters: [
      ["Pendahuluan", "Identitas objek pemeriksaan", "Latar belakang, maksud, dan tujuan", "Dasar hukum dan lingkup pekerjaan"],
      ["Parameter dan metodologi", "Parameter administratif dan teknis", "Pemeriksaan dokumen dan observasi lapangan", "Pengujian dan analisis"],
      ["Pemeriksaan persyaratan bangunan gedung", "Tata bangunan dan lingkungan", "Keselamatan dan struktur", "Kesehatan", "Kenyamanan", "Kemudahan"],
      ["Kesimpulan dan rekomendasi", "Administrasi dan arsitektur", "Struktur", "Mekanikal, elektrikal, dan lingkungan", "Ringkasan hasil daftar simak"],
    ],
  },
  simak: {
    label: "Daftar simak sebagai bab · 5 bab",
    description: "Tempatkan daftar simak dalam Bab IV, diikuti kesimpulan dan rekomendasi pada Bab V.",
    chapters: [
      ["Pendahuluan", "Profil penyedia jasa", "Profil tim pengkaji teknis", "Lingkup dan tujuan kajian"],
      ["Gambaran umum", "Identitas dan kondisi bangunan", "Kesesuaian dokumen perizinan dan kondisi eksisting"],
      ["Tinjauan aspek dokumen", "Metode pemeriksaan", "Alat, bahan, dan standar pemeriksaan", "Dokumen dan rekomendasi sebelumnya"],
      ["Daftar simak", "@checklist"],
      ["Kesimpulan dan rekomendasi", "Arsitektur", "Struktur", "Mekanikal, elektrikal, dan plambing", "Tindak lanjut"],
    ],
  },
};

const coverFields = [
  ["title", "Judul laporan"], ["building", "Nama bangunan"], ["address", "Alamat bangunan"],
  ["use", "Fungsi bangunan"], ["owner", "Pemilik / pemberi tugas"], ["consultant", "Penyedia jasa / pengkaji"],
  ["city", "Kota / kabupaten"], ["date", "Tanggal laporan", "date"], ["number", "Nomor / revisi laporan"],
];
const frontFields = [
  ["preface", "Kata pengantar"], ["approval", "Lembar pengesahan"],
  ["location", "Tempat dan tanggal pengesahan"], ["signatory", "Nama penandatangan"], ["role", "Jabatan / peran"],
];

const roman = (number) => {
  let text = "";
  for (const [value, digit] of [[100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]) {
    while (number >= value) { text += digit; number -= value; }
  }
  return text;
};
