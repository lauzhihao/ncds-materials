/* eslint-disable */
/* ============================================================
   Chart3D — real 3D scene with drag-rotate, zoom, auto-rotate,
   entry rotation/zoom animation, painter's-algorithm rendering
   ============================================================ */

const { useState: useS3D, useEffect: useE3D, useRef: useR3D, useMemo: useM3D } = React;

// ---------- Math helpers ----------

function _hexRgb3D(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
function _rgbHex3D(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}
function shade3D(hex, factor) {
  // factor 0..1, 0.5 = base color, 0 = black, 1 = white
  const { r, g, b } = _hexRgb3D(hex);
  if (factor <= 0.5) {
    const t = factor * 2;
    return _rgbHex3D(r * t, g * t, b * t);
  }
  const t = (factor - 0.5) * 2;
  return _rgbHex3D(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
}

const lerp3 = (a, b, t) => a + (b - a) * t;

// Project 3D world point → 2D screen
function project3D(p, view, cx, cy) {
  const { yaw, pitch, zoom } = view;
  const cyw = Math.cos(yaw), syw = Math.sin(yaw);
  const x1 = p.x * cyw + p.z * syw;
  const z1 = -p.x * syw + p.z * cyw;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const y1 = p.y * cp - z1 * sp;
  const z2 = p.y * sp + z1 * cp;
  return { sx: cx + x1 * zoom, sy: cy - y1 * zoom, sz: z2 };
}

function avgZ3D(verts) {
  let s = 0;
  for (let i = 0; i < verts.length; i++) s += verts[i].sz;
  return s / verts.length;
}

function staggered3D(progress, i, total, amt) {
  if (amt <= 0) return progress;
  const startAt = (i / Math.max(1, total - 1)) * amt;
  const range = 1 - amt;
  if (range <= 0) return progress >= 1 ? 1 : 0;
  return Math.max(0, Math.min(1, (progress - startAt) / range));
}

// ---------- Face poly factory + material registry ----------

function _facePoly3D(verts, color, colorIdx, shadeFactor) {
  return {
    type: "face",
    verts,
    depth: avgZ3D(verts),
    color, colorIdx, shadeFactor,
    fill: shade3D(color, shadeFactor),
    stroke: shade3D(color, Math.max(0.18, shadeFactor - 0.3)),
  };
}

const MATERIALS_3D = {
  plastic:   { label: "光面", en: "Glossy" },
  matte:     { label: "哑光", en: "Matte" },
  metal:     { label: "金属", en: "Metal" },
  glass:     { label: "毛玻璃", en: "Frosted" },
  neon:      { label: "霓虹", en: "Neon" },
  wireframe: { label: "线框", en: "Wireframe" },
};
const MATERIAL_KEYS_3D = ["plastic", "matte", "metal", "glass", "neon", "wireframe"];

function _renderFace3D(p, i, material) {
  const d = _polyPath3D(p.verts);
  if (p.color == null) {
    return <path key={i} d={d} fill={p.fill} stroke={p.stroke || "none"} strokeWidth="0.6" strokeLinejoin="round" />;
  }
  switch (material) {
    case "matte":
      return <path key={i} d={d} fill={shade3D(p.color, 0.42 + p.shadeFactor * 0.32)} stroke="none" />;
    case "metal":
      return <path key={i} d={d} fill={`url(#mat3d-metal-${p.colorIdx})`} stroke={shade3D(p.color, Math.max(0.12, p.shadeFactor - 0.35))} strokeWidth="0.6" strokeLinejoin="round" />;
    case "glass":
      return <path key={i} d={d} fill={shade3D(p.color, Math.min(0.85, p.shadeFactor + 0.1))} fillOpacity={p.shadeFactor > 0.7 ? 0.45 : 0.6} stroke="rgba(255,255,255,0.55)" strokeWidth="1.1" strokeLinejoin="round" />;
    case "neon":
      return (
        <g key={i}>
          <path d={d} fill={p.color} fillOpacity="0.12" />
          <path d={d} fill="none" stroke={p.color} strokeWidth="1.6" strokeLinejoin="round" filter="url(#mat3d-neon-glow)" />
        </g>
      );
    case "wireframe":
      return <path key={i} d={d} fill="none" stroke={shade3D(p.color, Math.max(0.55, p.shadeFactor))} strokeWidth="1.3" strokeLinejoin="round" />;
    case "plastic":
    default:
      return <path key={i} d={d} fill={p.fill} stroke={p.stroke || "none"} strokeWidth="0.6" strokeLinejoin="round" />;
  }
}

// ---------- 3D View hook (drag / wheel / auto-rotate) ----------

const DEFAULT_VIEW = { yaw: 0.55, pitch: 0.42, zoom: 1 };

function use3DView({ autoRotate, rotateSpeed, replayKey }) {
  const [view, setView] = useS3D(DEFAULT_VIEW);
  const [hasInteracted, setHasInteracted] = useS3D(false);
  const draggingRef = useR3D(false);
  const lastRef = useR3D({ x: 0, y: 0 });
  const svgRef = useR3D(null);

  // Reset interaction flag on replay
  useE3D(() => { setHasInteracted(false); }, [replayKey]);

  // Auto-rotate loop
  useE3D(() => {
    if (!autoRotate) return;
    let raf, last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!draggingRef.current) {
        setView((v) => ({ ...v, yaw: v.yaw + rotateSpeed * dt }));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate, rotateSpeed]);

  // Non-passive wheel listener
  useE3D(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const dz = -e.deltaY * 0.0012;
      setView((v) => ({ ...v, zoom: Math.max(0.45, Math.min(2.6, v.zoom * (1 + dz))) }));
      setHasInteracted(true);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handlers = {
    onPointerDown: (e) => {
      if (e.button !== 0) return;
      draggingRef.current = true;
      lastRef.current = { x: e.clientX, y: e.clientY };
      setHasInteracted(true);
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
      e.currentTarget.style.cursor = "grabbing";
    },
    onPointerMove: (e) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastRef.current.x;
      const dy = e.clientY - lastRef.current.y;
      lastRef.current = { x: e.clientX, y: e.clientY };
      setView((v) => ({
        ...v,
        yaw: v.yaw + dx * 0.012,
        pitch: Math.max(-0.2, Math.min(1.45, v.pitch + dy * 0.009)),
      }));
    },
    onPointerUp: (e) => {
      draggingRef.current = false;
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
      e.currentTarget.style.cursor = "grab";
    },
    onPointerLeave: (e) => {
      draggingRef.current = false;
      e.currentTarget.style.cursor = "grab";
    },
  };

  const reset = () => { setView(DEFAULT_VIEW); setHasInteracted(false); };

  return { view, setView, reset, handlers, hasInteracted, svgRef };
}

// ---------- Scene primitives ----------

function _polyPath3D(verts) {
  if (!verts.length) return "";
  let d = "M " + verts[0].sx.toFixed(1) + "," + verts[0].sy.toFixed(1);
  for (let i = 1; i < verts.length; i++) d += " L " + verts[i].sx.toFixed(1) + "," + verts[i].sy.toFixed(1);
  return d + " Z";
}

function SceneRender({ polys, material }) {
  // Painter's algorithm: draw back-to-front (smallest depth first).
  // Convention: depth = sz (camera-space z, larger=closer). Background uses -1e9, foreground labels use +1e9.
  const sorted = useM3D(() => polys.slice().sort((a, b) => a.depth - b.depth), [polys]);
  return (
    <>
      {sorted.map((p, i) => {
        if (p.type === "gridline") {
          return <line key={i} x1={p.a.sx} y1={p.a.sy} x2={p.b.sx} y2={p.b.sy} stroke={p.stroke} strokeWidth={p.width || 1} strokeDasharray={p.dash || "0"} />;
        }
        if (p.type === "face") {
          return _renderFace3D(p, i, material);
        }
        if (p.type === "circle") {
          return <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} stroke={p.stroke || "none"} strokeWidth={p.sw || 1} />;
        }
        if (p.type === "label") {
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              fill={p.fill}
              fontSize={p.size}
              fontWeight={p.weight || 600}
              textAnchor={p.anchor || "middle"}
              fontFamily={p.font || "var(--font-mono)"}
              opacity={p.opacity == null ? 1 : p.opacity}
              pointerEvents="none"
            >
              {p.text}
            </text>
          );
        }
        return null;
      })}
    </>
  );
}

