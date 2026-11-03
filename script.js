const NS = "http://www.w3.org/2000/svg";
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

function el(tag, attrs = {}, parent, text) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "style") node.setAttribute("style", v);
    else node.setAttribute(k, v);
  }
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// requestAnimationFrame tween; returns a cancel function
function tween(duration, delay, onFrame, ease = t => t) {
  let raf, start;
  const timer = setTimeout(() => {
    const step = now => {
      start ??= now;
      const t = Math.min(1, (now - start) / duration);
      onFrame(ease(t), t);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }, REDUCED ? 0 : delay);
  if (REDUCED) duration = 1;
  return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
}
const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);

const SPECIES = {
  "long-eared":   { name: "Northern Long-Eared Bat",  color: "#1f5c7a" },
  "tricolored":   { name: "Tricolored Bat",           color: "#7a2a90" },
  "eastern-red":  { name: "Eastern Red Bat",          color: "#ef737c" },
  "unknown":      { name: "Bat - Unknown",            color: "#f2b76e" },
  "small-footed": { name: "Eastern Small-Footed Bat", color: "#ffe15c" },
  "hoary":        { name: "Hoary Bat",                color: "#aeea6e" },
  "little-brown": { name: "Little Brown Bat",         color: "#9ab851" },
  "silver-haired":{ name: "Silver-Haired Bat",        color: "#6e8e2d" },
  "big-brown":    { name: "Big Brown Bat",            color: "#3a93b6" },
};

function legendSquares(svg, keys, x, ys, d0 = .4) {
  keys.forEach((k, i) => {
    el("rect", { x, y: ys[i] - 26, width: 52, height: 52, fill: SPECIES[k].color, class: "pop", style: `--d:${d0 + i * .07}s` }, svg);
    el("text", { x: x + 66, y: ys[i] + 6, class: "lbl fade", style: `--d:${d0 + .1 + i * .07}s` }, svg, SPECIES[k].name.toUpperCase());
  });
}

/* ---------------- slide: hearing range (log scale) ---------------- */
(function hearing() {
  const svg = document.getElementById("hearingChart");
  const x = hz => 249 + (Math.log10(hz) - 1) * 384.5;
  ["10 Hz", "100 Hz", "1 kHz", "10 kHz", "100 kHz"].forEach((t, i) => {
    const gx = 249 + i * 384.5;
    el("line", { x1: gx, y1: 341, x2: gx, y2: 788, stroke: i ? "rgba(255,255,255,.18)" : "#bbb", "stroke-width": 1.5, class: "grow-y", style: `--d:${.2 + i * .08}s` }, svg);
    el("text", { x: gx, y: 818, "text-anchor": "middle", class: "tick-lbl fade", style: `--d:${.3 + i * .08}s` }, svg, t);
  });
  el("line", { x1: 225, y1: 762, x2: 1807, y2: 762, stroke: "#ddd", "stroke-width": 1.5, class: "grow-x", style: "--d:.1s" }, svg);
  el("line", { x1: x(20000), y1: 341, x2: x(20000), y2: 788, stroke: "#bbb", "stroke-width": 2, "stroke-dasharray": "14 12", class: "fade", style: "--d:1.6s" }, svg);

  [["HUMANS", 462], ["BAT CALLS", 615]].forEach(([t, y], i) => {
    el("text", { x: 212, y: y + 6, "text-anchor": "end", class: "lbl fade", style: `--d:${.4 + i * .2}s` }, svg, t);
    el("line", { x1: 225, y1: y, x2: 258, y2: y, stroke: "#bbb", "stroke-width": 1.5, class: "fade", style: `--d:${.4 + i * .2}s` }, svg);
  });

  const hx0 = x(10), hx1 = x(20000);
  el("rect", { x: hx0 + 3, y: 415, width: hx1 - hx0 - 6, height: 94, rx: 4, fill: "#f2f2f2", stroke: "#ffb347", "stroke-width": 6, class: "grow-x", style: "--d:.7s;transition-duration:1.6s" }, svg);
  el("text", { x: (hx0 + hx1) / 2, y: 468, "text-anchor": "middle", class: "lbl fade", style: "--d:1.8s;fill:#111" }, svg, "10 Hz - 20 kHz");

  const bx0 = x(20000) + 3, bx1 = x(60000);
  el("rect", { x: bx0 + 3, y: 568, width: bx1 - bx0 - 6, height: 94, rx: 6, fill: "#5a1d1d", stroke: "#e8474a", "stroke-width": 6, class: "pop", style: "--d:2.1s" }, svg);
  el("text", { x: (bx0 + bx1) / 2, y: 621, "text-anchor": "middle", class: "lbl fade", style: "--d:2.5s" }, svg, "20 kHz - 60 kHz");
  // echolocation pulses radiating from the bat-call band
  [0, .8, 1.6].forEach(delay => {
    el("path", { d: `M${bx1 + 20},565 q30,50 0,100`, class: "ripple", style: `--d:${2.6 + delay}s` }, svg);
  });
})();

