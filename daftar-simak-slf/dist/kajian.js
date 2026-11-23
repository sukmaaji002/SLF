"use strict";

const $ = (id) => document.getElementById(id);
const database = openStore("ruang-kajian-slf", "workspace");
const preset = "disiplin";
const editor = $("editor");
const status = $("save-status");
const dialog = $("preview-dialog");
const reportUrls = [];
let disposePagination;
let workspace;
let active = "cover";
let saving = 0;

function heading(text) {
  return { type: "heading", text, body: "" };
}

function draft(name, template) {
  return {
    id: crypto.randomUUID(), name, template,
    ...(template === "disiplin" ? { narrativeRevision: disciplineNarrativeRevision } : {}),
    cover: { title: "Laporan Kajian Teknis Sertifikat Laik Fungsi" },
    front: { ...frontDefaults },
    chapters: reportTemplates[template].chapters.map(([title, ...sections]) => ({
      title, checklist: sections.includes("@checklist"),
      blocks: templateBlocks(sections),
    })),
  };
}

const current = () => workspace.projects.find(({ id }) => id === workspace.current);

async function save() {
  ensureTableReferences(current());
  const revision = ++saving;
  status.textContent = "Menyimpan…";
  try {
    await storeValue(database, "workspace", "drafts", workspace);
    if (revision === saving) status.textContent = "Tersimpan di browser ini";
  } catch {
    if (revision === saving) status.textContent = "Gagal menyimpan. Unduh cadangan sebelum menutup.";
  }
}

function button(text, action, className = "") {
  const control = dom("button", { type: "button", className }, text);
  control.addEventListener("click", action);
  return control;
}

function field(label, value, onInput, type = "text") {
  const props = { value: value ?? "" };
  const input = type === "area" ? dom("textarea", { ...props, rows: 4 }) : dom("input", { ...props, type });
  input.addEventListener("input", () => onInput(input.value));
  return dom("label", { className: type === "area" ? "wide" : "" }, dom("span", {}, label), input);
}

function boundField(data, key, label, type, changed = save) {
  return field(label, data[key], (value) => { data[key] = value; changed(); }, type);
}

function scopeField(project, onChange) {
  const form = dom("fieldset", { className: "scope-options" }, dom("legend", {}, "Bidang yang diperiksa"));
  const selected = () => new Set(project.scope?.parts ?? []);
  const change = (changes) => {
    project.scope = { ...project.scope, ...changes };
    onChange();
  };
  for (const [id, label] of scopeOptions) {
    const control = dom("input", { type: "checkbox", checked: selected().has(id) });
    control.addEventListener("change", () => {
      const parts = selected();
      if (control.checked) parts.add(id);
      else parts.delete(id);
      change({ parts: [...parts] });
    });
    form.append(dom("label", { className: "scope-choice" }, control, label));
  }
  const other = field("Bidang atau sistem lain", project.scope?.other, (value) => change({ other: value }));
  other.querySelector("input").placeholder = "Contoh: sistem gas medis";
  form.append(other);
  return form;
}