// ---------- 3D Bar chart ----------

function _bar3DScene({ data, colors, progress, stagger, view, sty, showValues, showAxis = true, showGrid = true, numberScale, cx, cy }) {
  const sceneW = 320, sceneD = 130, sceneH = 220;
  const n = data.length;
  const max = Math.max(...data.map((d) => d.value), 1) * 1.1;
  const gap = sceneW / n;
  const barW = gap * 0.6;
  const barD = sceneD * 0.4;

  const polys = [];
  const isDark = sty.text === "#ffffff";
  const groundFill = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const groundStroke = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)";

  // Ground plane
  const groundCorners = [
    { x: -sceneW / 2 - 30, y: 0, z: -sceneD / 2 - 20 },
    { x: sceneW / 2 + 30,  y: 0, z: -sceneD / 2 - 20 },
    { x: sceneW / 2 + 30,  y: 0, z: sceneD / 2 + 20 },
    { x: -sceneW / 2 - 30, y: 0, z: sceneD / 2 + 20 },
  ].map((p) => project3D(p, view, cx, cy));
  polys.push({ type: "face", verts: groundCorners, depth: -1e9, fill: groundFill, stroke: groundStroke });

  // Floor grid — drawn just above ground, still in BG layer
  if (showGrid) {
    const gridSteps = 8;
    for (let i = 0; i <= gridSteps; i++) {
      const t = i / gridSteps;
      const x = lerp3(-sceneW / 2, sceneW / 2, t);
      const a = project3D({ x, y: 0.4, z: -sceneD / 2 }, view, cx, cy);
      const b = project3D({ x, y: 0.4, z: sceneD / 2 }, view, cx, cy);
      polys.push({ type: "gridline", a, b, depth: -1e9 + 1, stroke: groundStroke });
    }
    const gridZ = 5;
    for (let i = 0; i <= gridZ; i++) {
      const t = i / gridZ;
      const z = lerp3(-sceneD / 2, sceneD / 2, t);
      const a = project3D({ x: -sceneW / 2, y: 0.4, z }, view, cx, cy);
      const b = project3D({ x: sceneW / 2, y: 0.4, z }, view, cx, cy);
      polys.push({ type: "gridline", a, b, depth: -1e9 + 1, stroke: groundStroke });
    }
  }

  // Y-axis ticks (on back-left wall) — BG layer
  if (showAxis || showGrid) {
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const yh = (sceneH / 1.1) * 1.1 * i / ticks;
      if (showGrid) {
        const a = project3D({ x: -sceneW / 2, y: yh, z: -sceneD / 2 }, view, cx, cy);
        const b = project3D({ x: sceneW / 2, y: yh, z: -sceneD / 2 }, view, cx, cy);
        polys.push({ type: "gridline", a, b, depth: -1e9 + 2, stroke: groundStroke, dash: "3 4" });
      }
      if (showAxis) {
        const lab = project3D({ x: -sceneW / 2 - 8, y: yh, z: -sceneD / 2 }, view, cx, cy);
        polys.push({
          type: "label", x: lab.sx, y: lab.sy + 4,
          text: Math.round((max * i) / ticks),
          depth: 1e9,
          fill: sty.textSoft, size: 10.5 * numberScale,
          weight: 500, anchor: "end",
        });
      }
    }
  }

  // Bars
  data.forEach((d, i) => {
    const p = staggered3D(progress, i, n, stagger);
    const h = (d.value / max) * sceneH * p;
    if (h < 0.5) return;

    const xL = -sceneW / 2 + gap * i + (gap - barW) / 2;
    const zL = -barD / 2;
    const color = colors[i % colors.length];

    // 8 corners
    const V = [
      { x: xL,         y: 0, z: zL },           // 0 bfl
      { x: xL + barW,  y: 0, z: zL },           // 1 bfr
      { x: xL + barW,  y: 0, z: zL + barD },    // 2 bbr
      { x: xL,         y: 0, z: zL + barD },    // 3 bbl
      { x: xL,         y: h, z: zL },           // 4 tfl
      { x: xL + barW,  y: h, z: zL },           // 5 tfr
      { x: xL + barW,  y: h, z: zL + barD },    // 6 tbr
      { x: xL,         y: h, z: zL + barD },    // 7 tbl
    ].map((v) => project3D(v, view, cx, cy));

    // Top
    polys.push(_facePoly3D([V[4], V[5], V[6], V[7]], color, i, 0.78));
    // Front (-z)
    polys.push(_facePoly3D([V[0], V[1], V[5], V[4]], color, i, 0.58));
    // Back (+z)
    polys.push(_facePoly3D([V[3], V[7], V[6], V[2]], color, i, 0.38));
    // Left
    polys.push(_facePoly3D([V[0], V[4], V[7], V[3]], color, i, 0.46));
    // Right
    polys.push(_facePoly3D([V[1], V[2], V[6], V[5]], color, i, 0.5));

    // Top value label
    if (showValues) {
      const top = project3D({ x: xL + barW / 2, y: h + 10, z: zL + barD / 2 }, view, cx, cy);
      polys.push({
        type: "label", x: top.sx, y: top.sy,
        text: Math.round(d.value * p),
        depth: 1e9,
        fill: sty.text, size: 12 * numberScale, weight: 700,
        opacity: Math.min(1, p * 4),
      });
    }
    // X-axis label (in front of base)
    const base = project3D({ x: xL + barW / 2, y: -6, z: zL + barD + 14 }, view, cx, cy);
    polys.push({
      type: "label", x: base.sx, y: base.sy + 4,
      text: d.label,
      depth: 1e9,
      fill: sty.textSoft, size: 11.5 * numberScale, weight: 500,
    });
  });

  return polys;
}

