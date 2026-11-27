"use strict";

const reportPaper = { width: 210, height: 297, top: 18, side: 18, bottom: 20 };
const reportLayoutStyle = `
  .report-print { font: 11pt/1.4 "Segoe UI", sans-serif; color: #172a27; overflow-wrap: anywhere; }
  .report-print .report-cover { display: grid; align-content: center; min-height: 235mm; text-align: center; }
  .report-print .report-cover h1 { font-size: 27pt; margin: 14px 0; text-transform: uppercase; }
  .report-print .paper-kicker { font-size: 11pt; font-weight: 700; }
  .report-print .cover-building { font-size: 17pt; font-weight: 700; }
  .report-print .cover-photo { width: auto; height: auto; max-width: calc(min(100%, 126mm) * var(--report-image-scale, 1)); max-height: calc(76mm * var(--report-image-scale, 1)); margin: 12px auto; }
  .report-print > .report-section { break-before: page; }
  .report-print h2 { font-size: 18pt; margin: 0 0 15px; break-after: avoid; }
  .report-print h3 { margin: 11px 0 6px; break-after: avoid; }
  .report-print h4 { margin: 6px 0 3px; break-after: avoid; }
  .report-print .front-doc { font-size: 11pt; line-height: 1.4; }
  .report-print .report-text { white-space: pre-wrap; margin: 0 0 9px; orphans: 3; widows: 3; }
  .report-print .front-doc .report-text { margin-bottom: 10px; }
  .report-print #report-approval { font-size: 10.8pt; line-height: 1.37; }
  .report-print #report-approval .report-text { margin-bottom: 8px; }
  .report-print .report-signoff { width: 76mm; margin: 11px 0 0 auto; text-align: center; break-inside: avoid; }
  .report-print .report-signoff p { margin: 0 0 2px; }
  .report-print .signature-space { height: 24mm; }
  .report-print .signatory-name { font-weight: 700; }
  .report-print ul { list-style: none; margin: 0 0 5px; padding: 0; }
  .report-print .sub-outline { padding-left: 15px; }
  .report-print .nested-outline { padding-left: 15px; }
  .report-print .toc > li > a { font-weight: 700; margin-top: 5px; }
  .report-print .toc-row { display: flex; align-items: baseline; gap: 5px; color: inherit; text-decoration: none; break-inside: avoid; }
  .report-print .toc-title { min-width: 0; }
  .report-print .toc-leader { flex: 1; min-width: 12px; border-bottom: 1px dotted #80948e; }
  .report-print .toc-page { flex: 0 0 33px; text-align: right; font-variant-numeric: tabular-nums; }
  .report-print .toc-row:hover .toc-title { text-decoration: underline; }
  .report-print .contents-index { margin: 0 0 13px; }
  .report-print table { border-collapse: collapse; width: 100%; table-layout: fixed; margin: 8px 0 12px; }
  .report-print th, .report-print td { padding: 6px; border: 1px solid #c7d4cf; text-align: left; vertical-align: top; white-space: pre-wrap; }
  .report-print td { text-align: justify; }
  .report-print td .formatted-value { text-align: inherit !important; }
  .report-print th { background: #e8efeb; }
  .report-print td img.report-table-image { width: auto; height: auto; max-width: min(100%, 36mm); max-height: 26mm; margin: 4px auto 0; }
  .report-print thead { display: table-header-group; break-inside: avoid; break-after: avoid; }
  .report-print tr, .report-print figure { break-inside: avoid; }
  .report-print .report-table-fit { break-inside: avoid; }
  .report-print .simak-item.fit:not(.report-table-fit) { break-inside: auto; }
  .report-print figure { margin: 12px 0; }
  .report-print img { display: block; max-width: calc(100% * var(--report-image-scale, 1)); max-height: calc(420px * var(--report-image-scale, 1)); object-fit: contain; margin: 4px 0; break-inside: avoid; }
  .report-print .site-diagram img { margin-inline: auto; }
  .report-print .caption, .report-print figcaption { font-size: 10pt; font-weight: 650; break-after: avoid; }
  .report-print .report-photo-row { display: flex; justify-content: center; align-items: flex-start; gap: 6mm; margin: 3mm 0; break-inside: avoid; }
  .report-print .report-photo-row > .report-photo { flex: 0 1 calc((100% - 6mm) / 2); min-width: 0; margin: 0; }
  .report-print .report-photo-row:not([data-report-photo-pair]) > .report-photo { flex-basis: 126mm; max-width: 100%; }
  .report-print .report-photo img { width: auto; height: auto; max-height: calc(62mm * var(--report-image-scale, 1)); margin: 0 auto 2mm; }
  .report-print .report-photo-row:not([data-report-photo-pair]) .report-photo img { max-height: calc(76mm * var(--report-image-scale, 1)); }
  .report-print [data-report-figure] > figcaption { text-align: center !important; break-after: auto; }
  .report-print .result-values { margin: 3px 0 6px; }
  .report-print .result-values dt { font-weight: 650; }
  .report-print .result-values dd { margin-left: 0; margin-bottom: 3px; }
  .report-print .result-values img { max-height: 180px; }
`;
const reportPrintStyle = `
  @page {
    size: A4;
    margin: ${reportPaper.top}mm ${reportPaper.side}mm ${reportPaper.bottom}mm;
    @bottom-center { content: counter(page); font: 10pt "Segoe UI", sans-serif; color: #38564f; }
  }
  @page :first { @bottom-center { content: none; } }
  ${reportLayoutStyle}
`;