function linkedText(project, data, key, label, getLinks, setLinks) {
  const summary = dom("summary", {}, "Isian tertaut");
  const content = dom("div", { className: "linked-content" });
  const details = dom("details", { className: "linked-fields" }, summary, content);
  const wrapper = dom("div", { className: "wide" }, boundField(data, key, label, "area", () => {
    update();
    save();
  }), details);

  function update() {
    const text = data[key] || "";
    const fields = reportTokens(text);
    details.hidden = fields.size === 0;
    summary.textContent = "Isian tertaut (" + fields.size + ")";
    if (!details.open || !fields.size) return;
    const sources = reportSources(project);
    const groups = new Map();
    for (const [id, source] of sources) {
      if (!groups.has(source.group)) groups.set(source.group, []);
      groups.get(source.group).push([id, source.label]);
    }
    const grid = dom("div", { className: "form-grid" });
    const preview = dom("p", { className: "linked-preview" });
    const updatePreview = () => { preview.textContent = resolveReportText(text, sources, getLinks()); };
    for (const [token, name] of fields) {
      const links = getLinks();
      const saved = Object.hasOwn(links, token) ? links[token] : undefined;
      const auto = automaticSource(token, sources);
      const select = dom("select", { ariaLabel: "[" + name + "]" });
      const combined = token === "nama dan alamat bangunan";
      const autoLabel = auto ? "Otomatis · " + sources.get(auto).label :
        "Otomatis · Nama dan alamat bangunan";
      if (auto || combined) select.append(new Option(autoLabel, ""));
      select.append(new Option("Isi manual", "manual"));
      for (const [group, entries] of groups) {
        select.append(dom("optgroup", { label: group }, ...entries.map(([id, label]) => new Option(label, id))));
      }
      if (saved?.source && !sources.has(saved.source)) select.append(new Option("Sumber tidak tersedia", saved.source));
      select.value = saved?.source ?? (saved || (!auto && !combined) ? "manual" : "");
      const value = dom("p", { className: "hint" });
      const example = inputExample(token);
      const hint = Object.hasOwn(inputHints, token) ? inputHints[token] : "";
      const manual = field("Isi " + name, saved?.value, (input) => {
        setLinks({ ...getLinks(), [token]: { value: input } });
        updatePreview();
        save();
      }, token === "tanggal pemeriksaan" ? "date" : "text");
      const manualInput = manual.querySelector("input");
      const choices = Object.hasOwn(inputChoices, token) ? inputChoices[token] : null;
      const pick = choices ? dom("select", { ariaLabel: "Pilihan isian " + name },
        new Option("Pilih isian", ""), ...choices.map((option) => new Option(option, option))) : null;
      const choiceField = pick ? dom("label", {}, "Pilihan isian", pick) : null;
      if (pick) pick.addEventListener("change", () => {
        if (!pick.value) return;
        const previousValue = manualInput.value.trim();
        const replace = token === "jenis uji, metode, dan acuan atau keterangan tidak dilakukan";
        if (replace || !previousValue) manualInput.value = pick.value;
        else if (!previousValue.split(", ").includes(pick.value)) manualInput.value = previousValue + ", " + pick.value;
        select.value = "manual";
        pick.value = "";
        updateValue();
        manualInput.dispatchEvent(new Event("input"));
        manualInput.focus();
      });
      const scope = auto === "project:scope" ? scopeField(project, () => {
        sources.get("project:scope").value = scopeValue(project.scope);
        updateValue();
        updatePreview();
        refreshLinkedFields(details);
        save();
      }) : null;
      const updateValue = () => {
        manual.hidden = select.value !== "manual";
        value.hidden = select.value === "manual";
        if (choiceField) choiceField.hidden = select.value !== "manual" && (Boolean(select.value) || Boolean(automaticValue(token, sources)));
        if (scope) scope.hidden = Boolean(select.value && select.value !== "project:scope");
        value.textContent = (select.value ? sources.get(select.value)?.value : automaticValue(token, sources)) ||
          (select.value ? "Sumber kosong atau sudah dihapus" : "Isian belum tersedia");
      };
      select.addEventListener("change", () => {
        const links = { ...getLinks() };
        if (select.value === "manual") links[token] = { value: manualInput.value };
        else if (select.value) links[token] = { source: select.value };
        else delete links[token];
        setLinks(links);
        updateValue();
        updatePreview();
        save();
      });
      updateValue();
      const entry = dom("div", { className: "link-entry" }, dom("label", {}, name[0].toLocaleUpperCase("id") + name.slice(1), select));
      if (hint) entry.append(dom("p", { className: "hint" }, hint));
      if (scope) entry.append(scope);
      if (choiceField) entry.append(choiceField);
      entry.append(manual, value);
      if (example) entry.append(dom("p", { className: "field-example" }, dom("strong", {}, "Contoh isian"), " · " + example));
      grid.append(entry);
    }
    updatePreview();
    content.replaceChildren(grid, dom("h4", {}, "Hasil di laporan"), preview);
  }

  details.addEventListener("toggle", update);
  details.refreshSources = update;
  update();
  return wrapper;
}

