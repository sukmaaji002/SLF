"use strict";

const tokenPattern = /\[([^\[\]\r\n]+)\]/g;
const tokenName = (text) => text.trim().replace(/\s+/g, " ").toLocaleLowerCase("id");
const tokenAliases = {
  "tujuan kajian": ["project:purpose"],
  "luas persil": ["project:land-area"],
  "gsb": ["project:gsb"], "garis sempadan bangunan": ["project:gsb"],
  "garis sempadan saluran": ["project:saluran"], "garis sempadan sungai": ["project:sungai"],
  "kdb": ["project:kdb"], "klb": ["project:klb"], "kdh": ["project:kdh"], "ktb": ["project:ktb"], "kbg": ["project:kbg"],
  "disiplin atau sistem yang diperiksa": ["project:scope"],
  "sistem utama dalam lingkup kajian": ["project:scope"],
  "pengajuan/perpanjangan": ["project:application"],
  "pengajuan atau perpanjangan": ["project:application"],
  "susunan bab laporan": ["project:chapter-order"],
  "nama penanggung jawab": ["project:team-lead"],
  "nama bangunan": ["cover:building", "identity:building"],
  "alamat": ["cover:address", "identity:location"],
  "alamat lengkap": ["cover:address", "identity:location"],
  "alamat bangunan": ["cover:address", "identity:location"],
  "lokasi": ["cover:address", "identity:location"],
  "fungsi aktual": ["cover:use", "identity:use"],
  "fungsi bangunan": ["cover:use", "identity:use"],
  "nama pemilik": ["cover:owner", "identity:ownerName"],
  "nama pemilik/pengelola": ["cover:owner", "identity:ownerName"],
  "pemilik/pengelola bangunan": ["cover:owner", "identity:ownerName"],
  "nama penyedia jasa atau tim": ["cover:consultant"],
  "nama penyedia jasa": ["cover:consultant"],
  "kabupaten/kota": ["cover:city"],
  "kota/kabupaten": ["cover:city"],
  "judul laporan": ["cover:title"],
  "nomor laporan": ["cover:number"],
  "nomor dan revisi laporan": ["cover:number"],
  "tanggal laporan": ["cover:date"],
  "tanggal pemeriksaan": ["identity:date"],
  "area atau posisi sampel": ["project:sample-locations"],
  "daftar simak atau dokumentasi foto": ["project:checklist-evidence"],
  "daftar dokumen": ["project:reviewed-documents"],
  "daftar alat pemeriksaan": ["project:inspection-tools"],
  "daftar bahan dan dokumen": ["project:intro-materials"],
  "jenis dokumen dan nomor": ["project:reviewed-permit"],
  "nama pengkaji arsitektur": ["project:reviewer-architecture"],
  "nama pengkaji struktur": ["project:reviewer-structure"],
  "nama pengkaji mep": ["project:reviewer-mep"],
};

const scopeOptions = [
  ["arsitektur", "Arsitektur dan tata bangunan"],
  ["struktur", "Struktur"],
  ["mep", "Mekanikal, elektrikal, dan plambing (MEP)"],
  ["kebakaran", "Proteksi kebakaran"],
  ["akses", "Aksesibilitas dan sarana bangunan"],
];
const scopeList = new Intl.ListFormat("id", { type: "conjunction" });

function scopeValue(scope) {
  const choices = scopeOptions.filter(([id]) => scope?.parts?.includes(id)).map(([, label]) => label.toLocaleLowerCase("id").replace("(mep)", "(MEP)"));
  const other = cleanValue(scope?.other);
  if (other) choices.push(other);
  return scopeList.format(choices);
}

function importScope(scope) {
  const parts = scopeOptions.filter(([id]) => Array.isArray(scope?.parts) && scope.parts.includes(id)).map(([id]) => id);
  const other = typeof scope?.other === "string" ? scope.other : "";
  return { parts, other };
}

function cleanValue(value) {
  if (typeof value !== "string" || !value.trim() || /\[[^\[\]]+\]/.test(value)) return "";
  return value.trim();
}

function reportTokens(text) {
  const entries = new Map();
  for (const [, label] of text.matchAll(tokenPattern)) {
    const key = tokenName(label);
    if (key) entries.set(key, label.trim());
  }
  return entries;
}

