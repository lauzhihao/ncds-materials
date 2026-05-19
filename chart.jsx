/* eslint-disable */
/* ============================================================
   Chart engine — 4 types × 6 styles with animated progress
   ============================================================ */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---------- Style definitions ----------

const STYLES = {
  flat: {
    label: "平面",
    en: "Flat 2D",
    bg: "#f6f4ef",
    grid: "#e6e1d6",
    text: "#1a1a1a",
    textSoft: "#5b5b5b",
    shadow: "none",
  },
  gradient: {
    label: "渐变",
    en: "Gradient",
    bg: "linear-gradient(160deg, #fdfcff 0%, #eef0fb 100%)",
    grid: "#d8dceb",
    text: "#1a1a2e",
    textSoft: "#5b5d72",
    shadow: "0 30px 80px -20px rgba(40,40,80,0.15)",
  },
  glass: {
    label: "玻璃",
    en: "Glassmorphism",
    bg: "linear-gradient(135deg, #1a4d8f 0%, #6e3aa8 50%, #c1306d 100%)",
    grid: "rgba(255,255,255,0.12)",
    text: "#ffffff",
    textSoft: "rgba(255,255,255,0.7)",
    shadow: "none",
  },
  threed: {
    label: "立体",
    en: "Isometric 3D",
    bg: "#eceae3",
    grid: "#d8d4c8",
    text: "#1f1d18",
    textSoft: "#56524a",
    shadow: "none",
  },
  metal: {
    label: "金属",
    en: "Metallic",
    bg: "radial-gradient(ellipse at top, #2c3036 0%, #15171b 100%)",
    grid: "rgba(255,255,255,0.06)",
    text: "#e8e6df",
    textSoft: "#9a958a",
    shadow: "none",
  },
  neon: {
    label: "霓虹",
    en: "Neon Glow",
    bg: "#07060e",
    grid: "rgba(120, 90, 255, 0.1)",
    text: "#ffffff",
    textSoft: "#9b9ec4",
    shadow: "none",
  },
};

const STYLE_KEYS = ["flat", "gradient", "glass", "threed", "metal", "neon"];

// ---------- Background presets (override style's default bg) ----------

const BACKGROUNDS = {
  default:  { name: "跟随风格", css: null, dark: null, auto: true },
  custom:   { name: "自定义", css: null, dark: null, isCustom: true },
  greenkey: { name: "绿幕", css: "#00b140", dark: false, chroma: true },
  bluekey:  { name: "蓝幕", css: "#0047bb", dark: true, chroma: true },
  purewhite:{ name: "纯白", css: "#ffffff", dark: false },
  pureblack:{ name: "纯黑", css: "#000000", dark: true },
  paper:    { name: "纸白",   css: "#f6f4ef", dark: false },
  cream:    { name: "奶油",   css: "#fff8e7", dark: false },
  mint:     { name: "薄荷",   css: "linear-gradient(160deg, #ecfdf5 0%, #d1fae5 100%)", dark: false },
  ink:      { name: "墨黑",   css: "#0a0a0a", dark: true },
  midnight: { name: "深夜",   css: "linear-gradient(180deg, #0f1224 0%, #1a1b35 100%)", dark: true },
  ocean:    { name: "深海",   css: "linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)", dark: true },
  sunset:   { name: "晚霞",   css: "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)", dark: true },
  aurora:   { name: "极光",   css: "linear-gradient(135deg, #00c6ff 0%, #0072ff 50%, #6a3093 100%)", dark: true },
  mesh:     { name: "光斑",   css: "radial-gradient(at 18% 28%, rgba(255,107,53,0.55) 0px, transparent 45%), radial-gradient(at 82% 72%, rgba(94,96,206,0.5) 0px, transparent 45%), #0e1014", dark: true },
};

