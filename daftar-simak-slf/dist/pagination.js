"use strict";

const reportPrintStyle = `
  @page {
    size: A4;
    margin: 18mm 18mm 20mm;
    @bottom-center { content: counter(page); font: 10pt "Segoe UI", sans-serif; color: #38564f; }
  }
  @page :first { @bottom-center { content: none; } }
  .report-print { font: 11pt/1.4 "Segoe UI", sans-serif; color: #172a27; overflow-wrap: anywhere; }
  .report-print .report-cover { display: grid; align-content: center; min-height: 235mm; text-align: center; }
  .report-print .report-cover h1 { font-size: 27pt; margin: 14px 0; text-transform: uppercase; }
  .report-print .paper-kicker { font-size: 11pt; font-weight: 700; }
  .report-print .cover-building { font-size: 17pt; font-weight: 700; }
  .report-print .cover-photo { width: min(100%, 500px); max-height: 80mm; margin: 12px auto; }
  .report-print > .report-section { break-before: page; }
  .report-print h2 { font-size: 18pt; margin: 0 0 15px; break-after: avoid; }
  .report-print h3 { margin: 11px 0 6px; break-after: avoid; }
  .report-print h4 { margin: 6px 0 3px; break-after: avoid; }
  .report-print .front-doc { font-size: 12pt; line-height: 1.47; }
  .report-print .report-text { white-space: pre-wrap; margin: 0 0 9px; orphans: 3; widows: 3; }
  .report-print .front-doc .report-text { margin-bottom: 13px; }
  .report-print .report-signoff { margin-top: 16px; break-inside: avoid; }
  .report-print .report-signoff p { margin: 0 0 3px; }
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
  .report-print th { background: #e8efeb; }
  .report-print tr, .report-print figure { break-inside: avoid; }
  .report-print figure { margin: 12px 0; }
  .report-print img { display: block; max-width: 100%; max-height: 420px; object-fit: contain; margin: 4px 0; }
  .report-print .caption, .report-print figcaption { font-size: 10pt; font-weight: 650; break-after: avoid; }
  .report-print .result-values { margin: 3px 0 6px; }
  .report-print .result-values dt { font-weight: 650; }
  .report-print .result-values dd { margin-left: 0; margin-bottom: 3px; }
  .report-print .result-values img { max-height: 180px; }
`;

function connectContents(pages) {
  const destinations = new Map();
  const targets = new Set(Array.from(pages.querySelectorAll("[data-page-for]"), (element) => element.dataset.pageFor));
  for (const [index, page] of [...pages.querySelectorAll(".pagedjs_page")].entries()) {
    for (const element of page.querySelectorAll("[id], [data-id]")) {
      const id = element.id || element.dataset.id;
      if (!targets.has(id) || destinations.has(id)) continue;
      if (!element.id) element.id = id;
      destinations.set(id, { element, page: String(index + 1) });
    }
  }
  for (const number of pages.querySelectorAll("[data-page-for]")) {
    const destination = destinations.get(number.dataset.pageFor);
    if (!destination) throw new Error("Tujuan daftar isi tidak ditemukan: " + number.dataset.pageFor);
    number.textContent = destination.page;
    number.closest("a").addEventListener("click", (event) => {
      event.preventDefault();
      destination.element.scrollIntoView({ block: "start", inline: "nearest" });
    });
  }
}

async function paginateReport(source, target) {
  const staging = dom("div", { className: "pagination-stage", ariaHidden: "true" });
  const previewer = new Paged.Previewer();
  const dispose = () => previewer.polisher.destroy();
  document.body.append(staging);
  const fragment = document.createDocumentFragment();
  fragment.append(source);
  try {
    await document.fonts.ready;
    await previewer.preview(fragment, [{ [location.href]: reportPrintStyle }], staging);
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