function reportTableBlock(table) {
  return table.parentElement.matches(".report-block, .simak-item") ? table.parentElement : table;
}

async function measureReportTables(source, staging) {
  const tables = [...source.querySelectorAll("table")].filter((table) => table.tHead && table.tBodies.length);
  if (!tables.length) return;
  const styles = dom("style", {}, reportLayoutStyle + simakFormStyle);
  const ruler = dom("div");
  const measure = dom("div", {}, ruler, source);
  measure.style.width = (reportPaper.width - 2 * reportPaper.side) + "mm";
  ruler.style.height = (reportPaper.height - reportPaper.top - reportPaper.bottom) + "mm";
  staging.append(styles, measure);
  try {
    await Promise.all([...source.querySelectorAll("table img")].map((img) => img.decode().catch(() => {})));
    await document.fonts.ready;
    const pageHeight = ruler.getBoundingClientRect().height;
    for (const table of tables) {
      const block = reportTableBlock(table);
      const box = block.getBoundingClientRect();
      const css = getComputedStyle(block);
      const height = box.height + parseFloat(css.marginTop) + parseFloat(css.marginBottom);
      block.classList.toggle("report-table-fit", height <= pageHeight - 2);
    }
  } finally {
    source.remove();
    styles.remove();
    measure.remove();
  }
}

function overflowElement(range) {
  const container = range.startContainer;
  const node = container.nodeType === Node.ELEMENT_NODE ? container.childNodes[range.startOffset] ?? container : container;
  return node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
}

function connectTablePagination(chunker) {
  let continuedTable;
  chunker.hooks.onPageLayout.register((_rendered, token) => {
    const node = token?.node;
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    continuedTable = element?.closest("tbody")?.closest("table");
  });
  chunker.hooks.layout.register((rendered) => {
    if (!continuedTable?.tHead) return;
    const table = rendered.querySelector('table[data-ref="' + continuedTable.dataset.ref + '"]');
    if (!table || table.tHead || !table.tBodies.length) return;
    if (!table.querySelector(":scope > colgroup")) {
      for (const columns of continuedTable.querySelectorAll(":scope > colgroup")) {
        table.insertBefore(columns.cloneNode(true), table.tBodies[0]);
      }
    }
    table.insertBefore(continuedTable.tHead.cloneNode(true), table.tBodies[0]);
  });
  chunker.hooks.onOverflow.register((range, rendered, bounds) => {
    if (!range) return;
    const element = overflowElement(range);
    const table = element?.closest("table");
    if (!table?.tHead) return;
    const firstRow = table.tBodies[0]?.rows[0];
    if (!table.tHead.contains(element) && !firstRow?.contains(element)) return;
    if (table.dataset.ref === continuedTable?.dataset.ref) return;
    const block = reportTableBlock(table);
    if (block.getBoundingClientRect().top > bounds.top + 2 && rendered.contains(block)) range.setStartBefore(block);
    return range;
  });
}

function imageBlock(element) {
  return element?.closest(".report-photo-row") ?? element?.closest("figure, img.cover-photo");
}

