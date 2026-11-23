"use strict";

const reportTemplates = {
  disiplin: {
    label: "Kajian per disiplin · 8 bab",
    description: "Mengikuti susunan per disiplin. Daftar simak ditempatkan setelah bab rekomendasi.",
    chapters: [
      [
        "Pendahuluan",
        ["Latar belakang", {"body":"Pemanfaatan bangunan gedung perlu didukung oleh kondisi yang sesuai dengan fungsi serta persyaratan tata bangunan dan keandalan. Kajian teknis ini disusun untuk mendukung [pengajuan/perpanjangan] Sertifikat Laik Fungsi (SLF) atas [nama bangunan] yang berlokasi di [alamat lengkap]. Bangunan digunakan untuk [fungsi aktual]. Kajian ini dilatarbelakangi oleh [kondisi bangunan atau kebutuhan pemilik] dan mencakup bagian bangunan yang ditetapkan dalam lingkup pekerjaan.","previous":"Kajian teknis ini disusun sebagai bagian dari [pengajuan atau perpanjangan] Sertifikat Laik Fungsi untuk [nama bangunan] di [alamat]. Bangunan berfungsi sebagai [fungsi aktual]. Pengkajian dilakukan atas dasar [alasan dan kondisi yang melatarbelakangi pekerjaan]."}],
        [
          "Maksud, tujuan, dan sasaran",
          {"body":"Penelaahan dokumen dan pemeriksaan kondisi bangunan merupakan dasar untuk menyusun penilaian teknis atas [nama bangunan]. Hasilnya digunakan untuk mendokumentasikan kondisi yang dapat diverifikasi, mencatat kesenjangan terhadap acuan pemeriksaan, dan menyusun rekomendasi yang dapat ditindaklanjuti oleh [pemilik/pengelola bangunan].","previous":"[Jelaskan apa yang dinilai, tujuan pemeriksaan, dan keluaran yang diharapkan.]"},
          ["Maksud", {"body":"Pekerjaan ini dimaksudkan untuk menelaah kelengkapan dan kesesuaian dokumen administratif serta mengkaji kondisi teknis [nama bangunan] sesuai dengan fungsi [fungsi aktual]. Kajian disusun sebagai bahan pertimbangan dalam proses [pengajuan/perpanjangan] SLF.","previous":"[Jelaskan kebutuhan pengkajian teknis untuk bangunan ini.]"}],
          ["Tujuan", {"body":"Kajian ini bertujuan membandingkan kondisi aktual dan pemanfaatan bangunan dengan dokumen yang tersedia, menilai aspek tata bangunan serta keselamatan, kesehatan, kenyamanan, dan kemudahan, dan merumuskan tindak lanjut atas temuan yang didukung bukti pemeriksaan.","previous":"[Tuliskan tujuan pemeriksaan administratif dan teknis.]"}],
          ["Sasaran", {"body":"Sasaran pekerjaan ini adalah tersusunnya data kondisi eksisting, daftar simak, dan rekomendasi yang dapat ditelusuri kembali ke dokumen, observasi, atau hasil uji. Objek yang ditinjau meliputi [unit atau area bangunan], sedangkan sistem yang diperiksa meliputi [sistem utama dalam lingkup kajian].","previous":"[Sebutkan objek dan aspek yang dinilai.]"}],
        ],
        [
          "Lingkup pekerjaan",
          {"body":"Pekerjaan mencakup pengumpulan data awal, penelaahan dokumen, pemeriksaan lapangan, dan penyusunan laporan. Pemeriksaan teknis meliputi [disiplin atau sistem yang diperiksa]. Pengukuran atau pengujian dicantumkan sesuai kegiatan yang dilakukan dan data yang tersedia.","previous":"[Sebutkan unit bangunan, area, dan aspek yang diperiksa.]"},
          ["Lingkup wilayah kegiatan", {"body":"Lokasi kegiatan berada di [alamat lengkap], [desa/kelurahan], [kecamatan], [kabupaten/kota], [provinsi]. Wilayah pemeriksaan meliputi [nama gedung atau blok], [lantai atau area], serta [prasarana tapak yang diperiksa]. Batas area kajian mengacu pada [gambar tapak atau uraian batas].","previous":"[Tuliskan alamat, batas tapak, dan cakupan bangunan.]"}],
          ["Lingkup materi pelaporan", {"body":"Laporan memuat profil objek kajian, daftar dokumen yang ditelaah, kondisi arsitektur, struktur, dan mekanikal, elektrikal, serta plambing (MEP), berikut bukti, temuan, dan rekomendasinya. Sumber data utama meliputi [dokumen, hasil survei, atau hasil uji]. Ruang atau komponen yang belum dapat diverifikasi karena [keterbatasan akses atau data] dicatat sebagai batasan kajian.","previous":"[Jelaskan dokumen, disiplin, dan batasan akses atau pengujian.]"}],
        ],
        ["Sistematika penyusunan","Laporan ini dimulai dengan pendahuluan, metode dan landasan hukum, gambaran umum, serta tinjauan dokumen administrasi. Bagian berikutnya memuat pengkajian bidang arsitektur, struktur, dan MEP. Rekomendasi dan daftar simak melengkapi hasil pengkajian."],
        ["Tim pengkaji teknis", {"body":"Kajian teknis atas [nama bangunan] dilaksanakan oleh [nama penyedia jasa atau tim]. Koordinasi pekerjaan dan penelaahan laporan menjadi tanggung jawab [nama penanggung jawab]. Pembagian bidang, nama pengkaji, dan rujukan kompetensinya tercantum dalam tabel susunan tim.","previous":"[Cantumkan personel, bidang, kompetensi, dan penanggung jawab kajian.]"}],
        {"table":"Susunan tim pengkaji teknis","columns":["Nama","Peran / bidang","Kompetensi / dokumen pendukung"],"rows":[["[Nama pengkaji arsitektur]","Arsitektur","[Jenis dan nomor bukti kompetensi]"],["[Nama pengkaji struktur]","Struktur","[Jenis dan nomor bukti kompetensi]"],["[Nama pengkaji MEP]","MEP","[Jenis dan nomor bukti kompetensi]"]]},
      ],
      [
        "Metode dan landasan hukum",
        [
          "Metode pemeriksaan",
          {"body":"Pemeriksaan disusun dalam tahapan pengumpulan dokumen, telaah awal, verifikasi lapangan, dan analisis temuan. Pemilihan area dan komponen yang diperiksa mempertimbangkan [fungsi, variasi kondisi, keterwakilan, atau riwayat gangguan]. Dasar pemilihan sampel dan batasan metode dicatat pada [tabel atau lampiran].","previous":"[Jelaskan urutan pemeriksaan dan dasar penentuan sampel.]"},
          ["Pemeriksaan dokumen", {"body":"Dokumen yang tersedia untuk ditelaah meliputi [daftar dokumen]. Identitas objek, fungsi, dimensi utama, dan spesifikasi yang tercantum pada [dokumen rujukan] dibandingkan dengan [gambar terbangun atau data lapangan]. Dokumen yang belum tersedia atau belum dapat diverifikasi dicatat dalam rekap pemeriksaan.","previous":"[Catat dokumen yang diperiksa, sumbernya, dan cara membandingkannya dengan kondisi terbangun.]"}],
          ["Observasi visual dan pengujian", {"body":"Observasi lapangan dilaksanakan pada [tanggal] di [area atau posisi sampel]. Kondisi komponen dicatat dalam [daftar simak atau dokumentasi foto]. Pengujian yang dilakukan meliputi [jenis uji, metode, dan acuan atau keterangan tidak dilakukan], dengan batasan [batasan pengamatan atau pengujian].","previous":"[Catat waktu, lokasi, alat, dan metode pengujian yang benar-benar dilakukan.]"}],
        ],
        ["Alat dan bahan pemeriksaan", {"body":"Alat yang digunakan untuk dokumentasi, pengukuran, atau pengujian dicantumkan pada tabel pemeriksaan. Catatan alat mencakup jenis, fungsi, satuan, dan status kalibrasi apabila relevan. Bahan serta dokumen pendukung yang digunakan adalah [daftar bahan dan dokumen].","previous":"[Cantumkan alat, satuan, serta kalibrasi bila relevan.]"}],
        {"table":"Daftar alat pemeriksaan","columns":["Alat","Kegunaan","Satuan / kalibrasi"],"rows":[["[Alat ukur atau uji]","[Parameter yang diukur]","[Satuan dan status kalibrasi]"],["[Alat dokumentasi]","[Jenis bukti yang dicatat]","[Keterangan]"]]},
        [
          "Standar pemeriksaan",
          {"body":"Acuan penilaian untuk objek kajian ini meliputi [peraturan, standar teknis, dan dokumen rencana yang relevan]. Setiap acuan dicatat bersama nomor, tahun atau edisi, dan parameter yang digunakan untuk membandingkan hasil pemeriksaan.","previous":"[Masukkan standar dan ketentuan yang digunakan pengkaji untuk proyek ini.]"},
          ["Tata bangunan", {"body":"Penilaian tata bangunan mengacu pada [ketentuan tata ruang, dokumen perizinan, dan gambar rencana yang digunakan]. Aspek pembanding meliputi fungsi bangunan, intensitas, sempadan, tata ruang dalam, dan hubungan dengan lingkungan tapak.","previous":"[Catat acuan pemeriksaan fungsi, intensitas, sempadan, dan tata ruang.]"}],
          ["Keselamatan", {"body":"Acuan pemeriksaan keselamatan meliputi [standar struktur, proteksi kebakaran, kelistrikan, dan proteksi petir yang relevan]. Parameter yang dijadikan pembanding untuk masing-masing sistem adalah [parameter dan rujukan].","previous":"[Catat acuan struktur, kebakaran, listrik, dan penangkal petir yang berlaku pada objek.]"}],
          ["Kesehatan", {"body":"Aspek kesehatan dinilai menggunakan [standar atau dokumen pembanding] terkait penghawaan, pencahayaan, air bersih, dan sanitasi. Parameter pembanding yang digunakan pada [ruang atau sistem] adalah [parameter, satuan, dan rujukan].","previous":"[Catat acuan penghawaan, pencahayaan, air, dan sanitasi.]"}],
          ["Kenyamanan", {"body":"Acuan aspek kenyamanan mencakup [ketentuan ruang gerak, suhu, kelembapan, getaran, atau kebisingan yang relevan]. Parameter yang diterapkan untuk [fungsi ruang] adalah [parameter dan rujukan].","previous":"[Catat acuan ruang gerak, suhu, kelembapan, getaran, atau kebisingan.]"}],
          ["Kemudahan", {"body":"Akses, sirkulasi, dan kelengkapan fasilitas dinilai dengan [acuan aksesibilitas atau dokumen teknis]. Ketentuan yang dibandingkan dengan kondisi lapangan meliputi [parameter jalur, fasilitas, atau peralatan yang berlaku].","previous":"[Catat acuan akses, sirkulasi, dan kelengkapan fasilitas.]"}],
        ],
      ],
      [
        "Gambaran umum",
        ["Kedudukan objek dan lokasi", {"body":"Objek kajian berlokasi di [alamat lengkap], dengan akses utama dari [jalan atau arah masuk]. Tapak berbatasan dengan [batas sisi utara, timur, selatan, dan barat]. Posisi bangunan dan pembagian area dapat dilihat pada [nomor gambar situasi atau denah].","previous":"[Uraikan alamat, orientasi tapak, batas persil, dan akses utama.]"}],
        ["Identitas dan fungsi bangunan", {"body":"Bangunan yang dikaji adalah [nama bangunan], milik atau dikelola oleh [nama pemilik/pengelola]. Berdasarkan [dokumen], fungsi bangunan tercatat sebagai [fungsi dalam dokumen]. Pada saat pemeriksaan, unit [nama unit] dimanfaatkan untuk [fungsi aktual].","previous":"[Identifikasi nama, pemilik, fungsi, dan unit bangunan.]"}],
        ["Data teknis bangunan", {"body":"Data teknis dirangkum dari [sumber dokumen] dan [sumber verifikasi lapangan]. Parameter yang dicatat meliputi tahun pembangunan, luas persil, luas lantai, jumlah lantai, dan tinggi bangunan. Perbedaan data rencana dan data eksisting dicatat pada tabel data umum.","previous":"[Catat tahun pembangunan, luas, lantai, ketinggian, dan sumber data.]"}],
        {"table":"Data umum bangunan gedung","columns":["Parameter","Data rencana / izin","Data eksisting","Sumber"],"rows":[["Tahun pembangunan","[Data izin/rencana]","[Data terverifikasi]","[Rujukan]"],["Luas persil","[Data izin/rencana]","[Data terverifikasi]","[Rujukan]"],["Luas lantai","[Data izin/rencana]","[Data terverifikasi]","[Rujukan]"],["Jumlah lantai","[Data izin/rencana]","[Data terverifikasi]","[Rujukan]"],["Tinggi bangunan","[Data izin/rencana]","[Data terverifikasi]","[Rujukan]"]]},
        ["Kondisi eksisting", {"body":"Pada saat observasi [tanggal], bangunan berada dalam kondisi [ringkasan kondisi umum]. Pemanfaatan utama teridentifikasi pada [area atau unit]. Dokumentasi berupa [denah, foto, atau catatan lapangan] digunakan untuk menunjukkan kondisi yang dapat diverifikasi.","previous":"[Jelaskan pemanfaatan aktual serta kondisi umum saat pemeriksaan. Tambahkan denah dan foto sesuai kebutuhan.]"}],
      ],
      [
        "Tinjauan aspek dokumen administrasi",
        ["Dokumen pemilik dan pertanahan", {"body":"Identitas pemilik atau pengelola dicatat berdasarkan [nama dan rujukan dokumen]. Data penguasaan atau penggunaan tanah diperoleh dari [jenis dokumen, nomor, dan tanggal]. Hasil pencocokan identitas, lokasi, dan data persil adalah [hasil verifikasi].","previous":"[Ringkas dokumen pemilik, bukti penguasaan tanah, serta status dan catatan verifikasinya.]"}],
        ["Dokumen perizinan dan teknis", {"body":"Dokumen perizinan yang ditelaah adalah [jenis dokumen dan nomor], sedangkan dokumen teknis yang tersedia meliputi [gambar rencana, gambar terbangun, dan dokumen terkait]. Pencocokan fungsi, data teknis, dan lingkup izin terhadap kondisi aktual menghasilkan [ringkasan hasil telaah].","previous":"[Bandingkan PBG/IMB, gambar rencana, gambar terbangun, dan dokumen pendukung yang tersedia.]"}],
        {"table":"Rekap pemeriksaan dokumen","columns":["Dokumen","Nomor / tanggal","Status verifikasi","Keterangan"],"rows":[["Bukti penguasaan tanah","[Nomor / tanggal]","[Hasil verifikasi]","[Catatan]"],["PBG / IMB","[Nomor / tanggal]","[Hasil verifikasi]","[Catatan]"],["Gambar rencana / terbangun","[Nomor / tanggal]","[Hasil verifikasi]","[Catatan]"],["Dokumen pendukung lainnya","[Nomor / tanggal]","[Hasil verifikasi]","[Catatan]"]]},
        ["Kesenjangan dan tindak lanjut", {"body":"Dari penelaahan dokumen, tercatat [dokumen yang kurang atau perbedaan data] dengan dampak terhadap verifikasi [aspek yang terdampak]. Konfirmasi atau pelengkapan dokumen menjadi tindak lanjut [penanggung jawab] dengan bukti yang diperlukan berupa [bukti atau dokumen].","previous":"[Sebutkan dokumen yang kurang, data yang berbeda, dan siapa yang perlu menindaklanjutinya.]"}],
      ],
      [
        "Laporan pengkajian teknis bidang arsitektur",
        [
          "Pemeriksaan persyaratan tata bangunan gedung",
          {"body":"Kondisi tata bangunan dibandingkan dengan [dokumen pembanding] untuk menilai peruntukan, intensitas, penampilan, tata ruang dalam, dan hubungan dengan lingkungan. Hasil penilaian disajikan menurut ruang lingkup dan bukti yang tersedia pada bagian berikut.","previous":"[Ringkas hasil perbandingan desain dengan kondisi bangunan.]"},
          ["Peruntukan bangunan", {"body":"Fungsi atau peruntukan bangunan menurut [dokumen rujukan] adalah [fungsi yang tercatat]. Pemanfaatan aktual di [area sampel] adalah [fungsi teramati]. Hasil perbandingannya adalah [kesesuaian atau perbedaan beserta rujukan bukti].","previous":"[Catat fungsi yang diizinkan dan pemanfaatan aktual per ruang atau unit.]"}],
          ["Intensitas bangunan", {"body":"Parameter intensitas yang ditelaah meliputi [luas, jumlah lantai, tinggi, koefisien, atau jarak sempadan yang relevan]. Data aktual [nilai dan satuan] dibandingkan dengan [nilai dan sumber pembanding]. Hasil telaah dicatat sebagai [temuan atau keterbatasan].","previous":"[Catat luas, jumlah lantai, ketinggian, intensitas, dan sempadan berdasarkan data proyek.]"}],
          ["Penampilan bangunan", {"body":"Penampilan bangunan diamati pada [sisi atau area] dan meliputi [bentuk, fasad, atap, atau elemen arsitektural yang diperiksa]. Kondisi teramati adalah [hasil observasi] dengan dokumentasi pada [nomor foto atau gambar].","previous":"[Uraikan bentuk, fasad, atap, dan kondisi elemen arsitektural.]"}],
          ["Tata ruang dalam", {"body":"Penataan ruang pada [lantai atau zona] diperiksa terhadap [denah atau gambar rujukan]. Hasil pemeriksaan menunjukkan [susunan, fungsi, luasan, atau perubahan yang teramati]. Area yang belum dicakup adalah [batasan pemeriksaan].","previous":"[Uraikan susunan, luasan, fungsi, dan kondisi ruang.]"}],
          ["Keselarasan dengan lingkungan", {"body":"Kondisi area luar ditinjau pada [ruang terbuka, sirkulasi, atau parkir]. Hubungan tapak dengan area sekitarnya tercatat sebagai [hasil observasi] berdasarkan [denah situasi, foto, atau pengukuran].","previous":"[Uraikan ruang terbuka, sirkulasi, parkir, dan kondisi area luar.]"}],
        ],
        ["Kesehatan", {"body":"Pemeriksaan aspek kesehatan mencakup [parameter yang diperiksa] pada [ruang atau sistem]. Hasil observasi atau pengukuran dirujuk pada [tabel, gambar, atau lampiran] dan dibandingkan dengan [acuan yang digunakan]. Ringkasan temuan untuk bidang ini adalah [temuan kesehatan].","previous":"[Catat hasil pemeriksaan pencahayaan atau aspek kesehatan yang dibahas dalam disiplin arsitektur.]"}],
        ["Kenyamanan", {"body":"Pemeriksaan kenyamanan mencakup [parameter yang diperiksa] pada [area sampel]. Hasil pengamatan atau pengukuran menunjukkan [hasil terverifikasi], dengan acuan [standar atau dokumen pembanding] dan keterbatasan [batasan yang relevan].","previous":"[Jelaskan ruang gerak, tata perabot, dan pandangan dari atau ke bangunan.]"}],
        ["Kemudahan", {"body":"Pemeriksaan kemudahan mencakup [jalur akses, fasilitas, atau peralatan yang diperiksa] untuk pengguna [kelompok pengguna]. Kondisi yang tercatat adalah [temuan], didukung oleh [hasil ukur, foto, atau daftar simak] dan dibandingkan dengan [acuan].","previous":"[Catat akses horizontal, vertikal, fasilitas sanitasi, dan aksesibilitas.]"}],
        ["Kesimpulan bidang arsitektur", {"body":"Berdasarkan ruang lingkup dan bukti yang tersedia, hasil penilaian arsitektur adalah [kesimpulan pengkaji]. Ketidaksesuaian atau bagian yang masih memerlukan verifikasi meliputi [temuan]. Rekomendasi terkait dirujuk pada [nomor rekomendasi].","previous":"[Ringkas bukti, ketidaksesuaian, dan rujukan tindak lanjut.]"}],
      ],
      [
        "Laporan pengkajian teknis bidang struktur",
        ["Data sistem struktur", {"body":"Sistem struktur bangunan terdiri atas [sistem utama dan material] menurut [gambar atau dokumen teknis]. Bagian yang dapat diamati meliputi [daftar elemen yang dapat diakses]. Informasi yang belum didukung dokumen atau belum terverifikasi adalah [batasan data].","previous":"[Identifikasi sistem struktur, material, gambar, dan bagian yang dapat diakses.]"}],
        ["Pemeriksaan elemen struktur", {"body":"Pemeriksaan visual dilakukan pada [elemen dan lokasi sampel] untuk mencatat kondisi yang dapat diamati. Temuan pada elemen tersebut adalah [kondisi, lokasi, dan ukuran kerusakan bila ada]. Lokasi dan bukti temuan ditunjukkan pada [tabel, denah, atau foto].","previous":"[Catat kondisi, lokasi sampel, kerusakan teramati, dan foto unsur yang diperiksa.]"}],
        ["Hasil pengujian dan analisis", {"body":"Pengujian atau analisis struktur yang tersedia berupa [metode atau status pengujian]. Hasil yang dapat ditelusuri adalah [hasil dan satuan], dibandingkan dengan [parameter pembanding]. Interpretasi pengkaji serta batasan penggunaannya adalah [interpretasi dan batasan].","previous":"[Masukkan metode, hasil, satuan, dasar pembanding, dan batasan bila dilakukan pengujian.]"}],
        {"table":"Rekap hasil pemeriksaan struktur","columns":["Elemen / lokasi","Observasi atau hasil uji","Satuan / acuan","Temuan"],"rows":[["[Elemen dan lokasi sampel]","[Kondisi atau hasil uji]","[Satuan / acuan]","[Temuan terverifikasi]"]]},
        ["Kesimpulan bidang struktur", {"body":"Penilaian bidang struktur dalam lingkup ini menghasilkan [kesimpulan pengkaji] berdasarkan [dokumen, observasi, atau hasil uji]. Elemen yang masih memerlukan konfirmasi atau pemeriksaan lanjutan adalah [elemen atau lokasi], dengan tindak lanjut pada [nomor rekomendasi].","previous":"[Ringkas temuan dan keterbatasan berdasarkan hasil pemeriksaan.]"}],
      ],
      [
        "Laporan pengkajian teknis bidang MEP",
        [
          "Keselamatan",
          {"body":"Penilaian utilitas keselamatan mencakup [sistem proteksi kebakaran, penangkal petir, instalasi listrik, atau sistem terkait]. Rincian sistem yang diperiksa, lokasi, hasil, dan bukti pembanding dijabarkan pada subbagian berikut.","previous":"[Ringkas kondisi utilitas terkait keselamatan.]"},
          ["Proteksi kebakaran", {"body":"Sarana proteksi kebakaran yang ditinjau meliputi [sistem pasif, sistem aktif, dan jalur evakuasi yang tersedia]. Hasil verifikasi pada [lokasi] adalah [kondisi, fungsi terverifikasi, atau temuan]. Bukti pemeriksaan berupa [daftar simak, hasil uji, atau foto].","previous":"[Catat sistem pasif, aktif, dan sarana evakuasi yang diperiksa.]"}],
          ["Penangkal petir", {"body":"Sistem proteksi petir yang tersedia diidentifikasi sebagai [jenis atau konfigurasi]. Pemeriksaan mencakup [komponen yang dapat diverifikasi] dan didukung [hasil pengukuran atau dokumen yang tersedia]. Hasil dan keterbatasan pemeriksaan adalah [hasil serta batasan].","previous":"[Catat instalasi, pembumian, dan hasil pengujian yang tersedia.]"}],
          ["Instalasi listrik", {"body":"Instalasi listrik yang ditinjau mencakup [sumber, panel, jaringan distribusi, dan perangkat proteksi]. Pada [lokasi panel atau sistem] tercatat [kondisi aktual], berdasarkan [observasi, dokumen, atau hasil pengujian]. Bagian yang memerlukan tindak lanjut adalah [temuan].","previous":"[Catat sumber, panel, distribusi, perlindungan, dan kondisi instalasi.]"}],
        ],
        [
          "Kesehatan",
          {"body":"Pemeriksaan utilitas kesehatan mencakup [penghawaan, pencahayaan, air bersih, sanitasi, atau sistem terkait]. Hasil observasi dan pengukuran dirinci menurut sistem yang diperiksa dan sumber bukti yang tersedia.","previous":"[Ringkas hasil pemeriksaan utilitas kesehatan.]"},
          ["Penghawaan dan pencahayaan", {"body":"Pada [lokasi sampel], penghawaan disediakan melalui [sistem atau bukaan], sedangkan pencahayaan berasal dari [sumber]. Hasil pengamatan atau pengukuran adalah [hasil dan satuan], dengan metode [metode] serta acuan [acuan].","previous":"[Masukkan lokasi sampel, metode, hasil ukur, dan satuan.]"}],
          ["Air bersih, air limbah, dan air hujan", {"body":"Air bersih berasal dari [sumber] dan disalurkan melalui [sistem distribusi]. Air limbah dialirkan atau diolah melalui [sistem], sedangkan air hujan ditangani oleh [sistem drainase atau penampungan]. Kondisi terverifikasi dan keterbatasannya adalah [hasil verifikasi].","previous":"[Catat sumber, jaringan distribusi, pengolahan, dan kondisi aktual.]"}],
          ["Persampahan dan utilitas khusus", {"body":"Sarana pengumpulan sampah yang diperiksa berada di [lokasi] dengan mekanisme [pemilahan, penyimpanan, atau pengangkutan]. Utilitas khusus yang sesuai dengan fungsi bangunan adalah [jenis sistem atau status tidak relevan]. Temuan yang didukung bukti adalah [temuan].","previous":"[Catat sistem yang ada dan yang relevan dengan fungsi bangunan.]"}],
        ],
        ["Kenyamanan", {"body":"Kondisi udara ruang serta getaran atau kebisingan ditinjau pada [lokasi sampel]. Parameter yang diperoleh adalah [hasil dan satuan] berdasarkan [metode atau sumber data]. Penilaian terhadap hasil tersebut adalah [hasil telaah dan keterbatasan].","previous":"[Catat kondisi udara ruang serta pengukuran getaran atau kebisingan bila dilakukan.]"}],
        ["Kemudahan", {"body":"Sarana dan peralatan terkait kemudahan penggunaan gedung yang ditinjau meliputi [fasilitas atau peralatan]. Kondisi dan fungsi yang terverifikasi pada [lokasi] adalah [hasil pemeriksaan] berdasarkan [rujukan bukti].","previous":"[Catat sarana, peralatan, dan fasilitas yang diperiksa.]"}],
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
const frontDefaults = {
  preface: "Laporan kajian teknis ini disusun untuk [tujuan kajian] pada [nama bangunan] di [lokasi]. Laporan memuat ruang lingkup, metode, hasil pemeriksaan, dan rekomendasi berdasarkan dokumen serta temuan yang dicatat tim pengkaji.\n\n[Tambahkan ucapan terima kasih dan keterangan yang diperlukan.]",
  approval: "Judul laporan: [judul laporan]\nObjek kajian: [nama dan alamat bangunan]\nNomor / revisi: [nomor laporan]\n\n[Isi pernyataan pengesahan setelah pemeriksaan dan penelaahan laporan selesai.]",
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
