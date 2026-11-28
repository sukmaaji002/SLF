"use strict";

const lightningProtectionNarrative = {"body":"Sistem proteksi petir yang tersedia diidentifikasi sebagai [jenis atau konfigurasi]. Pemeriksaan mencakup [komponen yang dapat diverifikasi] dan didukung [hasil pengukuran atau dokumen yang tersedia]. Hasil dan keterbatasan pemeriksaan adalah [hasil serta batasan].","previous":"[Catat instalasi, pembumian, dan hasil pengujian yang tersedia.]"};
const mepSafetyToken = "sistem proteksi kebakaran, penangkal petir, instalasi listrik, atau sistem terkait";
const mepSafetyNarrative = "Penilaian utilitas keselamatan mencakup [sistem proteksi kebakaran, penangkal petir, instalasi listrik, atau sistem terkait]. Rincian sistem yang diperiksa, lokasi, hasil, dan bukti pembanding dijabarkan pada subbagian berikut.";
const structuralConclusionNarrative = "Penilaian bidang struktur dalam lingkup ini menghasilkan [kesimpulan pengkaji] berdasarkan [dokumen, observasi, atau hasil uji]. Elemen yang masih memerlukan konfirmasi atau pemeriksaan lanjutan adalah [elemen atau lokasi], dengan tindak lanjut pada [nomor rekomendasi].";
const structuralTestingNarrative = "Pengujian atau analisis struktur yang tersedia berupa [metode atau status pengujian]. Hasil yang dapat ditelusuri adalah [hasil dan satuan], dibandingkan dengan [parameter pembanding]. Interpretasi pengkaji serta batasan penggunaannya adalah [interpretasi dan batasan].";
const structuralInspectionNarrative = "Pemeriksaan visual dilakukan pada [elemen dan lokasi sampel] untuk mencatat kondisi yang dapat diamati. Temuan pada elemen tersebut adalah [kondisi, lokasi, dan ukuran kerusakan bila ada]. Lokasi dan bukti temuan ditunjukkan pada [tabel, denah, atau foto].";

const oldDocumentReviewNames = ["Bukti penguasaan tanah", "PBG / IMB", "Gambar rencana / terbangun", "Dokumen pendukung lainnya"];
const documentReviewExamples = ["Data Tanah", "Dokumen Perjanjian Sewa", "NIB", "Dokumen Tata Ruang", "IMB/PBG", "Dokumen Lingkungan", "Andalalin"];
const documentReviewHeaders = ["Dokumen", "Nomor / tanggal", "Status verifikasi", "Keterangan"];
const documentReviewRow = (name) => [name, "[Nomor / tanggal]", "[Hasil verifikasi]", "[Catatan]"];

const originalPurposeText = "Kajian ini bertujuan membandingkan kondisi aktual dan pemanfaatan bangunan dengan dokumen yang tersedia, menilai aspek tata bangunan serta keselamatan, kesehatan, kenyamanan, dan kemudahan, dan merumuskan tindak lanjut atas temuan yang didukung bukti pemeriksaan.";
const purposeText = "Kajian ini disusun untuk [tujuan kajian]. Dalam lingkup tersebut, pengkaji membandingkan kondisi aktual dan pemanfaatan bangunan dengan dokumen yang tersedia, menilai aspek tata bangunan serta keselamatan, kesehatan, kenyamanan, dan kemudahan, lalu merumuskan tindak lanjut berdasarkan bukti pemeriksaan.";
const purposeOptions = [
  ["pengajuan", "Pengajuan SLF pertama", "mendukung pengajuan Sertifikat Laik Fungsi (SLF) pertama"],
  ["perpanjangan", "Perpanjangan SLF", "mendukung perpanjangan Sertifikat Laik Fungsi (SLF)"],
  ["perubahan", "Kajian setelah perubahan bangunan atau fungsi", "menilai kembali kelaikan fungsi setelah perubahan bangunan atau pemanfaatannya"],
  ["tindak-lanjut", "Verifikasi tindak lanjut rekomendasi", "memverifikasi tindak lanjut atas rekomendasi kajian teknis sebelumnya"],
];

const originalIntroduction = {
  "Latar belakang": "Pemanfaatan bangunan gedung perlu didukung oleh kondisi yang sesuai dengan fungsi serta persyaratan tata bangunan dan keandalan. Kajian teknis ini disusun untuk mendukung [pengajuan/perpanjangan] Sertifikat Laik Fungsi (SLF) atas [nama bangunan] yang berlokasi di [alamat lengkap]. Bangunan digunakan untuk [fungsi aktual]. Kajian ini dilatarbelakangi oleh [kondisi bangunan atau kebutuhan pemilik] dan mencakup bagian bangunan yang ditetapkan dalam lingkup pekerjaan.",
  "Maksud": "Pekerjaan ini dimaksudkan untuk menelaah kelengkapan dan kesesuaian dokumen administratif serta mengkaji kondisi teknis [nama bangunan] sesuai dengan fungsi [fungsi aktual]. Kajian disusun sebagai bahan pertimbangan dalam proses [pengajuan/perpanjangan] SLF.",
  "Sistematika penyusunan": "Laporan ini dimulai dengan pendahuluan, metode dan landasan hukum, gambaran umum, serta tinjauan dokumen administrasi. Bagian berikutnya memuat pengkajian bidang arsitektur, struktur, dan MEP. Rekomendasi dan daftar simak melengkapi hasil pengkajian.",
};
const linkedIntroduction = {
  "Latar belakang": originalIntroduction["Latar belakang"].replace(
    "untuk mendukung [pengajuan/perpanjangan] Sertifikat Laik Fungsi (SLF) atas", "untuk [tujuan kajian] pada"),
  "Maksud": originalIntroduction.Maksud.replace(
    "Kajian disusun sebagai bahan pertimbangan dalam proses [pengajuan/perpanjangan] SLF.",
    "Hasil kajian ini digunakan untuk [tujuan kajian]."),
  "Sistematika penyusunan": "Susunan bab dalam laporan ini mengikuti urutan berikut.\n\n[susunan bab laporan]",
};

const originalMethodNarratives = {
  "Metode pemeriksaan": "Pemeriksaan disusun dalam tahapan pengumpulan dokumen, telaah awal, verifikasi lapangan, dan analisis temuan. Pemilihan area dan komponen yang diperiksa mempertimbangkan [fungsi, variasi kondisi, keterwakilan, atau riwayat gangguan]. Dasar pemilihan sampel dan batasan metode dicatat pada [tabel atau lampiran].",
  "Observasi visual dan pengujian": "Observasi lapangan dilaksanakan pada [tanggal] di [area atau posisi sampel]. Kondisi komponen dicatat dalam [daftar simak atau dokumentasi foto]. Pengujian yang dilakukan meliputi [jenis uji, metode, dan acuan atau keterangan tidak dilakukan], dengan batasan [batasan pengamatan atau pengujian].",
  "Alat dan bahan pemeriksaan": "Alat yang digunakan untuk dokumentasi, pengukuran, atau pengujian dicantumkan pada tabel pemeriksaan. Catatan alat mencakup jenis, fungsi, satuan, dan status kalibrasi apabila relevan. Bahan serta dokumen pendukung yang digunakan adalah [daftar bahan dan dokumen].",
};
const linkedMethodNarratives = {
  "Metode pemeriksaan": originalMethodNarratives["Metode pemeriksaan"].replace(
    "Pemeriksaan disusun dalam tahapan pengumpulan dokumen, telaah awal, verifikasi lapangan, dan analisis temuan.",
    "Metode yang digunakan dalam pemeriksaan meliputi [metode pemeriksaan yang digunakan]."),
  "Observasi visual dan pengujian": "Observasi lapangan dilaksanakan pada [tanggal pemeriksaan] di [area atau posisi sampel]. Kondisi komponen dicatat dalam [daftar simak atau dokumentasi foto]. Pelaksanaan pengujian dicatat sebagai berikut. [jenis uji, metode, dan acuan atau keterangan tidak dilakukan]. Batasan pemeriksaan meliputi [batasan pengamatan atau pengujian].",
  "Alat dan bahan pemeriksaan": originalMethodNarratives["Alat dan bahan pemeriksaan"].replace(
    "Alat yang digunakan untuk dokumentasi, pengukuran, atau pengujian dicantumkan pada tabel pemeriksaan.",
    "Alat yang tercatat dalam tabel pemeriksaan meliputi [daftar alat pemeriksaan]."),
};

