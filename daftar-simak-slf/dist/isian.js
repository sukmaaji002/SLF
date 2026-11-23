"use strict";

const tokenPattern = /\[([^\[\]\r\n]+)\]/g;
const tokenName = (text) => text.trim().replace(/\s+/g, " ").toLocaleLowerCase("id");
const tokenAliases = {
  "tujuan kajian": ["project:purpose"],
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
};

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

function ensureTableReferences(project) {
  for (const chapter of project.chapters) {
    for (const block of chapter.blocks) {
      if (block.type !== "table") continue;
      block.sourceId ??= crypto.randomUUID();
      block.rowIds ??= block.rows.map(() => crypto.randomUUID());
      block.columnIds ??= block.headers.map(() => crypto.randomUUID());
    }
  }
}

function reportSources(project, checklist = readChecklist(project.id)) {
  const sources = new Map();
  const teamLeads = new Set();
  function add(id, group, label, value) {
    sources.set(id, { group, label, value: cleanValue(value) });
  }
  const purpose = project.purpose;
  const purposeValue = purpose?.mode === "manual" ? purpose.custom : purposeOptions.find(([id]) => id === purpose?.mode)?.[2];
  add("project:purpose", "Data kajian", "Tujuan kajian", purposeValue);
  const application = purpose?.mode === "pengajuan" ? "pengajuan" : purpose?.mode === "perpanjangan" ? "perpanjangan" : "";
  add("project:application", "Data kajian", "Jenis permohonan SLF", application);
  const outline = project.chapters.map((chapter, index) => chapterLabel(project, index));
  if (!project.chapters.some((chapter) => chapter.checklist)) outline.push("Lampiran · Daftar simak kajian");
  add("project:chapter-order", "Data kajian", "Urutan bab dan lampiran", outline.join("\n"));
  for (const [key, label] of coverFields) add("cover:" + key, "Sampul", label, project.cover[key]);
  for (const [key, label] of Object.entries(checklistIdentityLabels)) {
    add("identity:" + key, "Identitas daftar simak", label, checklist.identity[key]);
  }
  for (const item of checklistItems) {
    const check = checklist.checks[item.id];
    if (!check || check.na) continue;
    for (const row of check.rows) {
      for (const [key, label] of Object.entries(checklistLabels)) {
        if (!cleanValue(row[key]) || key === "photo" || key === "ndtPhoto") continue;
        const value = row[key] + (key === "measurement" && item.unit ? " " + item.unit : "");
        const name = [item.group.code + " " + item.title, row.label, label].filter(Boolean).join(" · ");
        add("check:" + [item.id, row.key, key].join(":"), "Hasil daftar simak", name, value);
      }
    }
  }
  for (const [index, chapter] of project.chapters.entries()) {
    for (const block of chapter.blocks) {
      if (block.type !== "table" || !block.sourceId) continue;
      if (tokenName(block.text) === "susunan tim pengkaji teknis") {
        const name = block.headers.findIndex((header) => tokenName(header) === "nama");
        const role = block.headers.findIndex((header) => tokenName(header) === "peran / bidang");
        const leadRoles = ["penanggung jawab", "penanggung jawab kajian", "penanggung jawab teknis", "ketua tim pengkaji teknis"];
        for (const row of block.rows) {
          if (leadRoles.includes(tokenName(row[role] ?? "")) && cleanValue(row[name])) teamLeads.add(cleanValue(row[name]));
        }
      }
      for (const [ri, row] of block.rows.entries()) {
        for (const [ci, value] of row.entries()) {
          if (!cleanValue(value)) continue;
          const rowName = cleanValue(row[0]) || "Baris " + (ri + 1);
          const name = [chapterLabel(project, index), block.text || "Tabel", rowName, block.headers[ci]].join(" · ");
          add("cell:" + [block.sourceId, block.rowIds[ri], block.columnIds[ci]].join(":"), "Tabel kajian", name, value);
        }
      }
    }
  }
  add("project:team-lead", "Data kajian", "Penanggung jawab dari tabel tim pengkaji", teamLeads.size === 1 ? [...teamLeads][0] : "");
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

function resolveReportText(text, sources, links) {
  return text.replace(tokenPattern, (original, label) => {
    const key = tokenName(label);
    const link = Object.hasOwn(links ?? {}, key) ? links[key] : undefined;
    const value = link ? (link.source ? sources.get(link.source)?.value : link.value) : automaticValue(key, sources);
    return value?.trim() || original;
  });
}

const sourceUuid = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;

function importLinks(links) {
  if (!links || typeof links !== "object" || Array.isArray(links)) return {};
  const pairs = [];
  for (const [token, link] of Object.entries(links)) {
    if (!token || typeof link !== "object" || !link) continue;
    if (typeof link.value === "string") pairs.push([tokenName(token), { value: link.value }]);
    else if (typeof link.source === "string" && /^(?:project|cover|identity|check|cell):[a-z\d.:/-]+$/i.test(link.source)) {
      pairs.push([tokenName(token), { source: link.source }]);
    }
  }
  return Object.fromEntries(pairs);
}

function importIds(ids, size) {
  return Array.isArray(ids) && ids.length === size && new Set(ids).size === size &&
    ids.every((id) => typeof id === "string" && sourceUuid.test(id)) ? ids : undefined;
}
