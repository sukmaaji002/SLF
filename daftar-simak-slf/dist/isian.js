"use strict";

const tokenPattern = /\[([^\[\]\r\n]+)\]/g;
const tokenName = (text) => text.trim().replace(/\s+/g, " ").toLocaleLowerCase("id");
const safetyReferenceToken = "standar struktur, proteksi kebakaran, kelistrikan, dan proteksi petir yang relevan";
const parameterReferenceToken = "parameter dan rujukan";
const healthReferenceToken = "standar atau dokumen pembanding";
const healthParameterToken = "parameter, satuan, dan rujukan";
const healthRoomToken = "ruang atau sistem";
const comfortReferenceToken = "ketentuan ruang gerak, suhu, kelembapan, getaran, atau kebisingan yang relevan";
const comfortRoomToken = "fungsi ruang";
const easeReferenceToken = "acuan aksesibilitas atau dokumen teknis";
const easeParameterToken = "parameter jalur, fasilitas, atau peralatan yang berlaku";
const sampleLocationToken = "area atau posisi sampel";
const existingAreaToken = "area atau unit";
const ownerDocumentsToken = "nama dan rujukan dokumen";
const permitDocumentsToken = "jenis dokumen dan nomor";
const permitDocumentTypes = ["Tata Ruang", "NIB", "IMB/PBG", "Dokumen Lingkungan", "ANDALALIN"];
const technicalDocumentsToken = "sumber dokumen";
const technicalFieldCheckToken = "sumber verifikasi lapangan";
const repeatedNarrativeFields = new Map([
  [sampleLocationToken, { key: "locations", legend: "Lokasi pemeriksaan", item: "Ruang atau gedung" }],
  [existingAreaToken, { key: "existingAreas", choiceKey: "existingAreaChoices", item: "Area atau unit tambahan", minimumRows: 0 }],
  [ownerDocumentsToken, { key: "ownerDocuments", choiceKey: "ownerDocumentChoices", item: "Nama atau rujukan tambahan", minimumRows: 0 }],
  [permitDocumentsToken, { key: "permitDocuments", choiceKey: "permitDocumentChoices", numberKey: "permitDocumentNumbers",
    item: "Nama dan nomor dokumen tambahan", minimumRows: 0 }],
  [technicalDocumentsToken,
    { key: "technicalDocuments", choiceKey: "technicalDocumentChoices", item: "Dokumen tambahan", minimumRows: 0,
      label: "Dokumen apa yang dipakai?", previewLabel: "Pilih dokumen yang dipakai" }],
  [technicalFieldCheckToken,
    { key: "technicalFieldChecks", choiceKey: "technicalFieldCheckChoices", item: "Cara pengecekan tambahan", minimumRows: 0,
      label: "Bagaimana data dicek di lapangan?", previewLabel: "Pilih cara cek di lapangan" }],
  [healthReferenceToken,
    { key: "healthReferences", choiceKey: "healthReferenceChoices", groupKey: "healthReferenceGroups", item: "Acuan tambahan",
      addGroupLabel: "Tambah acuan kesehatan", method: "health" }],
  [healthParameterToken, { key: "healthParameters", choiceKey: "healthParameterChoices", item: "Isian tambahan", minimumRows: 0, method: "health" }],
  [healthRoomToken, { key: "healthRooms", choiceKey: "healthRoomChoices", item: "Ruang atau sistem tambahan", minimumRows: 0, method: "health" }],
  [comfortReferenceToken,
    { key: "comfortReferences", choiceKey: "comfortReferenceChoices", groupKey: "comfortReferenceGroups", item: "Acuan tambahan",
      addGroupLabel: "Tambah acuan kenyamanan", method: "comfort" }],
  [comfortRoomToken, { key: "comfortRooms", choiceKey: "comfortRoomChoices", item: "Fungsi atau nama ruang tambahan",
    minimumRows: 0, method: "comfort" }],
  ["parameter yang diperiksa", { key: "comfortAspects", choiceKey: "comfortAspectChoices", item: "Jenis aspek kenyamanan",
    label: "Aspek kenyamanan yang diperiksa", addLabel: "Tambah aspek sendiri", minimumRows: 0, method: "comfortAssessment" }],
  [easeReferenceToken,
    { key: "easeReferences", choiceKey: "easeReferenceChoices", groupKey: "easeReferenceGroups", item: "Acuan tambahan",
      addGroupLabel: "Tambah acuan kemudahan", method: "ease" }],
  [easeParameterToken, { key: "easeParameters", choiceKey: "easeParameterChoices", item: "Isian tambahan", minimumRows: 0, method: "ease" }],
  ["daftar alat pemeriksaan", { key: "tools", legend: "Alat pemeriksaan", item: "Nama alat" }],
  ["peraturan, standar teknis, dan dokumen rencana yang relevan",
    { key: "references", choiceKey: "referenceChoices", legend: "Acuan penilaian", item: "Acuan tambahan" }],
  ["ketentuan tata ruang, dokumen perizinan, dan gambar rencana yang digunakan",
    { key: "references", choiceKey: "referenceChoices", legend: "Acuan tata bangunan", item: "Acuan tambahan" }],
  [safetyReferenceToken,
    { key: "references", choiceKey: "referenceChoices", groupKey: "referenceGroups", legend: "Acuan keselamatan",
      item: "Acuan tambahan", addGroupLabel: "Tambah acuan keselamatan" }],
  [parameterReferenceToken,
    { key: "parameters", choiceKey: "parameterStandardChoices", item: "Isian tambahan", minimumRows: 0 }],
]);
const tokenAliases = {
  "tujuan kajian": ["project:purpose"],
  "luas persil": ["project:land-area"],
  "luas total lantai": ["project:measurement-klb"],
  "jumlah lantai bangunan": ["project:measurement-kbg"],
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
  [permitDocumentsToken]: ["project:reviewed-permit"],
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

const technicalActualSources = new Map([
  ["luas persil", "project:land-area"],
  ["luas lantai", "project:measurement-klb"],
  ["luas total lantai", "project:measurement-klb"],
  ["jumlah lantai", "project:measurement-kbg"],
  ["jumlah lantai bangunan", "project:measurement-kbg"],
]);

function automaticTableCellSource(block, row, column) {
  if (tokenName(block.text) !== "data umum bangunan gedung" || tokenName(block.headers[column]) !== "data eksisting") return undefined;
  if (cleanValue(block.rows[row][column])) return undefined;
  const parameterColumn = block.headers.findIndex((header) => tokenName(header) === "parameter");
  return technicalActualSources.get(tokenName(block.rows[row][parameterColumn] ?? ""));
}

function tableCellValue(block, row, column, sources) {
  const measurement = block.healthMeasurements?.[block.rowIds?.[row]];
  if (measurement && column < 4) return healthMeasurementValues(measurement)[column];
  const source = block.cellLinks?.[tableCellKey(block, row, column)];
  const automatic = sources.get(automaticTableCellSource(block, row, column));
  const value = source ? sources.get(source)?.value || "" : automatic?.value || block.rows[row][column];
  if (measurement && column === 4 && !source) return inspectionRecommendation(measurement, value);
  if (source) return value;
  return isDocumentReviewTable(block) && /^\[[^\[\]\r\n]+\]$/.test(value ?? "") ? "" : value;
}

function isArchitectureHealthTable(block) {
  return block?.type === "table" && tokenName(block.text) === tokenName(architectureHealthTableTitle);
}

function architectureInspectionKind(block) {
  if (block?.type !== "table") return undefined;
  if (Object.hasOwn(inspectionParameters, block.inspectionKind)) return block.inspectionKind;
  const title = tokenName(block.text);
  if (title === tokenName(architectureHealthTableTitle)) return "health";
  if (title === tokenName(architectureComfort.title)) return "comfort";
  if (title === tokenName(architectureEase.title)) return "ease";
}

function tableImageColumn(block) {
  return (block.healthMeasurements || architectureInspectionKind(block)) && block.headers.length >= 5 ?
    4 : block.headers.length - 1;
}

function tableSourceAvailable(id, block) {
  if (block.healthMeasurements || architectureInspectionKind(block)) return true;
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

function isTeamTable(block) {
  return tokenName(block.text) === "susunan tim pengkaji teknis";
}

function isDocumentReviewTable(block) {
  return block.type === "table" && tokenName(block.text) === "rekap pemeriksaan dokumen";
}

function teamMembers(block, sources) {
  const name = block.headers.findIndex((header) => tokenName(header) === "nama");
  return block.rowIds.map((id, index) => [id, name < 0 ? "" : cleanValue(tableCellValue(block, index, name, sources))]);
}

const permitKinds = [
  ["Tata Ruang", /\b(?:pkkpr|kkpr)\b/i],
  ["IMB/PBG", /\b(?:imb|pbg)\b/i],
];
const earlierPermitFields = new Set([
  "dokumen, hasil survei, atau hasil uji", "daftar dokumen", "dokumen rujukan",
  "peraturan, standar teknis, dan dokumen rencana yang relevan",
  "ketentuan tata ruang, dokumen perizinan, dan gambar rencana yang digunakan",
  "dokumen", technicalDocumentsToken, ownerDocumentsToken, "jenis dokumen, nomor, dan tanggal",
]);

function permitNumberFromText(value, kind) {
  const pattern = new RegExp(kind.source +
    String.raw`(?:\s*/\s*(?:IMB|PBG))?\)?\s*(?:\(\s*|[-:–]\s*)?(?:(?:nomor|no\.?)\s*[:.]?\s*)?([\w/-]*\d[\w./-]*)`, "i");
  return cleanValue(value).match(pattern)?.[1]?.replace(/[./-]+$/, "");
}

function recordedPermitNumbers(project, beforeBlock, sources) {
  const recorded = { ...sources.get("project:reviewed-permit")?.numbers };
  const [spatialPlan, kkpr] = permitKinds[0];
  const kkprNumber = permitNumberFromText(project.intensity?.local?.source, kkpr);
  if (kkprNumber) recorded[spatialPlan] = kkprNumber;
  for (const chapter of project.chapters) {
    for (const block of chapter.blocks) {
      if (block === beforeBlock) return recorded;
      if (block.type !== "heading" && block.type !== "text") continue;
      const text = block.type === "heading" ? block.body : block.text;
      for (const token of reportTokens(text ?? "").keys()) {
        if (!earlierPermitFields.has(token)) continue;
        const value = resolveReportLink("", token, sources, block.links).value;
        for (const [type, kind] of permitKinds) {
          if (recorded[type]) continue;
          const number = permitNumberFromText(value, kind);
          if (number) recorded[type] = number;
        }
      }
    }
  }
  return recorded;
}

function reportSources(project, checklist = readChecklist(project.id)) {
  const sources = new Map();
  const teamLeads = new Set();
  const designatedLeads = new Set();
  let hasDesignation = false;
  const locations = new Set();
  const availableDocuments = new Set();
  const permits = new Set();
  const permitNumbers = new Map();
  const reviewedPermitNumbers = new Map();
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
    if (metric.status !== "Tidak berlaku" && metric.measurement.value !== null) add("project:measurement-" + metric.key, "Data awal intensitas", metric.areaLabel,
      intensityValue(metric.measurement.value, unit));
    if (metric.value !== null) add("project:" + metric.key, "Intensitas dan tata ruang", metric.name,
      intensityValue(metric.value, intensityUnit(metric)));
  }
  const purpose = project.purpose;
  add("project:purpose", "Bagian awal", "Tujuan kajian", projectPurposeValue(purpose), getTextFormat(purpose, "custom"));
  add("project:scope", "Data kajian", "Pilihan bidang pemeriksaan", scopeValue(project.scope));
  if (!isIndividualConsultant(project)) {
    const director = cleanValue(project.front.consultantDirector) ||
      (/^(?:direktur(?: utama)?)?$/i.test(project.front.role?.trim() ?? "") ? cleanValue(project.front.signatory) : "");
    add("project:consultant-director", "Bagian awal", "Direktur Badan Usaha Pengkaji", director,
      getTextFormat(project.front, cleanValue(project.front.consultantDirector) ? "consultantDirector" : "signatory"));
  }
  const application = purpose?.mode === "pengajuan" ? "pengajuan" : purpose?.mode === "perpanjangan" ? "perpanjangan" : "";
  add("project:application", "Data kajian", "Jenis permohonan SLF", application);
  const outline = project.chapters.map((chapter, index) => chapterLabel(project, index));
  if (!project.chapters.some((chapter) => chapter.checklist)) outline.push("Lampiran · Daftar simak kajian");
  add("project:chapter-order", "Data kajian", "Urutan bab dan lampiran", outline.join("\n"));
  for (const [key, label] of coverFields) {
    const [owner, fieldKey] = key === "consultant" ? consultantNameField(project) : [project.cover, key];
    add("cover:" + key, "Sampul", label, owner[fieldKey], getTextFormat(owner, fieldKey));
  }
  for (const [key, label] of frontFields.slice(0, 2)) {
    addNarrativeSources(add, key, project.front[key] ?? "", project.frontLinks?.[key], label);
  }
  const identity = effectiveChecklistIdentity(project.cover, checklist.identity);
  for (const [key, label] of Object.entries(checklistIdentityLabels)) {
    const value = identity[key];
    add("identity:" + key, "Identitas daftar simak", label, key === "date" ? inspectionDate(value) : value, getTextFormat(identity, key));
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
        const text = inspectionIntroductions.get(block.body) ??
          (block.type === "heading" ? block.body : block.text);
        addNarrativeSources(add, block.sourceId, text, block.links,
          chapterLabel(project, index) + (block.type === "heading" ? " · " + block.text : " · Paragraf"));
      }
      if (block.type !== "table") continue;
      if (block.sourceId || isDocumentReviewTable(block)) tables.push(block);
      if (!block.sourceId) continue;
      for (const [ri, row] of block.rows.entries()) {
        for (const ci of row.keys()) {
          const key = tableCellKey(block, ri, ci);
          if (block.cellLinks?.[key]) continue;
          const value = tableCellValue(block, ri, ci, sources);
          if (!cleanValue(value)) continue;
          const rowName = cleanValue(row[0]) || "Baris " + (ri + 1);
          const name = [chapterLabel(project, index), block.text || "Tabel", rowName, block.headers[ci]].join(" · ");
          add("cell:" + block.sourceId + ":" + key, "Tabel kajian", name, value, getTextFormat(block, "cell:" + key));
        }
      }
    }
  }
  const presetDocuments = new Set(oldDocumentReviewNames.map(tokenName));
  for (const block of tables) {
    const title = tokenName(block.text);
    const columns = block.headers.map(tokenName);
    const rows = block.rows.map((row, ri) => row.map((_, ci) => tableCellValue(block, ri, ci, sources)));
    if (isTeamTable(block)) {
      const role = columns.indexOf("peran / bidang");
      const leadRoles = ["penanggung jawab", "penanggung jawab kajian", "penanggung jawab teknis", "ketua tim pengkaji teknis"];
      const members = teamMembers(block, sources);
      if (block.teamLead) {
        hasDesignation = true;
        const designated = block.teamLead === "director" ? director :
          members.find(([id]) => id === block.teamLead)?.[1];
        if (designated) designatedLeads.add(designated);
      }
      for (const [index, [, person]] of members.entries()) {
        const roleName = tokenName(rows[index][role] ?? "");
        if (!person) continue;
        if (leadRoles.includes(roleName)) teamLeads.add(person);
        reviewers.get(roleName)?.add(person);
      }
    }
    if (title === "daftar alat pemeriksaan") {
      const column = columns.indexOf("alat");
      for (const row of rows) if (cleanValue(row[column])) tools.add(cleanValue(row[column]));
    }
    if (isDocumentReviewTable(block)) {
      const name = columns.findIndex((column) => ["dokumen", "nama dokumen", "jenis dokumen"].includes(column));
      const reference = columns.findIndex((column) => ["nomor / tanggal", "nomor/tanggal", "nomor dan tanggal", "nomor", "nomor dokumen"].includes(column));
      const verification = columns.findIndex((column) => ["status verifikasi", "hasil verifikasi", "status"].includes(column));
      const notes = columns.indexOf("keterangan");
      for (const [ri, row] of rows.entries()) {
        const document = cleanValue(row[name]);
        if (!document) continue;
        const status = tokenName(cleanValue(row[verification]));
        const number = cleanValue(row[reference]);
        const note = cleanValue(row[notes]);
        const reviewed = ["terverifikasi", "telah ditelaah", "sudah ditelaah", "ditelaah", "sesuai", "valid"].includes(status);
        const available = ["ada", "tersedia", "lengkap", "diterima"].includes(status);
        const unavailable = /^(?:(?:belum|tidak) (?:tersedia|ada|diterima|disampaikan|diperoleh)|tidak berlaku)\b/i;
        if (unavailable.test(status) || (!reviewed && !available && unavailable.test(note))) continue;
        const value = number ? document + " (" + number + ")" : document;
        if (reviewed || available || number || note || !presetDocuments.has(tokenName(document))) availableDocuments.add(value);
        const kind = permitKinds.find(([, pattern]) => pattern.test(document))?.[0] ??
          (/\btata ruang\b/i.test(document) ? "Tata Ruang" : undefined);
        if (kind && /\d/.test(number)) {
          if (!permitNumbers.has(kind)) permitNumbers.set(kind, new Set());
          permitNumbers.get(kind).add(number);
        }
        if (!reviewed) continue;
        if (kind === "IMB/PBG") {
          permits.add(value);
          if (/\d/.test(number)) reviewedPermitNumbers.set(value, number);
        }
        if (block.sourceId && block.rowIds?.[ri]) {
          add("document:" + block.sourceId + ":" + block.rowIds[ri], "Dokumen yang sudah ditelaah", document, value);
        }
      }
    }
  }
  const leads = hasDesignation ? designatedLeads : teamLeads;
  add("project:team-lead", "Data kajian", "Penanggung jawab dari tabel tim pengkaji", leads.size === 1 ? [...leads][0] : "");
  const sampleLocations = [...locations];
  add("project:sample-locations", "Data kajian", "Lokasi sampel yang dicatat di daftar simak", scopeList.format(sampleLocations));
  sources.get("project:sample-locations").locations = sampleLocations;
  const evidence = [hasResults ? "daftar simak kajian" : "", hasPhotos ? "dokumentasi foto pemeriksaan" : ""].filter(Boolean);
  add("project:checklist-evidence", "Data kajian", "Bukti yang dicatat di daftar simak", scopeList.format(evidence));
  const documents = [...availableDocuments];
  add("project:reviewed-documents", "Data kajian", "Daftar dokumen dari Rekap Pemeriksaan Dokumen", scopeList.format(documents));
  sources.get("project:reviewed-documents").documents = documents;
  add("project:reviewed-permit", "Data kajian", "Dokumen PBG atau IMB yang sudah ditelaah", scopeList.format([...permits]));
  const permitSource = sources.get("project:reviewed-permit");
  permitSource.numbers = Object.fromEntries([...permitNumbers].map(([kind, numbers]) => [kind, [...numbers].join(", ")]));
  if (permits.size && reviewedPermitNumbers.size === permits.size) {
    permitSource.reviewedNumbers = [...new Set(reviewedPermitNumbers.values())].join(", ");
  }
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

