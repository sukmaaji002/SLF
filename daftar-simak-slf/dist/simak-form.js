"use strict";

const simakFormStyle = `
  .simak-form { color: #111; font: 9pt/1.24 "Times New Roman", serif; print-color-adjust: exact; }
  .simak-form h3.simak-title { text-align: center; margin: 0 0 7pt; font: bold 12pt/1.2 "Times New Roman", serif; }
  .simak-title span { display: block; font-size: 10pt; font-weight: normal; }
  .simak-form h4.simak-band { margin: 7pt 0 3pt; padding: 2pt 3pt; background: #bcbcbc; color: #111; font: bold 9.5pt/1.23 "Times New Roman", serif; break-after: avoid; }
  .simak-form h5.simak-group { margin: 6pt 0 2pt; color: #111; font: bold 9.5pt/1.23 "Times New Roman", serif; break-after: avoid; }
  .simak-form h6.simak-item-title { margin: 3pt 0 2pt; color: #111; font: 9pt/1.18 "Times New Roman", serif; break-after: avoid; }
  .simak-form .simak-item { margin: 0 0 5pt 8pt; }
  .simak-form table { width: 100%; table-layout: fixed; margin: 0; border-collapse: collapse; }
  .simak-form th, .simak-form td { border: .65pt solid #222; color: #111; background: #fff; padding: 2.4pt 3pt; vertical-align: top; text-align: left; white-space: pre-wrap; overflow-wrap: anywhere; }
  .simak-form th { background: #ffff9a; color: #111; text-align: center; vertical-align: middle; font-weight: normal; }
  .simak-form thead { display: table-header-group; break-after: avoid; }
  .simak-form tr { break-inside: avoid; }
  .simak-form .simak-item.fit { break-inside: avoid; }
  .simak-form .simak-center { text-align: center; }
  .simak-form .simak-ref { margin: 2pt 0 0; color: #343434; font-size: 7.5pt; break-before: avoid; }
  .simak-form .simak-choice { white-space: normal; }
  .simak-form .simak-options { display: flex; flex-wrap: wrap; gap: 2pt 6pt; }
  .simak-form .simak-box { display: inline-block; width: 6pt; height: 6pt; margin-right: 2pt; border: .6pt solid #222; vertical-align: baseline; }
  .simak-form .simak-box.checked { background: #111; box-shadow: inset 0 0 0 1pt #fff; }
  .simak-form .simak-state { font-style: italic; margin-bottom: 2pt; }
  .simak-form .simak-extra { margin-top: 2pt; }
  .simak-form .simak-photo { font-size: 7.5pt; margin: 2pt 0; }
  .simak-form .simak-photo img { display: block; max-width: 100%; max-height: 85pt; margin: 2pt 0; object-fit: contain; }
  .simak-form .simak-jump { margin-left: 5pt; color: #1d4a40; font-size: 8pt; }
  .simak-form .simak-band, .simak-form .simak-group, .simak-form .simak-item-title { scroll-margin-top: 65px; }
`;

const simakCategoryTitles = {
  "K.1": "Pemeriksaan Persyaratan Tata Bangunan Gedung",
  "K.2": "Pemeriksaan Persyaratan Keselamatan",
  "K.3": "Pemeriksaan Persyaratan Kesehatan",
  "K.4": "Pemeriksaan Persyaratan Kenyamanan",
  "K.5": "Pemeriksaan Persyaratan Kemudahan",
};