function refreshLinkedFields(except) {
  for (const details of editor.querySelectorAll(".linked-fields[open]")) {
    if (details !== except) details.refreshSources();
  }
}

function purposeField(project) {
  const select = dom("select", { ariaLabel: "Tujuan kajian" });
  select.append(new Option("Pilih tujuan kajian", ""),
    ...purposeOptions.map(([id, label]) => new Option(label, id)),
    new Option("Isi manual", "manual"));
  select.value = project.purpose?.mode ?? "";
  const manual = field("Tujuan kajian manual", project.purpose?.custom, (value) => update({ custom: value }));
  manual.querySelector("input").placeholder = "Contoh: menilai kelaikan fungsi pada area renovasi";
  const reflect = () => { manual.hidden = select.value !== "manual"; };

  function update(changes) {
    project.purpose = { ...project.purpose, ...changes };
    refreshLinkedFields();
    save();
  }

  select.addEventListener("change", () => {
    reflect();
    update({ mode: select.value });
    if (select.value === "manual") manual.querySelector("input").focus();
  });
  reflect();
  return dom("div", { className: "purpose-field" }, dom("label", {}, "Tujuan kajian", select), manual);
}

function setCurrent(id) {
  workspace.current = id;
  active = "cover";
  const url = new URL(location.href);
  url.searchParams.set("proyek", id);
  history.replaceState(null, "", url);
  save();
  render();
}

function outlineEntry(label, id, marker) {
  const control = button("", () => { active = id; render(); }, "outline-entry");
  control.append(dom("span", { className: "nav-marker", ariaHidden: "true" }, marker), dom("span", {}, label));
  if (active === id) control.setAttribute("aria-current", "page");
  return control;
}

function renderOutline() {
  const project = current();
  const nav = $("outline");
  nav.replaceChildren(outlineEntry("Sampul", "cover", "01"), outlineEntry("Bagian awal & daftar isi", "front", "02"));
  for (const [index, chapter] of project.chapters.entries()) {
    nav.append(outlineEntry(chapter.title.trim() || "Bab tanpa judul", index, roman(index + 1)));
  }
  if (!project.chapters.some((chapter) => chapter.checklist)) {
    nav.append(outlineEntry("Daftar simak", "checklist", "✓"));
  }
}

function render() {
  const project = current();
  $("projects").replaceChildren(...workspace.projects.map(({ id, name }) => new Option(name, id)));
  $("projects").value = project.id;
  $("template-label").textContent = reportTemplates[project.template].label;
  renderOutline();
  editor.replaceChildren();
  if (active === "cover") return renderCover(project);
  if (active === "front") return renderFront(project);
  if (active === "checklist") return renderChecklistEditor(project);
  renderChapter(project);
}

function title(type, label) {
  $("section-type").textContent = type;
  $("section-title").textContent = label;
}

function renderCover(project) {
  title("Bagian awal", "Sampul laporan");
  editor.append(dom("p", { className: "lead" }, "Nama, alamat, fungsi, dan identitas pada sampul otomatis mengisi bagian yang sesuai dalam laporan."),
    dom("div", { className: "form-grid" }, ...coverFields.map(([key, label, type]) =>
      boundField(project.cover, key, label, type))),
    dom("hr"), pictureEditor(project.cover, "foto sampul"));
  editor.append(dom("hr"), field("Nama proyek di editor", project.name, (value) => {
    project.name = value;
    $("projects").selectedOptions[0].textContent = value;
    save();
  }));
}