/* ---------------- slide: map dots ---------------- */
(function map() {
  const svg = document.getElementById("mapChart");
  const legend = document.getElementById("mapLegend");
  const order = ["long-eared", "tricolored", "eastern-red", "unknown", "small-footed", "hoary", "little-brown", "silver-haired", "big-brown"];
  order.forEach((k, i) => {
    const li = document.createElement("li");
    li.className = "rv";
    li.style.setProperty("--d", `${.3 + i * .06}s`);
    li.dataset.k = k;
    li.innerHTML = `<i style="background:${SPECIES[k].color}"></i>${SPECIES[k].name.toUpperCase()}`;
    legend.appendChild(li);
  });

  // [x, y, species, filled] in the 1600-wide design export (scaled ×1.2 below)
  const boroughs = [
    [[964,154,"little-brown",1],[996,154,"tricolored",0],[1028,154,"long-eared",1],[1060,154,"big-brown",0],[964,181,"silver-haired",0],[996,181,"eastern-red",0],[1028,181,"hoary",0]],
    [[871,256,"big-brown",1],[856,284,"long-eared",0],[881,297,"hoary",1],[842,313,"tricolored",0],[867,325,"eastern-red",1],[828,341,"little-brown",1],[853,354,"silver-haired",1]],
    [[967,378,"little-brown",1],[999,378,"tricolored",1],[1031,378,"long-eared",0],[1063,378,"big-brown",0],[967,406,"silver-haired",0],[999,406,"eastern-red",0],[1031,406,"hoary",0]],
    [[823,584,"little-brown",1],[855,584,"tricolored",1],[887,584,"long-eared",0],[919,584,"big-brown",1],[823,611,"silver-haired",1],[855,611,"eastern-red",1],[887,611,"hoary",1]],
    [[541,685,"little-brown",1],[573,685,"tricolored",1],[605,685,"long-eared",0],[637,685,"big-brown",0],[541,712,"silver-haired",0],[573,712,"eastern-red",0],[605,712,"hoary",0]],
  ];
  boroughs.forEach((dots, b) => dots.forEach(([dx, dy, k, filled], i) => {
    const c = SPECIES[k].color;
    el("circle", {
      cx: dx * 1.2, cy: dy * 1.2, r: filled ? 11 : 9.5,
      fill: filled ? c : "none", stroke: c, "stroke-width": filled ? 0 : 3.5,
      class: "dot pop", "data-k": k, style: `--d:${.8 + b * .3 + i * .05}s`,
    }, svg);
  }));

  legend.addEventListener("mouseover", e => {
    const li = e.target.closest("li");
    if (!li) return;
    legend.classList.add("focus");
    svg.classList.add("focus");
    legend.querySelectorAll("li").forEach(n => n.classList.toggle("on", n === li));
    svg.querySelectorAll(".dot").forEach(d => d.classList.toggle("on", d.dataset.k === li.dataset.k));
  });
  legend.addEventListener("mouseleave", () => { legend.classList.remove("focus"); svg.classList.remove("focus"); });
})();

