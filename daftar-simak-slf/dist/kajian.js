"use strict";

const $ = (id) => document.getElementById(id);
const database = openStore("ruang-kajian-slf", "workspace");
const preset = "disiplin";
const editor = $("editor");
const narrowLayout = matchMedia("(max-width: 760px)");
const status = $("save-status");
const dialog = $("preview-dialog");
const reportUrls = [];
const photoEditors = new Map();
let disposePagination;
let workspace;
let active = "cover";
let saving = 0;
let trial;

const isTrial = () => Boolean(trial && workspace === trial.workspace);
globalThis.slfTrialData = (id) => isTrial() && trial.workspace.current === id ? trial : undefined;
globalThis.slfChecklistCover = (id) => current()?.id === id ? current().cover : undefined;

function setTrialView(visible) {
  if (visible && slfAuthUser) return;
  if (visible && !trial) {
    const project = draft("Kajian SLF versi coba", preset);
    const lockedChapters = project.chapters.splice(trialChapterCount);
    trial = { workspace: { projects: [project], current: project.id }, lockedChapters, checklist: { identity: {}, checks: {} } };
  }
  if (dialog.open) dialog.close();
  workspace = visible ? trial.workspace : slfLocalWorkspace();
  slfChecklistItem = "";
  active = "cover";
  if (visible) ensureReportReferences(current());
  render();
  $("slf-public").hidden = visible;
  $("slf-workspace").hidden = !visible;
  window.scrollTo(0, 0);
  $(visible ? "page-title" : "start-trial").focus({ preventScroll: true });
}


function heading(text) {
  return { type: "heading", text, body: "" };
}

function draft(name, template) {
  const project = {
    id: crypto.randomUUID(), name, template,
    ...(template === "disiplin" ? { narrativeRevision: architectureInspectionRevision } : {}),
    cover: { title: "Laporan Kajian Teknis Sertifikat Laik Fungsi" },
    front: { ...frontDefaults },
    chapters: reportTemplates[template].chapters.map(([title, ...sections]) => ({
      title, checklist: sections.includes("@checklist"),
      blocks: templateBlocks(sections),
    })),
  };
  initializeHealthMeasurements(project);
  initializeMepSafety(project, true);
  return project;
}

const current = () => workspace.projects.find(({ id }) => id === workspace.current);

async function save(markDirty = true, project = current()) {
  ensureReportReferences(project);
  if (isTrial()) return;
  if (markDirty !== false) slfRememberEdit(project.id);
  const revision = ++saving;
  status.textContent = "Menyimpan…";
  try {
    await storeValue(database, "workspace", slfWorkspaceKey(slfCloudOwner()), workspace);
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

const multipleChoiceLegends = new Map([
  ["metode pemeriksaan yang digunakan", "Pilih satu atau beberapa metode"],
  ["fungsi, variasi kondisi, keterwakilan, atau riwayat gangguan", "Pilih satu atau beberapa kriteria"],
  ["daftar dokumen", "Pilih satu atau beberapa dokumen"],
  ["dokumen rujukan", "Pilih satu atau beberapa dokumen rujukan"],
  ["gambar terbangun atau data lapangan", "Pilih satu atau beberapa data pembanding"],
]);

function narrativeChoiceParts(value, choiceKeys) {
  const known = (part) => choiceKeys.has(tokenName(part));
  return value.trim().split(/\s*,\s*/).filter(Boolean).flatMap((part) => {
    const tail = part.replace(/^dan\s+/i, "");
    if (known(tail)) return [tail];
    for (const match of part.matchAll(/\s+dan\s+/gi)) {
      const left = part.slice(0, match.index);
      const right = part.slice(match.index + match[0].length);
      if (known(left) && known(right)) return [left, right];
    }
    return [part];
  });
}

function narrativeChoiceCheckboxes(legend, choices, changed, choiceDetail) {
  const fieldset = dom("fieldset", { className: "scope-options" }, dom("legend", {}, legend));
  const controls = choices.map((choice) => {
    const control = dom("input", { type: "checkbox" });
    const detail = choiceDetail?.(choice);
    control.addEventListener("change", () => {
      if (detail) detail.hidden = !control.checked;
      changed(choice, control.checked, detail);
    });
    fieldset.append(dom("label", { className: "scope-choice" }, control, choice));
    if (detail) fieldset.append(detail);
    return [tokenName(choice), control, detail];
  });
  const sync = (values) => {
    const selected = new Set(values.map(tokenName));
    for (const [choice, control, detail] of controls) {
      control.checked = selected.has(choice);
      if (detail) detail.hidden = !control.checked;
    }
  };
  return { fieldset, sync };
}

function multipleChoiceField(legend, choices, input, applyValue) {
  const choiceKeys = new Set(choices.map(tokenName));
  const parts = () => narrativeChoiceParts(input.value, choiceKeys);
  const { fieldset, sync } = narrativeChoiceCheckboxes(legend, choices, (choice, checked) => {
    const values = parts().filter((part) => tokenName(part) !== tokenName(choice));
    if (checked) values.push(choice);
    applyValue(values.every((part) => choiceKeys.has(tokenName(part))) ? scopeList.format(values) : values.join(", "));
  });
  input.addEventListener("input", () => sync(parts()));
  sync(parts());
  return fieldset;
}

function documentReviewLinks(project) {
  const label = "Rekap Pemeriksaan Dokumen";
  const links = dom("div", { className: "button-row" });
  project.chapters.forEach((chapter, chapterIndex) => {
    chapter.blocks.forEach((block, blockIndex) => {
      if (!isDocumentReviewTable(block)) return;
      links.append(button("Buka " + label + " · Bab " + roman(chapterIndex + 1), () => {
        active = chapterIndex;
        render();
        if (narrowLayout.matches) $("section-navigation").open = false;
        const target = $("edit-block-" + blockIndex);
        target.tabIndex = -1;
        target.setAttribute("aria-label", label);
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: "start" });
      }));
    });
  });
  if (links.childElementCount) return links;
  const lockedIndex = isTrial() ? trial.lockedChapters.findIndex((chapter) => chapter.blocks.some(isDocumentReviewTable)) : -1;
  if (lockedIndex >= 0) {
    const labelWithChapter = label + " · Bab " + roman(project.chapters.length + lockedIndex + 1);
    return dom("button", { type: "button", className: "upload-locked", disabled: true }, labelWithChapter + " · Perlu login");
  }
  return dom("p", { className: "hint" }, "Tabel " + label + " belum ada pada kajian ini.");
}

function priorNarrativeChoices(project, sources, beforeBlock, tokens, coverKey, coverLabel) {
  const names = new Set([sources.get("cover:" + coverKey)?.value].filter(Boolean));
  const links = dom("div", { className: "button-row" });
  if (coverKey) links.append(button("Buka " + coverLabel + " di Sampul", () => {
    active = "cover";
    render();
    if (narrowLayout.matches) $("section-navigation").open = false;
    focusTextField($("cover-" + coverKey));
  }, "quiet"));
  for (const [chapterIndex, chapter] of project.chapters.entries()) {
    for (const [blockIndex, block] of chapter.blocks.entries()) {
      if (block === beforeBlock) return { names, links };
      const text = block.type === "heading" ? block.body : block.type === "text" ? block.text : "";
      const fields = reportTokens(text ?? "");
      for (const token of tokens) {
        if (!fields.has(token)) continue;
        const link = block.links?.[token];
        const sourceId = link?.source ?? automaticSource(token, sources);
        const selectedSource = !link || link.source ? sources.get(sourceId) : undefined;
        const existingAreas = token === existingAreaToken && !link?.source && Array.isArray(link?.existingAreas) ?
          [...(link.existingAreaChoices ?? []), ...link.existingAreas] : undefined;
        const recorded = (selectedSource?.locations ?? link?.locations ?? existingAreas ??
          [selectedSource?.value ?? link?.value]).map(cleanValue).filter(Boolean);
        for (const name of recorded) names.add(name);
        if (coverKey !== "owner" && token !== sampleLocationToken && !recorded.length) continue;
        const label = token[0].toLocaleUpperCase("id") + token.slice(1);
        links.append(button("Buka " + label + " · Bab " + roman(chapterIndex + 1), () => {
          active = chapterIndex;
          render();
          if (narrowLayout.matches) $("section-navigation").open = false;
          $("edit-block-" + blockIndex)?.querySelector(".guided-narrative")?.openNarrativeField(token);
        }, "quiet"));
      }
    }
  }
  return { names, links };
}

function narrativeEntryList(values, item, changed, minimumRows = 1, addLabel = "Tambah isian") {
  const list = dom("div", { className: "repeated-narrative-list" });
  const appendEntry = button(addLabel, () => {
    values.push("");
    renderRows();
    changed();
    list.lastElementChild.querySelector("input").focus();
  });
  function renderRows() {
    list.replaceChildren(...values.map((value, index) => {
      const label = item + " " + (index + 1);
      const input = field(label, value, (text) => {
        values[index] = text;
        changed();
      });
      const row = dom("div", { className: "repeated-narrative-row" }, input);
      if (values.length > minimumRows) {
        const remove = button("Hapus", () => {
          values.splice(index, 1);
          renderRows();
          changed();
          const next = list.children[Math.min(index, values.length - 1)];
          (next?.querySelector("input") ?? appendEntry).focus();
        }, "quiet");
        remove.setAttribute("aria-label", "Hapus " + label.toLocaleLowerCase("id"));
        row.append(remove);
      }
      return row;
    }));
  }
  renderRows();
  return [list, appendEntry];
}

function repeatedNarrativeField(spec, data, changed, groups = [], suggestedNumbers = {}) {
  const choices = groups.flatMap(([, options]) => options);
  const choiceKeys = new Set(choices.map(tokenName));
  const parts = choices.length ? narrativeChoiceParts(data.value, choiceKeys) : [];
  let selected = data[spec.choiceKey] ?? parts.filter((part) => choiceKeys.has(tokenName(part)));
  const extra = data[spec.key] ? "" : selected.length ? parts.filter((part) => !choiceKeys.has(tokenName(part))).join(", ") : data.value;
  const values = [...(data[spec.key] ?? [])];
  const numbers = { ...data[spec.numberKey] };
  const choiceDetail = spec.numberKey ? (choice) => field("Nomor " + choice, numbers[choice], (value) => {
    numbers[choice] = value;
    commit();
  }) : undefined;
  const minimumRows = spec.minimumRows ?? 1;
  const hasLegacyValue = !data[spec.groupKey] && extra.trim();
  if (!values.length && ((!spec.groupKey && minimumRows) || hasLegacyValue)) values.push(extra);
  const fixedNames = new Set(groups.map(([name]) => name));
  const referenceGroups = (data[spec.groupKey] ?? []).map(({ name, fixed, entries }) =>
    ({ name, fixed: fixed && fixedNames.has(name), entries: [...entries] }));
  const form = spec.legend ? dom("fieldset", { className: "scope-options" }, dom("legend", {}, spec.legend)) : dom("div");
  for (const [legend, options] of groups) {
    const { fieldset, sync } = narrativeChoiceCheckboxes(legend, options, (choice, checked, detail) => {
      selected = selected.filter((part) => tokenName(part) !== tokenName(choice));
      if (checked) {
        selected.push(choice);
        if (detail && !Object.hasOwn(numbers, choice) && suggestedNumbers[choice]) {
          numbers[choice] = suggestedNumbers[choice];
          detail.querySelector("input").value = numbers[choice];
        }
      }
      commit();
    }, choiceDetail);
    sync(selected);
    if (spec.groupKey) {
      let group = referenceGroups.find(({ name, fixed }) => fixed && name === legend);
      if (!group) {
        group = { name: legend, fixed: true, entries: [] };
        referenceGroups.push(group);
      }
      fieldset.append(...narrativeEntryList(group.entries, spec.item, commit, 0));
    }
    form.append(fieldset);
  }
  if (spec.groupKey) {
    if (values.some((entry) => entry.trim())) {
      form.append(dom("fieldset", { className: "scope-options" }, dom("legend", {}, spec.item + " sebelumnya"),
        ...narrativeEntryList(values, spec.item, commit, 0)));
    }
    const customGroups = dom("div");
    const addGroup = button(spec.addGroupLabel, () => {
      const group = { name: "", fixed: false, entries: [""] };
      referenceGroups.push(group);
      appendGroup(group).focus();
      commit();
    });
    for (const group of referenceGroups.filter(({ fixed }) => !fixed)) appendGroup(group);
    form.append(customGroups, addGroup);

    function appendGroup(group) {
      const name = field("Nama jenis acuan", group.name, (text) => {
        group.name = text;
        commit();
      });
      const fieldset = dom("fieldset", { className: "scope-options" },
        dom("legend", {}, "Jenis acuan tambahan"), name,
        ...narrativeEntryList(group.entries, spec.item, commit));
      fieldset.append(button("Hapus jenis acuan", () => {
        referenceGroups.splice(referenceGroups.indexOf(group), 1);
        fieldset.remove();
        addGroup.focus();
        commit();
      }, "quiet"));
      customGroups.append(fieldset);
      return name.querySelector("input");
    }
  } else {
    form.append(...narrativeEntryList(values, spec.item, commit, minimumRows, spec.addLabel));
  }
  function commit() {
    const value = narrativeEntryValue(selected, values, referenceGroups, numbers);
    updateTextFormat(data, "value", data.value, value);
    data[spec.key] = [...values];
    if (spec.choiceKey) data[spec.choiceKey] = [...selected];
    if (spec.numberKey) data[spec.numberKey] = { ...numbers };
    if (spec.groupKey) data[spec.groupKey] = referenceGroups.map(({ name, fixed, entries }) =>
      ({ name, fixed, entries: [...entries] }));
    data.value = value;
    changed();
  }
  return form;
}

const appearanceSectionFields = [
  ["area", "Sisi bangunan", "sisi depan bangunan"],
  ["part", "Bagian yang diperiksa", "kanopi pintu masuk"],
  ["condition", "Kondisi yang terlihat", "terdapat korosi pada ujung kanopi"],
];

function appearanceSectionsEditor(block, changed) {
  const list = dom("div", { className: "appearance-sections" });
  const add = button("＋ Tambah bagian yang diperiksa", () => {
    (block.appearanceSections ??= []).push({});
    renderSections();
    changed();
    list.lastElementChild?.querySelector("input")?.focus();
  });
  function renderSections() {
    list.replaceChildren(...(block.appearanceSections ?? []).map((section, index) => {
      const inputs = appearanceSectionFields.map(([key, label, example]) => {
        const control = field(label, section[key], (value) => {
          section[key] = value;
          changed();
        }, key === "condition" ? "area" : "text");
        control.querySelector("input, textarea").placeholder = "Contoh · " + example;
        return control;
      });
      const remove = button("Hapus bagian", () => {
        if (appearanceSectionFields.some(([key]) => section[key]?.trim()) && !confirm("Hapus bagian beserta catatannya?")) return;
        block.appearanceSections.splice(index, 1);
        renderSections();
        changed();
        (list.children[index]?.querySelector("input") ?? add).focus();
      }, "quiet");
      remove.setAttribute("aria-label", "Hapus bagian " + (index + 2));
      return dom("fieldset", { className: "link-entry" }, dom("legend", {}, "Bagian " + (index + 2)),
        dom("div", { className: "form-grid" }, ...inputs), remove);
    }));
  }
  renderSections();
  return [list, add];
}

const areaObservationFields = ["area", "observation", "reference", "limitation"];
const environmentObservationFields = [...areaObservationFields, "location", "impact", "followUp"];
const environmentObservationExamples = new Map([
  ["ruang terbuka tapak", "Contoh · Area depan berupa perkerasan dan dipakai untuk manuver. Taman berada di sisi timur."],
  ["sirkulasi kendaraan", "Contoh · Kendaraan masuk dan keluar melalui satu gerbang. Truk berputar di halaman depan."],
  ["jalur pedestrian", "Contoh · Jalur dari gerbang ke pintu masuk terpisah dari lintasan truk, kecuali pada titik persilangan di depan pos."],
  ["area parkir", "Contoh · Parkir motor di sisi barat dan parkir mobil di halaman depan. Catat kapasitas atau kondisi saat jam sibuk jika diperiksa."],
  ["drainase dan limpasan", "Contoh · Saluran sisi timur menerima aliran dari halaman. Sebagian mulut saluran tertutup sedimen."],
  ["batas tapak dan akses sekitar", "Contoh · Pagar sisi utara berbatasan dengan jalan umum. Pintu masuk bangunan bersebelahan dengan akses persil tetangga."],
]);
const earlierRoomTokens = [
  sampleLocationToken, existingAreaToken, "nama gedung atau blok", "lantai atau area",
  "nama unit", "unit atau area bangunan", "area sampel",
];

function healthRoomChoices(project, table, sources) {
  const { names } = priorNarrativeChoices(project, sources, table, [...earlierRoomTokens, "lantai atau zona"]);
  for (const location of sources.get("project:sample-locations")?.locations ?? []) names.add(location);
  for (const chapter of project.chapters) {
    for (const block of chapter.blocks) {
      if (block === table) {
        const unique = new Map([...names].map((name) => [tokenName(name), name]));
        return [...unique.values()];
      }
      for (const entry of block.roomLayoutAreas ?? []) {
        const name = cleanValue(entry.area);
        if (entry.selected && name) names.add(name);
      }
      for (const entry of Object.values(block.healthMeasurements ?? {})) {
        const name = cleanValue(entry.location);
        if (name) names.add(name);
      }
    }
  }
  return [...names];
}