function renderFront(project) {
  title("Bagian awal", "Bagian awal & daftar isi");
  editor.append(dom("p", { className: "lead" }, "Daftar isi, daftar tabel, dan daftar gambar mengikuti susunan laporan."),
    purposeField(project),
    dom("div", { className: "form-grid" }, ...frontFields.map(([key, label], index) =>
      index < 2 ? linkedText(project, project.front, key, label, () => project.frontLinks?.[key] ?? {},
        (links) => { project.frontLinks = { ...project.frontLinks, [key]: links }; }) :
        boundField(project.front, key, label))),
    dom("h3", {}, "Susunan bab"),
    dom("ol", { className: "chapter-list" }, ...project.chapters.map((chapter, index) => {
      const titles = [...headingEntries(chapter, index)].filter(([bi]) => chapter.blocks[bi].text.trim());
      const jump = (bi) => {
        active = index;
        render();
        editor.querySelector(bi === undefined ? "input" : "#edit-block-" + bi + " input")?.focus();
      };
      const entry = dom("li", {}, button(chapterLabel(project, index), () => jump(), "quiet"));
      if (titles.length) entry.append(dom("ul", { className: "sub-outline" }, ...titles.map(([bi, info]) =>
        dom("li", { className: info.nested ? "nested-outline" : "" },
          button(info.number + " " + chapter.blocks[bi].text, () => jump(bi), "quiet")))));
      return entry;
    })));
}

function renderChecklistEditor(project) {
  if (active === "checklist") title("Lampiran", "Daftar simak kajian");
  const url = "./daftar-simak.html?proyek=" + encodeURIComponent(project.id);
  editor.append(dom("div", { className: "checklist-head" },
    dom("p", { className: "lead" }, "Isi hasil pemeriksaan. Perubahan pada daftar simak ikut masuk ke laporan proyek ini."),
    dom("a", { href: url, target: "_blank", rel: "noopener" }, "Buka layar penuh")),
    dom("iframe", { src: url + "&embed=1", title: "Daftar simak proyek", className: "checklist-frame" }));
}

function renderChapter(project) {
  const index = active;
  const chapter = project.chapters[index];
  title("Bab " + roman(index + 1), chapter.title || "Bab tanpa judul");
  const chapterActions = dom("div", { className: "button-row chapter-actions" });
  for (const [delta, label] of [[-1, "Naikkan bab"], [1, "Turunkan bab"]]) {
    const control = button(label, () => {
      const next = index + delta;
      [project.chapters[next], project.chapters[index]] = [chapter, project.chapters[next]];
      active = next;
      save();
      render();
    });
    control.disabled = !project.chapters[index + delta];
    chapterActions.append(control);
  }
  if (!chapter.checklist) chapterActions.append(button("Hapus bab", () => {
    if (!confirm("Hapus bab ini beserta seluruh isinya?")) return;
    project.chapters.splice(index, 1);
    active = "front";
    save();
    render();
  }, "danger"));
  editor.append(boundField(chapter, "title", "Judul bab", "text", () => {
    title("Bab " + roman(index + 1), chapter.title || "Bab tanpa judul");
    renderOutline();
    save();
  }), chapterActions);
  if (chapter.checklist) return renderChecklistEditor(project);
  editor.append(dom("p", { className: "lead" }, "Buka Isian tertaut pada setiap poin untuk memakai data baku proyek, sel tabel, atau hasil daftar simak yang sudah diisi."));
  const headings = headingEntries(chapter, index);
  for (const [bi, block] of chapter.blocks.entries()) editor.append(blockEditor(chapter, block, bi, headings.get(bi)));
  const actions = dom("div", { className: "button-row add-block" });
  for (const [type, label] of Object.entries({ heading: "Subbab", text: "Paragraf", table: "Tabel", photo: "Foto" })) {
    actions.append(button("＋ " + label, () => {
      const data = type === "heading" ? heading("") :
        type === "table" ? { type, text: "", headers: ["Uraian", "Keterangan"], rows: [["", ""]] } : { type, text: "" };
      chapter.blocks.push(data);
      save();
      render();
      editor.querySelector(".block:last-of-type input, .block:last-of-type textarea")?.focus();
    }));
  }
  editor.append(actions);
}

