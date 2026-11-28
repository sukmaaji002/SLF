"use strict";

// Urutan, nomor, dan judul butir mengikuti formulir sumber. Huruf menentukan jenis isian.
const catalog = [
  {
    code: "K.1", title: "Tata bangunan gedung", groups: [
      {
        code: "K.1.1", title: "Pemeriksaan Persyaratan Peruntukan Bangunan Gedung", items: [
          {"no":"1","title":"Fungsi Bangunan Gedung","fields":"VCF","page":1,"buildingUse":true},
          {"no":"2","title":"Pemanfaatan Setiap Ruang Dalam Bangunan Gedung","fields":"SVCF","page":1,"samples":["Ruang dalam 1","Ruang dalam 2"],"sampleTitle":"Ruang dalam","indoorUse":true},
          {"no":"3","title":"Pemanfaatan Ruang Luar Pada Persil Bangunan Gedung","fields":"SVCFK","page":1,"samples":["Ruang luar 1"],"sampleTitle":"Sampel ruang luar"},
        ],
      },
      {
        code: "K.1.2", title: "Pemeriksaan Persyaratan Intensitas Bangunan Gedung", items: [
          {"no":"1","title":"Luas Lantai Dasar Bangunan","fields":"CMFK","page":1,"unit":"m²"},
          {"no":"2","title":"Luas Dasar Basemen","fields":"CMFK","page":1,"unit":"m²"},
          {"no":"3","title":"Luas Total Lantai Bangunan","fields":"CMFK","page":1,"unit":"m²"},
          {"no":"4","title":"Jumlah Lantai Bangunan","fields":"CMFK","page":1,"unit":"lantai"},
          {"no":"5","title":"Jumlah Lantai Basemen","fields":"CMFK","page":2,"unit":"lantai"},
          {"no":"6","title":"Ketinggian Bangunan","fields":"CMFK","page":2,"unit":"m"},
          {"no":"7","title":"Luas Daerah Hijau Dalam Persil","fields":"CMFK","page":2,"unit":"m²"},
          {"no":"8","title":"Jarak Sempadan Jalan/Sungai/Pantai/Danau/Rel Kereta Api/Jalur Tegangan Tinggi","fields":"CMK","page":2,"unit":"m","components":["Jalan","Sungai","Pantai","Danau","Rel Kereta Api","Jalur Tegangan Tinggi","Saluran / irigasi"]},
          {"no":"9","title":"Jarak Bangunan Gedung Dengan Batas Persil","fields":"CMK","page":2,"unit":"m","components":["Batas kiri","Batas kanan","Batas belakang","Batas depan"]},
          {"no":"10","title":"Jarak Antar Bangunan","fields":"SMCK","page":2,"unit":"m","samples":["Bangunan 1","Bangunan 2","Bangunan 3"],"sampleTitle":"Bangunan"},
        ],
      },
      {
        code: "K.1.3", title: "Pemeriksaan Penampilan Bangunan Gedung", items: [
          {"no":"1","title":"Bentuk Bangunan Gedung","fields":"CK","page":3},
          {"no":"2","title":"Bentuk Denah Bangunan Gedung","fields":"CK","page":3},
          {"no":"3","title":"Tampak bangunan","fields":"CK","page":3},
          {"no":"4","title":"Bentuk dan Penutup Atap Bangunan Gedung","fields":"DCK","page":3},
          {"no":"5","title":"Profil, Detail, dan Material Bangunan","fields":"SDCK","page":3},
          {"no":"6","title":"Batas Fisik Atau Pagar Pekarangan","fields":"SDCK","page":3},
          {"no":"7","title":"Kulit Atau Selubung Bangunan","fields":"SDCK","page":3},
        ],
      },
      {
        code: "K.1.4", title: "Pemeriksaan Tata Ruang-Dalam Bangunan Gedung", items: [
          {"no":"1","title":"Kebutuhan Ruang Utama","fields":"CK","page":3},
          {"no":"2","title":"Bidang-Bidang Dinding","fields":"SDCK","page":3},
          {"no":"3","title":"Dinding-Dinding Penyekat","fields":"SDCK","page":3},
          {"no":"4","title":"Pintu/Jendela","fields":"SDCK","page":3},
          {"no":"5","title":"Tinggi Ruang","fields":"SMCFK","page":3},
          {"no":"6","title":"Tinggi Lantai Dasar","fields":"CMFK","page":4,"unit":"m"},
          {"no":"7","title":"Ruang Rongga Atap","fields":"DCK","page":4},
          {"no":"8","title":"Penutup Lantai","fields":"SDCK","page":4},
          {"no":"9","title":"Penutup Langit-Langit","fields":"SDCK","page":4},
        ],
      },
      {
        code: "K.1.5", title: "Pemeriksaan Keseimbangan, Keserasian dan Keselarasan Dengan Lingkungan", items: [
          {"no":"1","title":"Tinggi (Peil) Pekarangan","fields":"CMFK","page":4,"unit":"m"},
          {"no":"2","title":"Ruang Terbuka Hijau Pekarangan","fields":"CMFK","page":4,"unit":"m²"},
          {"no":"3","title":"Pemanfaatan Ruang Sempadan Bangunan","fields":"CMFK","page":4},
          {"no":"4","title":"Daerah Hijau Bangunan","fields":"CMFK","page":4},
          {"no":"5","title":"Tata Tanaman","fields":"DCK","page":4},
          {"no":"6","title":"Tata Perkerasan Pekarangan","fields":"DCK","page":4},
          {"no":"7","title":"Sirkulasi Manusia dan Kendaraan","fields":"DCK","page":5,"components":["Sirkulasi manusia"]},
          {"no":"8","title":"Jalur Utama Pedestrian","fields":"SDCK","page":5},
          {"no":"9","title":"Perabot Lanskap (Landscape Furniture)","fields":"SDCK","page":5},
          {"no":"9","title":"Pertandaan (Signage)","fields":"SDCK","page":5},
          {"no":"11","title":"Pencahayaan Ruang Luar Bangunan Gedung","fields":"SDCK","page":5},
        ],
      },
    ],
  },
  {
    code: "K.2", title: "Keselamatan", groups: [
      {
        code: "K.2.1", title: "Pemeriksaan Sistem Struktur Bangunan Gedung", items: [
          {"no":"1","title":"Pondasi (Apabila Dapat Diamati)","fields":"SDCMUFKN","page":5},
          {"no":"2","title":"Kolom","fields":"SDCMUFKN","page":5},
          {"no":"3","title":"Balok Lantai","fields":"SDCMUFKN","page":5},
          {"no":"4","title":"Pelat Lantai","fields":"SDCMUFKN","page":6},
          {"no":"5","title":"Rangka Atap","fields":"SDCMUFKN","page":6},
          {"no":"6","title":"Dinding Basement","fields":"SDCMUFKN","page":6},
          {"no":"7","title":"Pelat Lantai Basement","fields":"SDCMUFKN","page":6},
          {"no":"8","title":"Komponen Struktur Lainnya","fields":"SDCMUFKN","page":6},
        ],
      },
      {
        code: "a)", title: "Proteksi Bahaya Kebakaran — Sistem Proteksi Pasif", items: [
          {"no":"1","title":"Pintu Tahan Api","fields":"SDCUFK","page":7},
          {"no":"2","title":"Jendela Tahan Api","fields":"SDCUFK","page":7},
          {"no":"3","title":"Bahan Pelapis Interior Tahan Api","fields":"SDCUFK","page":7},
          {"no":"4","title":"Perlengkapan dan Perabot Tahan Api","fields":"SDCUFK","page":7},
          {"no":"5","title":"Penghalang Api","fields":"SDCUFK","page":7},
          {"no":"6","title":"Partisi Penghalang Asap","fields":"SDCUFK","page":7},
        ],
      },
      {
        code: "b)", title: "Proteksi Bahaya Kebakaran — Sistem Proteksi Aktif", items: [
          {"no":"7","title":"Sistem Pipa Tegak","fields":"SDCUFK","page":7},
          {"no":"8","title":"Sistem Springkler Otomatik","fields":"SDCUFK","page":8},
          {"no":"9","title":"Pompa Pemadam Kebakaran","fields":"SDCUFK","page":8},
          {"no":"10","title":"Ketersediaan Air","fields":"SCUFKT","page":8},
          {"no":"11","title":"Alat Pemadam Api Ringan","fields":"SDCUFK","page":8},
          {"no":"12","title":"Sistem Deteksi Kebakaran","fields":"SDCUFK","page":8},
          {"no":"13","title":"Sistem Alarm Kebakaran","fields":"SDCUFK","page":8},
          {"no":"14","title":"Sistem Komunikasi Darurat","fields":"SDCUFK","page":8},
          {"no":"15","title":"Ventilasi Mekanik","fields":"SDCUFK","page":9},
          {"no":"16","title":"Sistem Pengendali Asap","fields":"SDCUFK","page":9},
        ],
      },
      {
        code: "c)", title: "Proteksi Bahaya Kebakaran — Sistem Evakuasi Darurat", items: [
          {"no":"17","title":"Tangga Kebakaran","fields":"SDCUFK","page":9},
          {"no":"18","title":"Pintu Kebakaran","fields":"SDCUFK","page":9},
          {"no":"19","title":"Bukan Penyelamatan","fields":"SDCUFK","page":9},
          {"no":"20","title":"Lift Kebakaran","fields":"SDCUFK","page":9},
          {"no":"21","title":"Penerangan Darurat","fields":"SDCUFK","page":9},
          {"no":"22","title":"Tanda Petunjuk Arah Keluar","fields":"SDCUFK","page":10},
          {"no":"23","title":"Peralatan pendukung Lainnya","fields":"SDCUFK","page":10},
        ],
      },
      {
        code: "d)", title: "Proteksi Bahaya Kebakaran — Sistem Manajemen Proteksi", items: [
          {"no":"24","title":"Unit Management Kebakaran","fields":"SCUFKT","page":10},
          {"no":"25","title":"Organisasi Proteksi Kebakaran","fields":"SCUFKT","page":10},
          {"no":"26","title":"Tata Laksana Operasional","fields":"SCUFKT","page":10},
          {"no":"27","title":"Sumber Daya Manusia","fields":"SCUFKT","page":10},
        ],
      },
      {
        code: "B.3", title: "Pemeriksaan Sistem Penangkal Petir", items: [
          {"no":"1","title":"Sistem Kepala Penangkal Petir","fields":"SDCUFK","page":10},
          {"no":"2","title":"Sistem Hantaran Penangkal petir","fields":"SDCUFK","page":11},
          {"no":"3","title":"Sistem Pembumian","fields":"SDCUFK","page":11},
        ],
      },
      {
        code: "K.2.4", title: "Pemeriksaan Sistem Instalasi Listrik", items: [
          {"no":"1","title":"Sumber Listrik","fields":"SDCUFK","page":11},
          {"no":"2","title":"Panel Listrik","fields":"SDCUFK","page":11},
          {"no":"3","title":"Instalasi Listrik","fields":"SDCUFK","page":11},
          {"no":"4","title":"Sistem Pembumian","fields":"SDCUFK","page":11},
        ],
      },
      {
        code: "K.2.4", title: "Pengamanan Bahan Peledak", items: [
          {"no":"1","title":"Prosedur Pengamanan Bahan Peledak","fields":"SCUFKT","page":12},
          {"no":"2","title":"Peralatan Pengamanan Bahan Peledak","fields":"SCUFKT","page":12},
          {"no":"3","title":"Petugas Pengamanan bahan Peledak","fields":"SCUFKT","page":12},
        ],
      },
    ],
  },
  {
    code: "K.3", title: "Kesehatan", groups: [
      {
        code: "K.3.1", title: "Pemeriksaan Sistem Penghawaan", items: [
          {"no":"1","title":"Ventilasi Alami","fields":"SDCUFK","page":12},
          {"no":"2","title":"Ventilasi Mekanik","fields":"SDCUFK","page":12},
          {"no":"3","title":"Sistem Pengkondisian Udara","fields":"SDCUFK","page":12},
          {"no":"4","title":"Kadar Karbonmonoksida","fields":"SDCUFK","page":12},
          {"no":"5","title":"Kadar Karbondioksida","fields":"SDCUFK","page":12},
        ],
      },
      {
        code: "K.3.2", title: "Pemeriksaan Sistem Pencahayaan", items: [
          {"no":"1","title":"Sistem Pencahayaan Alami","fields":"SDCUFK","page":13},
          {"no":"2","title":"Sistem Pencahayaan Buatan","fields":"SDCUFK","page":13},
          {"no":"3","title":"Luminansi Pencahayaan Alami","fields":"SMK","page":13},
          {"no":"4","title":"Luminansi Pencahayaan Buatan","fields":"SMK","page":13},
        ],
      },
      {
        code: "K.3.3", title: "Pemeriksaan Sistem Penyediaan Air Bersih/Minum", items: [
          {"no":"1","title":"Sumber Air Bersih/Minum","fields":"SDCUFK","page":13},
          {"no":"2","title":"Sistem Distribusi Air Bersih/Minum","fields":"SDCUFK","page":13},
          {"no":"3","title":"Kualitas Air Bersih/Minum","fields":"SDCUFK","page":13},
          {"no":"4","title":"Debit Air Bersih/Minum","fields":"SDCUFK","page":14},
        ],
      },
      {
        code: "K.3.4", title: "Pemeriksaan Sistem Pengelolaan Air Kotor dan/atau Air Limbah (Black Water)", items: [
          {"no":"1","title":"Peralatan Saniter","fields":"SDCUFK","page":14},
          {"no":"2","title":"Instalasi Inlet/Outlet","fields":"SDCUFK","page":14},
          {"no":"3","title":"Sistem Jaringan Pembuangan","fields":"SDCUFK","page":14},
          {"no":"4","title":"Sistem Penampungan Dan Pengolahan","fields":"SDCUFK","page":14},
        ],
      },
      {
        code: "K.3.5", title: "Pemeriksaan Sistem Pengelolaan Air Kotor dan/atau Air Limbah (Black Water)", items: [
          {"no":"1","title":"Inlet Pembuangan","fields":"SDCUFK","page":14},
          {"no":"2","title":"Penampungan Sementara Dalam Persil","fields":"SDCUFK","page":14},
          {"no":"3","title":"Pengolahan Dalam Persil","fields":"SDCUFK","page":15},
        ],
      },
      {
        code: "K.3.6", title: "Pemeriksaan Sistem Pengelolaan Air Hujan (Grey Water)", items: [
          {"no":"1","title":"Sistem Penangkap Air Hujan, Termasuk Talang","fields":"SDCUFK","page":15},
          {"no":"2","title":"Sistem Penyalur Air Hujan, Termasuk Pipa Tegak dan Drainase Dalam Persil","fields":"SDCUFK","page":15},
          {"no":"3","title":"Sistem Penampungan, Pengolahan, Peresapan Dan/Atau Pembuangan Air Hujan","fields":"SDCUFK","page":15},
        ],
      },
      {
        code: "K.3.7", title: "Pemeriksaan Sistem Pengelolaan Air Hujan (Grey Water)", items: [
          {"no":"1","title":"Bahan Bangunan yang Mengandung Bahan berbahaya/Beracun","fields":"SACUFK","page":15},
          {"no":"2","title":"Bahan Bangunan yang Menyebabkan Efek Silau Dan Pantulan","fields":"SACUFK","page":15},
          {"no":"3","title":"Bahan Bangunan yang Menyebabkan Efek Peningkatan Suhu","fields":"SACUFK","page":15},
        ],
      },
      {
        code: "K.3.8", title: "Pemeriksaan Sistem Gas Medik", items: [
          {"no":"","title":"Sistem Gas Medik","fields":"SDCUFK","page":16},
        ],
      },
    ],
  },
  {
    code: "K.4", title: "Kenyamanan", groups: [
      {
        code: "K.4.1", title: "Pemeriksaan Ruang Gerak Dalam Bangunan Gedung", items: [
          {"no":"1","title":"Jumlah Pengguna atau Batas Okupansi","fields":"SVCK","page":16},
          {"no":"2","title":"Kapasitas Dan Tata Letak Perabot","fields":"SVCK","page":16},
        ],
      },
      {
        code: "K.4.2", title: "Pemeriksaan Kondisi Udara Dalam Ruang", items: [
          {"no":"1","title":"Temperatur Ruang","fields":"SMFK","page":16,"unit":"°C"},
          {"no":"2","title":"Kelembaban Ruang","fields":"SMFK","page":16,"unit":"%"},
        ],
      },
      {
        code: "K.4.3", title: "Pemeriksaan Pandangan Dari dan Ke Dalam Bangunan Gedung", items: [
          {"no":"1","title":"Pandangan dari Dalam Ruang ke Luar Bangunan","fields":"SG","page":16},
          {"no":"2","title":"Pandangan dari Luar Bangunan","fields":"SG","page":16},
        ],
      },
      {
        code: "K.4.4", title: "Pemeriksaan Kondisi Getaran dan kebisingan dalam bangunan Gedung", items: [
          {"no":"1","title":"Tingkat Getaran","fields":"SF","page":16},
          {"no":"2","title":"Tingkat Kebisingan","fields":"SF","page":16},
        ],
      },
    ],
  },
  {
    code: "K.5", title: "Kemudahan", groups: [
      {
        code: "K.5.1", title: "Pemeriksaan Sarana Hubungan Horisontal Antarruang/Antarbangunan", items: [
          {"no":"1","title":"Kondisi Bukaan Pintu","fields":"SDCMUFK","page":16},
          {"no":"2","title":"Kondisi Koridor","fields":"SDCMUFK","page":17},
          {"no":"3","title":"Kondisi Ban Berjalan","fields":"SDCMUFK","page":17},
        ],
      },
      {
        code: "K.5.2", title: "Pemeriksaan Sarana Hubungan Vertikal Antar Lantai", items: [
          {"no":"1","title":"Tangga","fields":"SDCMUFK","page":17},
          {"no":"2","title":"Ram","fields":"SDCMUFK","page":17},
          {"no":"3","title":"Sistem Lif","fields":"SDCMUFK","page":17},
          {"no":"4","title":"Sistem Eskalator","fields":"SDCMUFK","page":17},
        ],
      },
      {
        code: "K.5.3", title: "Pemeriksaan kelengkapan Prasarana dan sarana Bangunan Gedung", items: [
          {"no":"1","title":"Toilet","fields":"SDCMUFK","page":17},
          {"no":"2","title":"Fasilitas Parkir","fields":"SDCMUFK","page":17},
          {"no":"3","title":"Ruang Ibadah","fields":"SDCMUFK","page":17},
          {"no":"4","title":"Ruang Laktasi","fields":"SDCMUFK","page":18},
          {"no":"5","title":"Ruang Ganti","fields":"SDCMUFK","page":18},
          {"no":"6","title":"Tempat Sampah","fields":"SDCMUFK","page":18},
          {"no":"7","title":"Sistem Komunikasi","fields":"SDCMUFK","page":18},
          {"no":"8","title":"Sistem Informasi","fields":"SDCMUFK","page":18},
          {"no":"9","title":"Kelengkapan lainnya","fields":"SDCMUFK","page":18},
        ],
      },
      {
        code: "K.5.4", title: "Pemeriksaan Pemeliharaan dan Perawatan Bangunan Gedung", items: [
          {"no":"1","title":"Informasi Pelaksanaan Pemeliharaan Bangunan Gedung","fields":"P","page":18,"samples":["1","2","3","4","5"]},
          {"no":"2","title":"Informasi Pelaksanaan Perawatan Bangunan Gedung","fields":"P","page":18,"samples":["1","2","3","4","5"]},
        ],
      },
    ],
  },
];