function areaObservationEditor(project, block, sources, areaKey, changed) {
  const environment = areaKey === "environmentAreas";
  const areas = block[areaKey] ?? [];
  const prior = environment ? {
    names: choicesForInput("ruang terbuka, sirkulasi, atau parkir"),
    links: dom("div"),
  } : priorNarrativeChoices(project, sources, block, earlierRoomTokens);
  const checklistLocations = environment ? [] : sources.get("project:sample-locations")?.locations ?? [];
  const oldArea = resolveReportLink("", environment ? "ruang terbuka, sirkulasi, atau parkir" : "lantai atau zona", sources, block.links).value;
  const names = new Map();
  for (const name of [...prior.names, ...checklistLocations, oldArea, ...areas.filter((area) => !area.manual).map((area) => area.area)]) {
    const key = tokenName(name ?? "");
    if (key && !names.has(key)) names.set(key, name);
  }
  const list = dom("div", { className: "appearance-sections" });
  const { fieldset, sync } = narrativeChoiceCheckboxes(environment ? "Pilih aspek atau area yang ditelaah" : "Pilih lantai atau area", [...names.values()], (name, checked) => {
    const existing = areas.find((area) => !area.manual && tokenName(area.area ?? "") === tokenName(name));
    if (existing) existing.selected = checked;
    else if (checked) areas.push({ area: name, selected: true });
    renderAreas();
    commit();
  });
  sync(areas.filter((area) => area.selected && !area.manual).map((area) => area.area ?? ""));
  const add = button(environment ? "＋ Tambah aspek atau area" : "＋ Tambah area sendiri", () => {
    areas.push({ selected: true, manual: true });
    renderAreas();
    commit();
    list.lastElementChild?.querySelector("input")?.focus();
  });
  function commit() {
    block[areaKey] = areas;
    changed();
  }
  function renderAreas() {
    list.replaceChildren(...areas.flatMap((entry, index) => {
      if (!entry.selected) return [];
      const input = (key, label, example, type = "text") => {
        const control = field(label, entry[key], (value) => { entry[key] = value; commit(); }, type);
        control.querySelector("input, textarea").placeholder = example;
        return control;
      };
      const evidence = environment ? dom("details", { className: "narrative-source",
        open: Boolean(entry.location || entry.impact || entry.reference || entry.followUp) },
        dom("summary", {}, "Lokasi, dampak, bukti, dan tindak lanjut (opsional)"),
        input("location", "Lokasi yang diperiksa", "Contoh · depan pos satpam"),
        input("impact", "Dampak terhadap pengguna atau area sekitar", "Contoh · Kendaraan yang antre menutup akses masuk di sebelah tapak.", "area"),
        input("reference", "Denah, foto, atau hasil ukur", "Contoh · Denah tapak A-01 atau lebar jalur 1,5 m"),
        input("followUp", "Tindak lanjut yang disarankan", "Contoh · Atur posisi antrean truk agar akses tetangga tetap terbuka.", "area")) :
        dom("details", { className: "narrative-source", open: Boolean(entry.reference || entry.limitation) },
          dom("summary", {}, "Denah dan batasan (opsional)"),
          input("reference", "Denah pembanding", "Contoh · Denah A-02"),
          input("limitation", "Bagian yang belum diperiksa", "Contoh · Ruang panel terkunci"));
      const group = dom("fieldset", { className: "link-entry" },
        dom("legend", {}, entry.manual ? "Area tambahan" : entry.area),
        entry.manual ? (environment ? input("area", "Nama aspek atau area", "Contoh · drainase sisi timur") :
          input("area", "Nama lantai atau area", "Contoh · ruang arsip lantai 2")) : "",
        input("observation", "Apa yang ditemukan?", environment ?
          environmentObservationExamples.get(tokenName(entry.area ?? "")) ?? "Contoh · Catat kondisi, cara area digunakan, dan bagian yang perlu diperhatikan." :
          "Contoh · Ruang arsip sekarang dipakai sebagai ruang staf.", "area"), evidence);
      if (entry.manual) group.append(button("Hapus area", () => {
        const fields = environment ? environmentObservationFields : areaObservationFields;
        if (fields.some((key) => entry[key]?.trim()) && !confirm("Hapus area beserta catatannya?")) return;
        areas.splice(index, 1);
        renderAreas();
        commit();
        add.focus();
      }, "quiet"));
      return [group];
    }));
  }
  if (checklistLocations.length) prior.links.append(button("Buka Daftar Simak", () => {
    active = "checklist";
    slfChecklistItem = "";
    render();
    $("section-title").focus();
  }, "quiet"));
  renderAreas();
  return dom("div", { className: "room-layout-areas" },
    dom("p", { className: "hint" }, environment ?
      "Centang aspek yang diperiksa. Jelaskan kondisi dan cara area digunakan. Buka rincian bila ada dampak, bukti, atau tindak lanjut yang perlu dicatat." :
      "Centang area yang diperiksa. Di setiap area, catat penggunaan ruang atau perubahan yang terlihat. Bandingkan dengan denah jika tersedia."),
    names.size ? fieldset : dom("p", { className: "hint" }, "Belum ada area dari isian sebelumnya. Tambahkan area sendiri di bawah."),
    prior.links.childElementCount ? dom("details", { className: "narrative-source" }, dom("summary", {}, "Buka sumber daftar area"), prior.links) : "",
    list, add);
}