function _isHexDark(hex) {
  if (typeof hex !== "string" || !hex.startsWith("#")) return false;
  const h = hex.length === 4 ? "#" + hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3] : hex;
  const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
  const yiq = (r*299 + g*587 + b*114) / 1000;
  return yiq < 128;
}

function resolveStyle(styleKey, bgKey, customBg) {
  const base = STYLES[styleKey];
  const preset = BACKGROUNDS[bgKey];
  if (!preset) return base;
  if (preset.isCustom) {
    const c = customBg || "#00b140";
    const isDark = _isHexDark(c);
    return {
      ...base,
      bg: c,
      text: isDark ? "#ffffff" : "#1a1a1a",
      textSoft: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)",
      grid: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    };
  }
  if (preset.css == null) return base;
  return {
    ...base,
    bg: preset.css,
    text: preset.dark ? "#ffffff" : "#1a1a1a",
    textSoft: preset.dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)",
    grid: preset.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
  };
}

// ---------- SVG defs (gradients/filters per series color and style) ----------

function StyleDefs({ styleKey, colors }) {
  return (
    <defs>
      {/* Gradient style: vertical */}
      {colors.map((c, i) => (
        <linearGradient key={`g-grad-${i}`} id={`grad-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lighten(c, 0.22)} />
          <stop offset="100%" stopColor={darken(c, 0.18)} />
        </linearGradient>
      ))}

      {/* Glass style */}
      {colors.map((c, i) => (
        <linearGradient key={`g-glass-${i}`} id={`grad-glass-${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.55" />
          <stop offset="100%" stopColor={c} stopOpacity="0.25" />
        </linearGradient>
      ))}
      <linearGradient id="glass-highlight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
        <stop offset="40%" stopColor="rgba(255,255,255,0.05)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>

      {/* Metal style — vertical brushed metal */}
      {colors.map((c, i) => (
        <linearGradient key={`g-metal-${i}`} id={`grad-metal-${i}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={darken(c, 0.4)} />
          <stop offset="20%" stopColor={lighten(c, 0.25)} />
          <stop offset="50%" stopColor={darken(c, 0.25)} />
          <stop offset="80%" stopColor={lighten(c, 0.18)} />
          <stop offset="100%" stopColor={darken(c, 0.45)} />
        </linearGradient>
      ))}
      {/* Metal style — radial for pie */}
      {colors.map((c, i) => (
        <radialGradient
          key={`g-metalR-${i}`}
          id={`grad-metalR-${i}`}
          cx="50%"
          cy="50%"
          r="60%"
        >
          <stop offset="0%" stopColor={lighten(c, 0.3)} />
          <stop offset="60%" stopColor={c} />
          <stop offset="100%" stopColor={darken(c, 0.5)} />
        </radialGradient>
      ))}

      {/* Neon glow filter */}
      <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.5" result="blur1" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur2" />
        <feMerge>
          <feMergeNode in="blur1" />
          <feMergeNode in="blur1" />
          <feMergeNode in="blur2" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* 3D side/top face derived colors handled inline */}
    </defs>
  );
}

// ---------- Color helpers ----------

function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}
function lighten(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}
function darken(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amt), g * (1 - amt), b * (1 - amt));
}

// ---------- Fill resolver ----------

function fillFor(styleKey, colorIndex) {
  switch (styleKey) {
    case "gradient": return `url(#grad-grad-${colorIndex})`;
    case "glass": return `url(#grad-glass-${colorIndex})`;
    case "metal": return `url(#grad-metal-${colorIndex})`;
    default: return null;
  }
}

// ---------- Easing ----------

const EASINGS = {
  ease: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  bounce: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75; }
    if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375; }
    t -= 2.625 / d1; return n1 * t * t + 0.984375;
  },
  elastic: (t) => {
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// ---------- Animation hook ----------

function useAnimation(duration, easing, delay, replayKey) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf;
    let start;
    setProgress(0);
    const ease = EASINGS[easing] || EASINGS.out;
    const startTime = performance.now() + delay * 1000;
    const tick = (now) => {
      if (now < startTime) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, (now - startTime) / (duration * 1000));
      setProgress(ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, easing, delay, replayKey]);
  return progress;
}

// ---------- Per-item staggered progress ----------

function staggered(progress, i, total, staggerAmt) {
  if (staggerAmt <= 0) return progress;
  const slice = staggerAmt; // each item starts this fraction later
  const startAt = (i / Math.max(1, total - 1)) * slice;
  const range = 1 - slice;
  if (range <= 0) return progress >= 1 ? 1 : 0;
  const p = (progress - startAt) / range;
  return Math.max(0, Math.min(1, p));
}

// ============================================================
// BAR CHART
// ============================================================

function BarChart({ data, colors, styleKey, style, progress, stagger, showValues = true, showAxis = true, showGrid = true, numberScale = 1 }) {
  const w = 900, h = 520;
  const pad = { top: 90, right: 50, bottom: 70, left: 60 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const max = Math.max(...data.map((d) => d.value), 1) * 1.1;
  const bw = innerW / data.length;
  const barW = bw * 0.62;

  const sty = style || STYLES[styleKey];
  const fs = (n) => n * numberScale;

  const ticks = 5;
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => (max / ticks) * i);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg" preserveAspectRatio="xMidYMid meet">
      <StyleDefs styleKey={styleKey} colors={colors} />

      {/* Grid */}
      {tickValues.map((v, i) => {
        const y = pad.top + innerH - (v / max) * innerH;
        return (
          <g key={`grid-${i}`}>
            {showGrid && <line x1={pad.left} x2={w - pad.right} y1={y} y2={y} stroke={sty.grid} strokeWidth="1" strokeDasharray={styleKey === "neon" ? "2 4" : "0"} />}
            {showAxis && <text x={pad.left - 12} y={y + 4} fill={sty.textSoft} fontSize={fs(11)} textAnchor="end" fontFamily="var(--font-mono)">{Math.round(v)}</text>}
          </g>
        );
      })}

      {/* Baseline */}
      {showGrid && <line x1={pad.left} x2={w - pad.right} y1={pad.top + innerH} y2={pad.top + innerH} stroke={sty.grid} strokeWidth="1.5" />}

      {/* Bars */}
      {data.map((d, i) => {
        const p = staggered(progress, i, data.length, stagger);
        const x = pad.left + bw * i + (bw - barW) / 2;
        const barH = (d.value / max) * innerH * p;
        const y = pad.top + innerH - barH;
        const color = colors[i % colors.length];

        return (
          <g key={`bar-${i}`}>
            {renderBar(styleKey, x, y, barW, barH, color, i)}

            {/* Value label — count-up */}
            {showValues && p > 0.02 && (
              <text
                x={x + barW / 2}
                y={y - 8}
                fill={sty.text}
                fontSize={fs(12)}
                fontWeight="600"
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                opacity={Math.min(1, p * 5)}
              >
                {Math.round(d.value * p)}
              </text>
            )}

            {/* Category label */}
            <text
              x={x + barW / 2}
              y={pad.top + innerH + 22}
              fill={sty.textSoft}
              fontSize={fs(12)}
              textAnchor="middle"
              fontWeight="500"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function renderBar(styleKey, x, y, w, h, color, i) {
  if (h <= 0.5) return null;
  switch (styleKey) {
    case "flat":
      return <rect x={x} y={y} width={w} height={h} fill={color} rx="2" />;
    case "gradient":
      return <rect x={x} y={y} width={w} height={h} fill={`url(#grad-grad-${i})`} rx="6" />;
    case "glass":
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={`url(#grad-glass-${i})`} rx="8" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
          <rect x={x + 2} y={y + 2} width={w * 0.25} height={h - 4} fill="url(#glass-highlight)" rx="6" />
        </g>
      );
    case "threed": {
      const depth = Math.min(18, w * 0.28);
      const front = color;
      const top = lighten(color, 0.22);
      const side = darken(color, 0.28);
      return (
        <g>
          {/* right side */}
          <polygon
            points={`${x + w},${y} ${x + w + depth},${y - depth} ${x + w + depth},${y - depth + h} ${x + w},${y + h}`}
            fill={side}
          />
          {/* top */}
          <polygon
            points={`${x},${y} ${x + depth},${y - depth} ${x + w + depth},${y - depth} ${x + w},${y}`}
            fill={top}
          />
          {/* front */}
          <rect x={x} y={y} width={w} height={h} fill={front} />
        </g>
      );
    }
    case "metal":
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={`url(#grad-metal-${i})`} rx="2" />
          <rect x={x} y={y} width={w} height={2} fill={lighten(color, 0.5)} opacity="0.8" />
          <rect x={x} y={y + h - 2} width={w} height={2} fill={darken(color, 0.6)} opacity="0.7" />
        </g>
      );
    case "neon":
      return (
        <g filter="url(#neon-glow)">
          <rect x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeWidth="2.5" rx="4" />
          <rect x={x + 4} y={y + 4} width={w - 8} height={Math.max(0, h - 8)} fill={color} opacity="0.18" rx="2" />
        </g>
      );
    default:
      return <rect x={x} y={y} width={w} height={h} fill={color} />;
  }
}

// ============================================================
// LINE CHART (指数图)
// ============================================================

function LineChart({ data, colors, styleKey, style, progress, showValues = true, showAxis = true, showGrid = true, numberScale = 1 }) {
  const w = 900, h = 520;
  const pad = { top: 90, right: 60, bottom: 70, left: 60 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const max = Math.max(...data.map((d) => d.value), 1) * 1.15;
  const min = 0;
  const sty = style || STYLES[styleKey];
  const fs = (n) => n * numberScale;

  const points = data.map((d, i) => ({
    x: pad.left + (innerW * i) / Math.max(1, data.length - 1),
    y: pad.top + innerH - ((d.value - min) / (max - min)) * innerH,
    v: d.value,
    label: d.label,
  }));

  // Build smooth curve path
  const linePath = useMemo(() => buildSmoothPath(points), [points]);
  const areaPath = useMemo(() => buildAreaPath(points, pad.top + innerH), [points]);

  // For stroke-dashoffset animation we need pathLength approximation
  // Use a long fixed length and rely on dashoffset = length*(1-progress)
  const pathLen = 4500;

  const ticks = 5;
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => (max / ticks) * i);

  // Use first color as primary
  const primary = colors[0];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg" preserveAspectRatio="xMidYMid meet">
      <StyleDefs styleKey={styleKey} colors={colors} />
      <defs>
        <linearGradient id="line-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary} stopOpacity={styleKey === "neon" ? "0.45" : "0.35"} />
          <stop offset="100%" stopColor={primary} stopOpacity="0" />
        </linearGradient>
        <clipPath id="line-clip">
          <rect x={pad.left} y={pad.top - 10} width={innerW * progress} height={innerH + 20} />
        </clipPath>
      </defs>

      {/* Grid */}
      {tickValues.map((v, i) => {
        const y = pad.top + innerH - (v / max) * innerH;
        return (
          <g key={`grid-${i}`}>
            {showGrid && <line x1={pad.left} x2={w - pad.right} y1={y} y2={y} stroke={sty.grid} strokeWidth="1" />}
            {showAxis && <text x={pad.left - 12} y={y + 4} fill={sty.textSoft} fontSize={fs(11)} textAnchor="end" fontFamily="var(--font-mono)">{Math.round(v)}</text>}
          </g>
        );
      })}

      {/* Area fill (clipped by progress) */}
      <g clipPath="url(#line-clip)">
        <path d={areaPath} fill="url(#line-area)" />
      </g>

      {/* Line itself */}
      {renderLine(styleKey, linePath, primary, pathLen, progress)}

      {/* Points (appear as progress passes them) */}
      {points.map((p, i) => {
        const t = i / Math.max(1, points.length - 1);
        const visible = progress > t - 0.001;
        if (!visible) return null;
        // Local progress for this point's value count-up
        const span = 1 / Math.max(1, points.length - 1);
        const localP = Math.max(0, Math.min(1, (progress - t + span) / span));
        const color = colors[i % colors.length];
        return (
          <g key={`pt-${i}`}>
            {renderPoint(styleKey, p.x, p.y, color, i)}
            <text
              x={p.x}
              y={pad.top + innerH + 22}
              fill={sty.textSoft}
              fontSize={fs(12)}
              textAnchor="middle"
              fontWeight="500"
            >
              {p.label}
            </text>
            {showValues && (
              <text
                x={p.x}
                y={p.y - 16}
                fill={sty.text}
                fontSize={fs(11)}
                fontWeight="600"
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                opacity={Math.min(1, localP * 2)}
              >
                {Math.round(p.v * localP)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function buildSmoothPath(points) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

function buildAreaPath(points, baseY) {
  if (points.length < 2) return "";
  let d = buildSmoothPath(points);
  d += ` L ${points[points.length - 1].x},${baseY}`;
  d += ` L ${points[0].x},${baseY} Z`;
  return d;
}

function renderLine(styleKey, d, color, pathLen, progress) {
  const dashOffset = pathLen * (1 - progress);
  switch (styleKey) {
    case "flat":
      return <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={pathLen} strokeDashoffset={dashOffset} />;
    case "gradient":
      return <path d={d} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={pathLen} strokeDashoffset={dashOffset} />;
    case "glass":
      return (
        <g strokeDasharray={pathLen} strokeDashoffset={dashOffset}>
          <path d={d} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="5" strokeLinecap="round" />
          <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case "threed":
      return (
        <g strokeDasharray={pathLen} strokeDashoffset={dashOffset}>
          <path d={d} fill="none" stroke={darken(color, 0.5)} strokeWidth="6" strokeLinecap="round" transform="translate(3,3)" opacity="0.4" />
          <path d={d} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <path d={d} fill="none" stroke={lighten(color, 0.3)} strokeWidth="1.5" strokeLinecap="round" transform="translate(-0.5,-0.5)" />
        </g>
      );
    case "metal":
      return (
        <g strokeDasharray={pathLen} strokeDashoffset={dashOffset}>
          <path d={d} fill="none" stroke={darken(color, 0.6)} strokeWidth="6" strokeLinecap="round" />
          <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <path d={d} fill="none" stroke={lighten(color, 0.5)} strokeWidth="1" strokeLinecap="round" />
        </g>
      );
    case "neon":
      return (
        <g filter="url(#neon-glow)" strokeDasharray={pathLen} strokeDashoffset={dashOffset}>
          <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    default:
      return <path d={d} fill="none" stroke={color} strokeWidth="2" />;
  }
}

function renderPoint(styleKey, x, y, color, i) {
  switch (styleKey) {
    case "flat":
      return <circle cx={x} cy={y} r="4" fill={color} />;
    case "gradient":
      return (
        <g>
          <circle cx={x} cy={y} r="6" fill={`url(#grad-grad-${i})`} />
          <circle cx={x} cy={y} r="2.5" fill="#fff" />
        </g>
      );
    case "glass":
      return (
        <g>
          <circle cx={x} cy={y} r="7" fill={color} fillOpacity="0.4" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
          <circle cx={x - 1.5} cy={y - 1.5} r="2" fill="rgba(255,255,255,0.6)" />
        </g>
      );
    case "threed":
      return (
        <g>
          <ellipse cx={x + 2} cy={y + 2} rx="6" ry="5" fill={darken(color, 0.5)} opacity="0.4" />
          <circle cx={x} cy={y} r="6" fill={color} />
          <ellipse cx={x - 1.5} cy={y - 2} rx="2.5" ry="1.5" fill={lighten(color, 0.4)} />
        </g>
      );
    case "metal":
      return (
        <g>
          <circle cx={x} cy={y} r="6.5" fill={`url(#grad-metalR-${i})`} stroke={darken(color, 0.4)} strokeWidth="0.5" />
        </g>
      );
    case "neon":
      return (
        <g filter="url(#neon-glow)">
          <circle cx={x} cy={y} r="5" fill={color} />
          <circle cx={x} cy={y} r="2" fill="#fff" />
        </g>
      );
    default:
      return <circle cx={x} cy={y} r="4" fill={color} />;
  }
}

// ============================================================
// PIE CHART
// ============================================================

function PieChart({ data, colors, styleKey, style, progress, stagger, donut = false, showValues = true, numberScale = 1 }) {
  const w = 900, h = 520;
  const cx = w / 2;
  const cy = h / 2 + 20;
  const r = 170;
  const innerR = donut ? 95 : 0;
  const sty = style || STYLES[styleKey];
  const fs = (n) => n * numberScale;

  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  // Compute slice angles
  let angle = -Math.PI / 2; // start at top
  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const startA = angle;
    const endA = angle + sweep;
    angle = endA;
    return { d, i, startA, endA, sweep, color: colors[i % colors.length] };
  });

  // 3D depth — draw side ellipses behind, then front
  const depth = styleKey === "threed" ? 30 : 0;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg" preserveAspectRatio="xMidYMid meet">
      <StyleDefs styleKey={styleKey} colors={colors} />
      <defs>
        <radialGradient id="pie-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="rgba(0,0,0,0.0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
        </radialGradient>
      </defs>

      {/* 3D depth band */}
      {styleKey === "threed" && (
        <g>
          {slices.map((s, i) => {
            const p = staggered(progress, i, slices.length, stagger);
            if (p < 0.01) return null;
            return renderPie3DSide(s, p, cx, cy, r, innerR, depth);
          })}
        </g>
      )}

      {/* Slices */}
      {slices.map((s, i) => {
        const p = staggered(progress, i, slices.length, stagger);
        if (p < 0.005) return null;
        return (
          <g key={`slice-${i}`}>
            {renderPieSlice(styleKey, s, p, cx, cy, r, innerR)}
          </g>
        );
      })}

      {/* Labels - count up percentages */}
      {slices.map((s, i) => {
        const p = staggered(progress, i, slices.length, stagger);
        if (p < 0.05 || !showValues) return null;
        const midA = s.startA + (s.sweep * p) / 2;
        const labelR = donut ? (r + innerR) / 2 : r * 0.65;
        const lx = cx + Math.cos(midA) * labelR;
        const ly = cy + Math.sin(midA) * labelR;
        if (s.sweep < 0.15) return null;
        const pct = ((s.d.value / total) * 100 * p).toFixed(0);
        return (
          <g key={`lbl-${i}`} opacity={Math.min(1, p * 3)}>
            <text x={lx} y={ly - 4} fill={contrastText(s.color, styleKey)} fontSize={fs(13)} fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
              {pct}%
            </text>
            <text x={lx} y={ly + 12} fill={contrastText(s.color, styleKey)} fontSize={fs(10.5)} fontWeight="500" textAnchor="middle" opacity="0.85">
              {s.d.label}
            </text>
          </g>
        );
      })}

      {/* Donut center — count up total */}
      {donut && (
        <g>
          <text x={cx} y={cy - 4} fill={sty.text} fontSize={fs(34)} fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
            {Math.round(total * progress)}
          </text>
          <text x={cx} y={cy + 18} fill={sty.textSoft} fontSize={fs(12)} textAnchor="middle" letterSpacing="0.08em">
            TOTAL
          </text>
        </g>
      )}
    </svg>
  );
}

function contrastText(hex, styleKey) {
  if (styleKey === "neon" || styleKey === "metal" || styleKey === "glass" || styleKey === "threed") return "#fff";
  const { r, g, b } = hexToRgb(hex);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#1a1a1a" : "#ffffff";
}

function sliceArcPath(cx, cy, r, innerR, startA, endA) {
  if (endA - startA >= Math.PI * 2 - 0.001) {
    // Full circle (with hole if donut)
    if (innerR > 0) {
      return `M ${cx + r},${cy} A ${r},${r} 0 1,1 ${cx - r},${cy} A ${r},${r} 0 1,1 ${cx + r},${cy} M ${cx + innerR},${cy} A ${innerR},${innerR} 0 1,0 ${cx - innerR},${cy} A ${innerR},${innerR} 0 1,0 ${cx + innerR},${cy} Z`;
    }
    return `M ${cx + r},${cy} A ${r},${r} 0 1,1 ${cx - r},${cy} A ${r},${r} 0 1,1 ${cx + r},${cy} Z`;
  }
  const x1 = cx + Math.cos(startA) * r;
  const y1 = cy + Math.sin(startA) * r;
  const x2 = cx + Math.cos(endA) * r;
  const y2 = cy + Math.sin(endA) * r;
  const largeArc = endA - startA > Math.PI ? 1 : 0;
  if (innerR > 0) {
    const xi1 = cx + Math.cos(endA) * innerR;
    const yi1 = cy + Math.sin(endA) * innerR;
    const xi2 = cx + Math.cos(startA) * innerR;
    const yi2 = cy + Math.sin(startA) * innerR;
    return `M ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} L ${xi1},${yi1} A ${innerR},${innerR} 0 ${largeArc},0 ${xi2},${yi2} Z`;
  }
  return `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
}

function renderPieSlice(styleKey, s, p, cx, cy, r, innerR) {
  const endA = s.startA + s.sweep * p;
  const path = sliceArcPath(cx, cy, r, innerR, s.startA, endA);
  const i = s.i;

  switch (styleKey) {
    case "flat":
      return <path d={path} fill={s.color} stroke="#fff" strokeWidth="2" />;
    case "gradient":
      return <path d={path} fill={`url(#grad-grad-${i})`} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />;
    case "glass":
      return (
        <g>
          <path d={path} fill={`url(#grad-glass-${i})`} stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        </g>
      );
    case "threed":
      return <path d={path} fill={s.color} stroke={darken(s.color, 0.25)} strokeWidth="1" />;
    case "metal":
      return (
        <g>
          <path d={path} fill={`url(#grad-metalR-${i})`} stroke={darken(s.color, 0.4)} strokeWidth="0.8" />
        </g>
      );
    case "neon":
      return (
        <g filter="url(#neon-glow)">
          <path d={path} fill={s.color} fillOpacity="0.2" stroke={s.color} strokeWidth="2" />
        </g>
      );
    default:
      return <path d={path} fill={s.color} />;
  }
}

function renderPie3DSide(s, p, cx, cy, r, innerR, depth) {
  const endA = s.startA + s.sweep * p;
  // Bottom layers (back to front for depth)
  const layers = [];
  for (let dz = depth; dz > 0; dz -= 2) {
    const path = sliceArcPath(cx, cy + dz, r, innerR, s.startA, endA);
    layers.push(
      <path key={dz} d={path} fill={darken(s.color, 0.4)} />
    );
  }
  return <g key={`3d-${s.i}`}>{layers}</g>;
}

// Expose
Object.assign(window, {
  STYLES, STYLE_KEYS, EASINGS, BACKGROUNDS, resolveStyle, _isHexDark,
  BarChart, LineChart, PieChart,
  useAnimation, lighten, darken,
});
