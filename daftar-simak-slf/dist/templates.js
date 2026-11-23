"use strict";

const reportTemplates = {
  disiplin: {
    label: "Kajian per disiplin · 8 bab",
    description: "Mengikuti susunan per disiplin. Daftar simak ditempatkan setelah bab rekomendasi.",
    chapters: [
      [
        "Pendahuluan",
        ["Latar belakang","[Uraikan alasan pengkajian, penggunaan gedung saat ini, dan konteks permohonan SLF.]"],
        [
          "Maksud, tujuan, dan sasaran",
          "[Jelaskan apa yang dinilai, tujuan pemeriksaan, dan keluaran yang diharapkan.]",
          ["Maksud","[Jelaskan kebutuhan pengkajian teknis untuk bangunan ini.]"],
          ["Tujuan","[Tuliskan tujuan pemeriksaan administratif dan teknis.]"],
          ["Sasaran","[Sebutkan objek dan aspek yang dinilai.]"],
        ],
        [
          "Lingkup pekerjaan",
          "[Sebutkan unit bangunan, area, dan aspek yang diperiksa.]",
          ["Lingkup wilayah kegiatan","[Tuliskan alamat, batas tapak, dan cakupan bangunan.]"],
          ["Lingkup materi pelaporan","[Jelaskan dokumen, disiplin, dan batasan akses atau pengujian.]"],
        ],
        ["Sistematika penyusunan","[Jelaskan urutan bab dan lampiran yang digunakan dalam laporan ini.]"],
        ["Tim pengkaji teknis","[Cantumkan personel, bidang, kompetensi, dan penanggung jawab kajian.]"],
        {"table":"Susunan tim pengkaji teknis","columns":["Nama","Peran / bidang","Kompetensi / dokumen pendukung"]},
      ],
      [
        "Metode dan landasan hukum",
        [
          "Metode pemeriksaan",
          "[Jelaskan urutan pemeriksaan dan dasar penentuan sampel.]",
          ["Pemeriksaan dokumen","[Catat dokumen yang diperiksa, sumbernya, dan cara membandingkannya dengan kondisi terbangun.]"],
          ["Observasi visual dan pengujian","[Catat waktu, lokasi, alat, dan metode pengujian yang benar-benar dilakukan.]"],
        ],
        ["Alat dan bahan pemeriksaan","[Cantumkan alat, satuan, serta kalibrasi bila relevan.]"],
        {"table":"Daftar alat pemeriksaan","columns":["Alat","Kegunaan","Satuan / kalibrasi"]},
        [
          "Standar pemeriksaan",
          "[Masukkan standar dan ketentuan yang digunakan pengkaji untuk proyek ini.]",
          ["Tata bangunan","[Catat acuan pemeriksaan fungsi, intensitas, sempadan, dan tata ruang.]"],
          ["Keselamatan","[Catat acuan struktur, kebakaran, listrik, dan penangkal petir yang berlaku pada objek.]"],
          ["Kesehatan","[Catat acuan penghawaan, pencahayaan, air, dan sanitasi.]"],
          ["Kenyamanan","[Catat acuan ruang gerak, suhu, kelembapan, getaran, atau kebisingan.]"],
          ["Kemudahan","[Catat acuan akses, sirkulasi, dan kelengkapan fasilitas.]"],
        ],
      ],
      [
        "Gambaran umum",
        ["Kedudukan objek dan lokasi","[Uraikan alamat, orientasi tapak, batas persil, dan akses utama.]"],
        ["Identitas dan fungsi bangunan","[Identifikasi nama, pemilik, fungsi, dan unit bangunan.]"],
        ["Data teknis bangunan","[Catat tahun pembangunan, luas, lantai, ketinggian, dan sumber data.]"],
        {"table":"Data umum bangunan gedung","columns":["Parameter","Data rencana / izin","Data eksisting","Sumber"]},
        ["Kondisi eksisting","[Jelaskan pemanfaatan aktual serta kondisi umum saat pemeriksaan. Tambahkan denah dan foto sesuai kebutuhan.]"],
      ],
      [
        "Tinjauan aspek dokumen administrasi",
        ["Dokumen pemilik dan pertanahan","[Ringkas dokumen pemilik, bukti penguasaan tanah, serta status dan catatan verifikasinya.]"],
        ["Dokumen perizinan dan teknis","[Bandingkan PBG/IMB, gambar rencana, gambar terbangun, dan dokumen pendukung yang tersedia.]"],
        {"table":"Rekap pemeriksaan dokumen","columns":["Dokumen","Nomor / tanggal","Status verifikasi","Keterangan"]},
        ["Kesenjangan dan tindak lanjut","[Sebutkan dokumen yang kurang, data yang berbeda, dan siapa yang perlu menindaklanjutinya.]"],
      ],
      [
        "Laporan pengkajian teknis bidang arsitektur",
        [
          "Pemeriksaan persyaratan tata bangunan gedung",
          "[Ringkas hasil perbandingan desain dengan kondisi bangunan.]",
          ["Peruntukan bangunan","[Catat fungsi yang diizinkan dan pemanfaatan aktual per ruang atau unit.]"],
          ["Intensitas bangunan","[Catat luas, jumlah lantai, ketinggian, intensitas, dan sempadan berdasarkan data proyek.]"],
          ["Penampilan bangunan","[Uraikan bentuk, fasad, atap, dan kondisi elemen arsitektural.]"],
          ["Tata ruang dalam","[Uraikan susunan, luasan, fungsi, dan kondisi ruang.]"],
          ["Keselarasan dengan lingkungan","[Uraikan ruang terbuka, sirkulasi, parkir, dan kondisi area luar.]"],
        ],
        ["Kesehatan","[Catat hasil pemeriksaan pencahayaan atau aspek kesehatan yang dibahas dalam disiplin arsitektur.]"],
        ["Kenyamanan","[Jelaskan ruang gerak, tata perabot, dan pandangan dari atau ke bangunan.]"],
        ["Kemudahan","[Catat akses horizontal, vertikal, fasilitas sanitasi, dan aksesibilitas.]"],
        ["Kesimpulan bidang arsitektur","[Ringkas bukti, ketidaksesuaian, dan rujukan tindak lanjut.]"],
      ],
      [
        "Laporan pengkajian teknis bidang struktur",
        ["Data sistem struktur","[Identifikasi sistem struktur, material, gambar, dan bagian yang dapat diakses.]"],
        ["Pemeriksaan elemen struktur","[Catat kondisi, lokasi sampel, kerusakan teramati, dan foto unsur yang diperiksa.]"],
        ["Hasil pengujian dan analisis","[Masukkan metode, hasil, satuan, dasar pembanding, dan batasan bila dilakukan pengujian.]"],
        {"table":"Rekap hasil pemeriksaan struktur","columns":["Elemen / lokasi","Observasi atau hasil uji","Satuan / acuan","Temuan"]},
        ["Kesimpulan bidang struktur","[Ringkas temuan dan keterbatasan berdasarkan hasil pemeriksaan.]"],
      ],
      [
        "Laporan pengkajian teknis bidang MEP",
        [
          "Keselamatan",
          "[Ringkas kondisi utilitas terkait keselamatan.]",
          ["Proteksi kebakaran","[Catat sistem pasif, aktif, dan sarana evakuasi yang diperiksa.]"],
          ["Penangkal petir","[Catat instalasi, pembumian, dan hasil pengujian yang tersedia.]"],
          ["Instalasi listrik","[Catat sumber, panel, distribusi, perlindungan, dan kondisi instalasi.]"],
        ],
        [
          "Kesehatan",
          "[Ringkas hasil pemeriksaan utilitas kesehatan.]",
          ["Penghawaan dan pencahayaan","[Masukkan lokasi sampel, metode, hasil ukur, dan satuan.]"],
          ["Air bersih, air limbah, dan air hujan","[Catat sumber, jaringan distribusi, pengolahan, dan kondisi aktual.]"],
          ["Persampahan dan utilitas khusus","[Catat sistem yang ada dan yang relevan dengan fungsi bangunan.]"],
        ],
        ["Kenyamanan","[Catat kondisi udara ruang serta pengukuran getaran atau kebisingan bila dilakukan.]"],
        ["Kemudahan","[Catat sarana, peralatan, dan fasilitas yang diperiksa.]"],
        ["Kesimpulan bidang MEP","[Ringkas temuan utama, rujukan bukti, dan prioritas tindak lanjut.]"],
      ],
      [
        "Rekomendasi",
        ["Ringkasan hasil kajian","[Rangkum temuan administrasi, arsitektur, struktur, dan MEP dengan rujukan bagian laporan.]"],
        ["Rekomendasi dan prioritas","[Tuliskan tindakan yang direkomendasikan berdasarkan bukti dan penilaian pengkaji.]"],
        {"table":"Matriks rekomendasi dan tindak lanjut","columns":["Aspek / temuan","Tindakan","Prioritas","Penanggung jawab / target"]},
        ["Verifikasi tindak lanjut","[Catat bukti penyelesaian yang diperlukan dan rencana pemeriksaan ulang.]"],
      ],
    ],
  },
  ringkas: {
    label: "Pemeriksaan terpadu · 4 bab",
    description: "Pemeriksaan persyaratan bangunan dalam satu bab dengan rekomendasi per aspek.",
    chapters: [
      [
        "Pendahuluan",
        ["Gambaran umum subjek pemeriksaan","[Identifikasi objek, lokasi, fungsi, pemilik, dan data teknis dasar.]"],
        ["Maksud, tujuan, dan sasaran","[Jelaskan alasan, tujuan, dan hasil yang diharapkan dari kajian.]"],
        ["Landasan hukum","[Cantumkan acuan yang digunakan menurut disiplin pemeriksaan.]"],
        ["Lingkup pekerjaan","[Tentukan unit bangunan, aspek administratif dan teknis, serta batasan akses.]"],
        ["Lingkup materi pelaporan","[Sebutkan dokumen, bukti, dan hasil pengujian yang dicakup.]"],
        ["Keluaran pekerjaan","[Rinci laporan, daftar simak, dan lampiran yang diserahkan.]"],
        ["Sistematika penulisan laporan","[Uraikan susunan bab.]"],
      ],
      [
        "Parameter dan metodologi",
        [
          "Parameter pemeriksaan",
          "[Jelaskan aspek, sumber bukti, dan ukuran pembanding.]",
          ["Administratif","[Cantumkan data umum, perizinan, dokumen tanah, dan dokumen pelaksanaan yang diperiksa.]"],
          ["Teknis","[Uraikan parameter tata bangunan, keselamatan, kesehatan, kenyamanan, dan kemudahan.]"],
        ],
        [
          "Metode pemeriksaan",
          "[Jelaskan langkah dan cakupan pekerjaan aktual.]",
          ["Pemeriksaan dokumen","[Catat telaah dokumen dan pembanding.]"],
          ["Observasi lapangan","[Catat lokasi, waktu, dan sampel.]"],
          ["Pengujian dan analisis","[Cantumkan alat, metode, hasil, dan batasan pengujian apabila dilakukan.]"],
        ],
        {"table":"Parameter dan metode pemeriksaan","columns":["Aspek","Metode","Sampel / sumber bukti","Acuan"]},
      ],
      [
        "Pemeriksaan persyaratan bangunan gedung",
        ["Tata bangunan dan lingkungan","[Catat kecocokan fungsi, intensitas, tampilan, tata ruang, dan kondisi lingkungan.]"],
        ["Keselamatan","[Rinci temuan pada elemen struktur, proteksi kebakaran, penangkal petir, dan instalasi listrik.]"],
        ["Kesehatan","[Catat penghawaan, pencahayaan, air bersih, sanitasi, dan pengelolaan limbah.]"],
        ["Kenyamanan","[Catat ruang gerak, udara, pandangan, getaran, dan kebisingan yang diperiksa.]"],
        ["Kemudahan","[Catat hubungan horizontal dan vertikal, aksesibilitas, serta kelengkapan fasilitas.]"],
        {"table":"Rekap temuan teknis","columns":["Aspek","Temuan dan lokasi","Bukti / hasil ukur","Tindak lanjut"]},
      ],
      [
        "Kesimpulan dan rekomendasi",
        ["Aspek administrasi","[Ringkas kecukupan dan kekurangan dokumen.]"],
        ["Aspek struktur","[Ringkas temuan struktur dan tindakan yang dinilai perlu.]"],
        ["Aspek arsitektur","[Ringkas temuan tata bangunan dan aksesibilitas.]"],
        ["Aspek mekanikal, elektrikal, dan K3","[Ringkas temuan utilitas serta keselamatan.]"],
        ["Aspek lingkungan","[Ringkas temuan lingkungan dan sanitasi.]"],
        ["Resume daftar simak","[Rujuk butir daftar simak dan rangkum prioritas tindak lanjut.]"],
        {"table":"Rencana tindak lanjut","columns":["Temuan","Rekomendasi","Prioritas / target","Bukti penyelesaian"]},
      ],
    ],
  },
  simak: {
    label: "Daftar simak sebagai bab · 5 bab",
    description: "Daftar simak menjadi Bab IV, diikuti kesimpulan dan rekomendasi pada Bab V.",
    chapters: [
      [
        "Pendahuluan",
        ["Profil penyedia jasa pengkaji teknis","[Isi nama, alamat, dan informasi penyedia jasa.]"],
        ["Profil tim pengkaji teknis","[Catat personel, peran, dan bidang teknis.]"],
        ["Dokumen kompetensi tim","[Rujuk kualifikasi dan bukti kompetensi anggota tim.]"],
        {"table":"Susunan tim pengkaji teknis","columns":["Nama","Bidang / peran","Bukti kompetensi"]},
      ],
      [
        "Gambaran umum",
        ["Kedudukan objek pengkajian","[Jelaskan lokasi, fungsi aktual, unit bangunan, dan data teknis dasar.]"],
        [
          "Tinjauan kesesuaian bangunan gedung",
          "[Bandingkan informasi perizinan dengan kondisi aktual.]",
          ["Kesesuaian PBG atau IMB dengan kondisi eksisting","[Rinci persamaan dan perbedaan berdasarkan dokumen dan observasi.]"],
          ["Kesimpulan kesesuaian dokumen","[Ringkas temuan, sumber, dan keterbatasan verifikasi.]"],
        ],
        {"table":"Perbandingan izin dan kondisi aktual","columns":["Parameter","Data izin","Kondisi aktual","Catatan"]},
      ],
      [
        "Tinjauan aspek dokumen",
        [
          "Metode pemeriksaan",
          "[Jelaskan metode dan lingkup bukti.]",
          ["Pemeriksaan dokumen","[Catat sumber dan cara menelaah dokumen.]"],
          ["Observasi visual","[Catat waktu, tempat, serta cakupan observasi.]"],
        ],
        ["Alat dan bahan pemeriksaan","[Catat alat dan kegunaan serta satuan pengukuran.]"],
        ["Standar pemeriksaan","[Cantumkan acuan terkait tata bangunan, keselamatan, kesehatan, kenyamanan, dan kemudahan.]"],
        ["Dokumen administrasi","[Catat dokumen yang tersedia dan yang masih perlu dilengkapi.]"],
        ["Rekomendasi SLF sebelumnya","[Jika ada, catat rekomendasi sebelumnya, status tindak lanjut, dan buktinya.]"],
        {"table":"Rekap dokumen dan tindak lanjut","columns":["Dokumen / rekomendasi","Tanggal / nomor","Status","Bukti / catatan"]},
      ],
      ["Daftar simak","@checklist"],
      [
        "Kesimpulan dan rekomendasi",
        ["Bidang arsitektur","[Ringkas kesimpulan dan rekomendasi arsitektur dengan rujukan bukti.]"],
        ["Bidang struktur","[Ringkas kesimpulan dan rekomendasi struktur berdasarkan pemeriksaan.]"],
        ["Bidang mekanikal, elektrikal, dan plambing","[Ringkas kesimpulan dan rekomendasi utilitas bangunan.]"],
        ["Tindak lanjut dan lampiran pendukung","[Cantumkan penanggung jawab, target, dan dokumen bukti yang diperlukan.]"],
        {"table":"Rekap rekomendasi per bidang","columns":["Bidang","Temuan","Rekomendasi","Penanggung jawab / target"]},
      ],
    ],
  },
};