const simakColumns = {
  V: { title: "Pengamatan visual", keys: ["observation"], weight: 2 },
  D: { title: "Pengamatan visual terhadap kerusakan", keys: ["damage"], choices: ["Tidak Rusak", "Rusak Ringan", "Rusak Sedang", "Rusak Berat"], weight: 1.65 },
  A: { title: "Keberadaan", keys: ["presence"], choices: ["Ada", "Tidak Ada"], weight: 1.45 },
  T: { title: "Ketersediaan", keys: ["presence"], choices: ["Tidak Tersedia", "Tersedia"], weight: 1.45 },
  M: { title: "Pengukuran kondisi faktual", keys: ["measurement"], weight: 1.7 },
  C: { title: "Kesesuaian kondisi faktual dengan rencana teknis dan gambar terbangun", keys: ["conformity","nonconformity"], choices: ["Sesuai","Tidak Sesuai"], weight: 2.7 },
  E: { title: "Kesesuaian kondisi faktual dengan rencana teknis dan gambar terbangun", keys: ["conformity"], weight: 2.7 },
  N: { title: "Penggunaan peralatan non-destruktif", keys: ["ndt","ndtPhoto"], weight: 1.4 },
  U: { title: "Pengetesan dan pengujian (apabila diperlukan)", keys: ["test"], weight: 1.55 },
  G: { title: "Pengamatan visual", keys: ["view","disruption"], choices: ["Tidak Mengganggu","Mengganggu"], weight: 3 },
  K: { title: "Keterangan", keys: ["note"], weight: 1.75 },
};
const upkeep = [
  { title: "No", keys: [], sample: true, weight: .45 },
  { title: "Komponen bangunan gedung", keys: ["component"], weight: 2 },
  { title: "Rutin", keys: ["routine"], weight: 2 },
  { title: "Berkala", keys: ["periodic"], weight: 2 },
  { title: "Tidak terjadwal", keys: ["unscheduled"], weight: 2 },
];

function simakFormColumns(item) {
  if (item.fields.includes("P")) return upkeep;
  const columns = [];
  if (item.fields.includes("S") || item.components || item.samples) {
    columns.push({ title: item.components || item.id === "K.1-1-9" ? "Komponen" : "Sampel", keys: ["location"],
      sample: true, weight: item.components ? 1.8 : 1.05 });
  }
  const order = item.category.code === "K.5" ? "MVDATCENUGK" : "VDATMCENUGK";
  for (const code of order) {
    if (!item.fields.includes(code)) continue;
    const column = simakColumns[code];
    if (code === "M" && item.category.code === "K.5") {
      columns.push({ ...column, title: "Pengukuran dimensi dan arah bukaan", keys: ["measurement","direction"] });
    } else if (code === "U" && item.fields.includes("N")) {
      columns.push({ ...column, title: "Pengujian kekuatan dan material (apabila diperlukan)" });
    } else columns.push(column);
  }
  if (item.fields.includes("F")) {
    const type = item.fields.includes("U") ? "test" : item.fields.includes("V") ? "observation" :
      item.fields.includes("M") ? "measurement" : "photo";
    const evidence = columns.findIndex(({ keys }) => keys.includes(type));
    if (evidence >= 0) columns[evidence] = { ...columns[evidence], keys: [...columns[evidence].keys, "photo"] };
    else columns.splice(Math.max(0, columns.findIndex(({keys}) => keys.includes("note"))), 0,
      { title: "Pengamatan visual dan dokumentasi", keys: ["photo"], weight: 2.1 });
  }
  return columns;
}

function simakMark(checked) {
  const box = dom("span", { className: "simak-box" + (checked ? " checked" : "") });
  box.setAttribute("aria-label", checked ? "Ditandai" : "Tidak ditandai");
  box.setAttribute("role", "img");
  return box;
}

function simakChoice(value, options) {
  const normalize = (text) => text?.trim().toLocaleLowerCase("id");
  const matched = options.find((option) => normalize(option) === normalize(value));
  if (value && !matched) return value;
  return dom("span", { className: "simak-options" }, ...options.map((option) =>
    dom("span", { className: "simak-choice" }, simakMark(option === matched), option)));
}

function simakValue(row, key, item) {
  const text = row[key] || "";
  const value = key === "measurement" ? formatChecklistMeasurement(text, item?.unit) : text;
  return formattedValue(value, getTextFormat(row, key));
}

