"use strict";

const textFonts = {
  arial: "Arial, sans-serif", calibri: "Calibri, sans-serif",
  cambria: "Cambria, serif", georgia: "Georgia, serif",
  times: '"Times New Roman", serif', segoe: '"Segoe UI", sans-serif',
};
const textInlineRules = {
  font: (value) => typeof value === "string" && Object.hasOwn(textFonts, value),
  size: (value) => Number.isInteger(value) && value >= 8 && value <= 28,
  bold: (value) => typeof value === "boolean",
  italic: (value) => typeof value === "boolean",
  underline: (value) => typeof value === "boolean",
};
const textBlockRules = {
  align: (value) => ["left", "center", "right", "justify"].includes(value),
  spacing: (value) => [1, 1.15, 1.5, 2].includes(value),
  left: (value) => Number.isInteger(value) && value >= 0 && value <= 30,
  right: (value) => Number.isInteger(value) && value >= 0 && value <= 30,
  first: (value) => Number.isInteger(value) && value >= 0 && value <= 20,
};
const maxFormatRuns = 1000;

function allowedTextStyle(source, rules) {
  return Object.fromEntries(Object.entries(rules).filter(([key, allowed]) =>
    Object.hasOwn(source ?? {}, key) && allowed(source[key])).map(([key]) => [key, source[key]]));
}

function cleanTextFormat(source) {
  const base = allowedTextStyle(source?.base, textInlineRules);
  const block = allowedTextStyle(source?.block, textBlockRules);
  const runs = [];
  let last = 0;
  for (const entry of Array.isArray(source?.runs) ? source.runs.slice(0, maxFormatRuns) : []) {
    if (!Number.isSafeInteger(entry?.start) || !Number.isSafeInteger(entry?.end) ||
        entry.start < last || entry.end <= entry.start) continue;
    const style = allowedTextStyle(entry.style, textInlineRules);
    if (!Object.keys(style).length) continue;
    runs.push({ start: entry.start, end: entry.end, style });
    last = entry.end;
  }
  return Object.keys(base).length || Object.keys(block).length || runs.length ? { base, block, runs } : undefined;
}

function getTextFormat(owner, key) {
  return Object.hasOwn(owner?._format ?? {}, key) ? cleanTextFormat(owner._format[key]) : undefined;
}

function setTextFormat(owner, key, value) {
  const format = cleanTextFormat(value);
  if (format) (owner._format ??= {})[key] = format;
  else if (owner._format) {
    delete owner._format[key];
    if (!Object.keys(owner._format).length) delete owner._format;
  }
}

function importTextFormats(target, source, keys) {
  for (const key of keys) setTextFormat(target, key, getTextFormat(source, key));
  return target;
}

function addFormatRun(runs, start, end, style) {
  if (start >= end || !Object.keys(style).length) return;
  const previous = runs.at(-1);
  if (previous?.end === start && Object.keys(previous.style).length === Object.keys(style).length &&
      Object.entries(style).every(([key, value]) => previous.style[key] === value)) {
    previous.end = end;
  } else {
    runs.push({ start, end, style });
  }
}

function updateTextFormat(owner, key, before, after) {
  const format = getTextFormat(owner, key);
  if (!format?.runs.length || before === after) return;
  let start = 0;
  let cut = before.length;
  let insertedEnd = after.length;
  while (start < cut && start < insertedEnd && before[start] === after[start]) start++;
  while (cut > start && insertedEnd > start && before[cut - 1] === after[insertedEnd - 1]) {
    cut--;
    insertedEnd--;
  }
  const delta = insertedEnd - cut;
  const runs = [];
  const inherited = format.runs.find((run) => run.start <= start && start < run.end);
  for (const { start: from, end: to, style } of format.runs) addFormatRun(runs, from, Math.min(to, start), style);
  if (inherited) addFormatRun(runs, start, insertedEnd, inherited.style);
  for (const { start: from, end: to, style } of format.runs) addFormatRun(runs, Math.max(from, cut) + delta, to + delta, style);
  setTextFormat(owner, key, { ...format, runs });
}

function selectedTextStyle(format, position) {
  const run = format?.runs.find(({ start, end }) => start <= position && position < end);
  return { ...format?.base, ...run?.style };
}

