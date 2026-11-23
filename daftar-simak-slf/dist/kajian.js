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
  ensureReportReferences(current());
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

function field(label, value, onInput, type = "text", formatOwner, key, onFormat) {
  const props = { value: value ?? "" };
  const input = type === "area" ? dom("textarea", { ...props, rows: 4 }) : dom("input", { ...props, type });
  input.addEventListener("input", () => onInput(input.value));
  const wrapper = dom("label", { className: type === "area" ? "wide" : "" }, dom("span", {}, label), input);
  return formatOwner && (type === "text" || type === "area") ?
    textFormatControl(wrapper, input, formatOwner, key, onFormat || save) : wrapper;
}

function boundField(data, key, label, type, changed = save, format = true) {
  return field(label, data[key], (value) => { data[key] = value; changed(); }, type, format ? data : undefined, key, changed);
}

function guidedField(data, key, label, type) {
  const control = boundField(data, key, label, type);
  const example = inputExample(tokenName(label));
  if (example && type !== "date") control.querySelector("input").placeholder = "Contoh: " + example;
  return control;
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
  const layout = project.scope ?? {};
  const other = field("Bidang atau sistem lain", layout.other, (value) => change({ other: value, _format: layout._format }), "text", layout, "other", () => change({ _format: layout._format }));
  other.querySelector("input").placeholder = "Contoh: sistem gas medis";
  form.append(other);
  return form;
}