// ---------- 3D Pie / Donut ----------

function _pie3DScene({ data, colors, progress, stagger, view, sty, showValues, numberScale, donut, cx, cy }) {
  const outerR = 110;
  const innerR = donut ? 60 : 0;
  const H = 38;
  const segPerRad = 26 / Math.PI; // tessellation density
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  const polys = [];
  const isDark = sty.text === "#ffffff";

  // Shadow disk
  const shadowVerts = [];
  for (let i = 0; i <= 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    shadowVerts.push(project3D({ x: Math.cos(a) * outerR * 1.25, y: -0.5, z: Math.sin(a) * outerR * 1.25 }, view, cx, cy));
  }
  polys.push({ type: "face", verts: shadowVerts, depth: -1e9, fill: isDark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.12)" });

  let angle = -Math.PI / 2; // start at top
  data.forEach((d, i) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const p = staggered3D(progress, i, data.length, stagger);
    if (sweep * p < 0.001) { angle += sweep; return; }

    const endA = angle + sweep * p;
    const arcSegs = Math.max(2, Math.ceil(Math.abs(endA - angle) * segPerRad));
    const arcAngles = [];
    for (let k = 0; k <= arcSegs; k++) arcAngles.push(angle + (endA - angle) * (k / arcSegs));
    const color = colors[i % colors.length];
    const stroke = shade3D(color, 0.28);

    // Top face polygon
    let topPts;
    if (donut) {
      const outerPts = arcAngles.map((a) => project3D({ x: Math.cos(a) * outerR, y: H, z: Math.sin(a) * outerR }, view, cx, cy));
      const innerPts = [...arcAngles].reverse().map((a) => project3D({ x: Math.cos(a) * innerR, y: H, z: Math.sin(a) * innerR }, view, cx, cy));
      topPts = [...outerPts, ...innerPts];
    } else {
      const c0 = project3D({ x: 0, y: H, z: 0 }, view, cx, cy);
      const outerPts = arcAngles.map((a) => project3D({ x: Math.cos(a) * outerR, y: H, z: Math.sin(a) * outerR }, view, cx, cy));
      topPts = [c0, ...outerPts];
    }
    polys.push(_facePoly3D(topPts, color, i, 0.78));

    // Outer curved face
    for (let k = 0; k < arcSegs; k++) {
      const a0 = arcAngles[k], a1 = arcAngles[k + 1];
      const am = (a0 + a1) / 2;
      // Shade by orientation: faces with normal closest to -z (toward viewer) brightest
      const nx = Math.cos(am), nz = Math.sin(am);
      // After yaw rotation, effective screen-z normal:
      const cosY = Math.cos(view.yaw), sinY = Math.sin(view.yaw);
      const nzView = -nx * sinY + nz * cosY;
      const facing = -nzView; // toward camera positive
      const sideShade = 0.36 + 0.28 * Math.max(0, Math.min(1, (facing + 1) / 2));
      const verts = [
        { x: Math.cos(a0) * outerR, y: 0, z: Math.sin(a0) * outerR },
        { x: Math.cos(a1) * outerR, y: 0, z: Math.sin(a1) * outerR },
        { x: Math.cos(a1) * outerR, y: H, z: Math.sin(a1) * outerR },
        { x: Math.cos(a0) * outerR, y: H, z: Math.sin(a0) * outerR },
      ].map((v) => project3D(v, view, cx, cy));
      polys.push(_facePoly3D(verts, color, i, sideShade));
    }

    // Inner curved face (donut)
    if (donut) {
      for (let k = 0; k < arcSegs; k++) {
        const a0 = arcAngles[k], a1 = arcAngles[k + 1];
        const verts = [
          { x: Math.cos(a1) * innerR, y: 0, z: Math.sin(a1) * innerR },
          { x: Math.cos(a0) * innerR, y: 0, z: Math.sin(a0) * innerR },
          { x: Math.cos(a0) * innerR, y: H, z: Math.sin(a0) * innerR },
          { x: Math.cos(a1) * innerR, y: H, z: Math.sin(a1) * innerR },
        ].map((v) => project3D(v, view, cx, cy));
        polys.push(_facePoly3D(verts, color, i, 0.32));
      }
    }

    // Two radial side faces
    const sa = angle;
    const ea = endA;
    const startVerts = (donut
      ? [
          { x: Math.cos(sa) * innerR, y: 0, z: Math.sin(sa) * innerR },
          { x: Math.cos(sa) * outerR, y: 0, z: Math.sin(sa) * outerR },
          { x: Math.cos(sa) * outerR, y: H, z: Math.sin(sa) * outerR },
          { x: Math.cos(sa) * innerR, y: H, z: Math.sin(sa) * innerR },
        ]
      : [
          { x: 0, y: 0, z: 0 },
          { x: Math.cos(sa) * outerR, y: 0, z: Math.sin(sa) * outerR },
          { x: Math.cos(sa) * outerR, y: H, z: Math.sin(sa) * outerR },
          { x: 0, y: H, z: 0 },
        ]
    ).map((v) => project3D(v, view, cx, cy));
    polys.push(_facePoly3D(startVerts, color, i, 0.44));

    const endVerts = (donut
      ? [
          { x: Math.cos(ea) * outerR, y: 0, z: Math.sin(ea) * outerR },
          { x: Math.cos(ea) * innerR, y: 0, z: Math.sin(ea) * innerR },
          { x: Math.cos(ea) * innerR, y: H, z: Math.sin(ea) * innerR },
          { x: Math.cos(ea) * outerR, y: H, z: Math.sin(ea) * outerR },
        ]
      : [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: H, z: 0 },
          { x: Math.cos(ea) * outerR, y: H, z: Math.sin(ea) * outerR },
          { x: Math.cos(ea) * outerR, y: 0, z: Math.sin(ea) * outerR },
        ]
    ).map((v) => project3D(v, view, cx, cy));
    polys.push(_facePoly3D(endVerts, color, i, 0.44));

    // Label on top
    if (showValues && sweep > 0.18 && p > 0.1) {
      const midA = angle + (endA - angle) / 2;
      const lr = donut ? (outerR + innerR) / 2 : outerR * 0.65;
      const lp = project3D({ x: Math.cos(midA) * lr, y: H + 2, z: Math.sin(midA) * lr }, view, cx, cy);
      polys.push({
        type: "label", x: lp.sx, y: lp.sy - 3,
        text: Math.round((d.value / total) * 100 * p) + "%",
        depth: 1e9,
        fill: "#fff", size: 13 * numberScale, weight: 700,
        opacity: Math.min(1, p * 3),
      });
      polys.push({
        type: "label", x: lp.sx, y: lp.sy + 12,
        text: d.label,
        depth: 1e9,
        fill: "rgba(255,255,255,0.92)", size: 10.5 * numberScale, weight: 500,
        font: "var(--font-ui)",
        opacity: Math.min(1, p * 3),
      });
    }
    angle += sweep;
  });

  // Donut center total
  if (donut && showValues) {
    const c0 = project3D({ x: 0, y: H + 4, z: 0 }, view, cx, cy);
    polys.push({
      type: "label", x: c0.sx, y: c0.sy - 4,
      text: String(Math.round(total * progress)),
      depth: 1e9,
      fill: sty.text, size: 30 * numberScale, weight: 700,
    });
    polys.push({
      type: "label", x: c0.sx, y: c0.sy + 16,
      text: "TOTAL",
      depth: 1e9,
      fill: sty.textSoft, size: 11 * numberScale, weight: 600,
      font: "var(--font-ui)",
    });
  }

  return polys;
}