/* ---------------- slide: monthly sightings line chart ---------------- */
(function lines() {
  const svg = document.getElementById("lineChart");
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JULY", "AUG", "SEPT", "OCT"];
  const series = [
    { color: "#ffb347", data: [4, 4, 24, 37, 39, 32, 42, 58, 32, 33] },
    { color: "#ff5c8a", data: [.7, 0, 5, 12, 15, 7, 6.3, 5, 7, 15] },
  ];
  const X = i => 356 + i * 128;
  const Y = v => 889 - v * 11.77;

  el("line", { x1: 317, y1: 175, x2: 317, y2: 960, stroke: "#ddd", "stroke-width": 1.5, class: "grow-y" }, svg);
  el("line", { x1: 282, y1: 924, x2: 1522, y2: 924, stroke: "#ddd", "stroke-width": 1.5, class: "grow-x" }, svg);
  for (let v = 0; v <= 60; v += 10) {
    el("line", { x1: 305, y1: Y(v), x2: 325, y2: Y(v), stroke: "#ddd", class: "fade", style: `--d:${.2 + v / 100}s` }, svg);
    el("text", { x: 290, y: Y(v) + 6, "text-anchor": "end", class: "tick-lbl fade", style: `--d:${.2 + v / 100}s` }, svg, v);
  }
  months.forEach((m, i) => {
    el("line", { x1: X(i), y1: 914, x2: X(i), y2: 934, stroke: "#ddd", class: "fade", style: `--d:${.3 + i * .05}s` }, svg);
    el("text", { x: X(i), y: 974, "text-anchor": "middle", class: "tick-lbl fade", style: `--d:${.3 + i * .05}s` }, svg, m);
  });
  el("text", { x: 0, y: 0, transform: "translate(226 542) rotate(-90)", "text-anchor": "middle", class: "lbl fade" }, svg, "SIGHTINGS");

  series.forEach((s, si) => {
    const d = s.data.map((v, i) => `${i ? "L" : "M"}${X(i)},${Y(v)}`).join(" ");
    el("path", { d, fill: "none", stroke: s.color, "stroke-width": 3, pathLength: 1, class: "draw", style: `--d:${.8 + si * .5}s` }, svg);
    s.data.forEach((v, i) => {
      const dot = el("circle", { cx: X(i), cy: Y(v), r: 8, fill: s.color, class: "pop hit", style: `--d:${.8 + si * .5 + (i / 9) * 2}s` }, svg);
      el("title", {}, dot, `${months[i]}: ${v}`);
    });
  });
})();

/* ---------------- slide: noise donuts ---------------- */
(function donuts() {
  const svg = document.getElementById("donutChart");
  const cats = [
    ["CONSTRUCTION +|JACKHAMMERING", "#ef737c"],
    ["BARKING DOGS", "#f2b76e"],
    ["ALARMS", "#ffe15c"],
    ["AC / VENTILATION", "#9ab851"],
    ["MANUFACTURING", "#6e8e2d"],
    ["OTHER", "#3a93b6"],
  ];
  // shares in %, clockwise from 12 o'clock, read off the Figma donuts
  const boroughs = [
    ["MANHATTAN",     [62, 9, 7, 11, 3, 8]],
    ["BROOKLYN",      [57, 14, 12, 7, 3, 7]],
    ["QUEENS",        [40, 18, 24, 6, 3, 9]],
    ["BRONX",         [43, 22, 16, 7, 3, 9]],
    ["STATEN ISLAND", [38, 26, 11, 7, 2, 16]],
  ];
  const R = 132, W = 88, SWEEP = 1.5;
  boroughs.forEach(([name, shares], b) => {
    const cx = 211 + b * 375, cy = 502;
    const total = shares.reduce((a, c) => a + c, 0);
    let acc = 0;
    shares.forEach((p, i) => {
      const pct = (p / total) * 100;
      const seg = el("circle", {
        cx, cy, r: R, fill: "none", stroke: cats[i][1], "stroke-width": W, pathLength: 100,
        transform: `rotate(${-90 + acc * 3.6} ${cx} ${cy})`,
        class: "seg hit",
        style: `--p:${pct + .15};--dur:${(pct / 100) * SWEEP}s;--d:${.5 + b * .25 + (acc / 100) * SWEEP}s`,
      }, svg);
      el("title", {}, seg, `${name}: ${cats[i][0].replace("|", " ")} about ${p}%`);
      acc += pct;
    });
    el("text", { x: cx, y: cy + 7, "text-anchor": "middle", class: "lbl fade", style: `--d:${.6 + b * .25}s` }, svg, name);
  });
  cats.forEach(([label, color], i) => {
    const x = 445 + i * 206;
    el("rect", { x: x - 40, y: 823, width: 80, height: 80, fill: color, class: "pop", style: `--d:${2.2 + i * .08}s` }, svg);
    label.split("|").forEach((line, j) => el("text", { x, y: 948 + j * 23, "text-anchor": "middle", class: "lbl fade", style: `--d:${2.3 + i * .08}s` }, svg, line));
  });
  const style = document.createElement("style");
  style.textContent = `
    #donutChart .seg { stroke-dasharray: 0 100; transition: stroke-dasharray var(--dur) linear; transition-delay: 0s; }
    .is-active #donutChart .seg { stroke-dasharray: var(--p) 100; transition-delay: var(--d); }`;
  document.head.appendChild(style);
})();