const contextualNarratives = {
  "Kemudahan": { marker: "lokasi", replacement: "lokasi fasilitas yang diperiksa", previous: "Sarana dan peralatan terkait kemudahan penggunaan gedung yang ditinjau meliputi [fasilitas atau peralatan]. Kondisi dan fungsi yang terverifikasi pada [lokasi] adalah [hasil pemeriksaan] berdasarkan [rujukan bukti]." },
  "Persampahan dan utilitas khusus": { marker: "lokasi", replacement: "lokasi sarana pengumpulan sampah", previous: "Sarana pengumpulan sampah yang diperiksa berada di [lokasi] dengan mekanisme [pemilahan, penyimpanan, atau pengangkutan]. Utilitas khusus yang sesuai dengan fungsi bangunan adalah [jenis sistem atau status tidak relevan]. Temuan yang didukung bukti adalah [temuan]." },
  "Kondisi eksisting": { marker: "tanggal", replacement: "tanggal pemeriksaan", previous: "Pada saat observasi [tanggal], bangunan berada dalam kondisi [ringkasan kondisi umum]. Pemanfaatan utama teridentifikasi pada [area atau unit]. Dokumentasi berupa [denah, foto, atau catatan lapangan] digunakan untuk menunjukkan kondisi yang dapat diverifikasi." },
  "Proteksi kebakaran": { marker: "lokasi", replacement: "lokasi komponen proteksi kebakaran", previous: "Sarana proteksi kebakaran yang ditinjau meliputi [sistem pasif, sistem aktif, dan jalur evakuasi yang tersedia]. Hasil verifikasi pada [lokasi] adalah [kondisi, fungsi terverifikasi, atau temuan]. Bukti pemeriksaan berupa [daftar simak, hasil uji, atau foto]." },
};

function contextualNarrative(title) {
  const { marker, replacement, previous } = contextualNarratives[title];
  return previous.replace("[" + marker + "]", "[" + replacement + "]");
}

const previousSafetyNarrative = "Acuan pemeriksaan keselamatan meliputi [standar struktur, proteksi kebakaran, kelistrikan, dan proteksi petir yang relevan]. Parameter yang dijadikan pembanding untuk masing-masing sistem adalah [parameter dan rujukan].";
const safetyNarrative = previousSafetyNarrative.replace(
  "Parameter yang dijadikan pembanding untuk masing-masing sistem adalah",
  "Parameter pembanding untuk tiap sistem ditetapkan",
);

const previousHealthNarrative = "Aspek kesehatan dinilai menggunakan [standar atau dokumen pembanding] terkait penghawaan, pencahayaan, air bersih, dan sanitasi. Parameter pembanding yang digunakan pada [ruang atau sistem] adalah [parameter, satuan, dan rujukan].";
const healthNarrative = previousHealthNarrative.replace(
  "Parameter pembanding yang digunakan pada [ruang atau sistem] adalah",
  "Parameter pembanding untuk [ruang atau sistem] ditetapkan",
);