function linkedText(project, data, key, label, getLinks, setLinks, initialSources) {
  const structural = key === "body" && isStructureConclusion(data);
  const summary = dom("summary");
  const content = dom("div", { className: "linked-content" });
  const details = dom("details", { className: "linked-fields" }, summary, content);
  const preview = dom("p", { className: "linked-preview" });
  const extraPreview = dom("div", { className: "additional-narrative-preview", hidden: true });
  const textEditor = dom("details", { className: "narrative-editor", open: !data[key]?.trim() },
    dom("summary", {}, "Ubah teks dan format"),
    dom("p", { className: "hint" }, "Teks dalam tanda kurung siku menjadi isian yang bisa dilengkapi dari panel di atas."),
    boundField(data, key, label, "area", () => {
      if (data[key] !== lastText) { lastText = data[key]; update(); }
      else updatePreview();
      if (structural) refreshLinkedFields(details);
      save();
    }));
  const wrapper = dom("div", { className: "wide guided-narrative" },
    dom("div", { className: "narrative-preview" }, dom("h4", {}, "Tampilan di laporan"), preview, extraPreview), details, textEditor);
  wrapper.openNarrativeField = openField;
  const control = textEditor.querySelector("textarea");
  const recommendationToken = "nomor rekomendasi";
  const recommendationAction = button("", () => {
    if (!reportTokens(control.value).has(recommendationToken)) {
      control.value += (control.value.trim() ? "\n\n" : "") + "Rekomendasi terkait dirujuk pada [nomor rekomendasi].";
      control.dispatchEvent(new Event("input"));
    }
    openField(recommendationToken);
  }, "primary recommendation-action");
  details.before(recommendationAction);
  const insertPurpose = button("Tambahkan isian Tujuan Kajian", () => {
    if (reportTokens(control.value).has("tujuan kajian")) return;
    const separator = control.value.trim() ? "\n\n" : "";
    control.value += separator + "[tujuan kajian]";
    control.dispatchEvent(new Event("input"));
    details.open = true;
    summary.focus();
  }, "quiet");
  textEditor.append(insertPurpose);
  const editPurpose = button("Ubah tujuan di Bagian Awal", () => {
    active = "front";
    render();
    $("purpose-mode").focus();
  }, "quiet");
  const entries = new Map();
  let lastText = data[key];
  let sources = initialSources;
  const followUp = key === "body" && (tokenName(data.text ?? "") === "kesenjangan dan tindak lanjut" ||
    reportTokens(data[key] || "").has("dokumen yang kurang atau perbedaan data"));
  const useGuide = key === "body" && (tokenName(data.text ?? "") === "peruntukan bangunan" ||
    reportTokens(data[key] || "").has("kesesuaian atau perbedaan beserta rujukan bukti"));
  const structureGuide = key === "body" && tokenName(data.text ?? "") === "data sistem struktur";
  const intensityGuide = key === "body" && tokenName(data.text ?? "") === "intensitas bangunan";
  const appearanceGuide = key === "body" && (tokenName(data.text ?? "") === "penampilan bangunan" ||
    data[key] === appearanceNarrative || Array.isArray(data.appearanceSections));
  const roomLayoutGuide = key === "body" && (tokenName(data.text ?? "") === "tata ruang dalam" ||
    Array.isArray(data.roomLayoutAreas));
  const environmentGuide = key === "body" && (tokenName(data.text ?? "") === "keselarasan dengan lingkungan" ||
    Array.isArray(data.environmentAreas));
  const areaKey = environmentGuide ? "environmentAreas" : roomLayoutGuide ? "roomLayoutAreas" : undefined;
  if (areaKey && !data[key]?.trim()) textEditor.open = false;
  const fireProtectionGuide = key === "body" && mepLocationInspection(data) === fireLocationInspection;
  if (fireProtectionGuide) {
    details.open = true;
    const reportPreview = preview.parentElement;
    reportPreview.firstElementChild.remove();
    details.after(dom("details", { className: "narrative-editor" },
      dom("summary", {}, "Lihat tampilan di laporan"), reportPreview));
  }
  const guideFields = fireProtectionGuide ? fireProtectionFields : followUp ? documentFollowUpFields : useGuide ? buildingUseFields :
    intensityGuide ? intensityGuideFields : appearanceGuide ? appearanceFields : structureGuide ? structuralSystemFields : undefined;

  function openField(token) {
    const refresh = !details.open || !entries.has(token) || token === recommendationToken;
    details.open = true;
    if (refresh) update();
    entries.get(token)?.();
  }

  function updatePreview() {
    const text = data[key] || "";
    const links = getLinks();
    const fields = reportTokens(text);
    const hasRecommendation = fields.has(recommendationToken);
    recommendationAction.hidden = !hasRecommendation && !(key === "body" &&
      ["kesimpulan bidang arsitektur", "kesimpulan bidang struktur"].includes(tokenName(data.text ?? "")));
    if (!recommendationAction.hidden) {
      recommendationAction.textContent = hasRecommendation ? "Ambil rekomendasi dari isian" : "Tambahkan rujukan rekomendasi";
      const count = recommendationsFor(sources, structural).size;
      if (count) recommendationAction.textContent += " (" + count + ")";
    }
    const missing = [...fields].filter(([token, name]) => resolveReportLink("[" + name + "]", token, sources, links, structural).value === "[" + name + "]").length;
    summary.textContent = missing ? "Lengkapi isian · " + missing + " belum terisi" :
      fields.size ? "Lihat atau ubah isian · " + fields.size + " terisi" : "Tambahkan isian otomatis";
    if (areaKey) {
      const selected = (data[areaKey] ?? []).filter((area) => area.selected).length;
      const label = environmentGuide ? "Catat per aspek atau area" : "Catat per area";
      summary.textContent = label + (selected ? " · " + selected + " dipilih" : "");
    }
    preview.removeAttribute("style");
    const format = getTextFormat(data, key);
    styleTextBlock(preview, format);
    preview.replaceChildren(text.trim() ? formattedText(text, format, (original, name) => {
      const resolved = resolveReportLink(original, name, sources, links, structural);
      if (resolved.value !== original) return resolved;
      const token = tokenName(name);
      const link = Object.hasOwn(links, token) ? links[token] : undefined;
      const fromChecklist = token === "tanggal pemeriksaan" && (!link || link.source === "identity:date");
      const caption = fromChecklist ? "Isi tanggal pemeriksaan di Daftar Simak" :
        repeatedNarrativeFields.get(token)?.previewLabel ??
        guideFields?.get(token)?.[1] ?? "Isi " + name.trim();
      return { value: caption, node: button(caption, fromChecklist ? openChecklistDate : () => openField(token), "narrative-placeholder") };
    }) : "Belum ada teks. Pilih Ubah teks dan format untuk mulai menulis.");
    if (appearanceGuide || areaKey) {
      extraPreview.replaceChildren(...(environmentGuide ? environmentObservationParagraphs(data.environmentAreas) :
        areaKey ? areaObservationParagraphs(data[areaKey], "Denah") :
        appearanceSectionParagraphs(data)));
      extraPreview.hidden = !extraPreview.childElementCount;
    }
    if (areaKey && !text.trim()) {
      preview.textContent = "Catatan muncul di sini setelah area dan hasil pemeriksaannya diisi.";
      preview.hidden = !extraPreview.hidden;
    } else {
      preview.hidden = false;
    }
  }

  function update(nextSources = reportSources(project)) {
    sources = nextSources;
    updatePreview();
    const fields = reportTokens(data[key] || "");
    details.hidden = !fields.size && !appearanceGuide && !areaKey;
    insertPurpose.hidden = fields.has("tujuan kajian") || (key === "body" && inspectionIntroductions.has(data[key]));
    if (!details.open) return;
    entries.clear();
    if (!fields.size && !appearanceGuide && !areaKey) {
      content.replaceChildren();
      return;
    }
    const groups = new Map();
    for (const [id, source] of sources) {
      if (id.startsWith("finding:")) continue;
      if (!groups.has(source.group)) groups.set(source.group, []);
      groups.get(source.group).push([id, source.label]);
    }
    const grid = dom("div", { className: "form-grid narrative-fields" });
    const intensityDetails = intensityGuide ? dom("div", { className: "form-grid narrative-fields" }) : undefined;
    const useSteps = useGuide ? [
      ["Menurut dokumen", "Catat dokumen yang dipakai dan fungsi yang tertulis di dalamnya."],
      ["Di lapangan", "Catat bagian yang diperiksa dan penggunaannya saat ini."],
      ["Hasil perbandingan", "Tulis sesuai, berbeda, atau belum bisa dipastikan. Sertakan foto, denah, atau dokumen yang mendukung."],
    ].map(([title, tip]) => ({
      title, tip, fields: dom("div", { className: "form-grid narrative-fields" }),
    })) : [];
    const methodHeading = key === "body" ? tokenName(data.text ?? "") : "";
    const structuralTests = methodHeading === "hasil pengujian dan analisis";
    const methods = {
      structure: structureGuide,
      health: fields.has(healthParameterToken) || (methodHeading === "kesehatan" && fields.has(healthReferenceToken)),
      comfort: fields.has(comfortReferenceToken) || (methodHeading === "kenyamanan" && fields.has(parameterReferenceToken)),
      comfortAssessment: methodHeading === "kenyamanan" && fields.has("hasil terverifikasi"),
      ease: fields.has(easeParameterToken) || (methodHeading === "kemudahan" && fields.has(easeReferenceToken)),
    };
    for (const [token, name] of fields) {
      const guideField = guideFields?.get(token);
      const showDocumentChoices = useGuide && token === "dokumen rujukan";
      const links = getLinks();
      const saved = Object.hasOwn(links, token) ? links[token] : undefined;
      const auto = automaticSource(token, sources);
      const safetyParameters = token === parameterReferenceToken &&
        (fields.has(safetyReferenceToken) || (key === "body" && tokenName(data.text ?? "") === "keselamatan"));
      const comfortParameters = token === parameterReferenceToken && methods.comfort && !safetyParameters;
      const spec = repeatedNarrativeFields.get(token);
      const otherParameters = token === parameterReferenceToken && !safetyParameters && !comfortParameters;
      const repeated = otherParameters || (spec?.method && !methods[spec.method]) ? undefined : spec;
      const roomField = repeated && (token === healthRoomToken || token === comfortRoomToken || token === existingAreaToken);
      const ownerDocuments = token === ownerDocumentsToken;
      const permitDocuments = token === permitDocumentsToken;
      const sampleLocation = token === sampleLocationToken;
      const technicalDocuments = token === technicalDocumentsToken;
      const fieldTitle = guideField?.[0] ?? repeated?.label ?? name[0].toLocaleUpperCase("id") + name.slice(1);
      const manualOnly = token === "daftar alat pemeriksaan" || (structural && token === recommendationToken);
      const select = dom("select", { ariaLabel: repeated?.label ?? "[" + name + "]" });
      const combined = token === "nama dan alamat bangunan";
      const autoLabel = auto ? "Otomatis · " + sources.get(auto).label :
        "Otomatis · Nama dan alamat bangunan";
      if (auto || combined) select.append(new Option(autoLabel, sampleLocation ? auto : ""));
      const directorId = "project:consultant-director";
      if (token === "nama penanggung jawab" && sources.has(directorId)) select.append(new Option("Direktur Badan Usaha Pengkaji", directorId));
      select.append(new Option("Isi manual", "manual"));
      const ownSource = narrativeReference(data.sourceId ?? key, token);
      for (const [group, entries] of groups) {
        const available = entries.filter(([id]) => id !== ownSource &&
          (!sampleLocation || id !== auto) && (token !== "nama penanggung jawab" || id !== directorId));
        if (available.length) select.append(dom("optgroup", { label: group }, ...available.map(([id, label]) => new Option(label, id))));
      }
      if (saved?.source && !sources.has(saved.source)) select.append(new Option("Sumber tidak tersedia", saved.source));
      const defaultSource = sampleLocation || permitDocuments ?
        (automaticValue(token, sources) ? (sampleLocation ? auto : "") : "manual") : "";
      select.value = manualOnly ? "manual" : saved?.source ?? (saved || (!auto && !combined) ? "manual" : defaultSource);
      const value = dom("p", { className: "narrative-source-value" });
      const badge = dom("span", { className: "narrative-state" });
      const useManual = button(permitDocuments ? "Pilih beberapa dokumen" : "Isi sendiri", () => {
        select.value = "manual";
        select.dispatchEvent(new Event("change"));
        focusManual();
      }, "quiet");
      const simpleChoices = safetyParameters || comfortParameters || repeated?.method;
      const example = simpleChoices || repeated?.label || guideField || token === "nomor rekomendasi" ? "" : inputExample(token);
      const hint = simpleChoices || !Object.hasOwn(inputHints, token) ? "" : inputHints[token];
      const previousValue = manualOnly || permitDocuments ? resolveReportLink("", token, sources, links).value : "";
      const manualData = { value: saved?.value ?? previousValue, _format: saved?._format };
      if (repeated && Array.isArray(saved?.[repeated.key])) manualData[repeated.key] = saved[repeated.key];
      if (repeated?.choiceKey && Array.isArray(saved?.[repeated.choiceKey])) manualData[repeated.choiceKey] = saved[repeated.choiceKey];
      if (repeated?.numberKey && saved?.[repeated.numberKey]) manualData[repeated.numberKey] = saved[repeated.numberKey];
      const permitSource = permitDocuments ? sources.get("project:reviewed-permit") : undefined;
      if (permitSource?.reviewedNumbers && (saved?.source ?? (!saved ? auto : "")) === "project:reviewed-permit") {
        manualData[repeated.key] = [];
        manualData[repeated.choiceKey] = ["IMB/PBG"];
        manualData[repeated.numberKey] = { "IMB/PBG": permitSource.reviewedNumbers };
        manualData.value = narrativeEntryValue(manualData[repeated.choiceKey], [], [], manualData[repeated.numberKey]);
      }
      if (repeated?.groupKey && Array.isArray(saved?.[repeated.groupKey])) manualData[repeated.groupKey] = saved[repeated.groupKey];
      if (safetyParameters && !manualData.parameterStandardChoices && Array.isArray(saved?.parameterChoices)) {
        manualData.parameters = [...saved.parameterChoices, ...(saved.parameters ?? []), ...narrativeGroupEntries(saved.parameterGroups ?? [])]
          .filter((entry) => entry.trim());
        manualData.parameterStandardChoices = [];
      }
      const saveManual = () => {
        setLinks({ ...getLinks(), [token]: manualData });
        if (sources.has(ownSource)) {
          sources.get(ownSource).value = cleanValue(manualData.value);
          sources.get(ownSource).format = getTextFormat(manualData, "value");
        }
        updateValue();
        updatePreview();
        refreshLinkedFields(details);
        save();
      };
      const fireSystem = fireProtectionGuide && token === fireProtectionSystemToken;
      const fireResult = fireProtectionGuide && token === fireProtectionResultToken;
      const choiceLegend = fireSystem ? "Centang sarana yang diperiksa" : multipleChoiceLegends.get(token);
      const manualLabel = token === "nomor rekomendasi" ? "Rujukan manual" : choiceLegend && token !== "metode pemeriksaan yang digunakan" ?
        "Isian sendiri atau sesuaikan pilihan" : "Isi " + name;
      const presetGroups = comfortParameters ? comfortParameterGroups :
        repeated?.method === "comfortAssessment" ? comfortAspectGroups : inputChoiceGroups.get(token);
      const choicesLegend = repeated?.method === "structure" ? "Centang satu atau lebih pilihan" :
        token === comfortRoomToken ? "Pilihan fungsi ruang" :
        token === existingAreaToken ? "Pilihan area atau unit" :
          roomField ? "Pilihan ruang atau sistem" : "Pilih satu atau beberapa jenis acuan";
      const presets = structuralTests && token === "metode atau status pengujian" ?
        choicesForInput(token).filter((option) => option !== "observasi visual") : choicesForInput(token);
      const groupsForChoices = repeated?.choiceKey ? [...(presetGroups ?? (ownerDocuments ? [] : [[choicesLegend, presets]]))] : [];
      const roomTokens = token === existingAreaToken ?
        [sampleLocationToken, "nama gedung atau blok", "lantai atau area", "nama unit"] : [sampleLocationToken];
      const priorChoices = ownerDocuments ?
        priorNarrativeChoices(project, sources, data, ["nama pemilik/pengelola", "dokumen"], "owner", "Pemilik / pemberi tugas") :
        roomField ? priorNarrativeChoices(project, sources, data, roomTokens, "building", "Nama bangunan") : undefined;
      const fromOtherFields = priorChoices?.names ?? (technicalDocuments ? sources.get("project:reviewed-documents")?.documents ?? [] : undefined);
      if (fromOtherFields) {
        const used = new Set(groupsForChoices.flatMap(([, options]) => options.map(tokenName)));
        const names = [...fromOtherFields, ...(manualData[repeated.choiceKey] ?? [])].filter((name) => {
          const key = tokenName(name);
          if (used.has(key)) return false;
          used.add(key);
          return true;
        });
        if (names.length) groupsForChoices.unshift([technicalDocuments ? "Dokumen dari rekap" : "Dari isian sebelumnya", names]);
      }
      const suggestedNumbers = permitDocuments ? recordedPermitNumbers(project, data, sources) : undefined;
      const manual = repeated ? repeatedNarrativeField(repeated, manualData, saveManual, groupsForChoices, suggestedNumbers) :
        field((fireSystem ? "Sarana terpilih atau tambahan lain" : guideField?.[1]) ?? manualLabel, manualData.value, (input) => { manualData.value = input; saveManual(); },
        token === "tanggal pemeriksaan" ? "date" : fireResult ? "area" : "text", manualData, "value", saveManual);
      const manualInput = manual.querySelector("input, textarea");
      const focusManual = () => {
        const input = manual.querySelector("input, textarea");
        if (input) focusTextField(input);
        else manual.querySelector("button")?.focus();
      };
      const showChoices = !guideField || showDocumentChoices || fireSystem;
      const choices = repeated || token === "nomor rekomendasi" || token === "tanggal pemeriksaan" || !showChoices ? [] : presets;
      const applyChoiceValue = (text) => {
        select.value = "manual";
        manualInput.value = text;
        updateValue();
        manualInput.dispatchEvent(new Event("input"));
      };
      const isExample = !Object.hasOwn(inputChoices, token);
      let choiceField;
      if (choiceLegend && choices.length) {
        choiceField = multipleChoiceField(choiceLegend, choices, manualInput, applyChoiceValue);
        if (showDocumentChoices) choiceField = dom("details", { className: "narrative-source" },
          dom("summary", {}, "Pilih jenis dokumen"), choiceField);
      } else if (choices.length) {
        const pick = dom("select", { ariaLabel: "Pilihan isian " + name },
          new Option(isExample ? "Pilih contoh untuk diedit" : "Pilih isian", ""), ...choices.map((option) => new Option(option, option)));
        choiceField = dom("label", {}, "Pilihan isian", pick);
        pick.addEventListener("change", () => {
          if (!pick.value) return;
          const previousValue = manualInput.value.trim();
          const replace = token === "hasil verifikasi" || token === "jenis uji, metode, dan acuan atau keterangan tidak dilakukan";
          const next = replace || isExample || !previousValue ? pick.value :
            previousValue.split(", ").includes(pick.value) ? previousValue : previousValue + ", " + pick.value;
          pick.value = "";
          applyChoiceValue(next);
          focusTextField(manualInput);
        });
      }
      const scope = auto === "project:scope" ? scopeField(project, () => {
        sources.get("project:scope").value = scopeValue(project.scope);
        updateValue();
        updatePreview();
        refreshLinkedFields(details);
        save();
      }) : null;
      const sourceSummary = dom("summary");
      const openDate = token === "tanggal pemeriksaan" ?
        button("Buka Tanggal Pemeriksaan di Daftar Simak", openChecklistDate) : null;
      const updateValue = () => {
        const self = select.value === "manual";
        const linkedValue = select.value ? sources.get(select.value)?.value : automaticValue(token, sources);
        const filled = Boolean(self ? manualData.value.trim() : linkedValue);
        badge.textContent = filled ? "Terisi" : "Belum terisi";
        badge.dataset.filled = String(filled);
        sourceSummary.textContent = self ? "Ambil dari isian sebelumnya" :
          "Sumber: " + (select.selectedOptions[0]?.label || "Otomatis");
        manual.hidden = !self;
        value.hidden = self;
        useManual.hidden = self || (Boolean(linkedValue) && !choiceLegend && !repeated);
        if (openDate) openDate.hidden = self || (select.value || auto) !== "identity:date";
        if (choiceField) choiceField.hidden = !self && (Boolean(select.value) || Boolean(automaticValue(token, sources)));
        if (scope) scope.hidden = Boolean(select.value && select.value !== "project:scope");
        value.textContent = linkedValue || "Data dari sumber ini belum terisi.";
      };
      select.addEventListener("change", () => {
        const links = { ...getLinks() };
        if (select.value === "manual") links[token] = manualData;
        else if (select.value) links[token] = { source: select.value };
        else delete links[token];
        setLinks(links);
        updateValue();
        updatePreview();
        refreshLinkedFields(details);
        save();
      });
      updateValue();
      const source = dom("details", { className: "narrative-source" },
        sourceSummary, dom("label", {}, repeated?.label ? "Pilih sumber data" : "Ambil data untuk " + name, select));
      const entry = dom("div", { className: "link-entry" }, dom("div", { className: "narrative-field-head" },
        dom("strong", {}, fieldTitle), badge));
      if (hint) entry.append(dom("p", { className: "hint" }, hint));
      if (token === "daftar dokumen" || technicalDocuments) entry.append(documentReviewLinks(project));
      if (openDate) entry.append(openDate);
      if (scope) entry.append(scope);
      if (choiceField && !showDocumentChoices) entry.append(choiceField);
      if (priorChoices) entry.append(priorChoices.links);
      entry.append(manual);
      if (guideField?.[2]) entry.append(dom("p", { className: "hint" }, "Contoh jawaban · " + guideField[2]));
      if (choiceField && showDocumentChoices) entry.append(choiceField);
      if (!manualOnly) entry.append(value, useManual, source);
      if (example) entry.append(dom("details", { className: "narrative-example" }, dom("summary", {}, "Lihat contoh isian"),
        dom("p", { className: "field-example" }, example)));
      let recommendationPicker;
      if (token === "nomor rekomendasi") {
        const controls = dom("div", { className: "recommendation-manual" });
        while (entry.children.length > 1) controls.append(entry.children[1]);
        const recommendations = recommendationsFor(sources, structural);
        const previousIds = saved?.recommendationIds ?? [];
        const selected = new Set(structural ? previousIds.filter((id) => recommendations.has(id)) : previousIds);
        const choices = dom("div", { className: "recommendation-list" });
        const pickerTitle = dom("summary");
        const available = new Map();
        const selectAll = button("Pilih semua", () => {
          for (const [id, check] of available) {
            selected.add(id);
            check.checked = true;
          }
          saveSelection();
        });
        const actions = dom("div", { className: "button-row recommendation-actions" }, selectAll);
        recommendationPicker = dom("details", { className: "recommendation-picker" }, pickerTitle, actions, choices);
        const sync = () => {
          actions.hidden = !available.size;
          selectAll.disabled = [...available.keys()].every((id) => selected.has(id));
          controls.hidden = selected.size > 0;
          pickerTitle.textContent = selected.size ? "Rekomendasi dari isian · " + selected.size + " dipilih" : "Pilih rekomendasi dari isian kajian";
          if (!selected.size) return updateValue();
          const missing = [...selected].filter((id) => !recommendations.has(id)).length;
          badge.dataset.filled = String(!missing);
          badge.textContent = missing ? missing + " sumber perlu ditinjau" : "Tertaut";
        };
        function saveSelection() {
          const link = { ...(getLinks()[token] ?? { value: "" }) };
          if (selected.size) link.recommendationIds = [...selected];
          else delete link.recommendationIds;
          setLinks({ ...getLinks(), [token]: link });
          sync();
          updatePreview();
          refreshLinkedFields(details);
          save();
        }
        for (const id of new Set([...recommendations.keys(), ...selected])) {
          const source = recommendations.get(id);
          const check = dom("input", { type: "checkbox", checked: selected.has(id) });
          if (source) available.set(id, check);
          choices.append(dom("label", { className: "scope-choice" }, check, dom("span", {},
            dom("strong", {}, source?.label || "Sumber dihapus atau dikosongkan"),
            dom("span", {}, source?.action || "Lepaskan pilihan ini atau isi rujukan secara manual."))));
          check.addEventListener("change", () => {
            if (check.checked) selected.add(id);
            else selected.delete(id);
            saveSelection();
          });
        }
        if (!choices.childElementCount) choices.append(dom("p", { className: "hint" },
          structural ? "Belum ada catatan struktur yang bisa diambil. Isi analisis di 6.2, penilaian hasil uji di 6.3, atau tulis rujukan manual." :
            "Belum ada rekomendasi yang terisi. Catat tindak lanjut per area atau isi rekomendasi pada tabel pemeriksaan atau matriks rekomendasi."));
        entry.classList.add("wide");
        entry.firstElementChild.querySelector("strong").textContent = "Rujukan rekomendasi";
        entry.append(recommendationPicker, controls);
        sync();
      }
      entries.set(token, () => {
        const extra = entry.closest(".intensity-narrative-details, .room-layout-legacy");
        if (extra) extra.open = true;
        entry.scrollIntoView({ block: "nearest" });
        if (recommendationPicker) {
          recommendationPicker.open = true;
          recommendationPicker.querySelector("summary").focus();
        } else if (!manual.hidden) focusManual();
        else if (!useManual.hidden) useManual.focus();
        else source.querySelector("summary").focus();
      });
      const isIntensityDetail = intensityGuide && guideField && token !== intensityFinding;
      if ((appearanceGuide && token === "hasil observasi") || fireResult) entry.classList.add("wide");
      (isIntensityDetail ? intensityDetails : useSteps[guideField?.[3]]?.fields ?? grid).append(entry);
    }
    if (followUp) {
      const instructions = dom("div", { className: "link-entry" },
        dom("p", {}, "Lihat rekap pemeriksaan. Jika ada dokumen yang belum lengkap atau datanya berbeda, jawab pertanyaan di bawah."),
        dom("p", { className: "hint" }, "Jika tidak ada temuan, buka Ubah teks dan format lalu ganti narasi dengan kalimat “Tidak ditemukan kekurangan atau perbedaan pada dokumen yang ditelaah.”"),
        documentReviewLinks(project));
      content.replaceChildren(instructions, grid, ...(fields.has("tujuan kajian") ? [editPurpose] : []));
    } else if (fireProtectionGuide) {
      content.replaceChildren(dom("p", { className: "hint" },
        "Pilih sarana yang diperiksa, tulis lokasinya, lalu catat hasil dan buktinya. Untuk fungsi yang belum diuji, tulis “belum diuji” pada hasil pemeriksaan."), grid);
    } else if (structureGuide) {
      content.replaceChildren(dom("p", { className: "hint" },
        "Centang pilihan yang sesuai atau gunakan Tambah isian sendiri untuk menulis jawaban, nomor dokumen, atau lokasi. Catat bagian yang belum bisa dipastikan pada isian terakhir."),
        grid, ...(fields.has("tujuan kajian") ? [editPurpose] : []));
    } else if (intensityGuide) {
      const lookUp = button("Lihat tabel perbandingan", () => {
        const table = $("intensity-analysis");
        if (!table) return;
        table.open = true;
        table.querySelector("summary").focus({ preventScroll: true });
        table.scrollIntoView({ block: "start" });
      }, "quiet");
      const instructions = dom("div", { className: "link-entry" },
        dom("p", {}, "Data ukur dan batas acuan sudah ditampilkan di tabel perbandingan. Catat hasil penting, data yang masih kurang, atau bagian yang perlu dicek ulang."),
        dom("div", { className: "button-row" }, lookUp,
          button("Ubah data ukur dan acuan", openIntensityEditor, "quiet")));
      const extra = intensityDetails.childElementCount ? [
        dom("details", { className: "narrative-source intensity-narrative-details" },
          dom("summary", {}, "Rincian yang sudah pernah dicatat"), intensityDetails),
      ] : [];
      if (grid.childElementCount === 1) grid.firstElementChild.classList.add("wide");
      content.replaceChildren(instructions, grid, ...extra, ...(fields.has("tujuan kajian") ? [editPurpose] : []));
    } else if (areaKey) {
      const areas = areaObservationEditor(project, data, sources, areaKey, () => {
        updatePreview();
        save();
        if (environmentGuide) refreshLinkedFields(details);
      });
      content.replaceChildren(areas, ...(grid.childElementCount ? [dom("details", { className: "narrative-source room-layout-legacy" },
        dom("summary", {}, "Isian narasi yang sudah ada"), grid)] : []));
    } else if (appearanceGuide) {
      const instructions = dom("p", { className: "hint" },
        "Isi satu catatan untuk tiap bagian. Nama foto bisa ditulis di Keterangan foto setelah diunggah. Nomor gambar muncul otomatis di laporan.");
      const first = grid.childElementCount ? [dom("section", { className: "narrative-step" },
        dom("h4", {}, "Bagian 1"), grid)] : [];
      const additional = appearanceSectionsEditor(data, () => { updatePreview(); save(); });
      content.replaceChildren(instructions, ...first, ...additional,
        ...(fields.has("tujuan kajian") ? [editPurpose] : []));
    } else if (useGuide) {
      const sections = useSteps.flatMap(({ title, tip, fields }, index) => {
        if (!fields.childElementCount) return [];
        if (fields.childElementCount === 1) fields.firstElementChild.classList.add("wide");
        return [dom("section", { className: "narrative-step" },
          dom("h4", {}, (index + 1) + ". " + title), dom("p", { className: "hint" }, tip), fields)];
      });
      content.replaceChildren(...sections, ...(grid.childElementCount ? [grid] : []),
        ...(fields.has("tujuan kajian") ? [editPurpose] : []));
    } else {
      content.replaceChildren(grid, ...(fields.has("tujuan kajian") ? [editPurpose] : []));
    }
  }

  details.addEventListener("toggle", () => {
    if (details.open && !content.firstChild) update();
    if (!details.open) {
      content.replaceChildren();
      entries.clear();
    }
  });
  details.refreshSources = update;
  update(initialSources);
  return wrapper;
}