function narrativeGroupEntries(groups) {
  return groups.flatMap(({ name, entries, fixed }) => {
    const references = entries.map((entry) => entry.trim()).filter(Boolean);
    return !fixed && name.trim() && references.length ?
      [name.trim() + " (" + scopeList.format(references) + ")"] : references;
  });
}

function narrativeEntryValue(choices, entries, groups = [], numbers = {}) {
  const selected = choices.map((choice) => {
    const number = Object.hasOwn(numbers, choice) ? numbers[choice].trim() : "";
    return number ? choice + " (" + number + ")" : choice;
  });
  return scopeList.format([...selected, ...entries, ...narrativeGroupEntries(groups)].map((entry) => entry.trim()).filter(Boolean));
}

function importLinks(links) {
  if (!links || typeof links !== "object" || Array.isArray(links)) return {};
  const pairs = [];
  for (const [token, link] of Object.entries(links)) {
    if (!token || typeof link !== "object" || !link) continue;
    if (typeof link.value === "string") {
      const key = tokenName(token);
      const data = importTextFormats({ value: link.value }, link, ["value"]);
      const field = repeatedNarrativeFields.get(key);
      const entries = field && link[field.key];
      const legacyParameters = key === parameterReferenceToken && Array.isArray(link.parameterChoices) &&
        !Array.isArray(link.parameterStandardChoices);
      const choiceKey = legacyParameters ? "parameterChoices" : field?.choiceKey;
      const groupKey = legacyParameters ? "parameterGroups" : field?.groupKey;
      const choices = choiceKey ? link[choiceKey] : [];
      const groups = groupKey ? link[groupKey] ?? [] : [];
      const numbers = field?.numberKey ? Object.fromEntries(permitDocumentTypes.flatMap((type) => {
        const number = link[field.numberKey]?.[type];
        return typeof number === "string" ? [[type, number]] : [];
      })) : undefined;
      if (Array.isArray(entries) && Array.isArray(choices) && [...choices, ...entries].every((entry) => typeof entry === "string") &&
        Array.isArray(groups) && groups.every((group) => group && typeof group.name === "string" &&
          typeof group.fixed === "boolean" && Array.isArray(group.entries) && group.entries.every((entry) => typeof entry === "string")) &&
        narrativeEntryValue(choices, entries, groups, numbers) === link.value) {
        data[field.key] = [...entries];
        if (choiceKey) data[choiceKey] = [...choices];
        if (field.numberKey) data[field.numberKey] = numbers;
        if (groupKey) data[groupKey] = groups.map(({ name, fixed, entries }) => ({ name, fixed, entries: [...entries] }));
      }
      pairs.push([key, data]);
    }
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