function ensureReportReferences(project) {
  for (const chapter of project.chapters) {
    for (const block of chapter.blocks) {
      if (block.type === "heading" || block.type === "text" || block.type === "table") block.sourceId ??= crypto.randomUUID();
      if (block.type !== "table") continue;
      if (block.rowIds?.length !== block.rows.length) {
        block.rowIds = block.rows.map((_, index) => block.rowIds?.[index] ?? crypto.randomUUID());
      }
      if (block.columnIds?.length !== block.headers.length) {
        block.columnIds = block.headers.map((_, index) => block.columnIds?.[index] ?? crypto.randomUUID());
      }
    }
  }
}

function narrativeReference(id, token) {
  return "narrative:" + id + ":" + encodeURIComponent(token);
}

function tableCellKey(block, row, column) {
  return block.rowIds?.[row] + ":" + block.columnIds?.[column];
}

function tableCellValue(block, row, column, sources) {
  const source = block.cellLinks?.[tableCellKey(block, row, column)];
  return source ? sources.get(source)?.value || "" : block.rows[row][column];
}

function tableSourceAvailable(id) {
  return !id.startsWith("document:") && (!id.startsWith("project:") ||
    ["project:purpose", "project:scope", "project:application", "project:chapter-order",
      "project:land-area", "project:kdb", "project:klb", "project:kdh", "project:ktb", "project:kbg", "project:gsb", "project:saluran", "project:sungai"].includes(id) || comparisonMetrics.some(({ key }) => id === "project:measurement-" + key));
}

function addNarrativeSources(add, id, text, links, label) {
  for (const [token, name] of reportTokens(text)) {
    const value = links?.[token]?.value;
    if (cleanValue(value)) add(narrativeReference(id, token), "Isian bagian lain", label + " · " + name, value, getTextFormat(links[token], "value"));
  }
}

function filledIntroSource(project, token, sources) {
  const section = project.chapters.flatMap((chapter) => chapter.blocks)
    .find((block) => block.type === "heading" && tokenName(block.text) === "lingkup materi pelaporan");
  const link = section?.links?.[token];
  return cleanValue(link?.source ? sources.get(link.source)?.value : link?.value);
}

function inspectionDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return cleanValue(value);
  const date = new Date(value + "T00:00:00Z");
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" }).format(date);
}

function projectPurposeValue(purpose) {
  return purpose?.mode === "manual" ? purpose.custom :
    purposeOptions.find(([id]) => id === purpose?.mode)?.[2];
}