function applyTextRun(format, start, end, key, value) {
  const change = (style) => {
    const next = { ...style };
    if (value === undefined || format.base[key] === value) delete next[key];
    else next[key] = value;
    return next;
  };
  const runs = [];
  let last = start;
  for (const run of format.runs) {
    if (run.end <= start || run.start >= end) {
      if (run.start >= end && last < end) {
        addFormatRun(runs, last, end, change({}));
        last = end;
      }
      addFormatRun(runs, run.start, run.end, run.style);
      continue;
    }
    addFormatRun(runs, run.start, start, run.style);
    addFormatRun(runs, last, Math.min(end, run.start), change({}));
    const overlapEnd = Math.min(end, run.end);
    addFormatRun(runs, Math.max(start, run.start), overlapEnd, change(run.style));
    addFormatRun(runs, end, run.end, run.style);
    last = overlapEnd;
  }
  addFormatRun(runs, last, end, change({}));
  format.runs = runs;
}

function styleTextBlock(element, format) {
  const style = format?.block;
  if (!style) return element;
  if (style.align) element.style.textAlign = style.align;
  if (style.spacing) element.style.lineHeight = style.spacing;
  if (style.left) element.style.paddingInlineStart = style.left + "mm";
  if (style.right) element.style.paddingInlineEnd = style.right + "mm";
  if (style.first) element.style.textIndent = style.first + "mm";
  return element;
}

function styleTextSpan(text, style) {
  if (!Object.keys(style ?? {}).length) return document.createTextNode(text);
  const span = document.createElement("span");
  span.textContent = text;
  if (style.font) span.style.fontFamily = textFonts[style.font];
  if (style.size) span.style.fontSize = style.size + "pt";
  if (style.bold !== undefined) span.style.fontWeight = style.bold ? "bold" : "normal";
  if (style.italic !== undefined) span.style.fontStyle = style.italic ? "italic" : "normal";
  if (style.underline !== undefined) span.style.textDecoration = style.underline ? "underline" : "none";
  return span;
}

function formattedText(text, format, replaceToken, offset = 0) {
  const fragment = document.createDocumentFragment();
  function literal(from, to) {
    if (from >= to) return;
    let left = from;
    for (const { start, end, style } of format?.runs ?? []) {
      const first = Math.max(from, start - offset);
      const last = Math.min(to, end - offset);
      if (last <= first) continue;
      if (first > left) fragment.append(styleTextSpan(text.slice(left, first), format.base));
      fragment.append(styleTextSpan(text.slice(first, last), { ...format.base, ...style }));
      left = last;
    }
    if (left < to) fragment.append(styleTextSpan(text.slice(left, to), format?.base));
  }
  let previous = 0;
  if (replaceToken) {
    for (const match of text.matchAll(/\[([^\[\]\r\n]+)\]/g)) {
      const [original, label] = match;
      const result = replaceToken(original, label);
      const value = typeof result === "object" ? result.value : result;
      if (original === value) continue;
      literal(previous, match.index);
      const style = selectedTextStyle(format, match.index + offset);
      const source = typeof result === "object" ? result.format : undefined;
      fragment.append(source ? formattedText(value, { ...source, base: { ...source.base, ...style } }) : styleTextSpan(value, style));
      previous = match.index + original.length;
    }
  }
  literal(previous, text.length);
  return fragment;
}

function formattedValue(text, format, replaceToken) {
  if (!format && !replaceToken) return text;
  const element = styleTextBlock(document.createElement("div"), format);
  element.className = "formatted-value";
  element.append(formattedText(text, format, replaceToken));
  return element;
}