function imageBlockTop(block, bounds) {
  const box = block.getBoundingClientRect();
  if (box.left < bounds.right - 1) return box.top;
  // The layout engine can put a whole figure in the next column before testing overflow.
  const previous = block.previousElementSibling;
  const last = [...(previous?.getClientRects() ?? [])].at(-1);
  if (!last || last.left >= bounds.right - 1) return Infinity;
  return last.bottom + Math.max(parseFloat(getComputedStyle(previous).marginBottom) || 0,
    parseFloat(getComputedStyle(block).marginTop) || 0);
}

function connectImagePagination(chunker) {
  chunker.hooks.onOverflow.register((range, rendered, bounds, layout) => {
    if (!range) return;
    const block = imageBlock(overflowElement(range));
    if (!block || !rendered.contains(block) || block.closest("table")) return;
    const figures = block.matches(".report-photo-row") ? [...block.children] : [block];
    const images = figures.map((figure) => {
      const image = figure.matches("img") ? figure : figure.querySelector("img");
      if (!image?.naturalWidth) return null;
      return { height: image.getBoundingClientRect().height, figureHeight: figure.getBoundingClientRect().height };
    });
    if (images.some((entry) => !entry || !entry.height)) return;
    const top = imageBlockTop(block, bounds);
    const space = bounds.bottom - top - 2;
    const ratio = Math.min(...images.map(({ height, figureHeight }) => (space - figureHeight + height) / height));
    const previous = block.style.getPropertyValue("--report-image-scale");
    const scale = ratio * (Number(previous) || 1);
    if (scale >= 0.9 && ratio < 1) {
      block.style.setProperty("--report-image-scale", scale);
      const next = layout.findOverflow(rendered, bounds);
      if (!next || imageBlock(overflowElement(next)) !== block) return next ?? null;
      if (previous) block.style.setProperty("--report-image-scale", previous);
      else block.style.removeProperty("--report-image-scale");
    }
    if (top > bounds.top + 2 && block.getBoundingClientRect().top > bounds.top + 2) {
      range.setStartBefore(block);
      return range;
    }
  });
}

function connectContents(pages) {
  const destinations = new Map();
  const jumps = [...pages.querySelectorAll("[data-report-jump]")];
  const targets = new Set(Array.from(pages.querySelectorAll("[data-page-for]"), (element) => element.dataset.pageFor));
  for (const jump of jumps) targets.add(jump.dataset.reportJump);
  for (const [index, page] of [...pages.querySelectorAll(".pagedjs_page")].entries()) {
    for (const element of page.querySelectorAll("[id], [data-id]")) {
      const id = element.id || element.dataset.id;
      if (!targets.has(id) || destinations.has(id)) continue;
      if (!element.id) element.id = id;
      destinations.set(id, { element, page: String(index + 1) });
    }
  }
  function connect(link, destination) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      destination.element.scrollIntoView({ block: "start", inline: "nearest" });
    });
  }
  for (const jump of jumps) {
    const destination = destinations.get(jump.dataset.reportJump);
    if (destination) connect(jump, destination);
  }
  for (const number of pages.querySelectorAll("[data-page-for]")) {
    const destination = destinations.get(number.dataset.pageFor);
    if (!destination) throw new Error("Tujuan daftar isi tidak ditemukan: " + number.dataset.pageFor);
    number.textContent = destination.page;
    connect(number.closest("a"), destination);
  }
}

async function paginateReport(source, target) {
  const staging = dom("div", { className: "pagination-stage", ariaHidden: "true" });
  const previewer = new PagedModule.Previewer();
  connectTablePagination(previewer.chunker);
  connectImagePagination(previewer.chunker);
  const dispose = () => previewer.polisher.destroy();
  document.body.append(staging);
  const fragment = document.createDocumentFragment();
  try {
    await document.fonts.ready;
    for (const row of source.querySelectorAll(".report-photo-row")) {
      row.toggleAttribute("data-report-photo-pair", row.children.length > 1);
    }
    await measureReportTables(source, staging);
    fragment.append(source);
    await previewer.preview(fragment, [{ [location.href]: reportPrintStyle + simakFormStyle }], staging);
    connectContents(staging);
    target.replaceChildren(...staging.childNodes);
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  } finally {
    staging.remove();
  }
}