/* ---------------- the 96-report stack (shared by water + sankey slides) ---------------- */
const STACK = [ // top → bottom
  ["silver-haired", 17], ["little-brown", 13], ["hoary", 2], ["eastern-red", 31],
  ["small-footed", 1], ["big-brown", 5], ["unknown", 27],
];
const BAR = { x: 913, y: 127, w: 140, h: 786 };
const LEGEND_KEYS = ["eastern-red", "unknown", "small-footed", "hoary", "little-brown", "silver-haired", "big-brown"];
const LEGEND_YS = [504, 578, 653, 727, 794, 870, 944];

function drawStack(parent, bar) {
  const total = STACK.reduce((a, [, n]) => a + n, 0);
  let y = bar.y;
  const bands = STACK.map(([k, n]) => {
    const h = (n / total) * bar.h;
    const r = el("rect", { x: bar.x, y, width: bar.w, height: h + .5, fill: SPECIES[k].color, class: "hit" }, parent);
    el("title", {}, r, `${SPECIES[k].name}: ${n}`);
    const band = { y0: y, y1: y + h, color: SPECIES[k].color };
    y += h;
    return band;
  });
  return bands;
}

/* ---------------- slide: water-fill stacked bar ---------------- */
const waterSlide = (function water() {
  const svg = document.getElementById("waterChart");
  legendSquares(svg, LEGEND_KEYS, 118, LEGEND_YS, .3);

  const defs = el("defs", {}, svg);
  const mFront = el("mask", { id: "waterFront", maskUnits: "userSpaceOnUse" }, defs);
  const front = el("path", { fill: "#fff" }, mFront);
  const mBack = el("mask", { id: "waterBack", maskUnits: "userSpaceOnUse" }, defs);
  const back = el("path", { fill: "#fff" }, mBack);

  // empty glass
  el("rect", { x: BAR.x - 1, y: BAR.y - 1, width: BAR.w + 2, height: BAR.h + 2, fill: "rgba(255,255,255,.03)", stroke: "rgba(255,255,255,.25)", "stroke-width": 1.5, class: "fade" }, svg);

  // back wave = lighter, slightly ahead; front wave = the real colours
  const gBack = el("g", { mask: "url(#waterBack)", opacity: .45 }, svg);
  const bands = drawStack(gBack, BAR);
  const gFront = el("g", { mask: "url(#waterFront)" }, svg);
  drawStack(gFront, BAR);

  const stream = el("rect", { x: BAR.x + BAR.w / 2 - 7, width: 14, rx: 7, opacity: 0 }, svg);
  const splash = el("ellipse", { cx: BAR.x + BAR.w / 2, rx: 0, ry: 0, fill: "rgba(255,255,255,.35)" }, svg);
  const count = el("text", { x: BAR.x + BAR.w / 2, y: 975, "text-anchor": "middle", style: "font-size:44px;font-weight:700" }, svg, "0");

  const bottom = BAR.y + BAR.h;
  let phase = 0, cancel = [], idle;

  function wavePath(level, amp, ph) {
    const pts = [];
    for (let x = BAR.x - 2; x <= BAR.x + BAR.w + 2; x += 4) {
      const k = (x - BAR.x) / BAR.w;
      pts.push(`${x},${level + amp * Math.sin(k * Math.PI * 2.2 + ph) + amp * .4 * Math.sin(k * Math.PI * 5 - ph * 1.7)}`);
    }
    return `M${pts.join(" L")} L${BAR.x + BAR.w + 2},${bottom + 2} L${BAR.x - 2},${bottom + 2} Z`;
  }
  function colourAt(y) {
    const b = bands.find(b => y >= b.y0 && y <= b.y1) || bands[bands.length - 1];
    return b.color;
  }
  function render(t, settle = 1) {
    const level = bottom - t * BAR.h;
    const amp = 9 * settle * (1 - Math.pow(t, 6));
    front.setAttribute("d", wavePath(level, amp, phase));
    back.setAttribute("d", wavePath(level - 6 * settle, amp * 1.1, phase + 1.9));
    count.textContent = Math.round(t * 96);
  }
  function reset() {
    cancel.forEach(c => c()); cancel = [];
    cancelAnimationFrame(idle);
    render(0); stream.setAttribute("opacity", 0); splash.setAttribute("rx", 0); splash.setAttribute("ry", 0);
  }
  reset();

  return {
    enter() {
      reset();
      const D = 4200;
      cancel.push(tween(D, 500, (t, raw) => {
        phase += .12;
        render(t);
        const level = bottom - t * BAR.h;
        // pour stream from the top of the glass down to the surface
        const on = raw < .93;
        stream.setAttribute("opacity", on ? 1 : Math.max(0, 1 - (raw - .93) / .07));
        const top = on ? -40 : -40 + ((raw - .93) / .07) * (level + 40);
        stream.setAttribute("y", top);
        stream.setAttribute("height", Math.max(0, level - top));
        stream.setAttribute("fill", colourAt(level + 2));
        stream.setAttribute("width", 14 + Math.sin(phase * 3) * 2);
        splash.setAttribute("cy", level);
        splash.setAttribute("rx", on ? 22 + Math.sin(phase * 4) * 6 : 0);
        splash.setAttribute("ry", on ? 5 : 0);
      }, easeInOut));
      // let the surface settle with a gentle slosh
      cancel.push(tween(1600, 500 + D, t => { phase += .1; render(1, 1 - t); }));
    },
    leave: reset,
  };
})();