function simakIdentity(identity) {
  const owner = [["Nama", "ownerName"], ["Alamat", "ownerAddress"]].map(([label,key]) => {
    const yes = identity[key + "Status"] === "Ada" || (!identity[key + "Status"] && Boolean(identity[key]?.trim()));
    const no = identity[key + "Status"] === "Tidak ada";
    const value = simakValue(identity, key);
    return [label, yes ? [simakMark(true), value] : "", no ? [simakMark(true), value] : ""];
  });
  const damage = identity.damage;
  const options = (no, title, value) => [no, title, value === "Ya" ? simakMark(true) : "", value === "Tidak" ? simakMark(true) : ""];
  const rows = [
    options("1", "Miring / deformasi", identity.deformation),
    options("2", "Terdapat kerusakan", damage),
    ...["Rusak ringan","Rusak sedang","Rusak berat"].map((level, index) =>
      options("", String.fromCharCode(97 + index) + ". " + level, damage === "Ya" && identity.severity?.toLowerCase() === level.toLowerCase() ? "Ya" : "")),
    options("3", "Bangunan dimanfaatkan", identity.inUse),
    options("4", "Bangunan terawat dengan baik", identity.maintained),
  ];
  const fragment = document.createDocumentFragment();
  fragment.append(dom("h4", { className: "simak-band" }, "K. IDENTITAS PEMILIK"),
    dom("div", { className: "simak-item" }, dom("h6", { className: "simak-item-title" }, "1. Identitas pemilik bangunan gedung"),
      simakTable(["Identitas pemilik","Ada","Tidak"], owner, [2,3,2])),
    dom("div", { className: "simak-item" }, dom("h6", { className: "simak-item-title" }, "2. Kondisi bangunan gedung"),
      simakTable(["No","Kondisi bangunan gedung","Ya","Tidak"], rows, [.7,3,2,2])));
  const details = ["building","location","use","date"].filter((key) => identity[key]?.trim())
    .map((key) => [checklistIdentityLabels[key], simakValue(identity,key)]);
  if (details.length) fragment.append(dom("div", { className: "simak-item" }, simakTable(["Data bangunan","Isian"], details,[2,5])));
  return fragment;
}

function simakTable(headers, rows, weights, maintenance = false) {
  const sum = weights.reduce((total, weight) => total + weight, 0);
  const sizing = dom("colgroup", {}, ...weights.map((weight) => {
    const col = dom("col");
    col.style.width = (100 * weight / sum) + "%";
    return col;
  }));
  const columns = (labels) => labels.map((value) => dom("th", { scope: "col" }, value));
  const thead = maintenance ?
    dom("thead", {}, dom("tr", {}, dom("th", { rowSpan: 2, scope: "col" }, headers[0]),
      dom("th", { rowSpan: 2, scope: "col" }, headers[1]), dom("th", { colSpan: 3, scope: "colgroup" }, "Pemeliharaan periodik")),
      dom("tr", {}, ...columns(headers.slice(2)))) :
    dom("thead", {}, dom("tr", {}, ...columns(headers)));
  const body = dom("tbody", {}, ...rows.map((row) => dom("tr", {}, ...row.map((value) =>
    dom("td", {}, ...(Array.isArray(value) ? value : [value]))))));
  return dom("table", {}, sizing, thead, body);
}

