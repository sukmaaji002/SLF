"use strict";

function siteDiagram() {
  const canvas = document.createElement("canvas");
  canvas.width = 1010;
  canvas.height = 420;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f4f8f6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  function box(x, y, w, h, fill, line = "#42645a") {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = line;
    ctx.strokeRect(x, y, w, h);
  }
  function text(label, x, y, size = 17, color = "#20423a") {
    ctx.fillStyle = color;
    ctx.font = size + "px Segoe UI, sans-serif";
    ctx.fillText(label, x, y);
  }
  function line(x1, y1, x2, y2, color, dashed = false) {
    ctx.strokeStyle = color;
    ctx.setLineDash(dashed ? [6, 5] : []);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  function dimension(x, from, to, label, textX) {
    const ink = "#843b1c";
    line(x, from, x, to, ink);
    for (const y of [from, to]) line(x - 6, y + 5, x + 6, y - 5, ink);
    text(label, textX, (from + to) / 2 + 4, 17, ink);
  }

  ctx.lineWidth = 2;
  text("Denah tapak dan garis sempadan", 28, 35, 23);
  text("Skema luas lantai", 600, 35, 23);
  box(68, 70, 360, 211, "#ffffff");
  box(106, 103, 175, 115, "#d2e4ec");
  box(296, 103, 103, 115, "#cfe3cc");
  text("Lantai dasar", 128, 149);
  text("Pembilang KDB", 128, 174);
  text("Area hijau", 307, 149);
  text("Untuk KDH", 307, 174);
  text("Luas persil = penyebut ketiga koefisien", 81, 254);
  line(69, 281, 427, 281, "#843b1c");
  text("Pagar depan / batas persil", 80, 305, 16);
  box(51, 317, 394, 66, "#dee5e4");
  line(51, 349, 501, 349, "#5b716c", true);
  text("As jalan", 80, 374);
  line(281, 219, 516, 219, "#843b1c", true);
  line(428, 281, 459, 281, "#843b1c", true);
  dimension(454, 281, 349, "GSP", 465);
  dimension(518, 219, 349, "GSB", 530);
  box(609, 88, 314, 76, "#d2e4ec");
  box(609, 193, 314, 76, "#d2e4ec");
  text("Lantai atas yang diperhitungkan", 631, 135);
  text("Lantai dasar yang diperhitungkan", 631, 240);
  text("Jumlahkan luas yang diperhitungkan", 607, 315, 18);
  text("pada tiap lantai untuk pembilang KLB.", 607, 340, 18);
  text("Ilustrasi tanpa skala atau dimensi objek.", 607, 378, 16);

  return dom("figure", { className: "site-diagram", id: "intensity-diagram" },
    dom("img", { src: canvas.toDataURL(), alt: "Skema generik persil, lantai dasar, area hijau, tumpukan lantai, serta ukuran ke pagar dan bangunan dari as jalan." }),
    dom("figcaption", {}, "Skema pengisian luas serta titik ukur GSP dan GSB. Ilustrasi tanpa skala."));
}