const previousComfortNarrative = "Acuan aspek kenyamanan mencakup [ketentuan ruang gerak, suhu, kelembapan, getaran, atau kebisingan yang relevan]. Parameter yang diterapkan untuk [fungsi ruang] adalah [parameter dan rujukan].";
const comfortNarrative = previousComfortNarrative.replace(
  "Parameter yang diterapkan untuk [fungsi ruang] adalah",
  "Parameter pembanding untuk [fungsi ruang] ditetapkan",
);
const previousEaseNarrative = "Akses, sirkulasi, dan kelengkapan fasilitas dinilai dengan [acuan aksesibilitas atau dokumen teknis]. Ketentuan yang dibandingkan dengan kondisi lapangan meliputi [parameter jalur, fasilitas, atau peralatan yang berlaku].";
const easeNarrative = previousEaseNarrative.replace(
  "Ketentuan yang dibandingkan dengan kondisi lapangan meliputi",
  "Parameter pembanding ditetapkan",
);
const previousDocumentFollowUp = "Dari penelaahan dokumen, tercatat [dokumen yang kurang atau perbedaan data] dengan dampak terhadap verifikasi [aspek yang terdampak]. Konfirmasi atau pelengkapan dokumen menjadi tindak lanjut [penanggung jawab] dengan bukti yang diperlukan berupa [bukti atau dokumen].";
const documentFollowUp = "Pemeriksaan dokumen menemukan [dokumen yang kurang atau perbedaan data]. Hal yang perlu dikonfirmasi adalah [aspek yang terdampak]. Tindak lanjut dilakukan oleh [penanggung jawab] dengan menyiapkan [bukti atau dokumen].";
const previousBuildingUse = "Fungsi atau peruntukan bangunan menurut [dokumen rujukan] adalah [fungsi yang tercatat]. Pemanfaatan aktual di [area sampel] adalah [fungsi teramati]. Hasil perbandingannya adalah [kesesuaian atau perbedaan beserta rujukan bukti].";
const buildingUse = "Menurut [dokumen rujukan], fungsi bangunan adalah [fungsi yang tercatat]. Saat diperiksa, [area sampel] digunakan untuk [fungsi teramati]. Hasil perbandingannya adalah [kesesuaian atau perbedaan beserta rujukan bukti].";
const intensityFinding = "temuan atau keterbatasan";
const intensityDetailFields = [
  ["luas, jumlah lantai, tinggi, koefisien, atau jarak sempadan yang relevan", "Parameter yang ditinjau"],
  ["nilai dan satuan", "Data ukur tambahan"],
  ["nilai dan sumber pembanding", "Batas atau acuan tambahan"],
];
const previousIntensityNarrative = "Parameter intensitas yang ditelaah meliputi [luas, jumlah lantai, tinggi, koefisien, atau jarak sempadan yang relevan]. Data aktual [nilai dan satuan] dibandingkan dengan [nilai dan sumber pembanding]. Hasil telaah dicatat sebagai [temuan atau keterbatasan].";
const intensityNarrative = "Pemeriksaan intensitas dan sempadan menggunakan data ukur dan batas acuan yang tersedia. Catatan pemeriksaan adalah [temuan atau keterbatasan].";
const appearanceEvidenceParagraph = "\n\nDokumentasi dapat dilihat pada [nomor foto atau gambar].";
const previousAppearanceNarrative = "Penampilan bangunan diamati pada [sisi atau area] dan meliputi [bentuk, fasad, atap, atau elemen arsitektural yang diperiksa]. Kondisi teramati adalah [hasil observasi] dengan dokumentasi pada [nomor foto atau gambar].";
const appearanceNarrative = "Pada [sisi atau area], pemeriksaan mencakup [bentuk, fasad, atap, atau elemen arsitektural yang diperiksa]. Kondisi yang terlihat adalah [hasil observasi].";
const previousRoomLayoutNarrative = "Penataan ruang pada [lantai atau zona] diperiksa terhadap [denah atau gambar rujukan]. Hasil pemeriksaan menunjukkan [susunan, fungsi, luasan, atau perubahan yang teramati]. Area yang belum dicakup adalah [batasan pemeriksaan].";
const roomLayoutLegacyFields = [
  ["lantai atau zona", "Area yang diperiksa"],
  ["denah atau gambar rujukan", "Denah rujukan"],
  ["susunan, fungsi, luasan, atau perubahan yang teramati", "Hasil pemeriksaan"],
  ["batasan pemeriksaan", "Batasan pemeriksaan"],
];
const previousEnvironmentNarrative = "Kondisi area luar ditinjau pada [ruang terbuka, sirkulasi, atau parkir]. Hubungan tapak dengan area sekitarnya tercatat sebagai [hasil observasi] berdasarkan [denah situasi, foto, atau pengukuran].";
const environmentLegacyFields = [
  ["ruang terbuka, sirkulasi, atau parkir", "Area yang diperiksa"],
  ["hasil observasi", "Hasil telaah"],
  ["denah situasi, foto, atau pengukuran", "Bukti pendukung"],
];
const architectureChapterTitle = "Laporan pengkajian teknis bidang arsitektur";
const previousArchitectureHealth = "Pemeriksaan aspek kesehatan mencakup [parameter yang diperiksa] pada [ruang atau sistem]. Hasil observasi atau pengukuran dirujuk pada [tabel, gambar, atau lampiran] dan dibandingkan dengan [acuan yang digunakan]. Ringkasan temuan untuk bidang ini adalah [temuan kesehatan].";
const architectureHealthIntro = [
  "Pemeriksaan aspek kesehatan bangunan meninjau kondisi ruang dan sistem yang memengaruhi kesehatan pengguna. Penelaahan meliputi penghawaan, pencahayaan, penyediaan air bersih, dan sanitasi sejauh berkaitan dengan ruang dan fungsi bangunan yang dikaji. Pengamatan lapangan, hasil pengukuran, serta dokumen pendukung menjadi dasar untuk memahami kondisi yang ada dan membandingkannya dengan acuan yang relevan.",
  "Tabel berikut merangkum pemeriksaan per parameter dan lokasi agar setiap temuan dapat ditelusuri ke ruang atau sistem yang diperiksa. Hasil dicatat bersama acuan dan bukti pendukung yang tersedia. Jika suatu bagian belum dapat diperiksa atau datanya belum cukup, keterbatasannya dicatat pada baris terkait sebagai dasar pemeriksaan lanjutan.",
].join("\n\n");
const architectureHealthTableTitle = "Hasil pemeriksaan aspek kesehatan";
const architectureHealthColumns = ["Parameter pemeriksaan", "Ruang / sistem", "Acuan", "Hasil / temuan", "Keterangan / rekomendasi"];
const architectureHealthTokens = ["parameter yang diperiksa", "ruang atau sistem", "acuan yang digunakan", "temuan kesehatan", "tabel, gambar, atau lampiran"];
const architectureComfort = {
  heading: "Kenyamanan",
  title: "Hasil pemeriksaan aspek kenyamanan",
  previous: "[Jelaskan ruang gerak, tata perabot, dan pandangan dari atau ke bangunan.]",
  narrative: "Pemeriksaan kenyamanan mencakup [parameter yang diperiksa] pada [area sampel]. Hasil pengamatan atau pengukuran menunjukkan [hasil terverifikasi], dengan acuan [standar atau dokumen pembanding] dan keterbatasan [batasan yang relevan].",
  intro: "Pemeriksaan kenyamanan meninjau apakah kondisi ruang mendukung kegiatan penggunanya. Pengamatan mencakup ruang gerak dan tata perabot, kenyamanan termal, pandangan dan silau, serta kebisingan atau getaran yang relevan dengan fungsi ruang. Hasil dapat berbeda antarruang atau menurut waktu dan kondisi penggunaan, sehingga lokasi dan keadaan saat pemeriksaan dicatat pada baris terkait.\n\nTabel berikut mencatat hasil ukur atau pengamatan, acuan pembanding, dan penyesuaian teknis yang diperlukan untuk setiap temuan.",
  tokens: ["parameter yang diperiksa", "area sampel", "standar atau dokumen pembanding", "hasil terverifikasi", "batasan yang relevan"],
};
const architectureEase = {
  heading: "Kemudahan",
  title: "Hasil pemeriksaan aspek kemudahan",
  previous: "[Catat akses horizontal, vertikal, fasilitas sanitasi, dan aksesibilitas.]",
  narrative: "Pemeriksaan kemudahan mencakup [jalur akses, fasilitas, atau peralatan yang diperiksa] untuk pengguna [kelompok pengguna]. Kondisi yang tercatat adalah [temuan], didukung oleh [hasil ukur, foto, atau daftar simak] dan dibandingkan dengan [acuan].",
  intro: "Pemeriksaan kemudahan mengikuti jalur yang digunakan untuk mencapai, memasuki, dan bergerak di dalam bangunan. Penelaahan mencakup hubungan horizontal dan vertikal, serta fasilitas pendukung seperti toilet, penunjuk arah, dan tempat parkir sesuai fungsi bangunan dan kebutuhan penggunanya. Pemeriksaan mencatat dimensi efektif dan hambatan yang ditemukan saat fasilitas digunakan.\n\nTabel berikut merangkum acuan, hasil pemeriksaan, dan usulan penyesuaian per lokasi, disertai dokumentasi bila tersedia.",
  tokens: ["jalur akses, fasilitas, atau peralatan yang diperiksa", "kelompok pengguna", "acuan", "temuan", "hasil ukur, foto, atau daftar simak"],
};
const inspectionIntroductions = new Map([
  [architectureHealthIntro, previousArchitectureHealth],
  [architectureComfort.intro, architectureComfort.narrative],
  [architectureEase.intro, architectureEase.narrative],
]);
const revisedStandardNarratives = new Map([
  [previousSafetyNarrative, safetyNarrative],
  [previousHealthNarrative, healthNarrative],
  [previousComfortNarrative, comfortNarrative],
  [previousEaseNarrative, easeNarrative],
  [previousDocumentFollowUp, documentFollowUp],
  [previousBuildingUse, buildingUse],
  [previousAppearanceNarrative, appearanceNarrative],
]);