async function renderSimakForm(target, checklist, settings = {}) {
  const form = dom("div", { className: "simak-form" });
  form.append(dom("h3", { className: "simak-title" }, "DAFTAR SIMAK SERTIFIKAT LAIK FUNGSI",
    dom("span", {}, "FORM KAJIAN PEMERIKSAAN BANGUNAN GEDUNG")));
  form.append(simakIdentity(checklist.identity));
  target.append(form);
  let category;
  let group;
  const photos = [];
  function photo(row, key, item) {
    const figure = dom("div", { className: "simak-photo" }, row[key]);
    if (!settings.loadPhoto) return figure;
    photos.push(settings.loadPhoto(item.id + ":" + row.key + ":" + key).then(async (file) => {
      if (!file) return;
      const url = URL.createObjectURL(file);
      settings.photoUrls?.push(url);
      const image = dom("img", { src: url, alt: checklistLabels[key] + " · " + item.title });
      await image.decode();
      figure.append(image);
    }).catch(() => {}));
    return figure;
  }
  function rowCells(item, columns, row) {
    const visited = new Set();
    const cells = columns.map((column) => {
      const parts = [];
      if (column.sample) parts.push(row.label || row.key || "");
      for (const [index, key] of column.keys.entries()) {
        visited.add(key);
        const value = row[key]?.trim();
        if (column.choices && index === 0) parts.push(simakChoice(value, column.choices));
        else if (value) {
          if (key === "photo" || key === "ndtPhoto") parts.push(photo(row,key,item));
          else if (key === "direction") parts.push(dom("div", { className: "simak-extra" }, "Arah bukaan: ", simakValue(row,key,item)));
          else parts.push(dom("div", {}, simakValue(row,key,item)));
        }
      }
      return parts;
    });
    const notes = columns.findIndex(({ keys }) => keys.includes("note"));
    for (const [key,label] of Object.entries(checklistLabels)) {
      if (visited.has(key) || !row[key]?.trim()) continue;
      cells[notes < 0 ? cells.length - 1 : notes].push(dom("div", { className: "simak-extra" }, label + ": ",
        key === "photo" || key === "ndtPhoto" ? photo(row,key,item) : simakValue(row,key,item)));
    }
    return cells;
  }
  for (const item of checklistItems) {
    if (item.category !== category) {
      category = item.category;
      form.append(dom("h4", { className: "simak-band" }, category.code + " " + simakCategoryTitles[category.code].toUpperCase()));
    }
    if (item.group !== group) {
      group = item.group;
      if (group.code === "a)") form.append(dom("h5", { className: "simak-group" }, "Pemeriksaan sistem proteksi bahaya kebakaran"));
      form.append(dom("h5", { className: "simak-group" }, group.code + " " + group.title));
    }
    const title = dom("h6", { className: "simak-item-title" }, [item.no, item.title].filter(Boolean).join(". "));
    if (settings.anchors) title.id = "report-check-" + item.id;
    const summary = settings.summaryAnchors?.get(item.id);
    if (summary) {
      const link = reportJump(summary, "Ringkasan di bab");
      link.className = "simak-jump";
      title.append(link);
    }
    const check = checklist.checks[item.id];
    const columns = simakFormColumns(item);
    const defaults = (item.components || item.samples || [columns[0].sample ? "1" : ""])
      .map((label,index) => ({ key: String(index+1), label }));
    const saved = check?.rows ?? [];
    const rows = [
      ...defaults.map((row) => saved.find(({ key }) => key === row.key) ?? row),
      ...saved.filter(({ key }) => !defaults.some((row) => row.key === key)),
    ];
    const table = simakTable(columns.map(({title}) => title),
      check?.na ? [] : rows.map((row) => rowCells(item, columns, row)),
      columns.map(({weight}) => weight), item.fields.includes("P"));
    if (check?.na) {
      const cell = dom("td", { colSpan: columns.length }, dom("div", { className: "simak-state" }, "Tidak berlaku"));
      const reason = checklistReason(check);
      if (reason) cell.append(formattedValue(reason, getTextFormat(check,"reason") || getTextFormat(check.rows[0],"note")));
      table.tBodies[0].append(dom("tr", {}, cell));
    }
    if (columns[0].sample && !check?.na) {
      for (const row of table.tBodies[0].rows) row.cells[0].className = "simak-center";
    }
    const textLength = rows.reduce((length, row) => length + Object.values(row).reduce((sum, value) => sum + (typeof value === "string" ? value.length : 0), 0), 0);
    const photoCount = rows.reduce((count, row) => count + Number(Boolean(row.photo)) + Number(Boolean(row.ndtPhoto)), 0);
    const short = check?.na || (rows.length <= 6 && textLength < 1300 && photoCount <= 2);
    form.append(dom("div", { className: "simak-item" + (short ? " fit" : "") }, title, table,
      dom("p", { className: "simak-ref" }, "Acuan: " + checklistReference(item.id, settings.tegal))));
  }
  await Promise.all(photos);
}