function textFormatControl(label, control, owner, key, changed) {
  const node = (tag, properties = {}, ...children) => {
    const element = Object.assign(document.createElement(tag), properties);
    element.append(...children);
    return element;
  };
  const panel = node("details", { className: "text-format-panel" });
  const preview = node("div", { className: "text-format-preview" });
  const toolbar = node("div", { className: "text-format-toolbar", role: "group", ariaLabel: "Pengaturan teks" });
  const ruler = node("div", { className: "text-format-ruler" });
  const wrapper = node("div", { className: "text-format-field" }, label, panel);
  if (label.classList.contains("wide")) wrapper.classList.add("wide");
  let previous = control.value;
  let selection = [0, 0];
  const readers = [];
  const formatLabel = node("summary", {}, "Format teks");
  panel.append(formatLabel, toolbar, ruler, node("p", { className: "text-format-hint" },
    "Blok teks untuk mengatur sebagian tulisan. Tanpa seleksi, format huruf berlaku untuk seluruh kolom. Pengaturan baris berlaku untuk seluruh kolom."),
    preview);

  function sync() {
    const format = getTextFormat(owner, key);
    preview.removeAttribute("style");
    styleTextBlock(preview, format);
    preview.replaceChildren(formattedText(control.value, format));
    preview.hidden = !control.value;
    formatLabel.textContent = format ? "Format teks · diatur" : "Format teks";
    const style = selection[0] === selection[1] ? format?.base : selectedTextStyle(format, selection[0]);
    for (const read of readers) read(style ?? {}, format?.block ?? {});
  }

  function selectRange() {
    selection = [control.selectionStart ?? 0, control.selectionEnd ?? 0];
    if (panel.open) sync();
  }

  function write(keyName, value, block = false) {
    const format = getTextFormat(owner, key) ?? { base: {}, block: {}, runs: [] };
    if (block) {
      if (value === undefined || value === 0) delete format.block[keyName];
      else format.block[keyName] = value;
    } else if (control.readOnly || selection[0] === selection[1]) {
      if (value === undefined) delete format.base[keyName];
      else format.base[keyName] = value;
      format.runs = format.runs.map((run) => {
        const style = { ...run.style };
        delete style[keyName];
        return { ...run, style };
      });
    } else {
      applyTextRun(format, ...selection, keyName, value);
    }
    setTextFormat(owner, key, format);
    sync();
    changed();
  }

  function select(labelText, keyName, values, block = false) {
    const control = node("select", { ariaLabel: labelText }, new Option("Bawaan", ""),
      ...values.map(([value, label]) => new Option(label, String(value))));
    control.addEventListener("change", () => {
      const value = values.find(([candidate]) => String(candidate) === control.value)?.[0];
      write(keyName, value, block);
    });
    readers.push((style, layout) => { control.value = String((block ? layout : style)[keyName] ?? ""); });
    toolbar.append(node("label", {}, labelText, control));
  }

  select("Font", "font", [["arial", "Arial"], ["calibri", "Calibri"], ["cambria", "Cambria"],
    ["georgia", "Georgia"], ["times", "Times New Roman"], ["segoe", "Segoe UI"]]);
  select("Ukuran huruf", "size", [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28].map((n) => [n, n + " pt"]));
  const toggles = node("div", { className: "text-format-toggles" });
  for (const [keyName, marker, title] of [["bold", "B", "Tebal"], ["italic", "I", "Miring"], ["underline", "U", "Garis bawah"]]) {
    const button = node("button", { type: "button", className: "format-" + keyName, title, ariaLabel: title, ariaPressed: "false" }, marker);
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => write(keyName, button.getAttribute("aria-pressed") !== "true"));
    readers.push((style) => button.setAttribute("aria-pressed", String(Boolean(style[keyName]))));
    toggles.append(button);
  }
  toolbar.append(toggles);
  select("Perataan", "align", [["left", "Rata kiri"], ["center", "Tengah"], ["right", "Rata kanan"], ["justify", "Rata kiri-kanan"]], true);
  select("Spasi baris", "spacing", [[1, "1"], [1.15, "1,15"], [1.5, "1,5"], [2, "2"]], true);
  for (const [name, keyName, max] of [["Indent kiri", "left", 30], ["Indent baris pertama", "first", 20], ["Indent kanan", "right", 30]]) {
    const input = node("input", { type: "range", min: "0", max: String(max), step: "1", ariaLabel: name });
    const output = node("output");
    input.addEventListener("input", () => write(keyName, Number(input.value), true));
    readers.push((_, layout) => { input.value = String(layout[keyName] ?? 0); output.value = input.value + " mm"; });
    ruler.append(node("label", {}, name, output, input));
  }
  const reset = node("button", { type: "button", className: "text-format-reset" }, "Hapus format");
  reset.addEventListener("click", () => {
    setTextFormat(owner, key, undefined);
    sync();
    changed();
  });
  toolbar.append(reset);

  for (const event of ["select", "keyup", "pointerup", "blur"]) control.addEventListener(event, selectRange);
  control.addEventListener("input", () => {
    updateTextFormat(owner, key, previous, control.value);
    previous = control.value;
    selectRange();
    if (!panel.open) sync();
  }, true);
  panel.addEventListener("toggle", sync);
  wrapper.syncTextFormat = () => { previous = control.value; selection = [0, 0]; sync(); };
  sync();
  return wrapper;
}
