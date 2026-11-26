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
      const node = typeof result === "object" ? result.node : undefined;
      fragment.append(node ?? (source ? formattedText(value, { ...source, base: { ...source.base, ...style } }) : styleTextSpan(value, style)));
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
  const multiline = control.tagName === "TEXTAREA";
  const title = control.getAttribute("aria-label") || label.querySelector(":scope > span:not(.print-value)")?.textContent ||
    [...label.childNodes].find((child) => child.nodeType === Node.TEXT_NODE)?.textContent || "Isian teks";
  const surface = node("div", { className: "text-format-surface", role: "textbox", ariaLabel: title, tabIndex: 0 });
  surface.setAttribute("aria-multiline", String(multiline));
  const toolbar = node("div", { className: "text-format-toolbar", role: "group", ariaLabel: "Pengaturan teks" });
  const ruler = node("div", { className: "text-format-ruler", hidden: true });
  const formatOptions = node("details", { className: "format-options" },
    node("summary", {}, "Format teks"), toolbar, ruler);
  const frame = node("div", { className: "text-format-frame" }, surface, formatOptions);
  const wrapper = node("div", { className: "text-format-field" }, label, frame);
  if (label.classList.contains("wide")) wrapper.classList.add("wide");
  if (!multiline) wrapper.classList.add("text-format-compact");
  control.hidden = true;
  let previous = control.value;
  let selection = [0, 0];
  let composing = false;
  let lastEdit = 0;
  const history = [];
  const forward = [];
  const readers = [];

  function readSelection() {
    const current = document.getSelection();
    if (!current?.rangeCount) return selection;
    const range = current.getRangeAt(0);
    if (!surface.contains(range.startContainer) || !surface.contains(range.endContainer)) return selection;
    const prefix = document.createRange();
    prefix.selectNodeContents(surface);
    prefix.setEnd(range.startContainer, range.startOffset);
    const start = prefix.toString().length;
    return (selection = [start, start + range.toString().length]);
  }

  function placeSelection([start, end]) {
    const range = document.createRange();
    function point(offset) {
      const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
      let remaining = offset;
      while (walker.nextNode()) {
        if (remaining <= walker.currentNode.length) return [walker.currentNode, remaining];
        remaining -= walker.currentNode.length;
      }
      return [surface, surface.childNodes.length];
    }
    range.setStart(...point(start));
    range.setEnd(...point(end));
    const current = document.getSelection();
    current.removeAllRanges();
    current.addRange(range);
  }

  function refreshToolbar() {
    const format = getTextFormat(owner, key);
    const style = selection[0] === selection[1] ? format?.base : selectedTextStyle(format, selection[0]);
    for (const read of readers) read(style ?? {}, format?.block ?? {});
  }

  function paint(restore = false) {
    const format = getTextFormat(owner, key);
    surface.removeAttribute("style");
    styleTextBlock(surface, format);
    surface.replaceChildren(formattedText(control.value, format));
    if (control.value.endsWith("\n")) surface.append(node("br"));
    if (restore) placeSelection(selection);
    refreshToolbar();
  }

  function syncAttributes() {
    surface.dataset.placeholder = control.placeholder;
    surface.setAttribute("aria-placeholder", control.placeholder);
    surface.contentEditable = control.readOnly ? "false" : "true";
    surface.setAttribute("aria-readonly", String(control.readOnly));
  }

  function snapshot() {
    return { text: control.value, format: getTextFormat(owner, key), selection: [...selection] };
  }

  function remember(edit = false) {
    if (!edit || Date.now() - lastEdit > 650) {
      history.push(snapshot());
      if (history.length > 100) history.shift();
    }
    forward.length = 0;
    lastEdit = edit ? Date.now() : 0;
  }

  function syncValue(value) {
    control.value = value;
    control.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function undo(from, to) {
    if (!from.length) return;
    to.push(snapshot());
    const entry = from.pop();
    setTextFormat(owner, key, entry.format);
    lastEdit = 0;
    selection = entry.selection;
    previous = entry.text;
    syncValue(entry.text);
  }

  function write(keyName, value, block = false, refocus = true) {
    const format = getTextFormat(owner, key) ?? { base: {}, block: {}, runs: [] };
    remember();
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
    if (refocus) surface.focus({ preventScroll: true });
    paint(document.activeElement === surface);
    changed();
  }

  function select(labelText, keyName, values, block = false) {
    const select = node("select", { ariaLabel: labelText, title: labelText }, new Option(labelText, ""),
      ...values.map(([value, name]) => new Option(name, String(value))));
    select.addEventListener("change", () => {
      const value = values.find(([candidate]) => String(candidate) === select.value)?.[0];
      write(keyName, value, block);
    });
    readers.push((style, layout) => { select.value = String((block ? layout : style)[keyName] ?? ""); });
    toolbar.append(select);
  }

  select("Font", "font", [["arial", "Arial"], ["calibri", "Calibri"], ["cambria", "Cambria"],
    ["georgia", "Georgia"], ["times", "Times New Roman"], ["segoe", "Segoe UI"]]);
  select("Ukuran huruf", "size", [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28].map((n) => [n, n + " pt"]));
  const toggles = node("div", { className: "text-format-toggles" });
  const styles = [["bold", "B", "Tebal"], ["italic", "I", "Miring"], ["underline", "U", "Garis bawah"]];
  for (const [keyName, marker, name] of styles) {
    const button = node("button", { type: "button", className: "format-" + keyName, title: name, ariaLabel: name, ariaPressed: "false" }, marker);
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => write(keyName, button.getAttribute("aria-pressed") !== "true"));
    readers.push((style) => button.setAttribute("aria-pressed", String(Boolean(style[keyName]))));
    toggles.append(button);
  }
  toolbar.append(toggles);
  select("Perataan", "align", [["left", "Rata kiri"], ["center", "Tengah"], ["right", "Rata kanan"], ["justify", "Rata kiri-kanan"]], true);
  select("Spasi baris", "spacing", [[1, "1"], [1.15, "1,15"], [1.5, "1,5"], [2, "2"]], true);
  const indent = node("button", { type: "button", ariaExpanded: "false" }, "Indent");
  indent.addEventListener("click", () => {
    ruler.hidden = !ruler.hidden;
    indent.setAttribute("aria-expanded", String(!ruler.hidden));
  });
  toolbar.append(indent);
  for (const [name, keyName, max] of [["Indent kiri", "left", 30], ["Indent baris pertama", "first", 20], ["Indent kanan", "right", 30]]) {
    const input = node("input", { type: "range", min: "0", max: String(max), step: "1", ariaLabel: name });
    const output = node("output");
    input.addEventListener("input", () => write(keyName, Number(input.value), true, false));
    readers.push((_, layout) => { input.value = String(layout[keyName] ?? 0); output.value = input.value + " mm"; });
    ruler.append(node("label", {}, name, output, input));
  }
  const reset = node("button", { type: "button" }, "Hapus format");
  reset.addEventListener("click", () => {
    remember();
    setTextFormat(owner, key, undefined);
    paint(document.activeElement === surface);
    changed();
  });
  toolbar.append(reset);

  function replaceSelection(text) {
    const [start, end] = readSelection();
    remember();
    selection = [start + text.length, start + text.length];
    syncValue(control.value.slice(0, start) + text + control.value.slice(end));
  }

  function commitSurface() {
    const text = surface.textContent;
    if (text === control.value) return;
    readSelection();
    remember(true);
    syncValue(text);
  }

  surface.addEventListener("beforeinput", (event) => {
    if (event.inputType === "insertParagraph" || event.inputType === "insertLineBreak") {
      event.preventDefault();
      if (multiline) replaceSelection("\n");
    }
    if (event.inputType === "historyUndo" || event.inputType === "historyRedo") {
      event.preventDefault();
      if (event.inputType === "historyUndo") undo(history, forward);
      else undo(forward, history);
    }
  });
  surface.addEventListener("paste", (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");
    replaceSelection(multiline ? text : text.replace(/\n+/g, " "));
  });
  surface.addEventListener("drop", (event) => event.preventDefault());
  surface.addEventListener("compositionstart", () => { composing = true; });
  surface.addEventListener("compositionend", () => { composing = false; commitSurface(); });
  surface.addEventListener("input", () => { if (!composing) commitSurface(); });
  surface.addEventListener("keydown", (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    const shortcut = event.key.toLowerCase();
    const keyName = { b: "bold", i: "italic", u: "underline" }[shortcut];
    if (keyName) {
      event.preventDefault();
      readSelection();
      const format = getTextFormat(owner, key);
      const style = selection[0] === selection[1] ? format?.base : selectedTextStyle(format, selection[0]);
      write(keyName, !style?.[keyName]);
    }
    if (shortcut === "z" || shortcut === "y") {
      event.preventDefault();
      if (!event.shiftKey && shortcut === "z") undo(history, forward);
      else undo(forward, history);
    }
  });
  for (const event of ["keyup", "pointerup", "blur"]) surface.addEventListener(event, () => { readSelection(); refreshToolbar(); });
  label.addEventListener("click", (event) => {
    if (event.target !== control) surface.focus();
  });
  new MutationObserver(syncAttributes).observe(control, { attributes: true, attributeFilter: ["placeholder", "readonly"] });
  control.addEventListener("input", () => {
    updateTextFormat(owner, key, previous, control.value);
    previous = control.value;
    paint(document.activeElement === surface);
  }, true);

  wrapper.syncTextFormat = () => {
    if (previous !== control.value) {
      history.length = forward.length = 0;
      selection = [0, 0];
      previous = control.value;
    }
    syncAttributes();
    paint();
  };
  wrapper.setTextChoices = (values) => {
    const select = node("select", { ariaLabel: "Pilihan isian" }, new Option("Pilihan isian", ""),
      ...values.map((value) => new Option(value, value)));
    select.addEventListener("change", () => {
      if (!select.value || control.readOnly) return;
      remember();
      syncValue(select.value);
      select.value = "";
      surface.focus();
    });
    readers.push(() => { select.disabled = control.readOnly; });
    frame.insertBefore(select, formatOptions);
  };
  wrapper.syncTextFormat();
  return wrapper;
}

function focusTextField(control) {
  (control?.closest(".text-format-field")?.querySelector(".text-format-surface") || control)?.focus();
}