const coverFields = [
  ["title", "Judul laporan"], ["building", "Nama bangunan"], ["address", "Alamat bangunan"],
  ["use", "Fungsi bangunan"], ["owner", "Pemilik / pemberi tugas"], ["consultant", "Penyedia jasa / pengkaji"],
  ["city", "Kota / kabupaten"], ["date", "Tanggal laporan", "date"], ["number", "Nomor / revisi laporan"],
];
const frontDefaults = {
  preface: "[Tuliskan tujuan penyusunan laporan, pihak yang terlibat, dan ucapan terima kasih yang relevan.]",
  approval: "[Isi pernyataan pengesahan laporan, nama bangunan, nomor laporan, dan pihak yang mengesahkan.]",
};
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

function templateBlocks(sections, depth = 1) {
  return sections.flatMap((section) => {
    if (section === "@checklist") return [];
    if (!Array.isArray(section)) {
      return [{ type: "table", text: section.table, headers: [...section.columns], rows: [section.columns.map(() => "")] }];
    }
    const [text, body, ...children] = section;
    return [{ type: "heading", text, body, depth }, ...templateBlocks(children, depth + 1)];
  });
}

function headingEntries(chapter, chapterIndex) {
  let group = 0;
  let child = 0;
  const entries = new Map();
  for (const [index, block] of chapter.blocks.entries()) {
    if (block.type !== "heading") continue;
    const nested = block.depth === 2 && group > 0;
    if (nested) child++;
    else { group++; child = 0; }
    const number = [chapterIndex + 1, group, ...(nested ? [child] : [])].join(".");
    entries.set(index, { number, nested });
  }
  return entries;
}