function refreshLinkedFields(except) {
  const narratives = [...editor.querySelectorAll(".linked-fields, .structure-conclusion-preview")];
  const tableFields = [...editor.querySelectorAll(".table-link[data-linked], .table-link[data-automatic]")];
  const leadFields = [...editor.querySelectorAll(".team-lead")];
  const measurementFields = [...editor.querySelectorAll(".health-source-field")];
  if (narratives.length || tableFields.length || leadFields.length || measurementFields.length) {
    const sources = reportSources(current());
    for (const details of narratives) if (details !== except) details.refreshSources(sources);
    for (const details of tableFields) details.refreshValue(sources);
    for (const control of leadFields) control.refreshMembers(sources);
    for (const control of measurementFields) control.refreshValue(sources);
  }
}

function purposeField(project) {
  const select = dom("select", { id: "purpose-mode", ariaLabel: "Tujuan kajian" });
  select.append(new Option("Pilih tujuan kajian", ""),
    ...purposeOptions.map(([id, label]) => new Option(label, id)),
    new Option("Isi manual", "manual"));
  select.value = project.purpose?.mode ?? "";
  const data = project.purpose ?? {};
  const manual = field("Uraian tujuan kajian", data.custom,
    (value) => update({ custom: value, _format: data._format }), "area", data, "custom",
    () => update({ _format: data._format }));
  const input = manual.querySelector("textarea");
  input.placeholder = "Contoh: menilai kelaikan fungsi bangunan setelah renovasi ruang pelayanan.";
  const chosen = dom("p", { className: "linked-preview field-example" });

  function reflect() {
    manual.hidden = select.value !== "manual";
    const presetPurpose = select.value === "manual" ? "" : projectPurposeValue({ mode: select.value }) || "";
    chosen.hidden = !presetPurpose;
    chosen.textContent = presetPurpose;
  }

  function update(changes) {
    project.purpose = { ...project.purpose, ...changes };
    refreshLinkedFields();
    save();
  }

  select.addEventListener("change", () => {
    update({ mode: select.value });
    reflect();
    if (select.value === "manual") focusTextField(input);
  });
  reflect();
  return dom("fieldset", { className: "purpose-field" },
    dom("legend", {}, "Tujuan Kajian"),
    dom("p", { className: "hint" }, "Isi sekali di sini. Gunakan Isian tertaut pada bab atau subbab untuk mengambil tujuan ini."),
    dom("label", {}, "Tujuan kajian", select), chosen, manual);
}

function setCurrent(id, dirty = false) {
  const fromDashboard = !$("slf-dashboard").hidden;
  workspace.current = id;
  active = "cover";
  const url = new URL(location.href);
  url.searchParams.set("proyek", id);
  url.searchParams.delete("bagian");
  url.searchParams.delete("butir");
  url.hash = "";
  history.replaceState(null, "", url);
  save(dirty);
  render();
  if (slfAccount) slfDashboardView(false, fromDashboard);
  slfUpdateAccountControls();
}

function outlineEntry(label, id, marker) {
  const control = button("", () => {
    active = id;
    render();
    if (narrowLayout.matches) {
      $("section-navigation").open = false;
      $("section-title").focus({ preventScroll: true });
      document.querySelector(".workspace").scrollIntoView({ block: "start" });
    }
  }, "outline-entry");
  control.append(dom("span", { className: "nav-marker", ariaHidden: "true" }, marker), dom("span", {}, label));
  if (active === id) control.setAttribute("aria-current", "page");
  return control;
}

function renderOutline() {
  const project = current();
  const nav = $("outline");
  const trying = isTrial();
  nav.replaceChildren(outlineEntry("Sampul", "cover", ""), outlineEntry(trying ? "Pendahuluan" : "Bagian awal & daftar isi", "front", ""),
    outlineEntry("Intensitas dan tata ruang", "intensity", ""), outlineEntry("Peta tautan dan acuan", "links", ""));
  for (const [index, chapter] of project.chapters.entries()) {
    const entry = outlineEntry(chapter.title.trim() || "Bab tanpa judul", index, roman(index + 1));
    entry.setAttribute("aria-label", chapterLabel(project, index));
    nav.append(entry);
  }
  if (trying) {
    for (const [index, chapter] of trial.lockedChapters.entries()) {
      const marker = roman(project.chapters.length + index + 1);
      const name = "Bab " + marker + " · " + chapter.title;
      nav.append(dom("button", { type: "button", className: "outline-entry trial-locked", disabled: true, ariaLabel: name + " · Perlu login" },
        dom("span", { className: "nav-marker", ariaHidden: "true" }, marker),
        dom("span", {}, chapter.title, dom("small", {}, "Perlu login"))));
    }
  }
  if (trying || !project.chapters.some((chapter) => chapter.checklist)) {
    nav.append(outlineEntry(trying ? "Daftar simak (25% dapat diisi)" : "Daftar simak", "checklist", ""));
  }
}

function render() {
  const project = current();
  initializeMepSafety(project);
  const trying = isTrial();
  $("page-title").textContent = trying ? "Coba buat kajian" : "Editor kajian";
  for (const id of ["trial-controls", "trial-notice", "trial-locked-tools"]) $(id).hidden = !trying;
  for (const id of ["workspace-standalone", "cloud-controls", "projects-label", "project-picker", "workspace-side-actions"]) {
    $(id).hidden = trying || (id === "cloud-controls" && !slfCloud);
  }
  $("backup-file").disabled = trying;
  if (trying) status.textContent = "";
  $("projects").replaceChildren(...slfProjectOptions());
  $("projects").value = project.id;
  $("template-label").textContent = trying ? "Kajian per disiplin · versi coba" : reportTemplates[project.template].label;
  renderOutline();
  $("mobile-section-name").textContent = $("outline").querySelector("[aria-current=page]")?.lastElementChild.textContent ?? "Daftar simak";
  photoEditors.clear();
  editor.replaceChildren();
  if (active === "cover") return renderCover(project);
  if (active === "front") return renderFront(project);
  if (active === "intensity") return renderIntensity(project);
  if (active === "links") return renderChecklistMap(project);
  if (active === "checklist") return renderChecklistEditor(project);
  renderChapter(project);
}

function editorTable(columns, rows) {
  const table = reportTable(columns, rows);
  table.classList.add("editor-table");
  table.setAttribute("role", "table");
  for (const [rowIndex, row] of [...table.rows].entries()) {
    row.setAttribute("role", "row");
    for (const [columnIndex, cell] of [...row.cells].entries()) {
      cell.setAttribute("role", rowIndex === 0 ? "columnheader" : "cell");
      if (rowIndex === 0) continue;
      const value = dom("div", { className: "editor-cell-value" }, ...cell.childNodes);
      const label = dom("span", { className: "mobile-cell-label", ariaHidden: "true" }, columns[columnIndex]);
      cell.replaceChildren(label, value);
    }
  }
  return table;
}

function intensityTable({ data, land, metrics, note }, forEditor = false) {
  const makeTable = forEditor ? editorTable : reportTable;
  const panel = dom("div", { className: "intensity-results" });
  const local = data.local;
  const site = data.region === "manual" ? [
    [local.municipality, local.province].map((v) => v.trim()).filter(Boolean).join(", "),
    local.zone, local.road, local.use,
  ] : data.region === "tegal" ? [
    "Kabupaten Tegal", intensityOptions(intensityZones, data.zone), intensityOptions(intensityRoads, data.road),
    intensityOptions(intensityFunctions, data.use),
  ] : [];
  const context = site.map((value) => value.trim()).filter(Boolean).join(" · ");
  if (context) panel.append(dom("p", {}, context));
  panel.append(dom("p", {}, "Luas persil: " + intensityValue(land.value, " m²")));
  panel.append(makeTable(["Parameter", "Data ukur", "Hasil", "Batas acuan", "Perbandingan"], metrics.map((metric) => {
    const suffix = intensityUnit(metric);
    const label = metric.areaLabel + " · " + intensityValue(metric.measurement.value, metric.direct || metric.unit === "lantai" ? suffix : " m²");
    const bounds = metric.limit == null ? "" : (metric.side === "Min" ? "Min. " : "Maks. ") + intensityValue(metric.limit, suffix);
    const limit = bounds && data.region === "tegal" && metric.page ? dom("a", {
      href: perbupTegalUrl + "#page=" + metric.page, target: "_blank", rel: "noopener",
    }, bounds) : bounds || "—";
    const standard = metric.source ? dom("div", {}, limit, dom("div", { className: "hint" }, metric.source)) : limit;
    return [metric.name, label,
      intensityValue(metric.value, suffix), standard, metric.status];
  })));
  if (note) panel.append(dom("p", {}, note));
  if (data.region === "manual" && local.source.trim()) {
    const citation = [local.source, local.reference].map((value) => value.trim()).filter(Boolean).join(" · ");
    const url = intensitySourceUrl(local.sourceUrl);
    panel.append(dom("p", {}, "Sumber acuan: ", url ? dom("a", { href: url, target: "_blank", rel: "noopener" }, citation) : citation));
  }
  if (data.region === "tegal") {
    panel.append(dom("p", {}, intensityReviewNote),
      dom("p", {}, dom("a", { href: perbupTegalUrl, target: "_blank", rel: "noopener" }, "Perbup Tegal No. 12 Tahun 2026, Lampiran intensitas dan tata bangunan"),
        " · ", dom("a", { href: rtrwTegalUrl, target: "_blank", rel: "noopener" }, "RTRW Kabupaten Tegal 2023–2043")));
  }
  return panel;
}

function additionalIntensityFields(data, changed) {
  const list = dom("div", { className: "intensity-criteria", id: "additional-parameters" });
  function renderRows() {
    list.replaceChildren(...data.additional.map((parameter, index) => {
      const field = (key, name, hint, mode) => {
        const label = boundField(parameter, key, name, "text", changed, false);
        Object.assign(label.querySelector("input"), { placeholder: hint, inputMode: mode || "text" });
        return label;
      };
      const side = dom("select", { ariaLabel: "Jenis batas parameter " + (index + 1) },
        new Option("Minimum", "Min"), new Option("Maksimum", "Max"));
      side.value = parameter.side;
      side.addEventListener("change", () => { parameter.side = side.value; changed(); });
      const remove = button("Hapus parameter " + (index + 1), () => {
        data.additional.splice(index, 1);
        renderRows();
        changed();
      }, "quiet");
      return dom("fieldset", { className: "block" }, dom("legend", {}, "Parameter tambahan " + (index + 1)),
        dom("div", { className: "form-grid" },
          field("name", "Nama parameter", "Contoh: Lebar akses"), field("unit", "Satuan", "Contoh: m"),
          field("actual", "Hasil ukur", "", "decimal"), field("limit", "Batas acuan", "", "decimal"),
          dom("label", {}, "Jenis batas", side), field("source", "Sumber acuan parameter", "Opsional jika memakai acuan daerah yang sama")),
        dom("div", { className: "button-row" }, remove));
    }));
  }
  const add = button("＋ Tambah parameter", () => {
    data.additional.push(importAdditionalIntensity({}));
    renderRows();
    changed();
    list.lastElementChild?.querySelector("input")?.focus();
  });
  renderRows();
  return dom("details", { className: "block" }, dom("summary", {}, "Parameter tambahan"),
    list, dom("div", { className: "button-row" }, add));
}


function renderIntensity(project) {
  title("Data awal", "Intensitas dan tata ruang");
  const data = importIntensity(project.intensity);
  const grid = dom("div", { className: "form-grid" });
  const criteria = dom("div", { className: "intensity-criteria" });
  const changed = () => { project.intensity = data; save(); };
  const checklist = readChecklist(project.id);
  const area = boundField(data, "land", "Luas persil yang diperhitungkan (m²)", "text", changed, false);
  Object.assign(area.querySelector("input"), { inputMode: "decimal", placeholder: "Contoh: 900 atau 1.250,5" });
  const select = (key, label, choices, blank, onChange = changed) => {
    const input = dom("select", { ariaLabel: label }, new Option(blank, ""), ...choices.map(([id, name]) => new Option(name, id)));
    input.value = data[key];
    input.addEventListener("change", () => { data[key] = input.value; onChange(); });
    return dom("label", {}, dom("span", {}, label), input);
  };
  function localField(key, label, hint = "", type = "text") {
    const control = boundField(data.local, key, label, type, changed, false);
    control.querySelector("input").placeholder = hint;
    return control;
  }
  function showCriteria() {
    criteria.replaceChildren();
    if (data.region === "tegal") {
      criteria.append(dom("div", { className: "form-grid" },
        select("zone", "Pola ruang / zona", intensityZones, "Pilih pola ruang / zona"),
        select("road", "Kelas jalan di depan persil", intensityRoads, "Pilih kelas jalan"),
        select("use", "Fungsi bangunan", intensityFunctions, "Pilih fungsi bangunan")));
    }
    if (data.region === "tegal") {
      criteria.append(dom("p", { className: "hint" }, "Isi batas saluran dan sungai dari dokumen persil jika relevan. Gunakan titik ukur yang sama untuk data dan batas."),
        dom("div", { className: "form-grid" },
          boundField(data.tegalSetbacks, "saluranMin", "Garis Sempadan Saluran Minimum (m)", "text", changed, false),
          boundField(data.tegalSetbacks, "sungaiMin", "Garis Sempadan Sungai Minimum (m)", "text", changed, false),
          boundField(data.tegalSetbacks, "source", "Sumber acuan sempadan", "text", changed, false)));
    }
    if (data.region === "manual") {
      criteria.append(
        dom("div", { className: "form-grid" },
          localField("municipality", "Kabupaten / kota"), localField("province", "Provinsi"),
          localField("zone", "Zona / subzona"), localField("road", "Kelas jalan"),
          localField("use", "Fungsi bangunan"), localField("source", "Judul dan nomor dokumen acuan", "Contoh: RDTR, KRK, atau dokumen izin"),
          localField("reference", "Pasal / tabel / halaman"), localField("sourceUrl", "Tautan resmi (opsional)", "https://", "url")),
        dom("p", { className: "hint" }, "Isi batas sesuai dokumen acuan. Gunakan titik ukur yang sama untuk data dan batas sempadan."),
        dom("div", { className: "form-grid" }, ...comparisonMetrics.map(({ key, name, unit, side }) => {
          const label = name + (side === "Min" ? " Minimum" : " Maksimum") + " (" + unit + ")";
          const field = localField(key + side, label);
          field.querySelector("input").inputMode = unit === "lantai" ? "numeric" : "decimal";
          return field;
        })));
    }
  }
  grid.append(area);
  for (const metric of comparisonMetrics) {
    const unit = metric.direct || metric.unit === "lantai" ? metric.unit : "m²";
    const input = field(metric.areaLabel + " (" + unit + ")", initialIntensityMeasurement(data, checklist, metric).raw, (value) => {
      data.measurements[metric.key] = value;
      changed();
    }, "text");
    Object.assign(input.querySelector("input"), {
      inputMode: unit === "lantai" ? "numeric" : "decimal",
      placeholder: unit === "lantai" ? "Contoh: 2" : unit === "m" ? "Contoh: 12,5" : "Contoh: 600",
    });
    input.querySelector("input").dataset.intensityMeasurement = metric.key;
    grid.append(input);
  }
  const references = dom("details", { className: "block" }, dom("summary", {}, "Acuan tata ruang"),
    select("region", "Sumber acuan tata ruang", [["manual", "Acuan daerah setempat"], ["tegal", "Kabupaten Tegal · Perbup 12/2026"]],
      "Belum ditentukan", () => { showCriteria(); changed(); }), criteria);
  showCriteria();
  editor.append(dom("p", { className: "lead" }, "Isi data awal persil dan bangunan. Data ini dipakai otomatis pada pembahasan intensitas di bab kajian."),
    grid, references, additionalIntensityFields(data, changed));
  const destination = intensityDestination(project);
  if (destination) editor.append(button("Buka pembahasan di Bab " + roman(destination.chapter + 1), () => {
    active = destination.chapter;
    render();
    $("intensity-analysis")?.scrollIntoView({ block: "start" });
  }, "quiet"));
}


function openChecklistDate() {
  slfChecklistItem = "tanggal-pemeriksaan";
  active = "checklist";
  render();
  if (narrowLayout.matches) $("section-navigation").open = false;
  $("section-title").scrollIntoView({ block: "start" });
}

function projectChecklistUrl(project, item, embed = false) {
  const params = new URLSearchParams({ proyek: project.id });
  if (project.intensity?.region === "tegal") params.set("acuan", "tegal");
  if (embed) params.set("embed", "1");
  if (isTrial()) params.set("trial", "1");
  if (slfCloudOwner()) params.set("cloud", "1");
  const anchor = item === "tanggal-pemeriksaan" ? "#tanggal-pemeriksaan" : item ? "#butir-" + item : "";
  return "./daftar-simak.html?" + params + anchor;
}