/* ---------------- slide: sankey into the 9,267 reports ---------------- */
const sankeySlide = (function sankey() {
  const svg = document.getElementById("sankeyChart");
  legendSquares(svg, LEGEND_KEYS, 118, LEGEND_YS, .1);
  drawStack(svg, BAR);
  el("text", { x: BAR.x + BAR.w / 2, y: 975, "text-anchor": "middle", style: "font-size:44px;font-weight:700" }, svg, "96");

  const R = { x: 1567, y: 127, w: 140, h: 786 };
  const animals = [ // top → bottom, % of all ranger animal reports
    ["Raccoon", 19, "#0e3445"], ["Canada Goose", 8, "#103e52"], ["Dog", 7, "#13465d"],
    ["Cat", 5, "#165068"], ["Eastern Grey Squirrel", 5, "#1a5a74"],
    [null, 3, "#1f6a87"], [null, 3, "#257a97"], [null, 2.5, "#2c88a6"], [null, 2.5, "#3a9bbd"],
    [null, 2, "#56acc9"], [null, 2, "#79c0d8"], [null, 2, "#a7d8ea"],
    ["Bats", 1, "#ff3b3b"], ["Everything else", 38, "#fff1e1"],
  ];
  let y = R.y, sliver;
  const segs = animals.map(([name, p, color], i) => {
    const h = (p / 100) * R.h;
    const g = el("g", { class: "grow-y-top", style: `--d:${2 + i * .06}s` }, svg);
    const r = el("rect", { x: R.x, y, width: R.w, height: h + .4, fill: color, class: "hit" }, g);
    el("title", {}, r, `${name ?? "Other animals"}: ${p}%`);
    if (name === "Bats") { sliver = { y0: y, y1: y + h }; r.classList.add("sliver"); }
    else if (name) {
      const dark = name === "Everything else";
      el("text", { x: R.x + 5, y: y + 15, class: "small-lbl", style: dark ? "fill:#222" : "" }, g, name);
      el("text", { x: R.x + R.w - 5, y: y + 15, "text-anchor": "end", class: "small-lbl", style: dark ? "fill:#222" : "" }, g, `${p}%`);
    }
    y += h;
    return r;
  });
  el("text", { x: R.x + R.w + 18, y: sliver.y1 + 2, class: "lbl fade", style: "--d:2.8s;fill:#ff3b3b" }, svg, "BATS 1%");
  const total = el("text", { x: R.x + R.w / 2, y: 975, "text-anchor": "middle", style: "font-size:44px;font-weight:700" }, svg, "0");

  // the flow: whole 96-report bar narrows into the 1% sliver
  const x0 = BAR.x + BAR.w, x1 = R.x, mx = (x0 + x1) / 2;
  const defs = el("defs", {}, svg);
  const clip = el("clipPath", { id: "flowClip" }, defs);
  const clipRect = el("rect", { x: x0, y: 0, width: 0, height: 1080 }, clip);
  const grad = el("linearGradient", { id: "flowGrad", x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
  el("stop", { offset: 0, "stop-color": "#561119" }, grad);
  el("stop", { offset: .75, "stop-color": "#6b1420" }, grad);
  el("stop", { offset: 1, "stop-color": "#ff3b3b" }, grad);

  const g = el("g", { "clip-path": "url(#flowClip)" }, svg);
  const top = `M${x0},${BAR.y} C${mx},${BAR.y} ${mx},${sliver.y0} ${x1},${sliver.y0}`;
  el("path", { d: `${top} L${x1},${sliver.y1} C${mx},${sliver.y1} ${mx},${BAR.y + BAR.h} ${x0},${BAR.y + BAR.h} Z`, fill: "url(#flowGrad)" }, g);
  el("path", { d: top, fill: "none", stroke: "#ff9a9a", "stroke-width": 1 }, g);
  el("path", { d: `M${x0},${BAR.y + BAR.h} C${mx},${BAR.y + BAR.h} ${mx},${sliver.y1} ${x1},${sliver.y1}`, fill: "none", stroke: "#ff9a9a", "stroke-width": 1 }, g);
  const lines = el("g", { class: "flow-lines" }, g);
  for (let f = .08; f < 1; f += .12) {
    const ya = BAR.y + f * BAR.h, yb = sliver.y0 + f * (sliver.y1 - sliver.y0);
    el("path", { d: `M${x0},${ya} C${mx},${ya} ${mx},${yb} ${x1},${yb}`, style: `animation-delay:${-f * 1.6}s` }, lines);
  }

  let cancel = [];
  function reset() {
    cancel.forEach(c => c()); cancel = [];
    clipRect.setAttribute("width", 0);
    total.textContent = "0";
  }
  return {
    enter() {
      reset();
      cancel.push(tween(1700, 500, t => clipRect.setAttribute("width", t * (x1 - x0) + 1), easeInOut));
      cancel.push(tween(1400, 2000, t => total.textContent = Math.round(t * 9267).toLocaleString("en-US"), easeOut));
    },
    leave: reset,
  };
})();

/* ---------------- slide: healthy vs injured ---------------- */
(function bars() {
  const svg = document.getElementById("barChart");
  const Y = v => 923 - v * 53.4;
  const groups = [
    ["EASTERN RED BAT", "eastern-red", 12, 10, 262],
    ["SILVER-HAIRED BAT", "silver-haired", 10, 4, 514],
    ["LITTLE BROWN BAT", "little-brown", 5, 1, 770],
    ["BIG BROWN BAT", "big-brown", 3, 1, 1028],
    ["BAT - UNKNOWN SPECIES", "unknown", 8, 5, 1285],
  ];
  el("line", { x1: 187, y1: 266, x2: 187, y2: 958, stroke: "#ddd", "stroke-width": 1.5, class: "grow-y" }, svg);
  el("line", { x1: 152, y1: 923, x2: 1538, y2: 923, stroke: "#ddd", "stroke-width": 1.5, class: "grow-x" }, svg);
  for (let v = 0; v <= 12; v += 2) {
    el("line", { x1: 174, y1: Y(v), x2: 194, y2: Y(v), stroke: "#ddd", class: "fade", style: `--d:${.2 + v / 40}s` }, svg);
    el("text", { x: 160, y: Y(v) + 6, "text-anchor": "end", class: "tick-lbl fade", style: `--d:${.2 + v / 40}s` }, svg, v);
  }
  el("text", { x: 0, y: 0, transform: "translate(96 542) rotate(-90)", "text-anchor": "middle", class: "lbl fade" }, svg, "SIGHTINGS");

  const W = 92;
  groups.forEach(([label, k, healthy, injured, x], i) => {
    const c = SPECIES[k].color, d = .6 + i * .25;
    el("rect", { x, y: Y(healthy), width: W, height: healthy * 53.4, rx: 3, fill: c, class: "grow-y", style: `--d:${d}s` }, svg);
    el("rect", { x: x + W + 6, y: Y(injured) + 2, width: W - 4, height: injured * 53.4 - 4, rx: 3, fill: "none", stroke: c, "stroke-width": 4, class: "grow-y", style: `--d:${d + .15}s` }, svg);
    el("text", { x: x + W / 2, y: Y(healthy) - 16, "text-anchor": "middle", class: "tick-lbl fade", style: `--d:${d + .8}s` }, svg, healthy);
    el("text", { x: x + W * 1.5 + 6, y: Y(injured) - 16, "text-anchor": "middle", class: "tick-lbl fade", style: `--d:${d + .95}s` }, svg, injured);
    el("text", { x: x + W + 3, y: 968, "text-anchor": "middle", class: "lbl fade", style: `--d:${d}s;font-size:18px` }, svg, label);
  });

  el("rect", { x: 1358, y: 85, width: 52, height: 52, fill: "#fff", class: "pop", style: "--d:.3s" }, svg);
  el("rect", { x: 1446, y: 87, width: 48, height: 48, fill: "none", stroke: "#fff", "stroke-width": 3, class: "pop", style: "--d:.4s" }, svg);
  el("text", { x: 1384, y: 160, "text-anchor": "middle", class: "lbl fade", style: "--d:.3s" }, svg, "HEALTHY");
  el("text", { x: 1470, y: 160, "text-anchor": "middle", class: "lbl fade", style: "--d:.4s" }, svg, "INJURED");
  legendSquares(svg, LEGEND_KEYS, 1571, [112, 186, 260, 334, 402, 479, 553], .5);
})();

/* ---------------- slide: white-nose dumbbells ---------------- */
(function dumbbell() {
  const svg = document.getElementById("dumbbellChart");
  const X = v => 517 + (Math.log10(v) - 2) * 310;
  const rows = [
    ["LITTLE BROWN BAT", "little-brown", 330000, 50000, 452, "-91%"],
    ["NORTHERN LONG-EARED BAT", "long-eared", 470000, 5100, 666, "-99%"],
    ["TRICOLORED BAT", "tricolored", 2350, 50, 845, "-98%"],
  ];
  el("line", { x1: 360, y1: 390, x2: 360, y2: 925, stroke: "#ddd", "stroke-width": 1.5, class: "grow-y" }, svg);
  el("line", { x1: 325, y1: 889, x2: 1711, y2: 889, stroke: "#ddd", "stroke-width": 1.5, class: "grow-x" }, svg);
  [100, 1000, 10000, 100000].forEach((v, i) => {
    el("line", { x1: X(v), y1: 879, x2: X(v), y2: 899, stroke: "#ddd", class: "fade", style: `--d:${.3 + i * .08}s` }, svg);
    el("text", { x: X(v), y: 934, "text-anchor": "middle", class: "tick-lbl fade", style: `--d:${.3 + i * .08}s` }, svg, v.toLocaleString("en-US"));
  });

  rows.forEach(([label, k, before, after, y, drop], i) => {
    const c = SPECIES[k].color, d = 1.2 + i * .45;
    el("text", { x: 329, y: y + 6, "text-anchor": "end", class: "lbl fade", style: `--d:${.4 + i * .1}s` }, svg, label);
    el("line", { x1: 344, y1: y, x2: 362, y2: y, stroke: "#ddd", class: "fade", style: `--d:${.4 + i * .1}s` }, svg);
    el("line", { x1: X(after), y1: y, x2: X(before), y2: y, stroke: c, "stroke-width": 5, class: "drop-line", style: `--d:${d}s` }, svg);
    el("circle", { cx: X(before), cy: y, r: 16, fill: "#000", stroke: c, "stroke-width": 5, class: "after-dot", style: `--dx:${X(after) - X(before)}px;--d:${d}s` }, svg);
    el("circle", { cx: X(before), cy: y, r: 18, fill: c, class: "pop", style: `--d:${.6 + i * .15}s` }, svg);
    el("text", { x: X(after), y: y - 30, "text-anchor": "middle", class: "lbl fade", style: `--d:${d + 1.9}s;font-size:22px;fill:${c === "#1f5c7a" ? "#4fa3cc" : c}` }, svg, drop);
  });

  // after / before legend
  el("text", { x: 1543, y: 37, "text-anchor": "middle", class: "fade", style: "font-size:9px;fill:#bbb" }, svg, "AFTER");
  el("text", { x: 1594, y: 37, "text-anchor": "middle", class: "fade", style: "font-size:9px;fill:#bbb" }, svg, "BEFORE");
  ["little-brown", "long-eared", "tricolored"].forEach((k, i) => {
    const y = 73 + i * 67, c = SPECIES[k].color;
    el("circle", { cx: 1554, cy: y, r: 23, fill: "none", stroke: c, "stroke-width": 4, class: "pop", style: `--d:${.4 + i * .08}s` }, svg);
    el("circle", { cx: 1591, cy: y, r: 25, fill: c, class: "pop", style: `--d:${.45 + i * .08}s` }, svg);
    el("text", { x: 1632, y: y + 6, class: "lbl fade", style: `--d:${.5 + i * .08}s;font-size:15px` }, svg, SPECIES[k].name.toUpperCase());
  });
})();

/* ---------------- closing words ---------------- */
(function finale() {
  const p = document.getElementById("finale");
  p.innerHTML = p.textContent.split(" ").map((w, i) => `<span class="w" style="transition-delay:${1 + i * .12}s">${w}</span>`).join(" ");
})();

/* ================= navigation ================= */
const track = document.getElementById("track");
const slides = [...document.querySelectorAll(".slide")];
const hooks = { water: waterSlide, sankey: sankeySlide };
const dotsWrap = document.getElementById("dots");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const bar = document.getElementById("progressBar");
let current = -1;

slides.forEach((s, i) => {
  const b = document.createElement("button");
  b.setAttribute("aria-label", `Go to slide ${i + 1}`);
  b.addEventListener("click", () => go(i));
  dotsWrap.appendChild(b);
});

function fit() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  document.documentElement.style.setProperty("--s", s);
  if (current >= 0) track.scrollLeft = current * track.clientWidth;
}

function activate(i) {
  if (i === current) return;
  slides.forEach((s, j) => {
    if (j === i) return;
    if (s.classList.contains("is-active")) hooks[s.dataset.id]?.leave();
    s.classList.remove("is-active");
  });
  current = i;
  // next frame so a freshly reset slide picks up its start state first
  requestAnimationFrame(() => requestAnimationFrame(() => {
    slides[i].classList.add("is-active");
    hooks[slides[i].dataset.id]?.enter();
  }));
  [...dotsWrap.children].forEach((d, j) => d.classList.toggle("on", j === i));
  prevBtn.disabled = i === 0;
  nextBtn.disabled = i === slides.length - 1;
  bar.style.width = `${((i + 1) / slides.length) * 100}%`;
  showNav();
}

const nav = document.querySelector(".nav");
let navTimer;
function showNav() {
  nav.classList.add("show");
  clearTimeout(navTimer);
  navTimer = setTimeout(() => nav.classList.remove("show"), 1800);
}
addEventListener("mousemove", e => { if (e.clientY > innerHeight - 110) showNav(); });

function go(i) {
  i = Math.max(0, Math.min(slides.length - 1, i));
  track.scrollTo({ left: i * track.clientWidth, behavior: REDUCED ? "auto" : "smooth" });
}

let scrollTimer;
track.addEventListener("scroll", () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => activate(Math.round(track.scrollLeft / track.clientWidth)), 60);
}, { passive: true });

// vertical mouse-wheel → one slide sideways (trackpad side-swipes scroll natively)
let wheelLock = false;
track.addEventListener("wheel", e => {
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  e.preventDefault();
  if (wheelLock || Math.abs(e.deltaY) < 6) return;
  wheelLock = true;
  go(current + Math.sign(e.deltaY));
  setTimeout(() => (wheelLock = false), 900);
}, { passive: false });

addEventListener("keydown", e => {
  if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(current + 1); }
  if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(current - 1); }
  if (e.key === "Home") go(0);
  if (e.key === "End") go(slides.length - 1);
});
prevBtn.addEventListener("click", () => go(current - 1));
nextBtn.addEventListener("click", () => go(current + 1));
addEventListener("resize", fit);

fit();
activate(0);