// ---------- 3D Line (extruded ribbon) ----------

function _line3DScene({ data, colors, progress, view, sty, showValues, showAxis = true, showGrid = true, numberScale, cx, cy }) {
  const sceneW = 340, sceneD = 60, sceneH = 220;
  const n = data.length;
  const max = Math.max(...data.map((d) => d.value), 1) * 1.15;

  const polys = [];
  const isDark = sty.text === "#ffffff";
  const groundFill = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const groundStroke = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)";

  // Ground
  const corners = [
    { x: -sceneW / 2 - 30, y: 0, z: -sceneD - 10 },
    { x: sceneW / 2 + 30,  y: 0, z: -sceneD - 10 },
    { x: sceneW / 2 + 30,  y: 0, z: sceneD + 10 },
    { x: -sceneW / 2 - 30, y: 0, z: sceneD + 10 },
  ].map((p) => project3D(p, view, cx, cy));
  polys.push({ type: "face", verts: corners, depth: -1e9, fill: groundFill, stroke: groundStroke });

  // Y-axis ticks back wall
  if (showAxis || showGrid) {
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const yh = (sceneH / max) * (max * i / ticks);
      if (showGrid) {
        const a = project3D({ x: -sceneW / 2, y: yh, z: -sceneD }, view, cx, cy);
        const b = project3D({ x: sceneW / 2, y: yh, z: -sceneD }, view, cx, cy);
        polys.push({ type: "gridline", a, b, depth: -1e9 + 1, stroke: groundStroke, dash: "3 4" });
      }
      if (showAxis) {
        const lab = project3D({ x: -sceneW / 2 - 8, y: yh, z: -sceneD }, view, cx, cy);
        polys.push({
          type: "label", x: lab.sx, y: lab.sy + 4,
          text: Math.round(max * i / ticks),
          depth: 1e9,
          fill: sty.textSoft, size: 10.5 * numberScale, weight: 500, anchor: "end",
        });
      }
    }
  }

  // Points
  const pts = data.map((d, i) => ({
    x: -sceneW / 2 + (sceneW * i) / Math.max(1, n - 1),
    h: (d.value / max) * sceneH,
    v: d.value,
    label: d.label,
  }));

  const d3 = sceneD * 0.5;
  const segs = pts.length - 1;
  const drawn = segs * progress;
  const color = colors[0];

  for (let i = 0; i < segs; i++) {
    const t = Math.max(0, Math.min(1, drawn - i));
    if (t <= 0) break;
    const a = pts[i];
    const b = pts[i + 1];
    const bx = a.x + (b.x - a.x) * t;
    const bh = a.h + (b.h - a.h) * t;

    const V = {
      a_bf: project3D({ x: a.x, y: 0, z: -d3 / 2 }, view, cx, cy),
      a_bb: project3D({ x: a.x, y: 0, z: d3 / 2 }, view, cx, cy),
      a_tf: project3D({ x: a.x, y: a.h, z: -d3 / 2 }, view, cx, cy),
      a_tb: project3D({ x: a.x, y: a.h, z: d3 / 2 }, view, cx, cy),
      b_bf: project3D({ x: bx, y: 0, z: -d3 / 2 }, view, cx, cy),
      b_bb: project3D({ x: bx, y: 0, z: d3 / 2 }, view, cx, cy),
      b_tf: project3D({ x: bx, y: bh, z: -d3 / 2 }, view, cx, cy),
      b_tb: project3D({ x: bx, y: bh, z: d3 / 2 }, view, cx, cy),
    };
    // Top (sloped)
    const top = [V.a_tf, V.b_tf, V.b_tb, V.a_tb];
    polys.push(_facePoly3D(top, color, 0, 0.74));
    // Front
    const front = [V.a_bf, V.b_bf, V.b_tf, V.a_tf];
    polys.push(_facePoly3D(front, color, 0, 0.55));
    // Back
    const back = [V.b_bb, V.a_bb, V.a_tb, V.b_tb];
    polys.push(_facePoly3D(back, color, 0, 0.34));
  }

  // Markers + labels
  pts.forEach((p, i) => {
    if (i > drawn) return;
    const span = 1; // count-up local progress
    const local = Math.max(0, Math.min(1, drawn - i + 1));
    const dotCol = colors[i % colors.length];
    const tipFront = project3D({ x: p.x, y: p.h, z: -d3 / 2 - 2 }, view, cx, cy);
    polys.push({
      type: "circle", cx: tipFront.sx, cy: tipFront.sy, r: 5.5,
      depth: 1e9 - 1,
      fill: dotCol, stroke: shade3D(dotCol, 0.85), sw: 1.5,
    });
    if (showValues) {
      polys.push({
        type: "label", x: tipFront.sx, y: tipFront.sy - 12,
        text: Math.round(p.v * local),
        depth: 1e9,
        fill: sty.text, size: 11.5 * numberScale, weight: 700,
        opacity: Math.min(1, local * 2),
      });
    }
    const lab = project3D({ x: p.x, y: -4, z: d3 / 2 + 14 }, view, cx, cy);
    polys.push({
      type: "label", x: lab.sx, y: lab.sy + 6,
      text: p.label,
      depth: 1e9,
      fill: sty.textSoft, size: 11.5 * numberScale, weight: 500,
    });
  });

  return polys;
}