function checklistEditorLink(project, item, label) {
  if (isTrial() && !trialChecklistIds.has(item)) return dom("span", {}, label);
  const link = dom("a", { href: projectChecklistUrl(project, item), target: "_blank", rel: "noopener" }, label);
  if (isTrial() || slfCloudOwner()) {
    link.removeAttribute("target");
    link.onclick = (event) => {
      event.preventDefault();
      slfChecklistItem = item;
      active = "checklist";
      render();
    };
  }
  return link;
}

function renderChecklistMap(project) {
  title("Daftar simak", "Peta tautan dan acuan");
  const search = dom("input", { type: "search", placeholder: "Cari nama butir atau acuan", ariaLabel: "Cari nama butir atau acuan" });
  const list = dom("div", { className: "auto-checklist", id: "checklist-map-items" });
  const linkedProject = isTrial() ? { ...project, chapters: [...project.chapters, ...trial.lockedChapters] } : project;
  function update() {
    const checklist = readChecklist(project.id);
    const term = tokenName(search.value);
    const rows = [];
    for (const item of checklistItems) {
      const reference = checklistReference(item.id, project.intensity?.region === "tegal");
      const label = item.group.code + " · " + item.title;
      if (!tokenName(label + " " + reference).includes(term)) continue;
      const to = checklistDestination(linkedProject, item);
      const locked = isTrial() && !trialChecklistIds.has(item.id);
      const summary = locked ? "Perlu login" : checklistSummary(item, checklist.checks[item.id]) || "Belum diisi";
      let jump = "Ringkasan teknis sebelum daftar simak";
      if (to) {
        const destination = "Bab " + roman(to.chapter + 1) + " · " + to.title;
        jump = to.chapter >= project.chapters.length ? destination + " · Perlu login" : button(destination, () => {
          active = to.chapter;
          render();
          const section = document.getElementById("checklist-links-" + to.block);
          if (section) { section.open = true; section.scrollIntoView({ block: "start" }); }
        }, "quiet");
      }
      rows.push([checklistEditorLink(project, item.id, label), summary, reference, jump]);
    }
    list.replaceChildren(rows.length ? editorTable(["Butir", "Hasil di laporan", "Acuan", "Tujuan laporan"], rows) :
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
    const data = importIntensity(current().intensity);
    const checklist = readChecklist(current().id);
    for (const metric of comparisonMetrics) {
      const input = editor.querySelector('[data-intensity-measurement="' + metric.key + '"]');
      if (input && input !== document.activeElement && !Object.hasOwn(data.measurements, metric.key)) {
        input.value = initialIntensityMeasurement(data, checklist, metric).raw;
      }
    }
  }
  if (typeof active === "number") {
    const checklist = readChecklist(current().id);
    $("intensity-analysis-table")?.replaceChildren(intensityTable(calculateIntensity(current(), checklist), true));
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
    const summary = isTrial() && !trialChecklistIds.has(item.id) ? "Perlu login" : checklistSummary(item, checklist.checks[item.id]);
    rows.push([checklistEditorLink(project, item.id, item.title),
      summary || "Belum diisi", checklistReference(item.id, project.intensity?.region === "tegal")]);
  }
  return editorTable(["Butir daftar simak", "Hasil di laporan", "Dasar aturan atau acuan teknis"], rows);
}

function title(type, label) {
  $("section-type").textContent = type;
  $("section-title").textContent = label;
}

function renderCover(project) {
  title("Bagian awal", "Sampul laporan");
  const groups = [
    ["Identitas bangunan", ["building", "use", "address", "city"]],
    ["Pihak yang terlibat", ["owner", "consultant"]],
    ["Identitas laporan", ["title", "number", "date"]],
  ];
  editor.append(dom("p", { className: "lead" }, "Mulai dari nama dan alamat bangunan. Data sampul akan digunakan kembali pada bagian laporan yang tertaut."));
  const fields = new Map();
  for (const [key, label, type] of coverFields) {
    const [owner, fieldKey] = key === "consultant" ? consultantNameField(project) : [project.cover, key];
    const control = guidedField(owner, fieldKey, fieldKey === "individualName" ? "Nama pengkaji teknis" : label, type);
    if (key === "building" || key === "owner") control.querySelector("input").id = "cover-" + key;
    fields.set(key, control);
  }
  for (const [heading, keys] of groups) {
    editor.append(dom("section", { className: "cover-group" }, dom("h3", {}, heading),
      dom("div", { className: "form-grid" }, ...keys.map((key) => fields.get(key)))));
  }
  editor.append(dom("section", { className: "cover-group" }, dom("h3", {}, "Foto sampul"),
    pictureEditor(project.cover, "foto sampul", () => workspace.projects.includes(project))),
    dom("details", { className: "editor-settings" }, dom("summary", {}, "Ubah nama proyek di editor"),
      field("Nama proyek di editor", project.name, (value) => {
        project.name = value;
        $("projects").selectedOptions[0].textContent = value;
        save();
      }, "text", project, "name")),
    button(isTrial() ? "Lanjut ke pendahuluan →" : "Lanjut ke bagian awal →", () => {
      active = "front";
      render();
      $("section-title").focus();
    }, "primary"));
}

function approvalSignatoryFields(project) {
  const front = project.front;
  const type = dom("select", { value: "" },
    new Option("Badan usaha", "badan-usaha"), new Option("Perorangan", "perorangan"));
  type.value = isIndividualConsultant(project) ? "perorangan" : "badan-usaha";
  const fields = dom("div", { className: "form-grid wide" });
  const changed = () => { refreshLinkedFields(); save(); };
  function renderFields() {
    const [owner, nameKey] = consultantNameField(project);
    if (isIndividualConsultant(project)) {
      fields.replaceChildren(boundField(owner, nameKey, "Nama pengkaji teknis", "text", changed));
      return;
    }
    fields.replaceChildren(
      boundField(owner, nameKey, "Nama perusahaan pengkaji", "text", changed),
      boundField(front, "signatory", "Nama penandatangan", "text", changed),
      boundField(front, "role", "Jabatan penandatangan", "text", changed),
      boundField(front, "consultantDirector", "Nama direktur jika berbeda dari penandatangan", "text", changed),
    );
  }
  type.addEventListener("change", () => {
    front.consultantType = type.value;
    renderFields();
    changed();
  });
  renderFields();
  return [dom("label", {}, "Jenis pengkaji teknis", type),
    guidedField(front, "location", "Tempat dan tanggal pengesahan"), fields];
}

function renderFront(project) {
  const sources = reportSources(project);
  title("Bagian awal", isTrial() ? "Pendahuluan" : "Bagian awal & daftar isi");
  editor.append(purposeField(project),
    dom("div", { className: "form-grid" }, ...frontFields.slice(0, 2).map(([key, label]) =>
      linkedText(project, project.front, key, label, () => project.frontLinks?.[key] ?? {},
        (links) => { project.frontLinks = { ...project.frontLinks, [key]: links }; }, sources)),
      ...approvalSignatoryFields(project)),
    dom("h3", {}, "Susunan bab"),
    dom("p", { className: "hint" }, "Daftar isi, daftar tabel, dan daftar gambar mengikuti susunan laporan."),
    dom("ol", { className: "chapter-list" }, ...project.chapters.map((chapter, index) => {
      const titles = [...headingEntries(chapter, index)].filter(([bi]) => chapter.blocks[bi].text.trim());
      const jump = (bi) => {
        active = index;
        render();
        if (bi === undefined) $("section-title").focus();
        else focusEditorBlock(bi);
      };
      const entry = dom("li", {}, button(chapterLabel(project, index), () => jump(), "quiet"));
      if (titles.length) entry.append(dom("ul", { className: "sub-outline" }, ...titles.map(([bi, info]) =>
        dom("li", { className: info.nested ? "nested-outline" : "" },
          button(info.number + " " + chapter.blocks[bi].text, () => jump(bi), "quiet")))));
      return entry;
    })));
}

function renderChecklistEditor(project) {
  const trying = isTrial();
  if (active === "checklist") title("Lampiran", trying ? "Daftar simak kajian (25% dapat diisi)" : "Daftar simak kajian");
  const item = slfChecklistItem;
  slfChecklistItem = "";
  const head = dom("div", { className: "checklist-head" },
    dom("p", { className: "lead" }, trying
      ? trialChecklistItems.length + " dari " + checklistItems.length + " butir dapat diisi. Butir lainnya · Perlu login."
      : "Isi hasil pemeriksaan. Perubahan pada daftar simak ikut masuk ke laporan proyek ini."));
  if (!trying) head.append(dom("a", { href: projectChecklistUrl(project), target: "_blank", rel: "noopener" }, "Buka layar penuh"));
  editor.append(head, dom("iframe", { src: projectChecklistUrl(project, item, true), title: "Daftar simak proyek", className: "checklist-frame" }));
}

function openIntensityEditor() {
  active = "intensity";
  render();
  $("section-title").focus();
}

function renderIntensityAnalysis(project, checklist) {
  const data = importIntensity(project.intensity);
  const table = dom("div", { className: "auto-checklist", id: "intensity-analysis-table" }, intensityTable(calculateIntensity(project, checklist), true));
  const edit = button("Ubah data awal intensitas", openIntensityEditor, "quiet");
  const diagram = dom("input", { type: "checkbox", checked: data.diagram });
  diagram.addEventListener("change", () => {
    project.intensity = { ...importIntensity(project.intensity), diagram: diagram.checked };
    save();
  });
  return dom("details", { className: "block", id: "intensity-analysis", open: true },
    dom("summary", {}, "Perbandingan intensitas dan sempadan"),
    dom("p", { className: "hint" }, "Tabel ini mengambil data awal intensitas dan acuan tata ruang proyek."),
    edit, table,
    dom("details", {}, dom("summary", {}, "Skema tapak ilustratif"), siteDiagram(),
      dom("label", { className: "intensity-toggle" }, diagram, "Sertakan skema ilustratif di laporan")));
}

function introductionEditor(owner, value, label) {
  const text = dom("div", { className: "linked-preview" });
  const preview = dom("div", { className: "narrative-preview" }, dom("h4", {}, label), text);
  function show(value) {
    text.textContent = value;
    preview.hidden = !value.trim();
  }
  const edit = dom("details", { className: "narrative-editor" },
    dom("summary", {}, "Sunting " + label.toLocaleLowerCase("id")),
    field(label, value, (updated) => {
      owner.introduction = updated;
      show(updated);
      save();
    }, "area"));
  show(value);
  return dom("div", { className: "guided-narrative" }, preview, edit);
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
  if (!isTrial() && !chapter.checklist) chapterActions.append(button("Hapus bab", () => {
    if (!confirm("Hapus bab ini beserta seluruh isinya?")) return;
    project.chapters.splice(index, 1);
    active = "front";
    save();
    render();
  }, "danger"));
  const settings = dom("details", { className: "editor-settings" }, dom("summary", {}, "Pengaturan bab"),
    boundField(chapter, "title", "Judul bab", "text", () => {
    title("Bab " + roman(index + 1), chapter.title || "Bab tanpa judul");
    renderOutline();
    save();
  }));
  if (!isTrial()) settings.append(chapterActions);
  editor.append(settings);
  const headings = headingEntries(chapter, index);
  if (headings.size) {
    const select = dom("select", { id: "subchapter-picker" });
    for (const [bi, info] of headings) select.add(new Option(info.number + " · " + (chapter.blocks[bi].text.trim() || "Tanpa judul"), String(bi)));
    editor.append(dom("div", { className: "subchapter-jump" }, dom("label", { htmlFor: select.id }, "Langsung ke subbab"), select,
      button("Buka", () => focusEditorBlock(select.value))));
  }
  editor.append(introductionEditor(chapter, introductionText(chapter), "Pengantar bab"));
  editor.append(sectionPhotoEditor(chapter, "Unggah foto bab", () => workspace.projects.includes(project) && project.chapters.includes(chapter)));
  if (chapter.checklist) return renderChecklistEditor(project);
  editor.append(dom("p", { className: "lead" }, "Mulai dari Tampilan di laporan. Pilih bagian bertanda Isi untuk melengkapi data, atau buka Ubah teks dan format untuk menyunting kalimat."));
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
  const intensity = intensityDestination(project);
  const sources = reportSources(project, checklist);
  appendChecklist(-1);
  for (const [bi, block] of chapter.blocks.entries()) {
    if (block.mepSafetySelected === false) continue;
    editor.append(blockEditor(chapter, block, bi, headings.get(bi), sources));
    if (intensity?.chapter === index && intensity.block === bi) editor.append(renderIntensityAnalysis(project, checklist));
    if (architectureInspectionKind(block) && chapter.blocks[bi - 1]?.type === "heading") appendChecklist(bi - 1);
    if (block.type !== "heading" || !architectureInspectionKind(chapter.blocks[bi + 1])) appendChecklist(bi);
  }
  const actions = dom("div", { className: "button-row add-block" });
  for (const [type, label] of Object.entries({ heading: "Subbab", text: "Paragraf", table: "Tabel", photo: "Foto" })) {
    if (isTrial() && type === "photo") {
      actions.append(lockedUpload("Foto"));
      continue;
    }
    actions.append(button("＋ " + label, () => {
      const data = type === "heading" ? heading("") :
        type === "table" ? { type, text: "", headers: ["Uraian", "Keterangan"], rows: [["", ""]] } : { type, text: "" };
      chapter.blocks.push(data);
      save();
      render();
      const added = focusEditorBlock(chapter.blocks.length - 1);
      if (type === "heading" || type === "table") added.querySelector(".block-settings").open = true;
      if (type !== "photo") focusTextField(added.querySelector("input, textarea"));
    }));
  }
  editor.append(actions);
}

function followUpPicker(block, sources) {
  const used = new Set(Object.values(block.cellLinks ?? {}));
  const choices = [...sources].filter(([id, entry]) => id.startsWith("finding:") && entry.actionable && entry.value && !used.has(id));
  const pick = dom("select", { ariaLabel: "Temuan yang akan ditambahkan" }, new Option("Pilih temuan", ""));
  for (const group of new Set(choices.map(([, entry]) => entry.group))) {
    pick.append(dom("optgroup", { label: group }, ...choices.filter(([, entry]) => entry.group === group)
      .map(([id, entry]) => new Option(entry.label, id))));
  }
  const preview = dom("p", { className: "hint" });
  const add = button("Tambahkan ke matriks", () => {
    const id = pick.value;
    const entry = sources.get(id);
    if (!entry || Object.values(block.cellLinks ?? {}).includes(id)) return;
    const empty = block.rows.findIndex((row, index) => !block.rowImages?.[block.rowIds[index]] && row.every((value, column) => {
      const key = tableCellKey(block, index, column);
      return (!value.trim() || /^\[[^\[\]\r\n]+\]$/.test(value.trim())) &&
        !block.cellLinks?.[key] && !getTextFormat(block, "cell:" + key);
    }));
    const index = empty < 0 ? block.rows.length : empty;
    const rowId = block.rowIds[index] ?? crypto.randomUUID();
    block.rowIds[index] = rowId;
    block.rows[index] = block.headers.map((_, column) => column === 0 ? entry.value : column === 1 ? entry.action ?? "" : "");
    (block.cellLinks ??= {})[tableCellKey(block, index, 0)] = id;
    save();
    render();
    const action = editor.querySelector('tr[data-row-id="' + rowId + '"] td:nth-child(2) input');
    if (action) focusTextField(action);
  });
  add.disabled = true;
  pick.addEventListener("change", () => {
    preview.textContent = sources.get(pick.value)?.value || "";
    add.disabled = !pick.value;
  });
  return dom("details", { className: "health-column-settings" }, dom("summary", {}, "Ambil temuan pemeriksaan"),
    choices.length ? dom("div", { className: "form-grid" }, dom("label", {}, "Temuan yang perlu ditindaklanjuti", pick),
      dom("div", {}, preview, add)) :
      dom("p", { className: "hint" }, "Temuan di luar acuan atau tidak sesuai akan tersedia setelah dicatat pada pemeriksaan."));
}

function tableEditor(block) {
  const team = isTeamTable(block);
  const guidedHealth = Boolean(block.healthMeasurements);
  const inspectionKind = architectureInspectionKind(block) || "health";
  const matrix = dom("div", { className: team ? "matrix team-matrix" : guidedHealth ? "matrix health-matrix" : "matrix" });
  const table = dom("table");
  const header = dom("tr");
  const columnFields = [];
  for (const [index, value] of block.headers.entries()) {
    const heading = dom("th", { scope: "col" });
    const editor = field("Kolom " + (index + 1), value, (text) => {
      block.headers[index] = text;
      heading.textContent = text;
      refreshLinkedFields();
      save();
    }, "text", block, "header:" + block.columnIds[index]);
    heading.textContent = value;
    columnFields.push(editor);
    header.append(heading);
  }
  header.append(dom("th", {}, "Baris"));
  const rows = dom("tbody");
  const sources = reportSources(current());
  const chapter = current().chapters.find((entry) => entry.blocks.includes(block));
  const locations = guidedHealth ? healthRoomChoices(current(), block, sources) : [];
  const imageColumn = tableImageColumn(block);
  const tableName = tokenName(block.text);
  const followUps = isFollowUpMatrix(block) ? followUpPicker(block, sources) : undefined;
  const statusColumn = isDocumentReviewTable(block) ?
    block.headers.findIndex((header) => tokenName(header) === "status verifikasi") : -1;
  const toolColumn = tableName === "daftar alat pemeriksaan" ?
    block.headers.findIndex((header) => tokenName(header) === "alat") : -1;
  for (const [index, row] of block.rows.entries()) {
    const rowId = block.rowIds[index];
    const measurement = block.healthMeasurements?.[rowId];
    const linked = inspectionKind === "comfort" && measurement?.healthSource;
    const outputs = linked ? Array.from({ length: 4 }, () => dom("p", { className: "health-threshold" })) : [];
    const cells = linked ? ["Parameter", "Ruang / sistem", "Acuan pembanding", "Hasil / temuan"].map((label, column) =>
      dom("td", {}, dom("span", { className: "health-field-label" }, label), outputs[column])) :
      measurement ? healthMeasurementCells(measurement, locations, inspectionKind) : [];
    const firstManualColumn = cells.length;
    cells.push(...row.slice(firstManualColumn).map((_, offset) => {
      const column = offset + firstManualColumn;
      return dom("td", {}, tableCellField(block, index, column, sources,
        column === statusColumn ? ["Tersedia", "Terverifikasi", "Telah ditelaah", "Belum ditelaah", "Belum tersedia"] :
          column === toolColumn ? inputChoices["daftar alat pemeriksaan"] : [],
        column === 4 ? measurement : undefined));
    }));
    if (measurement) {
      cells[0].append(button("＋ Ruang lain", () => addRow(measurement.parameter, index + 1, measurement), "quiet"));
      if (inspectionKind === "comfort") {
        const control = healthMeasurementSourceField(measurement, chapter, outputs, sources, (id) => {
          if (id) measurement.healthSource = id;
          else delete measurement.healthSource;
          save();
          render();
          editor.querySelector('tr[data-row-id="' + rowId + '"] .health-source-field:not([hidden]) select')?.focus();
        });
        cells[1].prepend(control);
      }
    }
    cells[imageColumn].append(tableRowImageEditor(current(), block, rowId, index));
    const rowElement = dom("tr", { ariaLabel: (team ? "Pengkaji " : "Baris ") + (index + 1) }, ...cells, dom("td", {}, button("Hapus", () => {
      const populated = block.rowImages?.[rowId] || (measurement && healthMeasurementFields.some((key) => key !== "parameter" && measurement[key]?.trim())) || row.some((cell, column) =>
        (isDocumentReviewTable(block) ? tableCellValue(block, index, column, sources) : cell).trim() ||
        block.cellLinks?.[tableCellKey(block, index, column)]);
      if (populated && !confirm("Hapus baris tabel ini?")) return;
      for (const column of row.keys()) {
        const key = tableCellKey(block, index, column);
        if (block.cellLinks) delete block.cellLinks[key];
        setTextFormat(block, "cell:" + key, undefined);
      }
      if (block.rowImages) delete block.rowImages[rowId];
      if (measurement) delete block.healthMeasurements[rowId];
      block.rows.splice(index, 1);
      if (block.teamLead === rowId) delete block.teamLead;
      block.rowIds.splice(index, 1);
      save();
      render();
    }, "danger")));
    if (guidedHealth) rowElement.lastElementChild.className = "health-row-actions";
    rowElement.dataset.rowId = rowId;
    rows.append(rowElement);
  }
  table.append(dom("thead", {}, header), rows);
  matrix.append(table);
  const change = (edit) => { edit(); save(); render(); };
  const addRow = (parameter, position = block.rows.length, measurement) => {
    const id = crypto.randomUUID();
    change(() => {
      block.rows.splice(position, 0, block.headers.map(() => ""));
      block.rowIds.splice(position, 0, id);
      if (parameter) {
        block.healthMeasurements[id] = parameter === "custom" && measurement ?
          { parameter, name: measurement.name || "", unit: measurement.unit || "" } : { parameter };
      }
    });
    if (parameter) document.querySelector('tr[data-row-id="' + id + '"] td:nth-child(2) input')?.focus();
  };
  const actions = dom("div", { className: "button-row" },
    button(guidedHealth ? "＋ Baris pengukuran" : "＋ Baris",
      () => addRow(guidedHealth ? defaultInspectionParameters[inspectionKind][0] : undefined)),
    ...(guidedHealth ? [button("＋ Baris manual", () => addRow())] : []),
    button("＋ Kolom", () => change(() => {
      block.headers.push("Kolom baru");
      block.columnIds.push(crypto.randomUUID());
      block.rows.forEach((row) => row.push(""));
    })));
  if (block.headers.length > (guidedHealth ? architectureHealthColumns.length : 1)) actions.append(button("Hapus kolom terakhir", () => {
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
  const editor = dom("div", {}, ...(guidedHealth ? [dom("p", { className: "hint" },
    "Pilih atau ketik nama ruang, tentukan acuan, lalu isi hasil ukur. Gunakan ＋ Ruang lain untuk menambah pemeriksaan pada aspek yang sama.")] : []),
    dom("details", { className: "health-column-settings" }, dom("summary", {}, "Sunting judul kolom"),
      dom("div", { className: "form-grid" }, ...columnFields)), ...(followUps ? [followUps] : []), matrix, actions);
  if (team) {
    const select = dom("select");
    const hint = dom("p", { className: "hint" });
    const leadField = dom("div", { className: "team-lead" },
      dom("label", {}, "Ketua tim / penanggung jawab kajian", select), hint);
    leadField.refreshMembers = (registry) => {
      const members = teamMembers(block, registry);
      const options = members.map(([id, name], index) =>
        new Option("Pengkaji " + (index + 1) + " · " + (name || "Nama belum diisi"), id));
      select.replaceChildren(new Option("Pilih penanggung jawab", ""), ...options,
        new Option("Direktur Badan Usaha Pengkaji", "director"));
      select.value = block.teamLead || "";
      const name = registry.get("project:team-lead").value;
      hint.textContent = name ? "Terhubung ke narasi subbab Tim pengkaji teknis · " + name :
        select.value === "director" ? "Isi nama Direktur Badan Usaha Pengkaji di Bagian Awal." :
          select.value ? "Isi nama pengkaji pada baris yang dipilih." :
            "Pilih pengkaji dari tabel ini atau Direktur dari Bagian Awal.";
    };
    select.addEventListener("change", () => {
      if (select.value) block.teamLead = select.value;
      else delete block.teamLead;
      refreshLinkedFields();
      save();
    });
    leadField.refreshMembers(sources);
    editor.append(leadField);
  }
  return editor;
}

function tableCellField(block, row, column, sources, options, measurement) {
  const label = block.headers[column].trim() || "Kolom " + (column + 1);
  const key = tableCellKey(block, row, column);
  const value = block.rows[row][column];
  const token = value.match(/^\[([^\[\]\r\n]+)\]$/)?.[1];
  const fieldToken = tokenName(token ?? block.headers[column]);
  const example = inputExample(fieldToken);
  const control = field(label, token ? "" : value, (text) => {
    if (measurement) measurement.recommendationMode = "manual";
    block.rows[row][column] = text;
    refreshLinkedFields();
    save();
  }, measurement ? "area" : "text", block, "cell:" + key, () => { refreshLinkedFields(); save(); });
  const input = control.querySelector("input, textarea");
  const choices = options.length ? options : choicesForInput(fieldToken);
  if (choices.length) control.setTextChoices(choices);
  const summary = dom("summary");
  const pick = dom("select", { ariaLabel: "Sumber data " + label.toLocaleLowerCase("id") });
  const link = dom("details", { className: "table-link" }, summary, pick);
  const mode = measurement ? dom("span", { className: "hint" }) : undefined;
  const reset = measurement ? button("Gunakan saran otomatis", () => {
    delete measurement.recommendationMode;
    block.rows[row][column] = "";
    updateTextFormat(block, "cell:" + key, input.value, inspectionRecommendation(resolvedHealthMeasurement(measurement, reportSources(current())), ""));
    refreshLinkedFields();
    save();
  }, "quiet") : undefined;
  function refreshValue(registry) {
    const source = block.cellLinks?.[key];
    const automatic = automaticTableCellSource(block, row, column);
    const entry = registry.get(source ?? automatic);
    link.toggleAttribute("data-linked", Boolean(source));
    link.toggleAttribute("data-automatic", Boolean(measurement || automatic) || tokenName(block.text) === "data umum bangunan gedung");
    const readOnly = Boolean(source);
    const savedValue = block.rows[row][column];
    const finding = source?.startsWith("finding:");
    const effectiveMeasurement = measurement && resolvedHealthMeasurement(measurement, registry);
    const nextValue = source ? entry?.value || (finding ? savedValue : "") : measurement ? inspectionRecommendation(effectiveMeasurement, savedValue) :
      token && savedValue === value ? "" : savedValue;
    const placeholder = source && !entry?.value ? "Sumber belum tersedia" :
      automatic && entry?.value ? entry.value + " · dari Intensitas" : example ? "Contoh: " + example : token ?? "";
    const changed = input.value !== nextValue || input.readOnly !== readOnly || input.placeholder !== placeholder;
    if (input.value !== nextValue) input.value = nextValue;
    if (input.readOnly !== readOnly) input.readOnly = readOnly;
    input.placeholder = placeholder;
    summary.textContent = finding && !entry?.value ? "Sumber temuan tidak tersedia · salinan tersimpan" :
      source ? "Data tertaut" : automatic && entry?.value ? "Otomatis dari Intensitas" : "Ambil data";
    if (measurement) {
      const manual = measurement.recommendationMode === "manual" || Boolean(savedValue.trim());
      mode.textContent = manual ? "Isian pengkaji" : nextValue ? "Otomatis · bisa diedit" : "Saran muncul setelah acuan dan hasil diisi.";
      mode.hidden = readOnly;
      reset.hidden = readOnly || !manual || !healthMeasurement(effectiveMeasurement).recommendation;
    }
    if (changed) control.syncTextFormat();
  }
  link.refreshValue = refreshValue;
  function refreshOptions() {
    if (!link.open) return;
    const registry = reportSources(current());
    const selected = block.cellLinks?.[key];
    pick.replaceChildren(new Option("Isi manual", ""));
    const groups = new Map();
    for (const [id, entry] of registry) {
      if (id.startsWith("finding:") && id !== selected) continue;
      if (!entry.value || !tableSourceAvailable(id, block) || id === "cell:" + block.sourceId + ":" + key) continue;
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
    if (!pick.value && block.cellLinks[key]?.startsWith("finding:")) block.rows[row][column] = input.value;
    if (pick.value) block.cellLinks[key] = pick.value;
    else delete block.cellLinks[key];
    refreshOptions();
    refreshLinkedFields();
    save();
  });
  refreshValue(sources);
  return dom("div", {}, control, ...(measurement ? [dom("div", { className: "recommendation-controls" }, mode, reset)] : []), link);
}

const tableRowImageUploads = new WeakMap();

function tableRowImageEditor(project, block, rowId, index) {
  if (isTrial()) return lockedUpload("Unggah gambar");
  const label = "Gambar baris " + (index + 1);
  const input = dom("input", { type: "file", accept: "image/*", hidden: true, ariaLabel: label });
  const preview = dom("img", { className: "table-row-image", alt: label });
  const upload = button("Unggah gambar", () => input.click());
  const remove = button("Hapus gambar", () => {
    tableRowImageUploads.get(block)?.delete(rowId);
    delete block.rowImages[rowId];
    refreshImage();
    save(true, project);
  }, "quiet");
  const status = dom("p", { className: "hint", role: "status" });
  const control = dom("div", { className: "table-row-image-editor" }, input, preview, upload, remove, status);
  control.dataset.tableRowImage = rowId;
  upload.setAttribute("aria-label", "Unggah " + label.toLocaleLowerCase("id"));
  remove.setAttribute("aria-label", "Hapus " + label.toLocaleLowerCase("id"));
  function refreshImage() {
    const image = block.rowImages?.[rowId];
    preview.hidden = remove.hidden = !image;
    if (image) preview.src = image;
    else preview.removeAttribute("src");
    upload.textContent = image ? "Ganti gambar" : "Unggah gambar";
    upload.setAttribute("aria-label", (image ? "Ganti " : "Unggah ") + label.toLocaleLowerCase("id"));
  }
  control.refreshImage = refreshImage;
  refreshImage();
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    const pending = tableRowImageUploads.get(block) ?? new Map();
    tableRowImageUploads.set(block, pending);
    const request = Symbol();
    pending.set(rowId, request);
    upload.disabled = remove.disabled = true;
    status.textContent = "Menyiapkan gambar…";
    try {
      const image = await imageData(file, 900);
      const attached = workspace.projects.includes(project) && block.rowIds.includes(rowId) &&
        project.chapters.some((chapter) => chapter.blocks.includes(block));
      if (!attached || pending.get(rowId) !== request) return;
      (block.rowImages ??= {})[rowId] = image;
      refreshImage();
      if (!control.isConnected && current() === project) {
        editor.querySelector('[data-table-row-image="' + rowId + '"]')?.refreshImage();
      }
      status.textContent = "Gambar ditambahkan.";
      save(true, project);
    } catch {
      status.textContent = "Gambar tidak dapat dibuka. Pilih file gambar lain.";
    } finally {
      if (pending.get(rowId) === request) pending.delete(rowId);
      input.value = "";
      upload.disabled = remove.disabled = false;
    }
  });
  return control;
}

async function imageData(file, maximumEdge = 1440) {
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maximumEdge / Math.max(image.width, image.height));
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

function lockedUpload(label) {
  return dom("button", { type: "button", className: "upload-locked", disabled: true }, label + " · Perlu login");
}

function pictureEditor(block, label, isAttached = () => true) {
  if (isTrial()) return lockedUpload("Unggah " + label);
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

function sectionPhotoEditor(owner, label, isAttached, firstCaption = "", onChange = save) {
  if (isTrial()) return dom("div", { className: "section-photos" }, lockedUpload(label));
  const upload = dom("input", { type: "file", accept: "image/*", multiple: true, hidden: true, ariaLabel: label });
  const add = button(label, () => upload.click());
  const feedback = dom("p", { className: "hint", role: "status", hidden: true });
  const list = dom("div", { className: "section-photo-list" });
  const gallery = dom("div", { className: "section-photos" }, dom("div", { className: "button-row" }, add),
    upload, feedback, list);
  function renderPhotos() {
    const photos = owner.photos ?? [];
    add.textContent = photos.length ? label.replace("Unggah", "Tambah") + " (" + photos.length + ")" : label;
    list.replaceChildren(...photos.map((photo, index) => {
      const caption = boundField(photo, "text", "Keterangan foto " + (index + 1), "text", onChange);
      const remove = button("Hapus foto " + (index + 1), () => {
        owner.photos = owner.photos.filter((entry) => entry !== photo);
        if (!owner.photos.length) delete owner.photos;
        renderPhotos();
        onChange();
        add.focus();
      }, "quiet");
      return dom("div", { className: "section-photo-card" },
        dom("img", { className: "photo-thumb", alt: photo.text || "Foto dokumentasi", src: photo.image }), caption, remove);
    }));
  }
  upload.addEventListener("change", async () => {
    const files = [...upload.files];
    if (!files.length) return;
    add.disabled = true;
    feedback.hidden = false;
    feedback.textContent = "Menyiapkan foto…";
    const photos = [];
    for (const file of files) {
      try {
        photos.push({ image: await imageData(file), text: "" });
      } catch { /* A photo that cannot be decoded does not prevent adding the others. */ }
    }
    if (isAttached() && photos.length) {
      if (!owner.photos?.length && firstCaption) photos[0].text = firstCaption;
      (owner.photos ??= []).push(...photos);
      const refreshPhotos = photoEditors.get(owner);
      if (refreshPhotos) refreshPhotos();
      else save();
    }
    const failed = files.length - photos.length;
    feedback.textContent = [photos.length ? photos.length + " foto ditambahkan." : "",
      failed ? failed + " foto gagal dibuka." : ""].filter(Boolean).join(" ");
    upload.value = "";
    add.disabled = false;
  });
  photoEditors.set(owner, () => { renderPhotos(); onChange(); });
  renderPhotos();
  return gallery;
}


function focusEditorBlock(index) {
  const target = $("edit-block-" + index);
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: "start" });
  return target;
}

function structureComponentsEditor(block, isAttached) {
  const list = dom("div", { className: "appearance-sections" });
  const add = button("＋ Tambah komponen", () => {
    const entry = {};
    (block.structureComponents ??= []).push(entry);
    const card = componentCard(entry);
    list.append(card);
    card.querySelector("input").focus();
    save();
  });
  function componentCard(entry) {
    const fields = structureComponentFields.map(([key, label, example]) => {
      const multiline = key === "observation" || key === "analysis";
      const control = boundField(entry, key, label, multiline ? "area" : "text", () => { save(); refreshLinkedFields(); }, false);
      control.querySelector("input, textarea").placeholder = example;
      return control;
    });
    const card = dom("fieldset", { className: "link-entry" }, dom("legend", {}, "Komponen yang diperiksa"),
      dom("div", { className: "form-grid" }, ...fields),
      sectionPhotoEditor(entry, "Unggah foto komponen", () =>
        isAttached() && block.structureComponents.includes(entry)));
    card.append(button("Hapus komponen", () => {
      if (hasStructureComponentContent(entry) && !confirm("Hapus komponen beserta catatan dan fotonya?")) return;
      block.structureComponents.splice(block.structureComponents.indexOf(entry), 1);
      photoEditors.delete(entry);
      card.remove();
      add.focus();
      save();
      refreshLinkedFields();
    }, "quiet"));
    return card;
  }
  list.append(...(block.structureComponents ?? []).map(componentCard));
  return dom("div", { className: "appearance-sections" },
    dom("p", { className: "hint" }, "Tambahkan satu entri untuk setiap komponen di lokasi yang diperiksa. Jika komponen sejenis diperiksa di lokasi lain, buat entri baru untuk catatan dan fotonya."),
    dom("div", { className: "button-row" }, add), list);
}

function structureTestingEditor(block, isAttached) {
  const previous = block.structureTest;
  const items = [...structureTestingItems(previous)];
  if (!Array.isArray(previous?.items) && !items.length) items.push({});
  const data = { status: previous?.status, pendingNote: previous?.pendingNote, items };
  if (previous) block.structureTest = data;
  const status = dom("select", {}, new Option("Pilih status", ""),
    new Option("Belum ada hasil uji atau analisis", "unavailable"),
    new Option("Ada hasil uji atau analisis", "available"));
  status.value = data.status ?? "";
  const update = () => {
    details.hidden = status.value !== "available";
    note.hidden = status.value !== "unavailable";
    const content = structureTestingContent(data);
    preview.hidden = !content.length;
    preview.replaceChildren(dom("h4", {}, "Tampilan di laporan"),
      dom("div", { className: "structure-test-scroll" }, ...content));
  };
  const changed = () => { block.structureTest = data; update(); save(); refreshLinkedFields(); };
  const rows = dom("tbody");
  const table = dom("table", { ariaLabel: "Hasil pengujian dan analisis" },
    dom("thead", {}, dom("tr", {}, ...structureTestColumns.map((label) => dom("th", { scope: "col" }, label)),
      dom("th", { scope: "col" }, "Tindakan"))), rows);
  const add = button("＋ Tambah item atau parameter uji", () => {
    const item = {};
    items.push(item);
    const row = itemRow(item);
    rows.append(row);
    row.querySelector("input").focus();
    changed();
  });
  const details = dom("div", { className: "appearance-sections structure-test-details" }, dom("div", { className: "button-row" }, add),
    dom("p", { className: "hint structure-test-scroll-hint" }, "Geser tabel untuk melihat semua kolom."),
    dom("div", { className: "structure-test-scroll structure-test-editor", tabIndex: 0, ariaLabel: "Tabel hasil uji" }, table));
  function itemRow(item) {
    const parameter = boundField(item, "parameter", "Item atau parameter yang diuji", "text", changed, false);
    parameter.querySelector("input").placeholder = "Contoh: kuat tekan beton pada kolom K-03";
    const fields = structureTestFields.map(([key, label, example]) => {
      const input = boundField(item, key, label, "area", changed, false);
      input.querySelector("textarea").placeholder = example;
      return input;
    });
    const photo = sectionPhotoEditor(item, "Unggah foto hasil uji", () =>
      isAttached() && block.structureTest?.items?.includes(item), "", changed);
    const row = dom("tr", {}, ...[parameter, ...fields, photo].map((cell) => dom("td", {}, cell)));
    row.append(dom("td", {}, button("Hapus item uji", () => {
      if (hasStructureTestItem(item) && !confirm("Hapus item uji beserta hasil dan fotonya?")) return;
      items.splice(items.indexOf(item), 1);
      photoEditors.delete(item);
      row.remove();
      add.focus();
      changed();
    }, "quiet")));
    return row;
  }
  rows.append(...items.map(itemRow));
  const note = boundField(data, "pendingNote", "Catatan (jika ada)", "area", changed, false);
  note.querySelector("textarea").placeholder = "Contoh: laporan uji belum diterima dari pengelola";
  const preview = dom("div", { className: "narrative-preview structure-test-preview" });
  status.addEventListener("change", () => { data.status = status.value; changed(); });
  update();
  return dom("div", { className: "guided-narrative" },
    dom("label", {}, "Apakah ada hasil pengujian atau analisis struktur?", status), details, note, preview);
}

function mepLocationCard(entry, inspection, isAttached, removeLocation, restoreLocation) {
  const { fields } = inspection;
  const extraFields = fields.slice(3);
  const controls = new Map(fields.map(([key, label, example, type = "text"]) => {
    const control = boundField(entry, key, label + (key === "followUp" ? " (jika diperlukan)" : ""), type,
      () => save(), false);
    control.querySelector("input, textarea").placeholder = "Contoh · " + example;
    return [key, control];
  }));
  const hasTestFields = extraFields.length > 1;
  const documents = dom("details", { className: "narrative-editor", open: extraFields.some(([key]) => key !== "component" && entry[key]?.trim()) },
    dom("summary", {}, hasTestFields ? "Detail komponen, hasil uji, dan dokumen (opsional)" : "Tambahkan rujukan dokumen (opsional)"),
    dom("p", { className: "hint" }, hasTestFields ?
      "Jika ada hasil ukur, cantumkan nilai dan satuannya. Jika belum diuji, catat pada kondisi dan temuan." :
      "Isi jika ada dokumen atau butir daftar simak yang mendukung temuan atau hasil uji."),
    ...extraFields.map(([key]) => controls.get(key)));
  controls.get("location").querySelector("input").dataset.mepLocation = "";
  return dom("fieldset", { className: "link-entry" }, dom("legend"), controls.get("location"), controls.get("observation"),
    sectionPhotoEditor(entry, "Unggah foto lokasi", isAttached), controls.get("followUp"), documents,
    restoreLocation ? button("Tampilkan di laporan", restoreLocation) : "", button("Hapus lokasi", removeLocation, "quiet"));
}

function lightningLocationsEditor(block, isAttached) {
  const locations = block.lightningLocations ??= [];
  if (!locations.length) locations.push({});
  const activeLocations = dom("div", { className: "appearance-sections" });
  const excluded = dom("details", { className: "narrative-editor" },
    dom("summary", {}, "Lokasi yang sebelumnya disembunyikan"));
  const add = button("＋ Tambah lokasi", () => {
    const entry = {};
    locations.push(entry);
    const card = append(entry);
    save();
    card.querySelector("[data-mep-location]").focus();
  });

  function refreshLabels() {
    [...activeLocations.children].forEach((card, index) => {
      card.querySelector("legend").textContent = "Pemeriksaan " + (index + 1);
    });
    excluded.hidden = excluded.childElementCount === 1;
    add.textContent = activeLocations.childElementCount ? "＋ Tambah lokasi lain" : "＋ Tambah lokasi";
  }

  function append(entry) {
    const card = mepLocationCard(entry, lightningLocationInspection, () => isAttached() && locations.includes(entry), () => {
      if (hasMepLocationContent(entry, lightningLocationInspection) && !confirm("Hapus lokasi ini beserta catatan dan fotonya?")) return;
      locations.splice(locations.indexOf(entry), 1);
      photoEditors.delete(entry);
      card.remove();
      refreshLabels();
      save();
      add.focus();
    }, entry.excluded ? () => {
      delete entry.excluded;
      locations.splice(locations.indexOf(entry), 1);
      locations.push(entry);
      card.remove();
      const restored = append(entry);
      save();
      restored.querySelector("[data-mep-location]").focus();
    } : undefined);
    if (entry.excluded) {
      card.querySelector("legend").textContent = entry.location?.trim() || "Pemeriksaan sebelumnya";
      excluded.append(card);
    } else {
      activeLocations.append(card);
    }
    refreshLabels();
    return card;
  }

  locations.forEach(append);
  refreshLabels();
  return dom("div", { className: "appearance-sections" },
    dom("p", { className: "hint" }, "Buat satu catatan untuk setiap titik yang diperiksa. Tulis temuan, tambahkan foto, lalu isi rekomendasi jika perlu."),
    activeLocations, dom("div", { className: "button-row" }, add), excluded);
}

function mepLocationEditor(block, inspection, isAttached) {
  const { key: storageKey, item, customExample } = inspection;
  const presets = choicesForInput(fireProtectionSystemToken);
  const facilities = block[storageKey] ?? [];
  const cards = dom("div", { className: "appearance-sections" });
  const sets = new Map(facilities.map(facility => [tokenName(facility.name), facility]));
  const byName = (name) => sets.get(tokenName(name));
  const selected = () => facilities.filter(facility => facility.selected).map(facility => facility.name);
  const editorId = "mep-locations-" + block.sourceId;
  const itemLabel = item[0].toUpperCase() + item.slice(1);

  function facilityCard(facility) {
    const entries = dom("div", { className: "appearance-sections" });
    const rowTitles = () => [...entries.children].forEach((card, index) => {
      card.querySelector("legend").textContent = "Pemeriksaan " + (index + 1);
    });
    const add = button("＋ Tambah lokasi", () => {
      const entry = {};
      facility.locations.push(entry);
      append(entry);
      rowTitles();
      save();
      entries.lastElementChild.querySelector("input").focus();
    });
    function append(entry) {
      const card = mepLocationCard(entry, inspection, () => isAttached() && facility.locations.includes(entry), () => {
        if (hasMepLocationContent(entry, inspection) && !confirm("Hapus lokasi ini beserta catatan dan fotonya?")) return;
        facility.locations.splice(facility.locations.indexOf(entry), 1);
        photoEditors.delete(entry);
        card.remove();
        rowTitles();
        save();
        add.focus();
      });
      entries.append(card);
    }
    facility.locations.forEach(append);
    rowTitles();
    return dom("section", { className: "link-entry appearance-sections" },
      dom("h4", {}, facility.name), entries, dom("div", { className: "button-row" }, add));
  }

  const sections = new Map();
  const names = [...new Map([...presets, ...facilities.map(facility => facility.name)]
    .map(name => [tokenName(name), name])).values()];
  const { fieldset, sync } = narrativeChoiceCheckboxes(itemLabel + " yang diperiksa", names, (name, checked) => {
    let facility = byName(name);
    if (!facility) {
      facility = { name, selected: false, locations: [{}] };
      facilities.push(facility);
      sets.set(tokenName(name), facility);
    }
    facility.selected = checked;
    show(facility);
    block[storageKey] = facilities;
    save();
  });
  function show(facility) {
    if (!sections.has(facility) && facility.selected) {
      const section = facilityCard(facility);
      sections.set(facility, section);
      cards.append(section);
    }
    if (sections.has(facility)) sections.get(facility).hidden = !facility.selected;
  }

  const custom = dom("input", { type: "text", maxLength: 120, placeholder: "Misalnya " + customExample });
  const feedback = dom("p", { className: "hint", role: "status" });
  function addFacility() {
    const name = custom.value.trim().replace(/\s+/g, " ");
    if (!name || names.some(choice => tokenName(choice) === tokenName(name))) {
      feedback.textContent = name ? itemLabel + " ini sudah ada di daftar pilihan." : "Isi nama " + item + " terlebih dahulu.";
      custom.focus();
      return;
    }
    facilities.push({ name, selected: true, locations: [{}] });
    block[storageKey] = facilities;
    save();
    render();
    const locations = $(editorId).querySelectorAll("[data-mep-location]");
    locations[locations.length - 1]?.focus();
  }
  custom.addEventListener("keydown", event => {
    if (event.key === "Enter") { event.preventDefault(); addFacility(); }
  });
  sync(selected());
  facilities.forEach(show);
  return dom("div", { id: editorId, className: "appearance-sections" },
    dom("p", { className: "hint" }, "Pilih " + item + ", lalu tambah satu pemeriksaan untuk setiap lokasi. Jika centang dilepas, catatan disimpan dan bisa dibuka kembali."),
    fieldset, dom("details", { className: "narrative-editor" }, dom("summary", {}, "Tambah " + item + " lain"),
      dom("label", {}, "Nama " + item, custom), button("Tambah " + item, addFacility), feedback), cards);
}

function mepSafetyEditor(chapter, parent, sources) {
  const { parameters, end } = mepSafetyParameters(chapter, parent);
  const choices = dom("fieldset", { className: "scope-options" }, dom("legend", {}, "Parameter keselamatan yang dikaji"));
  choices.append(dom("p", { className: "hint" }, "Centang parameter untuk menampilkan subbabnya. Jika centang dilepas, isian tetap tersimpan dan dapat dibuka kembali."));
  for (const block of parameters) {
    const check = dom("input", { type: "checkbox", checked: block.mepSafetySelected !== false });
    check.addEventListener("change", () => {
      block.mepSafetySelected = check.checked;
      save();
      render();
      $("mep-safety-options").querySelectorAll('input[type="checkbox"]')[parameters.indexOf(block)]?.focus({ preventScroll: true });
    });
    choices.append(dom("label", { className: "scope-choice" }, check,
      dom("span", { id: "mep-safety-option-" + block.sourceId }, block.text.trim() || "Tanpa judul")));
  }
  choices.id = "mep-safety-options";
  const input = dom("input", { type: "text", maxLength: 120, placeholder: "Misalnya sistem listrik darurat" });
  const feedback = dom("p", { className: "hint", role: "status" });
  function add() {
    const name = input.value.trim().replace(/\s+/g, " ");
    if (!name || parameters.some(block => mepSafetyKey(block.text) === mepSafetyKey(name) ||
      (block.mepSafetyPreset && mepSafetyKey(block.mepSafetyPreset) === mepSafetyKey(name)))) {
      feedback.textContent = name ? "Parameter ini sudah ada. Centang pada daftar di atas." : "Isi nama parameter terlebih dahulu.";
      input.focus();
      return;
    }
    const child = { type: "heading", text: name, depth: 2, mepSafetySelected: true,
      body: "Pemeriksaan dilakukan pada [lokasi atau komponen yang diperiksa]. Hasil pemeriksaan menunjukkan [kondisi atau hasil uji], berdasarkan [bukti atau acuan]. Tindak lanjut yang diperlukan adalah [tindak lanjut]." };
    chapter.blocks.splice(end, 0, child);
    save();
    render();
    focusEditorBlock(end);
  }
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") { event.preventDefault(); add(); }
  });
  const extra = dom("details", { className: "narrative-editor" },
    dom("summary", {}, "Tambah parameter lain"), dom("label", {}, "Nama parameter", input),
    button("Tambah subbab", add), feedback);
  const preview = dom("div", { className: "narrative-preview" });
  function refresh() {
    preview.replaceChildren(dom("h4", {}, "Tampilan di laporan"),
      ...mepSafetySummary(chapter, parent, (original, label) => resolveReportLink(original, label, sources, parent.links)));
  }
  choices.refreshSafetyPreview = refresh;
  refresh();
  const edit = dom("details", { className: "narrative-editor" }, dom("summary", {}, "Ubah narasi pengantar pemeriksaan"),
    boundField(parent, "body", "Narasi pemeriksaan", "area", () => { refresh(); save(); }));
  return dom("div", { className: "guided-narrative" }, choices, extra, preview, edit);
}