function reportSources(project, checklist = readChecklist(project.id)) {
  const sources = new Map();
  const teamLeads = new Set();
  const locations = new Set();
  const reviewedDocuments = new Set();
  const permits = new Set();
  const reviewers = new Map([["arsitektur", new Set()], ["struktur", new Set()], ["mep", new Set()]]);
  const tools = new Set();
  const tables = [];
  let hasResults = false;
  let hasPhotos = false;
  function add(id, group, label, value, format) {
    sources.set(id, { group, label, value: cleanValue(value), format });
  }
  const intensity = calculateIntensity(project, checklist);
  if (intensity.land.value > 0) add("project:land-area", "Intensitas dan tata ruang", "Luas persil", intensityValue(intensity.land.value, " m²"));
  for (const metric of intensity.metrics) {
    if (metric.custom) continue;
    const unit = metric.direct || metric.unit === "lantai" ? intensityUnit(metric) : " m²";
    if (metric.measurement.value !== null) add("project:measurement-" + metric.key, "Data awal intensitas", metric.areaLabel,
      intensityValue(metric.measurement.value, unit));
    if (metric.value !== null) add("project:" + metric.key, "Intensitas dan tata ruang", metric.name,
      intensityValue(metric.value, intensityUnit(metric)));
  }
  const purpose = project.purpose;
  add("project:purpose", "Bagian awal", "Tujuan kajian", projectPurposeValue(purpose), getTextFormat(purpose, "custom"));
  add("project:scope", "Data kajian", "Pilihan bidang pemeriksaan", scopeValue(project.scope));
  const application = purpose?.mode === "pengajuan" ? "pengajuan" : purpose?.mode === "perpanjangan" ? "perpanjangan" : "";
  add("project:application", "Data kajian", "Jenis permohonan SLF", application);
  const outline = project.chapters.map((chapter, index) => chapterLabel(project, index));
  if (!project.chapters.some((chapter) => chapter.checklist)) outline.push("Lampiran · Daftar simak kajian");
  add("project:chapter-order", "Data kajian", "Urutan bab dan lampiran", outline.join("\n"));
  for (const [key, label] of coverFields) add("cover:" + key, "Sampul", label, project.cover[key], getTextFormat(project.cover, key));
  for (const [key, label] of frontFields.slice(0, 2)) {
    addNarrativeSources(add, key, project.front[key] ?? "", project.frontLinks?.[key], label);
  }
  for (const [key, label] of Object.entries(checklistIdentityLabels)) {
    const value = checklist.identity[key];
    add("identity:" + key, "Identitas daftar simak", label, key === "date" ? inspectionDate(value) : value, getTextFormat(checklist.identity, key));
  }
  for (const item of checklistItems) {
    const check = checklist.checks[item.id];
    if (!check || check.na) continue;
    for (const row of check.rows) {
      if (cleanValue(row.location) && tokenName(item.title) !== "jarak antar bangunan") locations.add(cleanValue(row.location));
      if (row.photo || row.ndtPhoto) hasPhotos = true;
      for (const [key, label] of Object.entries(checklistLabels)) {
        if (!cleanValue(row[key]) || key === "photo" || key === "ndtPhoto") continue;
        if (key !== "location") hasResults = true;
        const value = key === "measurement" ? formatChecklistMeasurement(row[key], item.unit) : row[key];
        const name = [item.group.code + " " + item.title, row.label, label].filter(Boolean).join(" · ");
        add("check:" + [item.id, row.key, key].join(":"), "Hasil daftar simak", name, value, getTextFormat(row, key));
      }
    }
  }
  for (const [index, chapter] of project.chapters.entries()) {
    for (const block of chapter.blocks) {
      if ((block.type === "heading" || block.type === "text") && block.sourceId) {
        addNarrativeSources(add, block.sourceId, block.type === "heading" ? block.body : block.text, block.links,
          chapterLabel(project, index) + (block.type === "heading" ? " · " + block.text : " · Paragraf"));
      }
      if (block.type !== "table" || !block.sourceId) continue;
      tables.push(block);
      for (const [ri, row] of block.rows.entries()) {
        for (const [ci, value] of row.entries()) {
          const key = tableCellKey(block, ri, ci);
          if (!cleanValue(value) || block.cellLinks?.[key]) continue;
          const rowName = cleanValue(row[0]) || "Baris " + (ri + 1);
          const name = [chapterLabel(project, index), block.text || "Tabel", rowName, block.headers[ci]].join(" · ");
          add("cell:" + block.sourceId + ":" + key, "Tabel kajian", name, value, getTextFormat(block, "cell:" + key));
        }
      }
    }
  }
  for (const block of tables) {
    const title = tokenName(block.text);
    const columns = block.headers.map(tokenName);
    const rows = block.rows.map((row, ri) => row.map((_, ci) => tableCellValue(block, ri, ci, sources)));
    if (title === "susunan tim pengkaji teknis") {
      const name = block.headers.findIndex((header) => tokenName(header) === "nama");
      const role = block.headers.findIndex((header) => tokenName(header) === "peran / bidang");
      const leadRoles = ["penanggung jawab", "penanggung jawab kajian", "penanggung jawab teknis", "ketua tim pengkaji teknis"];
      for (const row of rows) {
        const roleName = tokenName(row[role] ?? "");
        const person = cleanValue(row[name]);
        if (!person) continue;
        if (leadRoles.includes(roleName)) teamLeads.add(person);
        reviewers.get(roleName)?.add(person);
      }
    }
    if (title === "daftar alat pemeriksaan") {
      const column = columns.indexOf("alat");
      for (const row of rows) if (cleanValue(row[column])) tools.add(cleanValue(row[column]));
    }
    if (title === "rekap pemeriksaan dokumen") {
      const name = columns.indexOf("dokumen");
      const reference = columns.indexOf("nomor / tanggal");
      const verification = columns.indexOf("status verifikasi");
      for (const [ri, row] of rows.entries()) {
        const document = cleanValue(row[name]);
        const status = tokenName(row[verification] ?? "");
        if (!document || !["terverifikasi", "telah ditelaah", "ditelaah", "sesuai", "valid"].includes(status)) continue;
        const number = cleanValue(row[reference]);
        const value = number ? document + " (" + number + ")" : document;
        reviewedDocuments.add(value);
        if (/\b(?:pbg|imb)\b/i.test(document)) permits.add(value);
        add("document:" + block.sourceId + ":" + block.rowIds[ri], "Dokumen yang sudah ditelaah", document, value);
      }
    }
  }
  add("project:team-lead", "Data kajian", "Penanggung jawab dari tabel tim pengkaji", teamLeads.size === 1 ? [...teamLeads][0] : "");
  add("project:sample-locations", "Data kajian", "Lokasi sampel yang dicatat di daftar simak", scopeList.format([...locations]));
  const evidence = [hasResults ? "daftar simak kajian" : "", hasPhotos ? "dokumentasi foto pemeriksaan" : ""].filter(Boolean);
  add("project:checklist-evidence", "Data kajian", "Bukti yang dicatat di daftar simak", scopeList.format(evidence));
  add("project:reviewed-documents", "Data kajian", "Daftar dokumen yang sudah ditelaah dari Bab IV", scopeList.format([...reviewedDocuments]));
  add("project:reviewed-permit", "Data kajian", "Dokumen PBG atau IMB yang sudah ditelaah", permits.size === 1 ? [...permits][0] : "");
  for (const [role, id] of [["arsitektur", "architecture"], ["struktur", "structure"], ["mep", "mep"]]) {
    const names = reviewers.get(role);
    add("project:reviewer-" + id, "Data kajian", "Pengkaji " + role + " dari tabel tim", names.size === 1 ? [...names][0] : "");
  }
  add("project:inspection-tools", "Data kajian", "Nama alat dari tabel Daftar Alat Pemeriksaan", scopeList.format([...tools]));
  add("project:intro-materials", "Data kajian", "Sumber data yang diisi di Bab I",
    filledIntroSource(project, "dokumen, hasil survei, atau hasil uji", sources));
  add("project:intro-limits", "Data kajian", "Keterbatasan akses atau data yang diisi di Bab I",
    filledIntroSource(project, "keterbatasan akses atau data", sources));
  return sources;
}