function tableEditor(block) {
  const matrix = dom("div", { className: "matrix" });
  const table = dom("table");
  const header = dom("tr");
  for (const [index, value] of block.headers.entries()) {
    header.append(dom("th", { scope: "col" }, field("Kolom " + (index + 1), value, (text) => {
      block.headers[index] = text;
      refreshLinkedFields();
      save();
    })));
  }
  header.append(dom("th", {}, "Baris"));
  const rows = dom("tbody");
  const tableName = tokenName(block.text);
  const statusColumn = tableName === "rekap pemeriksaan dokumen" ?
    block.headers.findIndex((header) => tokenName(header) === "status verifikasi") : -1;
  const toolColumn = tableName === "daftar alat pemeriksaan" ?
    block.headers.findIndex((header) => tokenName(header) === "alat") : -1;
  for (const [index, row] of block.rows.entries()) {
    rows.append(dom("tr", {}, ...row.map((value, column) =>
      dom("td", {}, tableCellField("Baris " + (index + 1) + ", kolom " + (column + 1), value, (text) => {
        row[column] = text;
        refreshLinkedFields();
        save();
      }, column === statusColumn ? ["Terverifikasi", "Telah ditelaah", "Belum ditelaah", "Belum tersedia"] :
        column === toolColumn ? inputChoices["daftar alat pemeriksaan"] : null))), dom("td", {}, button("Hapus", () => {
      if (row.some((cell) => cell.trim()) && !confirm("Hapus baris tabel ini?")) return;
      block.rows.splice(index, 1);
      block.rowIds.splice(index, 1);
      save();
      render();
    }, "danger"))));
  }
  table.append(dom("thead", {}, header), rows);
  matrix.append(table);
  const change = (edit) => { edit(); save(); render(); };
  const actions = dom("div", { className: "button-row" },
    button("＋ Baris", () => change(() => {
      block.rows.push(block.headers.map(() => ""));
      block.rowIds.push(crypto.randomUUID());
    })),
    button("＋ Kolom", () => change(() => {
      block.headers.push("Kolom baru");
      block.columnIds.push(crypto.randomUUID());
      block.rows.forEach((row) => row.push(""));
    })));
  if (block.headers.length > 1) actions.append(button("Hapus kolom terakhir", () => {
    if (block.rows.some((row) => row.at(-1).trim()) && !confirm("Hapus kolom terakhir beserta isinya?")) return;
    change(() => { block.headers.pop(); block.columnIds.pop(); block.rows.forEach((row) => row.pop()); });
  }));
  const editor = dom("div", {}, matrix, actions);
  if (tokenName(block.text) === "susunan tim pengkaji teknis") {
    editor.prepend(dom("p", { className: "hint" },
      "Isi peran Penanggung jawab kajian pada baris yang sesuai agar nama dari tabel muncul otomatis dalam narasi Bab I."));
  }
  return editor;
}

function tableCellField(label, value, onInput, options) {
  const token = value.match(/^\[([^\[\]\r\n]+)\]$/)?.[1];
  const control = field(label, token ? "" : value, onInput);
  if (token) {
    const example = inputExample(tokenName(token));
    control.querySelector("input").placeholder = example ? "Contoh: " + example : token;
  }
  if (options) {
    const id = "pilihan-" + crypto.randomUUID();
    const input = control.querySelector("input");
    input.setAttribute("list", id);
    input.setAttribute("aria-label", label);
    control.append(dom("datalist", { id }, ...options.map((option) => new Option(option, option))));
  }
  return control;
}