function blockEditor(chapter, block, index, headingInfo, sources) {
  const labels = { heading: "Subbab", text: "Paragraf", table: "Tabel", photo: "Foto dokumentasi" };
  const marker = headingInfo ? labels[block.type] + " " + headingInfo.number : labels[block.type];
  const named = block.type === "heading" || block.type === "table";
  const name = dom("h3", {}, named ? block.text.trim() || "Tanpa judul" : marker);
  const bar = dom("div", { className: "block-head" }, dom("div", {},
    named ? dom("span", { className: "block-marker" }, marker) : "", name));
  const controls = dom("div", { className: "button-row" });
  for (const [delta, name] of [[-1, "Naikkan blok"], [1, "Turunkan blok"]]) {
    const control = button(name, () => {
      const next = index + delta;
      [chapter.blocks[index], chapter.blocks[next]] = [chapter.blocks[next], block];
      save();
      render();
    }, "quiet");
    const adjacent = chapter.blocks[index + delta];
    control.disabled = !adjacent || adjacent.mepSafety || adjacent.mepSafetySelected !== undefined;
    controls.append(control);
  }
  controls.append(button("Hapus", () => {
    if (!confirm("Hapus bagian ini?")) return;
    chapter.blocks.splice(index, 1);
    save();
    render();
  }, "danger"));
  const settings = dom("details", { className: "editor-settings block-settings" }, dom("summary", {}, "Atur " + labels[block.type].toLocaleLowerCase("id")));
  if (named) settings.append(boundField(block, "text", block.type === "heading" ? "Judul subbab" : "Judul tabel", "text", () => {
    name.textContent = block.text.trim() || "Tanpa judul";
    const option = $("subchapter-picker")?.querySelector('option[value="' + index + '"]');
    if (option && headingInfo) option.textContent = headingInfo.number + " · " + name.textContent;
    if (block.mepSafetySelected !== undefined) {
      const label = $("mep-safety-option-" + block.sourceId);
      if (label) label.textContent = name.textContent;
      $("mep-safety-options")?.refreshSafetyPreview();
    }
    save();
  }));
  if (!block.mepSafety && block.mepSafetySelected === undefined) settings.append(controls);
  bar.append(settings);
  const wrapper = dom("section", { className: headingInfo?.nested ? "block nested-block" : "block", id: "edit-block-" + index, tabIndex: -1 }, bar);
  name.id = "block-title-" + index;
  wrapper.setAttribute("aria-labelledby", name.id);
  const linked = (key, label) => linkedText(current(), block, key, label, () => block.links ?? {}, (links) => { block.links = links; }, sources);
  if (block.type === "heading") {
    if (!inspectionIntroductions.has(block.body) || Object.hasOwn(block, "introduction")) {
      wrapper.append(introductionEditor(block, introductionText(chapter, block), "Pengantar subbab"));
    }
    const project = current();
    const isAttached = () => workspace.projects.includes(project) && project.chapters.includes(chapter) && chapter.blocks.includes(block);
    const locationInspection = mepLocationInspection(block);
    if (block.mepSafety) {
      wrapper.append(mepSafetyEditor(chapter, block, sources));
    } else if (locationInspection) {
      wrapper.append(locationInspection === lightningLocationInspection ? lightningLocationsEditor(block, isAttached) :
        mepLocationEditor(block, locationInspection, isAttached));
      if (hasLegacyMepLocationInspection(block, locationInspection)) {
        const previous = dom("details", { className: "narrative-editor" }, dom("summary", {}, "Lihat atau ubah catatan sebelumnya"));
        previous.addEventListener("toggle", () => {
          if (previous.open && previous.childElementCount === 1) previous.append(linked("body", "Isi subbab"));
        });
        wrapper.append(previous);
      }
    } else if (tokenName(block.text) === "pemeriksaan elemen struktur" || block.structureComponents) {
      wrapper.append(structureComponentsEditor(block, isAttached));
      if (hasLegacyStructureInspection(block)) {
        wrapper.append(dom("details", { className: "narrative-editor" }, dom("summary", {}, "Catatan pemeriksaan sebelumnya"),
          linked("body", "Isi subbab")));
      }
    } else if (isStructureConclusion(block)) {
      const preview = dom("div", { className: "structure-conclusion-preview" });
      preview.refreshSources = registry => preview.replaceChildren(...structureConclusionContent(chapter, block, registry));
      preview.refreshSources(sources);
      wrapper.append(dom("p", { className: "hint" }, "Kesimpulan dan rekomendasi diperbarui otomatis dari data sistem struktur, pemeriksaan elemen, hasil uji, dan tindak lanjut struktur."), preview);
      wrapper.append(dom("details", { className: "narrative-editor" },
        dom("summary", {}, "Tambah atau ubah catatan pengkaji"),
        boundField(block, "structureConclusionNote", "Catatan tambahan (opsional)", "area",
          () => { refreshLinkedFields(); save(); }, false)));
      if (hasWrittenStructureConclusion(block)) {
        const previous = dom("details", { className: "narrative-editor" }, dom("summary", {}, "Sunting isian terdahulu"));
        previous.addEventListener("toggle", () => {
          if (previous.open && previous.childElementCount === 1) previous.append(linkedText(project, block, "body", "Isi subbab",
            () => block.links ?? {}, links => { block.links = links; }, reportSources(project)));
        });
        wrapper.append(previous);
      }
    } else if (isStructureTesting(block)) {
      wrapper.append(structureTestingEditor(block, isAttached));
      if (hasLegacyStructureTesting(block)) {
        wrapper.append(dom("details", { className: "narrative-editor" }, dom("summary", {}, "Catatan pengujian sebelumnya"),
          linked("body", "Isi subbab")));
      }
    } else {
      wrapper.append(linked("body", "Isi subbab"));
    }
    wrapper.append(sectionPhotoEditor(block, "Unggah foto subbab", isAttached));
  }
  if (block.type === "text") wrapper.append(linked("text", "Isi paragraf"));
  if (block.type === "table") {
    const table = tableEditor(block);
    wrapper.append(isStructureRecap(block) ? dom("details", { className: "narrative-editor" },
      dom("summary", {}, "Buka tabel rekap (opsional)"),
      dom("p", { className: "hint" }, "Gunakan tabel jika ada rincian tambahan atau rekap yang sudah diisi. Entri pada Subbab 6.3 langsung masuk ke laporan."),
      table) : table);
  }
  if (block.type === "photo") {
    const project = current();
    wrapper.append(sectionPhotoEditor(block, "Unggah foto dokumentasi",
      () => project.chapters.includes(chapter) && chapter.blocks.includes(block), block.text));
  }
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

async function backup(project, owner, control, feedback) {
  const copy = structuredClone(project);
  control.disabled = true;
  try {
    const checklist = readChecklist(copy.id, owner);
    const photos = {};
    for (const key of checklistPhotos(checklist)) {
      const blob = await checklistPhoto(copy.id, key, undefined, owner);
      if (blob) photos[key] = await blobData(blob);
    }
    download("kajian-slf-" + copy.id.slice(0, 8) + ".json", JSON.stringify({ version: 1, project: copy, checklist, photos }));
    feedback.textContent = "Cadangan diunduh";
  } catch {
    feedback.textContent = "Cadangan gagal dibuat";
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
  function restorePhotos(target, owner) {
    if (owner.photos === undefined) return target;
    valid(Array.isArray(owner.photos));
    const photos = owner.photos.map((photo) => {
      valid(typeof photo?.image === "string" && imageSource.test(photo.image));
      return { image: photo.image, text: "", ...pickText(photo, ["text"]) };
    });
    if (photos.length) target.photos = photos;
    return target;
  }
  const chapters = source.chapters.map((chapter) => {
    valid(typeof chapter?.title === "string" && Array.isArray(chapter.blocks));
    const blocks = chapter.blocks.map((block) => {
      valid(block && ["heading", "text", "table", "photo"].includes(block.type) && typeof block.text === "string");
      const clean = { type: block.type, text: block.text };
      if (block.type === "heading") {
        valid(typeof block.body === "string");
        clean.body = block.body;
        if (typeof block.structureConclusionNote === "string") clean.structureConclusionNote = block.structureConclusionNote;
        if (typeof block.introduction === "string") clean.introduction = block.introduction;
        clean.depth = block.depth === 2 ? 2 : 1;
        if (block.mepSafety === true) clean.mepSafety = true;
        if (typeof block.mepSafetySelected === "boolean") clean.mepSafetySelected = block.mepSafetySelected;
        if (typeof block.mepSafetyPreset === "string") clean.mepSafetyPreset = block.mepSafetyPreset;
        if (block.structureTest && typeof block.structureTest === "object" && !Array.isArray(block.structureTest)) {
          const data = pickText(block.structureTest, ["pendingNote"]);
          const keys = ["parameter", ...structureTestFields.map(([key]) => key)];
          data.items = structureTestingItems(block.structureTest)
            .filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry))
            .map((entry) => restorePhotos(pickText(entry, ["id", ...keys]), entry));
          const status = block.structureTest.status;
          if (status === "available" || status === "unavailable") data.status = status;
          clean.structureTest = data;
        }
        if (Array.isArray(block.structureComponents)) {
          const keys = structureComponentFields.map(([key]) => key);
          clean.structureComponents = block.structureComponents
            .filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry))
            .map((entry) => restorePhotos(pickText(entry, ["id", ...keys]), entry));
        }
        if (Array.isArray(block.lightningLocations)) {
          const fields = lightningLocationInspection.fields.map(([key]) => key);
          clean.lightningLocations = block.lightningLocations.filter(entry => entry && typeof entry === "object" && !Array.isArray(entry))
            .map(entry => restorePhotos({ ...pickText(entry, fields), ...(entry.excluded === true ? { excluded: true } : {}) }, entry));
        }
        for (const [key, inspection] of [["fireInspections", fireLocationInspection], ["lightningInspections", lightningLocationInspection]]) {
          if (!Array.isArray(block[key])) continue;
          const fields = inspection.fields.map(([key]) => key);
          const seen = new Set();
          clean[key] = block[key].flatMap(facility => {
            if (typeof facility?.name !== "string" || !facility.name.trim() || !Array.isArray(facility.locations)) return [];
            const name = facility.name.trim();
            const key = tokenName(name);
            if (seen.has(key)) return [];
            seen.add(key);
            return [{ name, selected: facility.selected === true,
              locations: facility.locations.filter(entry => entry && typeof entry === "object" && !Array.isArray(entry))
                .map(entry => restorePhotos(pickText(entry, fields), entry)) }];
          });
        }
        upgradeLightningLocations(clean);
        if (Array.isArray(block.appearanceSections)) {
          const keys = [...appearanceSectionFields.map(([key]) => key), "evidence"];
          clean.appearanceSections = block.appearanceSections.filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry))
            .map((entry) => Object.fromEntries(keys.filter((key) => typeof entry[key] === "string").map((key) => [key, entry[key]])));
        }
        for (const key of ["roomLayoutAreas", "environmentAreas"]) {
          if (!Array.isArray(block[key])) continue;
          clean[key] = block[key].filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry))
            .map((entry) => ({ ...pickText(entry, key === "environmentAreas" ? environmentObservationFields : areaObservationFields),
              ...(key === "environmentAreas" && sourceUuid.test(entry.id) ? { id: entry.id } : {}),
              selected: entry.selected === true, manual: entry.manual === true }));
        }
      }
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
        if (Object.hasOwn(inspectionParameters, block.inspectionKind)) clean.inspectionKind = block.inspectionKind;
        if (clean.rowIds && block.headers.length >= architectureHealthColumns.length &&
            block.healthMeasurements && typeof block.healthMeasurements === "object" && !Array.isArray(block.healthMeasurements)) {
          clean.healthMeasurements = Object.fromEntries(clean.rowIds.flatMap((id) => {
            const entry = block.healthMeasurements[id];
            if (!entry || !Object.hasOwn(healthParameters, entry.parameter)) return [];
            const measurement = pickText(entry, healthMeasurementFields);
            const reference = measurement.healthSource?.split(":");
            if (architectureInspectionKind(clean) !== "comfort" || !reusableHealthParameter(entry.parameter) ||
                reference?.length !== 2 || !reference.every((part) => sourceUuid.test(part))) delete measurement.healthSource;
            return [[id, measurement]];
          }));
        }
        if (clean.rowIds && block.rowImages && typeof block.rowImages === "object") {
          const images = clean.rowIds.flatMap((id) => {
            const image = block.rowImages[id];
            return typeof image === "string" && imageSource.test(image) ? [[id, image]] : [];
          });
          if (images.length) clean.rowImages = Object.fromEntries(images);
        }
        if (block.teamLead === "director" || clean.rowIds?.includes(block.teamLead)) clean.teamLead = block.teamLead;
        if (clean.rowIds && clean.columnIds && block.cellLinks && typeof block.cellLinks === "object") {
          const keys = new Set(clean.rowIds.flatMap((row) => clean.columnIds.map((column) => row + ":" + column)));
          clean.cellLinks = Object.fromEntries(Object.entries(block.cellLinks).filter(([key, id]) =>
            keys.has(key) && validReportSource(id) && tableSourceAvailable(id, block)));
        }
      }
      const tableFormatKeys = clean.columnIds?.map((id) => "header:" + id) ?? [];
      if (clean.rowIds && clean.columnIds) {
        for (const row of clean.rowIds) for (const col of clean.columnIds) tableFormatKeys.push("cell:" + row + ":" + col);
      }
      importTextFormats(clean, block, ["text", "body", ...tableFormatKeys]);
      if (block.type === "photo" && block.image) { valid(imageSource.test(block.image)); clean.image = block.image; }
      return block.type === "heading" || block.type === "photo" ? restorePhotos(clean, block) : clean;
    });
    const clean = { title: chapter.title, blocks, checklist: chapter.checklist === true };
    if (typeof chapter.introduction === "string") clean.introduction = chapter.introduction;
    return restorePhotos(importTextFormats(clean, chapter, ["title"]), chapter);
  });
  const project = {
    id: crypto.randomUUID(), name: (source.name || "Kajian impor").slice(0, 120), template: source.template,
    ...([disciplineNarrativeRevision, architectureHealthTableRevision, architectureInspectionRevision].includes(source.narrativeRevision) ?
      { narrativeRevision: source.narrativeRevision } : {}),
    cover: pickText(source.cover, coverFields.map(([key]) => key)),
    front: pickText(source.front, frontFields.map(([key]) => key)),
    frontLinks: { preface: importLinks(source.frontLinks?.preface), approval: importLinks(source.frontLinks?.approval) },
    chapters,
  };
  if (typeof source.createdAt === "string" && Number.isFinite(Date.parse(source.createdAt))) {
    project.createdAt = new Date(source.createdAt).toISOString();
  }
  if (["badan-usaha", "perorangan"].includes(source.front?.consultantType)) {
    project.front.consultantType = source.front.consultantType;
  }
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
  const owner = slfCloudOwner();
  const signedInAs = slfAuthUser?.id;
  const state = workspace;
  const input = $("backup-file");
  const sameWorkspace = () => workspace === state && slfCloudOwner() === owner && slfAuthUser?.id === signedInAs && !isTrial();
  try {
    const raw = JSON.parse(await file.text());
    if (!sameWorkspace()) return;
    const { project, checklist } = validateBackup(raw);
    project.createdAt = new Date().toISOString();
    upgradeReportDraft(project);
    const photos = {};
    for (const key of checklistPhotos(checklist)) {
      const photo = raw.photos?.[key];
      if (typeof photo !== "string" || !/^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(photo)) continue;
      photos[key] = await (await fetch(photo)).blob();
      if (!sameWorkspace()) return;
    }
    await storeChecklistPhotos(project.id, photos, owner);
    if (!sameWorkspace()) return;
    localStorage.setItem(slfChecklistKey(project.id, owner), JSON.stringify(checklist));
    state.projects.push(project);
    setCurrent(project.id, true);
  } catch {
    if (sameWorkspace()) status.textContent = "Impor gagal. Periksa file cadangan atau ruang penyimpanan browser.";
  } finally {
    if (input.files[0] === file) input.value = "";
  }
}