// ---------- Chart3D wrapper ----------

function Chart3D({
  chartType, data, colors, progress, stagger, sty,
  showValues, showAxis = true, showGrid = true, numberScale,
  autoRotate, rotateSpeed, replayKey,
  viewSignal, onResetReady, material = "plastic",
  introFraction,
}) {
  const { view, reset, handlers, hasInteracted, svgRef } = use3DView({ autoRotate, rotateSpeed, replayKey });

  // Expose reset to parent
  useE3D(() => {
    if (onResetReady) onResetReady(reset);
  }, [onResetReady]);

  // Reset when external signal toggles
  useE3D(() => {
    if (viewSignal !== undefined && viewSignal !== null) reset();
  }, [viewSignal]);

  // Entry rotation/zoom animation — interpolates view with intro offset
  const introFrac = introFraction == null ? 0.65 : introFraction;
  const introT = (hasInteracted || introFrac <= 0.01)
    ? 1
    : Math.min(1, progress / Math.max(0.05, introFrac));
  const eased = 1 - Math.pow(1 - introT, 3);
  const renderView = {
    yaw: view.yaw - 0.9 * (1 - eased),
    pitch: view.pitch - 0.18 * (1 - eased),
    zoom: view.zoom * (0.55 + 0.45 * eased),
  };

  const w = 900, h = 520;
  const cx = w / 2, cy = h / 2 + 30;

  const polys = useM3D(() => {
    if (chartType === "bar") {
      return _bar3DScene({ data, colors, progress, stagger, view: renderView, sty, showValues, showAxis, showGrid, numberScale, cx, cy });
    }
    if (chartType === "pie" || chartType === "donut") {
      return _pie3DScene({ data, colors, progress, stagger, view: renderView, sty, showValues, numberScale, donut: chartType === "donut", cx, cy });
    }
    if (chartType === "line") {
      return _line3DScene({ data, colors, progress, view: renderView, sty, showValues, showAxis, showGrid, numberScale, cx, cy });
    }
    return [];
  }, [chartType, data, colors, progress, stagger, renderView.yaw, renderView.pitch, renderView.zoom, sty, showValues, showAxis, showGrid, numberScale]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${w} ${h}`}
      className="chart-svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ cursor: "grab", touchAction: "none", userSelect: "none" }}
      {...handlers}
    >
      <defs>
        {material === "metal" && colors.map((c, i) => (
          <linearGradient key={i} id={`mat3d-metal-${i}`} x1="0" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor={shade3D(c, 0.95)} />
            <stop offset="28%" stopColor={shade3D(c, 0.55)} />
            <stop offset="52%" stopColor={shade3D(c, 0.82)} />
            <stop offset="78%" stopColor={shade3D(c, 0.4)} />
            <stop offset="100%" stopColor={shade3D(c, 0.22)} />
          </linearGradient>
        ))}
        {material === "neon" && (
          <filter id="mat3d-neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" />
            <feMerge>
              <feMergeNode />
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <SceneRender polys={polys} material={material} />
    </svg>
  );
}

Object.assign(window, { Chart3D, shade3D, project3D, DEFAULT_VIEW, MATERIALS_3D, MATERIAL_KEYS_3D });