function linkedText(project, data, key, label, getLinks, setLinks) {
  const summary = dom("summary", {}, "Isian tertaut");
  const content = dom("div", { className: "linked-content" });
  const details = dom("details", { className: "linked-fields" }, summary, content);
  const wrapper = dom("div", { className: "wide" }, boundField(data, key, label, "area", () => {
    if (data[key] !== lastText) { lastText = data[key]; update(); }
    else linkedPreview?.();
    save();
  }), details);
  let lastText = data[key];
  let linkedPreview;

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
    const updatePreview = () => {
      const format = getTextFormat(data, key);
      preview.removeAttribute("style");
      styleTextBlock(preview, format);
      preview.replaceChildren(formattedText(text, format, (token, name) => resolveReportLink(token, name, sources, getLinks())));
    };
    linkedPreview = updatePreview;
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
      const ownSource = narrativeReference(data.sourceId ?? key, token);
      for (const [group, entries] of groups) {
        const available = entries.filter(([id]) => id !== ownSource);
        if (available.length) select.append(dom("optgroup", { label: group }, ...available.map(([id, label]) => new Option(label, id))));
      }
      if (saved?.source && !sources.has(saved.source)) select.append(new Option("Sumber tidak tersedia", saved.source));
      select.value = saved?.source ?? (saved || (!auto && !combined) ? "manual" : "");
      const value = dom("p", { className: "hint" });
      const example = inputExample(token);
      const hint = Object.hasOwn(inputHints, token) ? inputHints[token] : "";
      const manualData = { value: saved?.value ?? "", _format: saved?._format };
      const saveManual = () => {
        setLinks({ ...getLinks(), [token]: manualData });
        if (sources.has(ownSource)) {
          sources.get(ownSource).value = cleanValue(manualData.value);
          sources.get(ownSource).format = getTextFormat(manualData, "value");
        }
        updatePreview();
        refreshLinkedFields(details);
        save();
      };
      const manual = field("Isi " + name, manualData.value, (input) => { manualData.value = input; saveManual(); },
        token === "tanggal pemeriksaan" ? "date" : "text", manualData, "value", saveManual);
      const manualInput = manual.querySelector("input");
      const choices = token === "tanggal pemeriksaan" ? [] : choicesForInput(token);
      const isExample = !Object.hasOwn(inputChoices, token);
      const pick = choices.length ? dom("select", { ariaLabel: "Pilihan isian " + name },
        new Option(isExample ? "Pilih contoh untuk diedit" : "Pilih isian", ""), ...choices.map((option) => new Option(option, option))) : null;
      const choiceField = pick ? dom("label", {}, "Pilihan isian", pick) : null;
      if (pick) pick.addEventListener("change", () => {
        if (!pick.value) return;
        const previousValue = manualInput.value.trim();
        const replace = token === "jenis uji, metode, dan acuan atau keterangan tidak dilakukan";
        if (replace || isExample || !previousValue) manualInput.value = pick.value;
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
        if (select.value === "manual") links[token] = manualData;
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
  const tableFields = [...editor.querySelectorAll(".table-link[data-linked]")];
  if (tableFields.length) {
    const sources = reportSources(current());
    for (const details of tableFields) details.refreshValue(sources);
  }
}

function purposeField(project) {
  const select = dom("select", { ariaLabel: "Tujuan kajian" });
  select.append(new Option("Pilih tujuan kajian", ""),
    ...purposeOptions.map(([id, label]) => new Option(label, id)),
    new Option("Isi manual", "manual"));
  select.value = project.purpose?.mode ?? "";
  const layout = project.purpose ?? {};
  const manual = field("Tujuan kajian manual", layout.custom, (value) => update({ custom: value, _format: layout._format }), "text", layout, "custom", () => update({ _format: layout._format }));
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
  nav.append(outlineEntry("Intensitas dan tata ruang", "intensity", "∑"), outlineEntry("Peta tautan dan acuan", "links", "↗"));
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
  if (active === "intensity") return renderIntensity(project);
  if (active === "links") return renderChecklistMap(project);
  if (active === "checklist") return renderChecklistEditor(project);
  renderChapter(project);
}

function intensityTable(project, checklist, linkToInputs = false) {
  const { data, land, metrics, note } = calculateIntensity(project, checklist);
  const panel = dom("div", { className: "intensity-results" });
  const site = [intensityOptions(intensityZones, data.zone), intensityOptions(intensityRoads, data.road),
    intensityOptions(intensityFunctions, data.use)].filter(Boolean).join(" · ");
  if (site) panel.append(dom("p", {}, site));
  panel.append(dom("p", {}, "Luas persil: " + intensityValue(land.value, " m²")));
  panel.append(reportTable(["Koefisien", "Luas dari daftar simak", "Hasil", "Batas Perbup", "Perbandingan"], metrics.map((metric) => {
    const suffix = metric.percent ? "%" : "";
    const label = metric.areaLabel + " · " + intensityValue(metric.area.value, " m²");
    const limit = metric.limit == null ? "—" : dom("a", {
      href: perbupTegalUrl + "#page=" + metric.page, target: "_blank", rel: "noopener",
    }, metric.direction + " " + intensityValue(metric.limit, suffix));
    return [metric.name, linkToInputs ? dom("a", { href: projectChecklistUrl(project, metric.id), target: "_blank", rel: "noopener" }, label) : label,
      intensityValue(metric.value, suffix), limit, metric.status];
  })));
  if (note) panel.append(dom("p", {}, note));
  if (data.region === "tegal") {
    panel.append(dom("p", {}, intensityReviewNote),
      dom("p", {}, dom("a", { href: perbupTegalUrl, target: "_blank", rel: "noopener" }, "Perbup Tegal No. 12 Tahun 2026, Lampiran III.A–C"),
        " · ", dom("a", { href: rtrwTegalUrl, target: "_blank", rel: "noopener" }, "RTRW Kabupaten Tegal 2023–2043")));
  }
  return panel;
}

function renderIntensity(project) {
  title("Data kajian", "Intensitas dan tata ruang");
  const data = importIntensity(project.intensity);
  const grid = dom("div", { className: "form-grid" });
  const results = dom("div", { className: "auto-checklist", id: "intensity-live", ariaLive: "polite" });
  const refresh = () => results.replaceChildren(intensityTable(project, readChecklist(project.id), true));
  const changed = () => {
    project.intensity = data;
    refresh();
    save();
  };
  const area = boundField(data, "land", "Luas persil yang diperhitungkan (m²)", "text", changed, false);
  Object.assign(area.querySelector("input"), { inputMode: "decimal", placeholder: "Contoh: 900 atau 1.250,5" });
  grid.append(area);
  for (const [key, label, choices] of [
    ["region", "Wilayah pembanding", [["tegal", "Kabupaten Tegal · Perbup 12/2026"]]],
    ["zone", "Pola ruang / zona", intensityZones],
    ["road", "Kelas jalan di depan persil", intensityRoads],
    ["use", "Fungsi pada PBG/IMB atau dokumen kajian", intensityFunctions],
  ]) {
    const select = dom("select", {}, new Option("Pilih " + label.toLowerCase(), ""),
      ...choices.map(([id, name]) => new Option(name, id)));
    select.value = data[key];
    select.addEventListener("change", () => { data[key] = select.value; changed(); });
    grid.append(dom("label", {}, dom("span", {}, label), select));
  }
  const diagram = dom("input", { type: "checkbox", checked: data.diagram });
  diagram.addEventListener("change", () => { data.diagram = diagram.checked; changed(); });
  editor.append(dom("p", { className: "lead" }, "Isi luas persil. Tiga luas pembilang diambil dari kolom Hasil pengukuran pada daftar simak. Gunakan luas yang diperhitungkan menurut dokumen lokasi dan ketentuan teknis."),
    grid, results, siteDiagram(),
    dom("label", { className: "intensity-toggle" }, diagram, "Sertakan skema ilustratif di laporan"),
    dom("p", { className: "lead" }, "Untuk gambar objek sebenarnya, gunakan Tambah Foto di Bab III. Sertakan denah terbangun atau gambar ukur yang telah diperiksa."));
  refresh();
}

function projectChecklistUrl(project, item, embed = false) {
  const params = new URLSearchParams({ proyek: project.id });
  if (project.intensity?.region === "tegal") params.set("acuan", "tegal");
  if (embed) params.set("embed", "1");
  return "./daftar-simak.html?" + params + (item ? "#butir-" + item : "");
}

function renderChecklistMap(project) {
  title("Daftar simak", "Peta tautan dan acuan");
  const search = dom("input", { type: "search", placeholder: "Cari nama butir atau acuan", ariaLabel: "Cari nama butir atau acuan" });
  const list = dom("div", { className: "auto-checklist", id: "checklist-map-items" });
  function update() {
    const checklist = readChecklist(project.id);
    const term = tokenName(search.value);
    const rows = [];
    for (const item of checklistItems) {
      const reference = checklistReference(item.id, project.intensity?.region === "tegal");
      const label = item.group.code + " · " + item.title;
      if (!tokenName(label + " " + reference).includes(term)) continue;
      const to = checklistDestination(project, item);
      const value = checklistSummary(item, checklist.checks[item.id]);
      const summary = value || "Belum diisi";
      let jump = "Ringkasan teknis sebelum daftar simak";
      if (to) jump = button("Bab " + roman(to.chapter + 1) + " · " + to.title, () => {
        active = to.chapter;
        render();
        const section = document.getElementById("checklist-links-" + to.block);
        if (section) { section.open = true; section.scrollIntoView({ block: "start" }); }
      }, "quiet");
      rows.push([dom("a", { href: projectChecklistUrl(project, item.id), target: "_blank", rel: "noopener" }, label), summary, reference, jump]);
    }
    list.replaceChildren(rows.length ? reportTable(["Butir", "Hasil di laporan", "Acuan", "Tujuan laporan"], rows) :
      dom("p", {}, "Tidak ada butir yang cocok."));
  }
  search.addEventListener("input", update);
  editor.append(dom("p", { className: "lead" }, "Buka nama butir untuk mengisi daftar simak. Butir dengan hasil atau status Tidak berlaku akan muncul pada tabel bab terkait."),
    search, list);
  update();
}

function refreshChecklistViews() {
  if (active === "links") {
    const search = editor.querySelector('input[type="search"]');
    search?.dispatchEvent(new Event("input"));
  }
  if (active === "intensity") {
    $("intensity-live")?.replaceChildren(intensityTable(current(), readChecklist(current().id), true));
  }
  if (typeof active === "number") {
    const checklist = readChecklist(current().id);
    for (const table of editor.querySelectorAll("[data-checklist-block]")) {
      table.replaceChildren(editorChecklistTable(current(), checklist, Number(table.dataset.checklistBlock)));
    }
  }
}

function editorChecklistTable(project, checklist, blockIndex) {
  const rows = [];
  for (const item of checklistItems) {
    const to = checklistDestination(project, item);
    if (to?.chapter !== active || to.block !== blockIndex) continue;
    const summary = checklistSummary(item, checklist.checks[item.id]);
    rows.push([dom("a", { href: projectChecklistUrl(project, item.id), target: "_blank", rel: "noopener" }, item.title),
      summary || "Belum diisi", checklistReference(item.id, project.intensity?.region === "tegal")]);
  }
  return reportTable(["Butir daftar simak", "Hasil di laporan", "Dasar aturan atau acuan teknis"], rows);
}

function title(type, label) {
  $("section-type").textContent = type;
  $("section-title").textContent = label;
}

function renderCover(project) {
  title("Bagian awal", "Sampul laporan");
  editor.append(dom("p", { className: "lead" }, "Nama, alamat, fungsi, dan identitas pada sampul otomatis mengisi bagian yang sesuai dalam laporan."),
    dom("div", { className: "form-grid" }, ...coverFields.map(([key, label, type]) =>
      guidedField(project.cover, key, label, type))),
    dom("hr"), pictureEditor(project.cover, "foto sampul"));
  editor.append(dom("hr"), field("Nama proyek di editor", project.name, (value) => {
    project.name = value;
    $("projects").selectedOptions[0].textContent = value;
    save();
  }, "text", project, "name"));
}

function renderFront(project) {
  title("Bagian awal", "Bagian awal & daftar isi");
  editor.append(dom("p", { className: "lead" }, "Daftar isi, daftar tabel, dan daftar gambar mengikuti susunan laporan."),
    purposeField(project),
    dom("div", { className: "form-grid" }, ...frontFields.map(([key, label], index) =>
      index < 2 ? linkedText(project, project.front, key, label, () => project.frontLinks?.[key] ?? {},
        (links) => { project.frontLinks = { ...project.frontLinks, [key]: links }; }) :
        guidedField(project.front, key, label))),
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
  const url = projectChecklistUrl(project);
  editor.append(dom("div", { className: "checklist-head" },
    dom("p", { className: "lead" }, "Isi hasil pemeriksaan. Perubahan pada daftar simak ikut masuk ke laporan proyek ini."),
    dom("a", { href: url, target: "_blank", rel: "noopener" }, "Buka layar penuh")),
    dom("iframe", { src: projectChecklistUrl(project, null, true), title: "Daftar simak proyek", className: "checklist-frame" }));
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
  const checklist = readChecklist(project.id);
  const mapped = new Set(checklistItems.map((item) => checklistDestination(project, item))
    .filter((destination) => destination?.chapter === index).map(({ block }) => block));
  function appendChecklist(blockIndex) {
    if (!mapped.has(blockIndex)) return;
    const wrapper = dom("div", { className: "auto-checklist" });
    wrapper.dataset.checklistBlock = blockIndex;
    wrapper.append(editorChecklistTable(project, checklist, blockIndex));
    editor.append(dom("details", { className: "block", id: "checklist-links-" + blockIndex },
      dom("summary", {}, "Hasil daftar simak dan acuan untuk subbab ini"), wrapper));
  }
  appendChecklist(-1);
  for (const [bi, block] of chapter.blocks.entries()) {
    editor.append(blockEditor(chapter, block, bi, headings.get(bi)));
    appendChecklist(bi);
  }
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
    }, "text", block, "header:" + block.columnIds[index])));
  }
  header.append(dom("th", {}, "Baris"));
  const rows = dom("tbody");
  const sources = reportSources(current());
  const tableName = tokenName(block.text);
  const statusColumn = tableName === "rekap pemeriksaan dokumen" ?
    block.headers.findIndex((header) => tokenName(header) === "status verifikasi") : -1;
  const toolColumn = tableName === "daftar alat pemeriksaan" ?
    block.headers.findIndex((header) => tokenName(header) === "alat") : -1;
  for (const [index, row] of block.rows.entries()) {
    rows.append(dom("tr", {}, ...row.map((_, column) =>
      dom("td", {}, tableCellField(block, index, column, sources,
        column === statusColumn ? ["Terverifikasi", "Telah ditelaah", "Belum ditelaah", "Belum tersedia"] :
          column === toolColumn ? inputChoices["daftar alat pemeriksaan"] : []))), dom("td", {}, button("Hapus", () => {
      const populated = row.some((cell, column) => cell.trim() || block.cellLinks?.[tableCellKey(block, index, column)]);
      if (populated && !confirm("Hapus baris tabel ini?")) return;
      for (const column of row.keys()) {
        const key = tableCellKey(block, index, column);
        if (block.cellLinks) delete block.cellLinks[key];
        setTextFormat(block, "cell:" + key, undefined);
      }
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
    const column = block.headers.length - 1;
    const populated = block.rows.some((row, index) => row[column].trim() || block.cellLinks?.[tableCellKey(block, index, column)]);
    if (populated && !confirm("Hapus kolom terakhir beserta isinya?")) return;
    change(() => {
      for (const row of block.rows.keys()) {
        const key = tableCellKey(block, row, column);
        if (block.cellLinks) delete block.cellLinks[key];
        setTextFormat(block, "cell:" + key, undefined);
      }
      setTextFormat(block, "header:" + block.columnIds[column], undefined);
      block.headers.pop();
      block.columnIds.pop();
      block.rows.forEach((row) => row.pop());
    });
  }));
  const editor = dom("div", {}, matrix, actions);
  if (tokenName(block.text) === "susunan tim pengkaji teknis") {
    editor.prepend(dom("p", { className: "hint" },
      "Isi peran Penanggung jawab kajian pada baris yang sesuai agar nama dari tabel muncul otomatis dalam narasi Bab I."));
  }
  return editor;
}

function tableCellField(block, row, column, sources, options) {
  const label = "Baris " + (row + 1) + ", kolom " + (column + 1);
  const key = tableCellKey(block, row, column);
  const value = block.rows[row][column];
  const token = value.match(/^\[([^\[\]\r\n]+)\]$/)?.[1];
  const fieldToken = tokenName(token ?? block.headers[column]);
  const example = inputExample(fieldToken);
  const control = field(label, token ? "" : value, (text) => {
    block.rows[row][column] = text;
    refreshLinkedFields();
    save();
  }, "text", block, "cell:" + key, () => { refreshLinkedFields(); save(); });
  const input = control.querySelector("input");
  const choices = options.length ? options : choicesForInput(fieldToken);
  if (choices.length) {
    const id = "pilihan-" + crypto.randomUUID();
    input.setAttribute("list", id);
    input.setAttribute("aria-label", label);
    control.append(dom("datalist", { id }, ...choices.map((option) => new Option(option, option))));
  }
  const summary = dom("summary");
  const pick = dom("select", { ariaLabel: "Sumber data " + label.toLocaleLowerCase("id") });
  const link = dom("details", { className: "table-link" }, summary, pick);
  function refreshValue(registry) {
    const source = block.cellLinks?.[key];
    const entry = registry.get(source);
    link.toggleAttribute("data-linked", Boolean(source));
    input.readOnly = Boolean(source);
    input.value = source ? entry?.value || "" : token && block.rows[row][column] === value ? "" : block.rows[row][column];
    input.placeholder = source && !entry?.value ? "Sumber belum tersedia" : example ? "Contoh: " + example : token ?? "";
    summary.textContent = source ? "Data tertaut" : "Ambil data";
    control.syncTextFormat();
  }
  link.refreshValue = refreshValue;
  function refreshOptions() {
    if (!link.open) return;
    const registry = reportSources(current());
    const selected = block.cellLinks?.[key];
    pick.replaceChildren(new Option("Isi manual", ""));
    const groups = new Map();
    for (const [id, entry] of registry) {
      if (!entry.value || !tableSourceAvailable(id) || id === "cell:" + block.sourceId + ":" + key) continue;
      if (!groups.has(entry.group)) groups.set(entry.group, []);
      groups.get(entry.group).push(new Option(entry.label, id));
    }
    for (const [group, options] of groups) pick.append(dom("optgroup", { label: group }, ...options));
    if (selected && ![...pick.options].some((option) => option.value === selected)) {
      pick.append(new Option("Sumber belum tersedia", selected));
    }
    pick.value = selected ?? "";
    refreshValue(registry);
  }
  link.addEventListener("toggle", refreshOptions);
  pick.addEventListener("change", () => {
    block.cellLinks ??= {};
    if (pick.value) block.cellLinks[key] = pick.value;
    else delete block.cellLinks[key];
    refreshOptions();
    refreshLinkedFields();
    save();
  });
  refreshValue(sources);
  return dom("div", {}, control, link);
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
  return importTextFormats(Object.fromEntries(keys.filter((key) => typeof record?.[key] === "string").map((key) => [key, record[key]])), record, keys);
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
      if (block.type === "heading" || block.type === "text") {
        clean.links = importLinks(block.links);
        if (typeof block.sourceId === "string" && sourceUuid.test(block.sourceId)) clean.sourceId = block.sourceId;
      }
      if (block.type === "table") {
        valid(Array.isArray(block.headers) && block.headers.length && block.headers.every((value) => typeof value === "string") &&
          Array.isArray(block.rows) && block.rows.every((row) => Array.isArray(row) &&
            row.length === block.headers.length && row.every((value) => typeof value === "string")));
        clean.headers = block.headers;
        clean.rows = block.rows;
        if (typeof block.sourceId === "string" && sourceUuid.test(block.sourceId)) clean.sourceId = block.sourceId;
        clean.rowIds = importIds(block.rowIds, block.rows.length);
        clean.columnIds = importIds(block.columnIds, block.headers.length);
        if (clean.rowIds && clean.columnIds && block.cellLinks && typeof block.cellLinks === "object") {
          const keys = new Set(clean.rowIds.flatMap((row) => clean.columnIds.map((column) => row + ":" + column)));
          clean.cellLinks = Object.fromEntries(Object.entries(block.cellLinks).filter(([key, id]) =>
            keys.has(key) && validReportSource(id) && tableSourceAvailable(id)));
        }
      }
      const tableFormatKeys = clean.columnIds?.map((id) => "header:" + id) ?? [];
      if (clean.rowIds && clean.columnIds) {
        for (const row of clean.rowIds) for (const col of clean.columnIds) tableFormatKeys.push("cell:" + row + ":" + col);
      }
      importTextFormats(clean, block, ["text", "body", ...tableFormatKeys]);
      if (block.type === "photo" && block.image) { valid(imageSource.test(block.image)); clean.image = block.image; }
      return clean;
    });
    return importTextFormats({ title: chapter.title, blocks, checklist: chapter.checklist === true }, chapter, ["title"]);
  });
  const project = {
    id: crypto.randomUUID(), name: (source.name || "Kajian impor").slice(0, 120), template: source.template,
    ...(source.narrativeRevision === disciplineNarrativeRevision ? { narrativeRevision: disciplineNarrativeRevision } : {}),
    cover: pickText(source.cover, coverFields.map(([key]) => key)),
    front: pickText(source.front, frontFields.map(([key]) => key)),
    frontLinks: { preface: importLinks(source.frontLinks?.preface), approval: importLinks(source.frontLinks?.approval) },
    chapters,
  };
  importTextFormats(project, source, ["name"]);
  const purpose = pickText(source.purpose, ["mode", "custom"]);
  if (purpose.mode === "manual" || purposeOptions.some(([id]) => id === purpose.mode)) project.purpose = importTextFormats(purpose, source.purpose, ["custom"]);
  if (source.scope) project.scope = importTextFormats(importScope(source.scope), source.scope, ["other"]);
  if (source.intensity) project.intensity = importIntensity(source.intensity);
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
    checks[id] = { rows, nextRow: check.nextRow, na: check.na === true, ...pickText(check, ["reason"]) };
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
    if (event.key !== "daftar-simak-slf:v2:" + current().id) return;
    refreshLinkedFields();
    refreshChecklistViews();
  });
  render();
  await save();
}

start();