let previewActualSize = false;

function fitReportPreview() {
  const target = $("report");
  const page = target.querySelector(".pagedjs_page");
  if (!dialog.open || !page?.offsetWidth) return;
  const style = getComputedStyle(target);
  const gutter = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const scale = Math.min(1, (target.clientWidth - gutter) / page.offsetWidth);
  target.style.setProperty("--preview-page-zoom", String(previewActualSize ? 1 : scale));
}

async function presentReport(print) {
  const buttons = [$("preview"), $("print")];
  if (buttons.some((control) => control.disabled)) return;
  buttons.forEach((control) => { control.disabled = true; });
  status.textContent = "Menyiapkan laporan…";
  const reportOwner = slfCloudOwner();
  const reportTrial = isTrial();
  try {
    const source = dom("article", { className: "report-print" });
    await buildReport(source, structuredClone(current()), reportUrls, { trial: reportTrial });
    disposePagination = await paginateReport(source, $("report"));
    if ($("slf-workspace").hidden || slfCloudOwner() !== reportOwner || reportTrial !== isTrial()) {
      disposePagination?.();
      disposePagination = undefined;
      $("report").replaceChildren();
      reportUrls.splice(0).forEach((url) => URL.revokeObjectURL(url));
      return;
    }
    previewActualSize = false;
    $("preview-zoom").textContent = "Perbesar";
    dialog.showModal();
    fitReportPreview();
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

function start() {
  workspace = slfLocalWorkspace();
  $("start-trial").addEventListener("click", () => setTrialView(true));
  $("start-trial").disabled = false;
  $("exit-trial").addEventListener("click", () => setTrialView(false));
  const sizeNavigation = () => { $("section-navigation").open = !narrowLayout.matches; };
  sizeNavigation();
  narrowLayout.addEventListener("change", sizeNavigation);
  $("projects").addEventListener("change", () => {
    const id = $("projects").value;
    if (workspace.projects.some((entry) => entry.id === id)) {
      setCurrent(id);
      slfRequestCloudSync();
    } else {
      slfQueueCloud(() => slfOpenDraft(id)).catch(() => {});
    }
  });
  const chapterDialog = $("chapter-dialog");
  const chapterForm = $("chapter-form");
  const chapterPosition = chapterForm.elements.position;
  const showChapterNumber = () => {
    $("chapter-number-hint").textContent = "Bab baru akan menjadi Bab " + roman(Number(chapterPosition.value) + 1) + ".";
  };
  $("add-chapter").addEventListener("click", () => {
    const project = current();
    chapterForm.reset();
    chapterPosition.replaceChildren(new Option("Sebelum bab pertama", "0"),
      ...project.chapters.map((_, index) => new Option("Setelah " + chapterLabel(project, index), String(index + 1))));
    chapterPosition.value = String(typeof active === "number" ? active + 1 : project.chapters.length);
    showChapterNumber();
    chapterDialog.showModal();
  });
  chapterPosition.addEventListener("change", showChapterNumber);
  $("chapter-cancel").addEventListener("click", () => chapterDialog.close());
  chapterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const { chapters } = current();
    const position = Number(chapterPosition.value);
    if (chapterPosition.value === "" || !Number.isInteger(position) || position < 0 || position > chapters.length) return;
    const title = chapterForm.elements.title.value.trim() || "Bab baru";
    chapters.splice(position, 0, { title, blocks: [heading("")], checklist: false });
    active = position;
    chapterDialog.close();
    save();
    render();
    focusTextField(editor.querySelector("input"));
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
    project.createdAt = new Date().toISOString();
    workspace.projects.push(project);
    $("project-dialog").close();
    form.reset();
    explain();
    setCurrent(project.id, true);
  });
  $("preview-zoom").addEventListener("click", () => {
    previewActualSize = !previewActualSize;
    $("preview-zoom").textContent = previewActualSize ? "Pas lebar" : "Perbesar";
    fitReportPreview();
  });
  new ResizeObserver(fitReportPreview).observe($("report"));
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
  const backupControl = $("backup");
  backupControl.addEventListener("click", () => backup(current(), slfCloudOwner(), backupControl, status));
  $("restore").addEventListener("click", () => $("backup-file").click());
  $("backup-file").addEventListener("change", () => {
    if (!isTrial() && $("backup-file").files[0]) importBackup($("backup-file").files[0]);
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== slfChecklistKey(current().id, slfCloudOwner())) return;
    slfRememberEdit(current().id);
    if (slfCloudOwner()) save(false);
    refreshLinkedFields();
    refreshChecklistViews();
  });
  render();
  initSlfDashboard();
  initSlfCloud();
}

start();