async function imageData(file) {
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1440 / Math.max(image.width, image.height));
    const canvas = dom("canvas", { width: Math.max(1, Math.round(image.width * scale)), height: Math.max(1, Math.round(image.height * scale)) });
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    image.close();
  }
}

function pictureEditor(block, label, isAttached = () => true) {
  const upload = dom("input", { type: "file", accept: "image/*" });
  const feedback = dom("p", { className: "hint", role: "status" });
  const image = dom("img", { className: "photo-thumb", alt: "Pratinjau dokumentasi", hidden: true });
  if (block.image) { image.src = block.image; image.hidden = false; }
  upload.addEventListener("change", async () => {
    if (!upload.files[0]) return;
    upload.disabled = true;
    try {
      const data = await imageData(upload.files[0]);
      if (!isAttached()) return;
      block.image = data;
      image.src = data;
      image.hidden = remove.hidden = false;
      feedback.textContent = "Foto ditambahkan";
      save();
    } catch {
      feedback.textContent = "Foto tidak dapat dibuka. Pilih file gambar lain.";
    } finally {
      upload.value = "";
      upload.disabled = false;
    }
  });
  const remove = button("Hapus " + label, () => {
    delete block.image;
    image.hidden = remove.hidden = true;
    image.removeAttribute("src");
    feedback.textContent = "";
    save();
  }, "quiet");
  remove.hidden = !block.image;
  return dom("div", {}, dom("label", {}, "Pilih " + label, upload), feedback, image, remove);
}

function blockEditor(chapter, block, index, headingInfo) {
  const labels = { heading: "Subbab", text: "Paragraf", table: "Tabel", photo: "Foto dokumentasi" };
  const marker = headingInfo ? labels[block.type] + " " + headingInfo.number : labels[block.type];
  const bar = dom("div", { className: "block-head" }, dom("strong", {}, marker));
  const controls = dom("div", { className: "button-row" });
  for (const [delta, name] of [[-1, "Naikkan blok"], [1, "Turunkan blok"]]) {
    const control = button(name, () => {
      const next = index + delta;
      [chapter.blocks[index], chapter.blocks[next]] = [chapter.blocks[next], block];
      save();
      render();
    }, "quiet");
    control.disabled = !chapter.blocks[index + delta];
    controls.append(control);
  }
  controls.append(button("Hapus", () => {
    if (!confirm("Hapus bagian ini?")) return;
    chapter.blocks.splice(index, 1);
    save();
    render();
  }, "danger"));
  bar.append(controls);
  const wrapper = dom("section", { className: headingInfo?.nested ? "block nested-block" : "block", id: "edit-block-" + index }, bar);
  const linked = (key, label) => linkedText(current(), block, key, label, () => block.links ?? {}, (links) => { block.links = links; });
  if (block.type === "heading") {
    wrapper.append(boundField(block, "text", "Judul subbab"));
    if (block.text === "Tujuan" && reportTokens(block.body).has("tujuan kajian")) wrapper.append(purposeField(current()));
    wrapper.append(linked("body", "Isi subbab"));
  }
  if (block.type === "text") wrapper.append(linked("text", "Isi paragraf"));
  if (block.type === "table") wrapper.append(boundField(block, "text", "Judul tabel"), tableEditor(block));
  if (block.type === "photo") wrapper.append(boundField(block, "text", "Keterangan foto"), pictureEditor(block, "foto", () => chapter.blocks.includes(block)));
  return wrapper;
}