const checklistIlluminance = {
  id: "K.3-1-4", no: "3", title: "Iluminansi per lokasi", fields: "SMFK", page: 13, unit: "lux",
  lightSource: true,
};
const checklistWaste = {
  code: "K.3.9", title: "Pemeriksaan Pengelolaan Sampah",
  items: [
    { id: "K.3-8-0", no: "1", title: "Pewadahan dan pemilahan sampah", fields: "SADCFK" },
    { id: "K.3-8-1", no: "2", title: "Penampungan sementara sampah", fields: "SADCFK" },
    { id: "K.3-8-2", no: "3", title: "Pengolahan atau pengangkutan sampah", fields: "SADCFK" },
  ],
};
const checklistHistoricalItems = new Set([
  "K.3-1-2", "K.3-1-3", "K.3-4-0", "K.3-4-1", "K.3-4-2", "K.5-2-5",
]);

function checklistItemId(category, groupIndex, item, itemIndex) {
  return item.id ?? category.code + "-" + groupIndex + "-" + itemIndex;
}

function catalogForChecklist(checks = {}) {
  return catalog.map(category => {
    if (!["K.3", "K.5"].includes(category.code)) return category;
    const groups = category.groups.map((group, groupIndex) => {
      const items = group.items.flatMap((item, itemIndex) => {
        const id = checklistItemId(category, groupIndex, item, itemIndex);
        if (!checklistHistoricalItems.has(id)) return [{ ...item, id }];
        if (!checks[id]) return [];
        return [{ ...item, id, title: item.title + " · isian sebelumnya" }];
      });
      if (category.code === "K.3" && groupIndex === 1) items.splice(2, 0, checklistIlluminance);
      return { ...group, items };
    }).filter(group => group.items.length);
    if (category.code === "K.3") groups.push(checklistWaste);
    return { ...category, groups };
  });
}