function automaticSource(token, sources) {
  const ids = Object.hasOwn(tokenAliases, token) ? tokenAliases[token] : [];
  return ids.find((id) => sources.get(id)?.value) || ids[0];
}

function automaticValue(token, sources) {
  if (token === "nama dan alamat bangunan") {
    const building = sources.get(automaticSource("nama bangunan", sources))?.value;
    const address = sources.get(automaticSource("alamat bangunan", sources))?.value;
    return building && address ? building + " · " + address : "";
  }
  return sources.get(automaticSource(token, sources))?.value || "";
}

function resolveReportLink(original, label, sources, links) {
  const key = tokenName(label);
  const link = Object.hasOwn(links ?? {}, key) ? links[key] : undefined;
  const source = sources.get(link?.source ?? automaticSource(key, sources));
  const value = link ? (link.source ? source?.value : link.value) : automaticValue(key, sources);
  const format = link && !link.source ? getTextFormat(link, "value") : source?.format;
  return { value: (key === "tanggal pemeriksaan" ? inspectionDate(value) : value?.trim()) || original, format };
}

function resolveReportText(text, sources, links) {
  return text.replace(tokenPattern, (original, label) => resolveReportLink(original, label, sources, links).value);
}

const sourceUuid = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;
const validReportSource = (source) => typeof source === "string" && /^(?:project|cover|identity|check|cell|document|narrative):[a-z\d.:/%()!'*~-]+$/i.test(source);

function importLinks(links) {
  if (!links || typeof links !== "object" || Array.isArray(links)) return {};
  const pairs = [];
  for (const [token, link] of Object.entries(links)) {
    if (!token || typeof link !== "object" || !link) continue;
    if (typeof link.value === "string") pairs.push([tokenName(token), importTextFormats({ value: link.value }, link, ["value"])]);
    else if (validReportSource(link.source)) {
      pairs.push([tokenName(token), { source: link.source }]);
    }
  }
  return Object.fromEntries(pairs);
}

function importIds(ids, size) {
  return Array.isArray(ids) && ids.length === size && new Set(ids).size === size &&
    ids.every((id) => typeof id === "string" && sourceUuid.test(id)) ? ids : undefined;
}