function download(name, body) {
  const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
  const link = dom("a", { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function blobData(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function backup() {
  const project = structuredClone(current());
  const checklist = readChecklist(project.id);
  const photos = {};
  const control = $("backup");
  control.disabled = true;
  try {
    for (const key of checklistPhotos(checklist)) {
      const blob = await checklistPhoto(project.id, key);
      if (blob) photos[key] = await blobData(blob);
    }
    download("kajian-slf-" + project.id.slice(0, 8) + ".json", JSON.stringify({ version: 1, project, checklist, photos }));
    status.textContent = "Cadangan diunduh";
  } catch {
    status.textContent = "Cadangan gagal dibuat";
  } finally {
    control.disabled = false;
  }
}

function pickText(record, keys) {
  return Object.fromEntries(keys.filter((key) => typeof record?.[key] === "string").map((key) => [key, record[key]]));
}

function validateBackup(data) {
  const source = data?.project;
  const valid = (condition) => { if (!condition) throw new Error("Struktur cadangan tidak valid"); };
  valid(data?.version === 1 && typeof source?.name === "string" && Object.hasOwn(reportTemplates, source.template) &&
    Array.isArray(source.chapters));
  const chapters = source.chapters.map((chapter) => {
    valid(typeof chapter?.title === "string" && Array.isArray(chapter.blocks));
    const blocks = chapter.blocks.map((block) => {
      valid(block && ["heading", "text", "table", "photo"].includes(block.type) && typeof block.text === "string");
      const clean = { type: block.type, text: block.text };
      if (block.type === "heading") { valid(typeof block.body === "string"); clean.body = block.body; clean.depth = block.depth === 2 ? 2 : 1; }
      if (block.type === "heading" || block.type === "text") clean.links = importLinks(block.links);
      if (block.type === "table") {
        valid(Array.isArray(block.headers) && block.headers.length && block.headers.every((value) => typeof value === "string") &&
          Array.isArray(block.rows) && block.rows.every((row) => Array.isArray(row) &&
            row.length === block.headers.length && row.every((value) => typeof value === "string")));
        clean.headers = block.headers;
        clean.rows = block.rows;
        if (typeof block.sourceId === "string" && sourceUuid.test(block.sourceId)) clean.sourceId = block.sourceId;
        clean.rowIds = importIds(block.rowIds, block.rows.length);
        clean.columnIds = importIds(block.columnIds, block.headers.length);
      }
      if (block.type === "photo" && block.image) { valid(imageSource.test(block.image)); clean.image = block.image; }
      return clean;
    });
    return { title: chapter.title, blocks, checklist: chapter.checklist === true };
  });
  const project = {
    id: crypto.randomUUID(), name: (source.name || "Kajian impor").slice(0, 120), template: source.template,
    ...(source.narrativeRevision === disciplineNarrativeRevision ? { narrativeRevision: disciplineNarrativeRevision } : {}),
    cover: pickText(source.cover, coverFields.map(([key]) => key)),
    front: pickText(source.front, frontFields.map(([key]) => key)),
    frontLinks: { preface: importLinks(source.frontLinks?.preface), approval: importLinks(source.frontLinks?.approval) },
    chapters,
  };
  const purpose = pickText(source.purpose, ["mode", "custom"]);
  if (purpose.mode === "manual" || purposeOptions.some(([id]) => id === purpose.mode)) project.purpose = purpose;
  if (source.scope) project.scope = importScope(source.scope);
  if (source.cover?.image) {
    valid(typeof source.cover.image === "string" && imageSource.test(source.cover.image));
    project.cover.image = source.cover.image;
  }
  const checks = {};
  for (const { id } of checklistItems) {
    const check = data.checklist?.checks?.[id];
    if (!check) continue;
    valid(Array.isArray(check.rows) && Number.isSafeInteger(check.nextRow) && check.nextRow > 0);
    const rows = check.rows.map((row) => {
      valid(typeof row?.key === "string" && /^\d+$/.test(row.key) && Number(row.key) < check.nextRow);
      return pickText(row, ["key", "label", ...Object.keys(checklistLabels)]);
    });
    valid(new Set(rows.map((row) => row.key)).size === rows.length);
    checks[id] = { rows, nextRow: check.nextRow, na: check.na === true };
  }
  return { project, checklist: { identity: pickText(data.checklist?.identity, Object.keys(checklistIdentityLabels)), checks } };
}

async function importBackup(file) {
  try {
    const raw = JSON.parse(await file.text());
    const { project, checklist } = validateBackup(raw);
    upgradeReportDraft(project);
    for (const key of checklistPhotos(checklist)) {
      const photo = raw.photos?.[key];
      if (typeof photo !== "string" || !/^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(photo)) continue;
      const blob = await (await fetch(photo)).blob();
      await checklistPhoto(project.id, key, blob);
    }
    localStorage.setItem("daftar-simak-slf:v2:" + project.id, JSON.stringify(checklist));
    workspace.projects.push(project);
    setCurrent(project.id);
  } catch {
    status.textContent = "Impor gagal. Periksa file cadangan atau ruang penyimpanan browser.";
  } finally {
    $("backup-file").value = "";
  }
}

async function presentReport(print) {
  const buttons = [$("preview"), $("print")];
  if (buttons.some((control) => control.disabled)) return;
  buttons.forEach((control) => { control.disabled = true; });
  status.textContent = "Menyiapkan laporan…";
  try {
    const source = dom("article", { className: "report-print" });
    await buildReport(source, structuredClone(current()), reportUrls);
    disposePagination = await paginateReport(source, $("report"));
    dialog.showModal();
    status.textContent = "Laporan siap";
    if (print) window.print();
  } catch {
    disposePagination?.();
    disposePagination = undefined;
    status.textContent = "Laporan gagal disiapkan";
    reportUrls.splice(0).forEach((url) => URL.revokeObjectURL(url));
  } finally {
    buttons.forEach((control) => { control.disabled = false; });
  }
}

async function start() {
  try {
    workspace = await storeValue(database, "workspace", "drafts");
  } catch {
    status.textContent = "Penyimpanan browser tidak tersedia";
  }
  if (!workspace?.projects?.length) {
    const project = draft("Kajian baru", preset);
    workspace = { projects: [project], current: project.id };
  }
  for (const project of workspace.projects) upgradeReportDraft(project);
  const requested = new URLSearchParams(location.search).get("proyek");
  if (workspace.projects.some(({ id }) => id === requested)) workspace.current = requested;
  $("projects").addEventListener("change", () => setCurrent($("projects").value));
  $("add-chapter").addEventListener("click", () => {
    const project = current();
    project.chapters.push({ title: "Bab baru", blocks: [heading("")], checklist: false });
    active = project.chapters.length - 1;
    save();
    render();
  });
  $("new-project").addEventListener("click", () => $("project-dialog").showModal());
  $("project-cancel").addEventListener("click", () => $("project-dialog").close());
  const form = $("project-form");
  const templates = form.elements.template;
  templates.append(...Object.entries(reportTemplates).map(([key, value]) => new Option(value.label, key)));
  const explain = () => { $("template-description").textContent = reportTemplates[templates.value].description; };
  templates.addEventListener("change", explain);
  explain();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = form.elements.name.value.trim();
    if (!name) { form.elements.name.focus(); return; }
    const project = draft(name, templates.value);
    workspace.projects.push(project);
    $("project-dialog").close();
    form.reset();
    explain();
    setCurrent(project.id);
  });
  $("preview").addEventListener("click", () => presentReport(false));
  $("print").addEventListener("click", () => presentReport(true));
  $("print-preview").addEventListener("click", () => window.print());
  $("close-preview").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    $("report").replaceChildren();
    disposePagination?.();
    disposePagination = undefined;
    reportUrls.splice(0).forEach((url) => URL.revokeObjectURL(url));
  });
  $("backup").addEventListener("click", backup);
  $("restore").addEventListener("click", () => $("backup-file").click());
  $("backup-file").addEventListener("change", () => {
    if ($("backup-file").files[0]) importBackup($("backup-file").files[0]);
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "daftar-simak-slf:v2:" + current().id) refreshLinkedFields();
  });
  render();
  await save();
}

start();