const reportTemplates = {
  disiplin: {
    label: "Kajian per disiplin · 8 bab",
    description: "Mengikuti susunan per disiplin. Daftar simak ditempatkan setelah bab rekomendasi.",
    chapters: [
      [
        "Pendahuluan",
        ["Latar belakang", { body: linkedIntroduction["Latar belakang"], previous: "Kajian teknis ini disusun sebagai bagian dari [pengajuan atau perpanjangan] Sertifikat Laik Fungsi untuk [nama bangunan] di [alamat]. Bangunan berfungsi sebagai [fungsi aktual]. Pengkajian dilakukan atas dasar [alasan dan kondisi yang melatarbelakangi pekerjaan]." }],
        [
          "Maksud, tujuan, dan sasaran",
          {"body":"Penelaahan dokumen dan pemeriksaan kondisi bangunan merupakan dasar untuk menyusun penilaian teknis atas [nama bangunan]. Hasilnya digunakan untuk mendokumentasikan kondisi yang dapat diverifikasi, mencatat kesenjangan terhadap acuan pemeriksaan, dan menyusun rekomendasi yang dapat ditindaklanjuti oleh [pemilik/pengelola bangunan].","previous":"[Jelaskan apa yang dinilai, tujuan pemeriksaan, dan keluaran yang diharapkan.]"},
          ["Maksud", { body: linkedIntroduction.Maksud, previous: "[Jelaskan kebutuhan pengkajian teknis untuk bangunan ini.]" }],
          ["Tujuan", { body: purposeText, previous: "[Tuliskan tujuan pemeriksaan administratif dan teknis.]" }],
          ["Sasaran", {"body":"Sasaran pekerjaan ini adalah tersusunnya data kondisi eksisting, daftar simak, dan rekomendasi yang dapat ditelusuri kembali ke dokumen, observasi, atau hasil uji. Objek yang ditinjau meliputi [unit atau area bangunan], sedangkan sistem yang diperiksa meliputi [sistem utama dalam lingkup kajian].","previous":"[Sebutkan objek dan aspek yang dinilai.]"}],
        ],
        [
          "Lingkup pekerjaan",
          {"body":"Pekerjaan mencakup pengumpulan data awal, penelaahan dokumen, pemeriksaan lapangan, dan penyusunan laporan. Pemeriksaan teknis meliputi [disiplin atau sistem yang diperiksa]. Pengukuran atau pengujian dicantumkan sesuai kegiatan yang dilakukan dan data yang tersedia.","previous":"[Sebutkan unit bangunan, area, dan aspek yang diperiksa.]"},
          ["Lingkup wilayah kegiatan", {"body":"Lokasi kegiatan berada di [alamat lengkap], [desa/kelurahan], [kecamatan], [kabupaten/kota], [provinsi]. Wilayah pemeriksaan meliputi [nama gedung atau blok], [lantai atau area], serta [prasarana tapak yang diperiksa]. Batas area kajian mengacu pada [gambar tapak atau uraian batas].","previous":"[Tuliskan alamat, batas tapak, dan cakupan bangunan.]"}],
          ["Lingkup materi pelaporan", {"body":"Laporan memuat profil objek kajian, daftar dokumen yang ditelaah, kondisi arsitektur, struktur, dan mekanikal, elektrikal, serta plambing (MEP), berikut bukti, temuan, dan rekomendasinya. Sumber data utama meliputi [dokumen, hasil survei, atau hasil uji]. Ruang atau komponen yang belum dapat diverifikasi karena [keterbatasan akses atau data] dicatat sebagai batasan kajian.","previous":"[Jelaskan dokumen, disiplin, dan batasan akses atau pengujian.]"}],
        ],
        ["Sistematika penyusunan", { body: linkedIntroduction["Sistematika penyusunan"], previous: originalIntroduction["Sistematika penyusunan"] }],
        ["Tim pengkaji teknis", {"body":"Kajian teknis atas [nama bangunan] dilaksanakan oleh [nama penyedia jasa atau tim]. Koordinasi pekerjaan dan penelaahan laporan menjadi tanggung jawab [nama penanggung jawab]. Pembagian bidang, nama pengkaji, dan rujukan kompetensinya tercantum dalam tabel susunan tim.","previous":"[Cantumkan personel, bidang, kompetensi, dan penanggung jawab kajian.]"}],
        {"table":"Susunan tim pengkaji teknis","columns":["Nama","Peran / bidang","Kompetensi / dokumen pendukung"],"rows":[["[Nama pengkaji arsitektur]","Arsitektur","[Jenis dan nomor bukti kompetensi]"],["[Nama pengkaji struktur]","Struktur","[Jenis dan nomor bukti kompetensi]"],["[Nama pengkaji MEP]","MEP","[Jenis dan nomor bukti kompetensi]"]]},
      ],
      [
        "Metode dan landasan hukum",
        [
          "Metode pemeriksaan",
          { body: linkedMethodNarratives["Metode pemeriksaan"], previous: "[Jelaskan urutan pemeriksaan dan dasar penentuan sampel.]" },
          ["Pemeriksaan dokumen", {"body":"Dokumen yang tersedia untuk ditelaah meliputi [daftar dokumen]. Identitas objek, fungsi, dimensi utama, dan spesifikasi yang tercantum pada [dokumen rujukan] dibandingkan dengan [gambar terbangun atau data lapangan]. Dokumen yang belum tersedia atau belum dapat diverifikasi dicatat dalam rekap pemeriksaan.","previous":"[Catat dokumen yang diperiksa, sumbernya, dan cara membandingkannya dengan kondisi terbangun.]"}],
          ["Observasi visual dan pengujian", { body: linkedMethodNarratives["Observasi visual dan pengujian"], previous: "[Catat waktu, lokasi, alat, dan metode pengujian yang benar-benar dilakukan.]" }],
        ],
        ["Alat dan bahan pemeriksaan", { body: linkedMethodNarratives["Alat dan bahan pemeriksaan"], previous: "[Cantumkan alat, satuan, serta kalibrasi bila relevan.]" }],
        {"table":"Daftar alat pemeriksaan","columns":["Alat","Kegunaan","Satuan / kalibrasi"],"rows":[["[Alat ukur atau uji]","[Parameter yang diukur]","[Satuan dan status kalibrasi]"],["[Alat dokumentasi]","[Jenis bukti yang dicatat]","[Keterangan]"]]},
        [
          "Standar pemeriksaan",
          {"body":"Acuan penilaian untuk objek kajian ini meliputi [peraturan, standar teknis, dan dokumen rencana yang relevan]. Setiap acuan dicatat bersama nomor, tahun atau edisi, dan parameter yang digunakan untuk membandingkan hasil pemeriksaan.","previous":"[Masukkan standar dan ketentuan yang digunakan pengkaji untuk proyek ini.]"},
          ["Tata bangunan", {"body":"Penilaian tata bangunan mengacu pada [ketentuan tata ruang, dokumen perizinan, dan gambar rencana yang digunakan]. Aspek pembanding meliputi fungsi bangunan, intensitas, sempadan, tata ruang dalam, dan hubungan dengan lingkungan tapak.","previous":"[Catat acuan pemeriksaan fungsi, intensitas, sempadan, dan tata ruang.]"}],
          ["Keselamatan", {"body":safetyNarrative,"previous":"[Catat acuan struktur, kebakaran, listrik, dan penangkal petir yang berlaku pada objek.]"}],
          ["Kesehatan", {"body":healthNarrative,"previous":"[Catat acuan penghawaan, pencahayaan, air, dan sanitasi.]"}],
          ["Kenyamanan", {"body":comfortNarrative,"previous":"[Catat acuan ruang gerak, suhu, kelembapan, getaran, atau kebisingan.]"}],
          ["Kemudahan", {"body":easeNarrative,"previous":"[Catat acuan akses, sirkulasi, dan kelengkapan fasilitas.]"}],
        ],
      ],
      [
        "Gambaran umum",
        ["Kedudukan objek dan lokasi", {"body":"Objek kajian berlokasi di [alamat lengkap], dengan akses utama dari [jalan atau arah masuk]. Tapak berbatasan dengan [batas sisi utara, timur, selatan, dan barat]. Posisi bangunan dan pembagian area dapat dilihat pada [nomor gambar situasi atau denah].","previous":"[Uraikan alamat, orientasi tapak, batas persil, dan akses utama.]"}],
        ["Identitas dan fungsi bangunan", {"body":"Bangunan yang dikaji adalah [nama bangunan], milik atau dikelola oleh [nama pemilik/pengelola]. Berdasarkan [dokumen], fungsi bangunan tercatat sebagai [fungsi dalam dokumen]. Pada saat pemeriksaan, unit [nama unit] dimanfaatkan untuk [fungsi aktual].","previous":"[Identifikasi nama, pemilik, fungsi, dan unit bangunan.]"}],
        ["Data teknis bangunan", {"body":"Data teknis dirangkum dari [sumber dokumen] dan [sumber verifikasi lapangan]. Parameter yang dicatat meliputi tahun pembangunan, luas persil, luas lantai, jumlah lantai, dan tinggi bangunan. Perbedaan data rencana dan data eksisting dicatat pada tabel data umum.","previous":"[Catat tahun pembangunan, luas, lantai, ketinggian, dan sumber data.]"}],
        {"table":"Data umum bangunan gedung","columns":["Parameter","Data rencana / izin","Data eksisting","Sumber"],"rows":[["Tahun pembangunan","[Data izin/rencana]","[Data terverifikasi]","[Rujukan]"],["Luas persil","[Data izin/rencana]","[Data terverifikasi]","[Rujukan]"],["Luas lantai","[Data izin/rencana]","[Data terverifikasi]","[Rujukan]"],["Jumlah lantai","[Data izin/rencana]","[Data terverifikasi]","[Rujukan]"],["Tinggi bangunan","[Data izin/rencana]","[Data terverifikasi]","[Rujukan]"]]},
        ["Kondisi eksisting", { body: contextualNarrative("Kondisi eksisting"), previous: "[Jelaskan pemanfaatan aktual serta kondisi umum saat pemeriksaan. Tambahkan denah dan foto sesuai kebutuhan.]" }],
      ],
      [
        "Tinjauan aspek dokumen administrasi",
        ["Dokumen pemilik dan pertanahan", {"body":"Identitas pemilik atau pengelola dicatat berdasarkan [nama dan rujukan dokumen]. Data penguasaan atau penggunaan tanah diperoleh dari [jenis dokumen, nomor, dan tanggal]. Hasil pencocokan identitas, lokasi, dan data persil adalah [hasil verifikasi].","previous":"[Ringkas dokumen pemilik, bukti penguasaan tanah, serta status dan catatan verifikasinya.]"}],
        ["Dokumen perizinan dan teknis", {"body":"Dokumen perizinan yang ditelaah adalah [jenis dokumen dan nomor], sedangkan dokumen teknis yang tersedia meliputi [gambar rencana, gambar terbangun, dan dokumen terkait]. Pencocokan fungsi, data teknis, dan lingkup izin terhadap kondisi aktual menghasilkan [ringkasan hasil telaah].","previous":"[Bandingkan PBG/IMB, gambar rencana, gambar terbangun, dan dokumen pendukung yang tersedia.]"}],
        { table: "Rekap pemeriksaan dokumen", columns: documentReviewHeaders,
          rows: documentReviewExamples.map((name) => documentReviewRow("[" + name + "]")) },
        ["Kesenjangan dan tindak lanjut", { body: documentFollowUp, previous: "[Sebutkan dokumen yang kurang, data yang berbeda, dan siapa yang perlu menindaklanjutinya.]" }],
      ],
      [
        architectureChapterTitle,
        [
          "Pemeriksaan persyaratan tata bangunan gedung",
          {"body":"Kondisi tata bangunan dibandingkan dengan [dokumen pembanding] untuk menilai peruntukan, intensitas, penampilan, tata ruang dalam, dan hubungan dengan lingkungan. Hasil penilaian disajikan menurut ruang lingkup dan bukti yang tersedia pada bagian berikut.","previous":"[Ringkas hasil perbandingan desain dengan kondisi bangunan.]"},
          ["Peruntukan bangunan", { body: buildingUse, previous: "[Catat fungsi yang diizinkan dan pemanfaatan aktual per ruang atau unit.]" }],
          ["Intensitas bangunan", { body: intensityNarrative, previous: "[Catat luas, jumlah lantai, ketinggian, intensitas, dan sempadan berdasarkan data proyek.]" }],
          ["Penampilan bangunan", { body: appearanceNarrative, previous: "[Uraikan bentuk, fasad, atap, dan kondisi elemen arsitektural.]" }],
          ["Tata ruang dalam", { body: "", previous: "[Uraikan susunan, luasan, fungsi, dan kondisi ruang.]" }],
          ["Keselarasan dengan lingkungan", { body: "", previous: "[Uraikan ruang terbuka, sirkulasi, parkir, dan kondisi area luar.]" }],
        ],
        ["Kesehatan", { body: architectureHealthIntro, previous: "[Catat hasil pemeriksaan pencahayaan atau aspek kesehatan yang dibahas dalam disiplin arsitektur.]" }],
        { table: architectureHealthTableTitle, columns: architectureHealthColumns },
        [architectureComfort.heading, { body: architectureComfort.intro, previous: architectureComfort.previous }],
        { table: architectureComfort.title, columns: architectureHealthColumns },
        [architectureEase.heading, { body: architectureEase.intro, previous: architectureEase.previous }],
        { table: architectureEase.title, columns: architectureHealthColumns },
        ["Kesimpulan bidang arsitektur", {"body":"Berdasarkan ruang lingkup dan bukti yang tersedia, hasil penilaian arsitektur adalah [kesimpulan pengkaji]. Ketidaksesuaian atau bagian yang masih memerlukan verifikasi meliputi [temuan]. Rekomendasi terkait dirujuk pada [nomor rekomendasi].","previous":"[Ringkas bukti, ketidaksesuaian, dan rujukan tindak lanjut.]"}],
      ],
      [
        "Laporan pengkajian teknis bidang struktur",
        ["Data sistem struktur", {"body":"Sistem struktur bangunan terdiri atas [sistem utama dan material] menurut [gambar atau dokumen teknis]. Bagian yang dapat diamati meliputi [daftar elemen yang dapat diakses]. Informasi yang belum didukung dokumen atau belum terverifikasi adalah [batasan data].","previous":"[Identifikasi sistem struktur, material, gambar, dan bagian yang dapat diakses.]"}],
        ["Pemeriksaan elemen struktur", {"body":structuralInspectionNarrative,"previous":"[Catat kondisi, lokasi sampel, kerusakan teramati, dan foto unsur yang diperiksa.]"}],
        ["Hasil pengujian dan analisis", {"body":structuralTestingNarrative,"previous":"[Masukkan metode, hasil, satuan, dasar pembanding, dan batasan bila dilakukan pengujian.]"}],
        {"table":"Rekap hasil pemeriksaan struktur","columns":["Elemen / lokasi","Observasi atau hasil uji","Satuan / acuan","Temuan"],"rows":[["[Elemen dan lokasi sampel]","[Kondisi atau hasil uji]","[Satuan / acuan]","[Temuan terverifikasi]"]]},
        ["Kesimpulan bidang struktur", {"body":structuralConclusionNarrative,"previous":"[Ringkas temuan dan keterbatasan berdasarkan hasil pemeriksaan.]"}],
      ],
      [
        "Laporan pengkajian teknis bidang MEP",
        [
          "Keselamatan",
          {"body":mepSafetyNarrative,"previous":"[Ringkas kondisi utilitas terkait keselamatan.]"},
          ["Proteksi kebakaran", { body: contextualNarrative("Proteksi kebakaran"), previous: "[Catat sistem pasif, aktif, dan sarana evakuasi yang diperiksa.]" }],
          ["Penangkal petir", lightningProtectionNarrative],
          ["Instalasi listrik", {"body":"Instalasi listrik yang ditinjau mencakup [sumber, panel, jaringan distribusi, dan perangkat proteksi]. Pada [lokasi panel atau sistem] tercatat [kondisi aktual], berdasarkan [observasi, dokumen, atau hasil pengujian]. Bagian yang memerlukan tindak lanjut adalah [temuan].","previous":"[Catat sumber, panel, distribusi, perlindungan, dan kondisi instalasi.]"}],
        ],
        [
          "Kesehatan",
          {"body":"Pemeriksaan utilitas kesehatan mencakup [penghawaan, pencahayaan, air bersih, sanitasi, atau sistem terkait]. Hasil observasi dan pengukuran dirinci menurut sistem yang diperiksa dan sumber bukti yang tersedia.","previous":"[Ringkas hasil pemeriksaan utilitas kesehatan.]"},
          ["Penghawaan dan pencahayaan", {"body":"Pada [lokasi sampel], penghawaan disediakan melalui [sistem atau bukaan], sedangkan pencahayaan berasal dari [sumber]. Hasil pengamatan atau pengukuran adalah [hasil dan satuan], dengan metode [metode] serta acuan [acuan].","previous":"[Masukkan lokasi sampel, metode, hasil ukur, dan satuan.]"}],
          ["Air bersih, air limbah, dan air hujan", {"body":"Air bersih berasal dari [sumber] dan disalurkan melalui [sistem distribusi]. Air limbah dialirkan atau diolah melalui [sistem], sedangkan air hujan ditangani oleh [sistem drainase atau penampungan]. Kondisi terverifikasi dan keterbatasannya adalah [hasil verifikasi].","previous":"[Catat sumber, jaringan distribusi, pengolahan, dan kondisi aktual.]"}],
          ["Persampahan dan utilitas khusus", {"body":contextualNarrative("Persampahan dan utilitas khusus"),"previous":"[Catat sistem yang ada dan yang relevan dengan fungsi bangunan.]"}],
        ],
        ["Kenyamanan", {"body":"Kondisi udara ruang serta getaran atau kebisingan ditinjau pada [lokasi sampel]. Parameter yang diperoleh adalah [hasil dan satuan] berdasarkan [metode atau sumber data]. Penilaian terhadap hasil tersebut adalah [hasil telaah dan keterbatasan].","previous":"[Catat kondisi udara ruang serta pengukuran getaran atau kebisingan bila dilakukan.]"}],
        ["Kemudahan", {"body":contextualNarrative("Kemudahan"),"previous":"[Catat sarana, peralatan, dan fasilitas yang diperiksa.]"}],
        ["Kesimpulan bidang MEP", {"body":"Pemeriksaan bidang MEP menghasilkan [kesimpulan pengkaji] berdasarkan [bukti atau rujukan bagian laporan]. Prioritas tindak lanjut berada pada [sistem dan lokasi], dengan mempertimbangkan [dampak temuan dan kebutuhan verifikasi].","previous":"[Ringkas temuan utama, rujukan bukti, dan prioritas tindak lanjut.]"}],
      ],
      [
        "Rekomendasi",
        ["Ringkasan hasil kajian", {"body":"Berdasarkan pemeriksaan administrasi serta pengkajian arsitektur, struktur, dan MEP, temuan utama meliputi [daftar temuan terverifikasi]. Bukti dan batasan penilaian diuraikan pada [bab, tabel, atau lampiran]. Kesimpulan pengkaji dalam lingkup kajian ini adalah [kesimpulan berdasarkan bukti].","previous":"[Rangkum temuan administrasi, arsitektur, struktur, dan MEP dengan rujukan bagian laporan.]"}],
        ["Rekomendasi dan prioritas", {"body":"Untuk menindaklanjuti [temuan], pengkaji merekomendasikan [tindakan]. Prioritas ditetapkan berdasarkan [dampak temuan dan kebutuhan penanganan]. Pelaksanaan menjadi tanggung jawab [pihak terkait] dengan target [target waktu atau tahapan]. Rincian tiap butir dicantumkan dalam matriks rekomendasi.","previous":"[Tuliskan tindakan yang direkomendasikan berdasarkan bukti dan penilaian pengkaji.]"}],
        {"table":"Matriks rekomendasi dan tindak lanjut","columns":["Aspek / temuan","Tindakan","Prioritas","Penanggung jawab / target"],"rows":[["[Aspek dan temuan]","[Tindakan usulan]","[Prioritas]","[Penanggung jawab dan target]"]]},
        ["Verifikasi tindak lanjut", {"body":"Penyelesaian rekomendasi akan dinilai melalui [bukti penyelesaian, dokumentasi, atau hasil pengujian ulang]. Verifikasi diusulkan pada [waktu atau tahapan], dengan ruang lingkup [komponen dan lokasi] dan penanggung jawab [pihak yang memverifikasi].","previous":"[Catat bukti penyelesaian yang diperlukan dan rencana pemeriksaan ulang.]"}],
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
const approvalPlaceholder = "[Isi pernyataan pengesahan setelah pemeriksaan dan penelaahan laporan selesai.]";
const acknowledgementsPlaceholder = "[Tambahkan ucapan terima kasih dan keterangan yang diperlukan.]";
const previousAcknowledgements = [
  "Kami menyampaikan terima kasih kepada [pemilik/pengelola bangunan] atas dukungan dalam penyediaan dokumen dan akses pemeriksaan, serta kepada tim pengkaji, petugas lapangan, dan seluruh pihak yang membantu pengumpulan data, pemeriksaan, dan penelaahan laporan ini.",
  "Laporan ini disusun berdasarkan data yang tersedia dan lingkup pemeriksaan yang ditetapkan. Kami menghargai masukan yang disertai informasi pendukung untuk penyempurnaan laporan. Semoga laporan ini bermanfaat sebagai rujukan dalam menindaklanjuti temuan dan menjaga keandalan fungsi bangunan.",
].join("\n\n");
const previousApprovalStatement = [
  "Pemeriksaan bangunan dan penelaahan laporan ini telah selesai dilaksanakan sesuai dengan ruang lingkup kajian. Penelaahan mencakup dokumen administrasi dan teknis, hasil pemeriksaan lapangan, serta bukti yang mendasari kesimpulan dan rekomendasi dalam laporan.",
  "Dengan ini, kami mengesahkan laporan ini sebagai dokumen hasil kajian teknis kelaikan fungsi [nama bangunan]. Rekomendasi dan tindak lanjut yang tercantum dalam laporan menjadi acuan bagi pihak terkait sesuai dengan tanggung jawab masing-masing.",
].join("\n\n");

const prefaceOpening = "Laporan kajian teknis ini disusun untuk [tujuan kajian] pada [nama bangunan] di [lokasi]. Laporan memuat ruang lingkup, metode, hasil pemeriksaan, dan rekomendasi berdasarkan dokumen serta temuan yang dicatat tim pengkaji.";
const approvalIdentity = "Judul laporan: [judul laporan]\nObjek kajian: [nama dan alamat bangunan]\nNomor / revisi: [nomor laporan]";

const acknowledgementsText = [
  "Tim pengkaji menyusun laporan ini untuk memberikan gambaran kondisi bangunan pada saat pemeriksaan. Penelaahan dimulai dengan mengenali fungsi dan pemanfaatan bangunan, meninjau kelengkapan informasi yang tersedia, dan membandingkannya dengan hasil pengamatan lapangan. Uraian teknis mengikuti bidang yang diperiksa, dengan memperhatikan tata bangunan, keselamatan, kesehatan, kenyamanan, serta kemudahan. Hasil pengamatan, pengukuran, atau pengujian yang menjadi dasar penilaian dicatat pada bagian yang berkaitan dengan masing-masing temuan.",
  "Naskah disusun agar pembaca dapat mengikuti hubungan antara data, temuan, kesimpulan, dan rekomendasi. Bab pendahuluan serta metode menjelaskan objek dan dasar pemeriksaan. Bab gambaran umum dan tinjauan dokumen memberikan konteks bagi pembahasan teknis. Bagian hasil pengkajian memuat kondisi yang teramati, sedangkan daftar simak dan dokumentasi berfungsi sebagai rujukan untuk menelusuri butir pemeriksaan. Rekomendasi merangkum tindak lanjut yang dinilai perlu berdasarkan hasil kajian.",
  "Kami menyampaikan terima kasih kepada [pemilik/pengelola bangunan] atas dukungan dalam penyediaan dokumen, pemberian akses, dan koordinasi selama pemeriksaan. Kami juga berterima kasih kepada tim pengkaji, petugas lapangan, tenaga administrasi, dan pihak pendukung yang membantu penyiapan data, pendokumentasian kondisi bangunan, serta penelaahan laporan. Kerja sama tersebut membantu tim mencatat temuan secara runtut dan menyiapkan bahan yang dapat ditinjau kembali.",
  "Ruang lingkup dan batasan kajian dicantumkan agar pembaca dapat menafsirkan hasil sesuai dengan kondisi saat pemeriksaan dan informasi yang tersedia. Bila ada data tambahan yang belum tercakup, perubahan penggunaan ruang, atau pekerjaan perbaikan setelah pemeriksaan, informasi tersebut dapat digunakan sebagai dasar penelaahan lanjutan. Kami menghargai masukan yang disertai bukti pendukung sehingga temuan atau kesimpulan dapat ditinjau dengan alasan yang jelas.",
  "Untuk memudahkan penggunaan laporan, setiap pembahasan teknis dapat dibaca bersama dokumen dan foto yang dirujuk pada bagian tersebut. Pembaca yang memerlukan gambaran awal dapat melihat ringkasan temuan pada bagian rekomendasi, kemudian merujuk uraian pemeriksaan untuk mengetahui lokasi, sumber data, dan batasan penilaiannya. Susunan ini juga memudahkan tim ketika memeriksa kembali temuan setelah tindak lanjut dilakukan.",
  "Semoga laporan ini membantu pemilik, pengelola, dan pihak terkait menentukan prioritas tindak lanjut serta memantau penyelesaian rekomendasi. Kami berharap hasil kajian dapat digunakan sebagai rujukan dalam pemeliharaan dan pengelolaan bangunan sesuai fungsi yang diperiksa, serta memudahkan komunikasi antara pihak yang bertanggung jawab atas pelaksanaan maupun verifikasi pekerjaan lanjutan.",
].join("\n\n");

const approvalStatement = [
  "Pemeriksaan bangunan dan penelaahan laporan ini telah selesai dilaksanakan sesuai dengan ruang lingkup kajian. Pemeriksaan mencakup penelusuran dokumen administratif dan teknis, pengamatan kondisi bangunan, serta pengukuran atau pengujian yang tercatat dalam laporan. Penelaahan dilakukan terhadap data yang tersedia dan bukti yang menjadi dasar temuan, dengan memperhatikan lokasi, waktu, dan metode pemeriksaan yang dicantumkan.",
  "Dalam penelaahan laporan, tim meninjau keterkaitan antara identitas objek, ruang lingkup, metode, hasil pemeriksaan, dan kesimpulan. Keterangan tentang kondisi bangunan dirujukkan pada dokumen, hasil pengamatan, daftar simak, hasil pengukuran atau pengujian, serta dokumentasi yang tersedia. Temuan yang memerlukan tindakan dicantumkan bersama rekomendasi agar dasar penilaian dan tindak lanjutnya dapat ditelusuri.",
  "Penelaahan juga mencakup kesesuaian antara uraian pada setiap bidang dan ringkasan hasil kajian. Rekomendasi yang disusun mempertimbangkan kondisi yang tercatat, dampak temuan, serta kebutuhan perbaikan atau verifikasi lanjutan. Bagian yang belum terverifikasi, data yang belum lengkap, atau area dengan keterbatasan akses dicatat sesuai batasan pemeriksaan dalam laporan.",
  "Dengan ini, kami mengesahkan laporan ini sebagai dokumen hasil kajian teknis kelaikan fungsi [nama bangunan]. Pengesahan diberikan atas naskah dengan nomor dan revisi yang tercantum pada lembar ini. Kesimpulan yang dimuat berlaku dalam lingkup kajian dan berdasarkan kondisi serta bukti yang tersedia pada saat pemeriksaan.",
  "Laporan yang disahkan digunakan sebagai rujukan bagi pemilik, pengelola, dan pihak terkait dalam menindaklanjuti rekomendasi sesuai tanggung jawab masing-masing. Pelaksanaan tindak lanjut dapat dicatat bersama bukti penyelesaiannya. Jika kemudian terdapat perubahan kondisi bangunan, perubahan pemanfaatan, atau informasi baru yang berpengaruh terhadap hasil kajian, kebutuhan penelaahan kembali ditentukan berdasarkan perubahan tersebut.",
  "Bukti tindak lanjut dapat berupa dokumentasi perbaikan, dokumen teknis yang telah dilengkapi, atau hasil pemeriksaan ulang yang sesuai dengan jenis temuan. Lokasi dan komponen yang ditangani dicatat dengan mengacu pada butir pemeriksaan terkait. Bagian laporan yang menjadi dasar tindak lanjut dan bukti penyelesaiannya dapat disimpan bersama agar riwayat penanganan dapat diperiksa kembali.",
  "Sebagai bagian dari pengendalian dokumen, perubahan isi setelah pengesahan dicatat dalam revisi laporan. Naskah revisi ditelaah kembali apabila perubahan memengaruhi data, temuan, kesimpulan, atau rekomendasi. Pihak yang mengesahkan laporan dicantumkan di bawah ini.",
].join("\n\n");

const frontDefaults = {
  preface: prefaceOpening + "\n\n" + acknowledgementsText,
  approval: approvalIdentity + "\n\n" + approvalStatement,
  consultantType: "badan-usaha",
};
const frontFields = [
  ["preface", "Kata pengantar"], ["approval", "Lembar pengesahan"],
  ["location", "Tempat dan tanggal pengesahan"], ["signatory", "Nama penandatangan"], ["role", "Jabatan / peran"],
  ["consultantDirector", "Nama Direktur Badan Usaha Pengkaji"],
  ["individualName", "Nama pengkaji teknis"],
];

const isIndividualConsultant = (project) => project.front.consultantType === "perorangan";

function consultantNameField(project) {
  return isIndividualConsultant(project) ? [project.front, "individualName"] : [project.cover, "consultant"];
}

const roman = (number) => {
  let text = "";
  for (const [value, digit] of [[100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]) {
    while (number >= value) { text += digit; number -= value; }
  }
  return text;
};

function templateBlocks(sections, depth = 1, previous = false) {
  return sections.flatMap((section) => {
    if (section === "@checklist") return [];
    if (!Array.isArray(section)) {
      const rows = !previous && section.rows ? section.rows.map((row) => [...row]) : [section.columns.map(() => "")];
      return [{ type: "table", text: section.table, headers: [...section.columns], rows }];
    }
    const [text, narrative, ...children] = section;
    const body = typeof narrative === "string" ? narrative : previous ? narrative.previous : narrative.body;
    return [{ type: "heading", text, body, depth }, ...templateBlocks(children, depth + 1, previous)];
  });
}

const disciplineNarrativeRevision = 1;
const architectureHealthTableRevision = 2;
const architectureInspectionRevision = 3;

function upgradeDisciplineDraft(project) {
  if (project.template !== "disiplin" || project.narrativeRevision >= disciplineNarrativeRevision) return;
  for (const [title, ...sections] of reportTemplates.disiplin.chapters) {
    const chapter = project.chapters.find((entry) => entry.title === title);
    if (!chapter) continue;
    const starters = templateBlocks(sections);
    const previous = templateBlocks(sections, 1, true);
    for (const [index, old] of previous.entries()) {
      const next = starters[index];
      if (old.type === "heading" && old.body !== next.body) {
        for (const block of chapter.blocks) {
          if (block.type === old.type && block.text === old.text && block.body === old.body) block.body = next.body;
        }
      }
      if (old.type === "table") {
        for (const block of chapter.blocks) {
          if (block.type === old.type && block.text === old.text &&
              JSON.stringify(block.headers) === JSON.stringify(old.headers) &&
              JSON.stringify(block.rows) === JSON.stringify(old.rows)) block.rows = next.rows.map((row) => [...row]);
        }
      }
    }
  }
  project.narrativeRevision = disciplineNarrativeRevision;
}

function upgradeArchitectureHealthDraft(project) {
  if (project.template !== "disiplin" || project.narrativeRevision >= architectureHealthTableRevision) return;
  for (const chapter of project.chapters) {
    const index = chapter.blocks.findIndex((block) => block.type === "heading" &&
      (block.body === previousArchitectureHealth ||
        (chapter.title === architectureChapterTitle && tokenName(block.text) === "kesehatan")));
    if (index < 0) continue;
    const heading = chapter.blocks[index];
    const previous = heading.body === previousArchitectureHealth || heading.body === architectureHealthIntro;
    const links = previous ? architectureHealthTokens.map((token) => heading.links?.[token]) : [];
    const hasValues = links.some((link) => link?.source || link?.value?.trim());
    if (heading.body === previousArchitectureHealth) {
      updateTextFormat(heading, "body", heading.body, architectureHealthIntro);
      heading.body = architectureHealthIntro;
    }
    let table = chapter.blocks[index + 1];
    if (table?.type !== "table" || table.text !== architectureHealthTableTitle ||
        (hasValues && (table.headers.length !== architectureHealthColumns.length ||
          table.headers.slice(0, 4).some((value, column) => value !== architectureHealthColumns[column])))) {
      table = { type: "table", text: architectureHealthTableTitle, headers: [...architectureHealthColumns],
        rows: hasValues ? [] : [architectureHealthColumns.map(() => "")] };
      chapter.blocks.splice(index + 1, 0, table);
    }
    if (!hasValues) continue;
    const row = table.rows.length;
    table.rows.push(links.map((link) => link?.value ?? ""));
    ensureReportReferences({ chapters: [{ blocks: [table] }] });
    for (const [column, link] of links.entries()) {
      const cell = tableCellKey(table, row, column);
      if (link?.source) (table.cellLinks ??= {})[cell] = link.source;
      else if (link) setTextFormat(table, "cell:" + cell, getTextFormat(link, "value"));
    }
  }
  project.narrativeRevision = architectureHealthTableRevision;
}

function upgradeArchitectureInspectionDraft(project) {
  if (project.template !== "disiplin" || project.narrativeRevision >= architectureInspectionRevision) return;
  const chapter = project.chapters.find((entry) => entry.title === architectureChapterTitle ||
    entry.blocks.some(isArchitectureHealthTable));
  if (chapter) for (const spec of [architectureComfort, architectureEase]) {
    const index = chapter.blocks.findIndex((block) => block.type === "heading" &&
      (block.text === spec.heading || block.body === spec.narrative || block.body === spec.intro));
    if (index < 0) continue;
    const heading = chapter.blocks[index];
    const useIntro = [spec.previous, spec.narrative, spec.intro, ""].includes(heading.body);
    const links = useIntro ? spec.tokens.map((token) => heading.links?.[token]) : [];
    let table = chapter.blocks[index + 1];
    if (table?.type !== "table" || table.text !== spec.title) {
      table = { type: "table", text: spec.title, headers: [...architectureHealthColumns], rows: [] };
      chapter.blocks.splice(index + 1, 0, table);
    }
    if (useIntro) {
      updateTextFormat(heading, "body", heading.body, spec.intro);
      heading.body = spec.intro;
    }
    if (!links.some((link) => link?.source || link?.value?.trim())) continue;
    const row = table.rows.length;
    table.rows.push(table.headers.map((_, column) => links[column]?.value ?? ""));
    ensureReportReferences({ chapters: [{ blocks: [table] }] });
    for (const [column, link] of links.entries()) {
      if (!link || column >= table.headers.length) continue;
      const cell = tableCellKey(table, row, column);
      if (link.source) (table.cellLinks ??= {})[cell] = link.source;
      else setTextFormat(table, "cell:" + cell, getTextFormat(link, "value"));
    }
  }
  project.narrativeRevision = architectureInspectionRevision;
}

function upgradeReportDraft(project) {
  upgradeDisciplineDraft(project);
  upgradeArchitectureHealthDraft(project);
  upgradeArchitectureInspectionDraft(project);
  initializeHealthMeasurements(project);
  for (const chapter of project.chapters) for (const block of chapter.blocks) {
    let revisedNarrative = block.type === "heading" ? revisedStandardNarratives.get(block.body) : undefined;
    if (block.type === "heading" && block.body.endsWith(appearanceEvidenceParagraph)) {
      revisedNarrative = block.body.slice(0, -appearanceEvidenceParagraph.length);
    }
    if (block.type === "heading" && block.body === previousIntensityNarrative) {
      const savedDetails = intensityDetailFields.flatMap(([token, label]) => {
        const link = block.links?.[token];
        return link?.source || link?.value?.trim() ? [label + " — [" + token + "]."] : [];
      });
      revisedNarrative = [...savedDetails, intensityNarrative].join(" ");
    }
    const legacyFields = block.body === previousRoomLayoutNarrative ? roomLayoutLegacyFields :
      block.body === previousEnvironmentNarrative ? environmentLegacyFields : undefined;
    if (block.type === "heading" && legacyFields) {
      revisedNarrative = legacyFields.flatMap(([token, label]) => {
        const link = block.links?.[token];
        return link?.source || link?.value?.trim() ? [label + " — [" + token + "]."] : [];
      }).join(" ");
    }
    if (revisedNarrative !== undefined) {
      updateTextFormat(block, "body", block.body, revisedNarrative);
      block.body = revisedNarrative;
    }
    if (block.type !== "photo" || !block.image) continue;
    const first = importTextFormats({ image: block.image, text: block.text }, block, ["text"]);
    block.photos = [first, ...(block.photos ?? [])];
    block.text = "";
    delete block.image;
    setTextFormat(block, "text", undefined);
  }
  if (typeof project.front.preface === "string") {
    project.front.preface = project.front.preface === prefaceOpening + "\n\n" + previousAcknowledgements ?
      frontDefaults.preface : project.front.preface.replace(acknowledgementsPlaceholder, acknowledgementsText);
  }
  if (typeof project.front.approval === "string") {
    project.front.approval = project.front.approval === approvalIdentity + "\n\n" + previousApprovalStatement ?
      frontDefaults.approval : project.front.approval.replace(approvalPlaceholder, approvalStatement);
  }
  if (project.template === "disiplin") {
    for (const chapter of project.chapters) {
      for (const block of chapter.blocks) {
        if (block.type !== "heading") continue;
        if (block.text === "Tujuan" && block.body === originalPurposeText) block.body = purposeText;
        if (Object.hasOwn(originalIntroduction, block.text) && block.body === originalIntroduction[block.text] &&
            !Object.hasOwn(block.links ?? {}, "pengajuan/perpanjangan")) {
          block.body = linkedIntroduction[block.text];
        }
        if (Object.hasOwn(originalMethodNarratives, block.text) && block.body === originalMethodNarratives[block.text]) {
          block.body = linkedMethodNarratives[block.text];
          if (block.links?.tanggal && !block.links["tanggal pemeriksaan"]) {
            block.links["tanggal pemeriksaan"] = block.links.tanggal;
          }
        }
        if (Object.hasOwn(contextualNarratives, block.text)) {
          const { marker, replacement, previous } = contextualNarratives[block.text];
          if (block.body !== previous) continue;
          const updated = contextualNarrative(block.text);
          updateTextFormat(block, "body", block.body, updated);
          block.body = updated;
          if (block.links?.[marker] && !block.links[replacement]) block.links[replacement] = block.links[marker];
        }
      }
    }
  }
}

function mepSafetyKey(title) {
  const key = tokenName(title).replace(/^sistem /, "");
  return key === "proteksi petir" ? "penangkal petir" : key;
}

function mepSafetyParameters(chapter, parent) {
  const start = chapter.blocks.indexOf(parent) + 1;
  let end = chapter.blocks.findIndex((block, index) => index >= start && block.type === "heading" && block.depth !== 2);
  if (end < 0) end = chapter.blocks.length;
  const parameters = chapter.blocks.slice(start, end).filter(block => block.type === "heading" && block.depth === 2);
  return { parameters, end };
}

function initializeMepSafety(project, fresh = false) {
  if (project.template !== "disiplin") return;
  const [title, ...sections] = reportTemplates.disiplin.chapters[6];
  const definition = sections.find(section => Array.isArray(section) && section[1]?.body === mepSafetyNarrative);
  for (const chapter of project.chapters) {
    const parent = chapter.blocks.find(block => block.mepSafety || (block.type === "heading" && block.depth !== 2 &&
      (block.body?.includes("[" + mepSafetyToken + "]") || (chapter.title === title && tokenName(block.text) === "keselamatan"))));
    if (!parent || parent.mepSafety) continue;
    const { parameters, end } = mepSafetyParameters(chapter, parent);
    parent.mepSafety = true;
    for (const child of parameters) child.mepSafetySelected = !fresh;
    const defaults = templateBlocks(definition.slice(2), 2);
    const existing = new Map(parameters.map(block => [mepSafetyKey(block.text), block]));
    const missing = [];
    for (const preset of defaults) {
      const child = existing.get(mepSafetyKey(preset.text)) || preset;
      child.mepSafetyPreset = preset.text;
      if (child === preset) {
        child.mepSafetySelected = false;
        missing.push(child);
      }
    }
    chapter.blocks.splice(end, 0, ...missing);
  }
}

function mepSafetySummary(chapter, parent, resolveToken) {
  const selected = mepSafetyParameters(chapter, parent).parameters
    .filter(block => block.mepSafetySelected !== false).map(block => block.text.trim()).filter(Boolean);
  const value = selected.length ? scopeList.format(selected) : "";
  const body = parent.body?.trim() || mepSafetyNarrative;
  if (!value && body === mepSafetyNarrative) return reportParagraphs("Parameter keselamatan belum dipilih.");
  const format = getTextFormat(parent, "body");
  const resolve = (original, label) => tokenName(label) === mepSafetyToken ?
    { value: value || "parameter yang belum dipilih" } : resolveToken(original, label);
  const result = reportParagraphs(body, format, resolve);
  if (value && !reportTokens(body).has(mepSafetyToken)) {
    result.push(...reportParagraphs("Parameter keselamatan yang dipilih meliputi " + value + "."));
  }
  return result;
}

function headingEntries(chapter, chapterIndex) {
  let group = 0;
  let child = 0;
  const entries = new Map();
  for (const [index, block] of chapter.blocks.entries()) {
    if (block.type !== "heading" || block.mepSafetySelected === false) continue;
    const nested = block.depth === 2 && group > 0;
    if (nested) child++;
    else { group++; child = 0; }
    const number = [chapterIndex + 1, group, ...(nested ? [child] : [])].join(".");
    entries.set(index, { number, nested });
  }
  return entries;
}
