/* eslint-disable */
/* ============================================================
   App - top-level component
   ============================================================ */

const DEFAULT_PALETTE = "sunrise";

const DEFAULT_DATA = [
  { label: "一月", value: 42 },
  { label: "二月", value: 68 },
  { label: "三月", value: 53 },
  { label: "四月", value: 89 },
  { label: "五月", value: 72 },
  { label: "六月", value: 95 },
];

const CHART_TYPES = [
  { key: "bar", label: "柱状图", icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="6" width="2.5" height="6.5" fill="currentColor" />
      <rect x="5.75" y="3" width="2.5" height="9.5" fill="currentColor" />
      <rect x="10" y="8" width="2.5" height="4.5" fill="currentColor" />
    </svg>
  ) },
  { key: "line", label: "指数图", icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1.5 10L4.5 6L7.5 8L12.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="4.5" cy="6" r="1.2" fill="currentColor" />
      <circle cx="7.5" cy="8" r="1.2" fill="currentColor" />
      <circle cx="12.5" cy="2.5" r="1.2" fill="currentColor" />
    </svg>
  ) },
  { key: "pie", label: "饼图", icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M7 7L7 1.5A5.5 5.5 0 0 1 12.5 7Z" fill="currentColor" />
    </svg>
  ) },
  { key: "donut", label: "环形图", icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7L9.5 7A2.5 2.5 0 0 0 7 4.5Z" fill="currentColor" />
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  ) },
];

function App() {
  const [state, setState] = useState({
    chartType: "bar",
    styleKey: "gradient",
    bgPreset: "default",
    customBg: "#00b140",
    pureMode: false,
    data: DEFAULT_DATA,
    colors: [...PALETTES[DEFAULT_PALETTE].colors],
    paletteKey: DEFAULT_PALETTE,
    title: "季度业务表现",
    subtitle: "上半年关键指标对比",
    duration: 1.2,
    delay: 0.1,
    stagger: 0.4,
    easing: "out",
    showLegend: true,
    showValues: true,
    showAxis: true,
    showGrid: true,
    numberScale: 1,
    autoRotate3D: false,
    rotateSpeed3D: 0.35,
    material3D: "plastic",
    intro3DFraction: 0.65,
    view3DReset: 0,
    replayKey: 0,
  });

  // Listen for color updates from data tab
  useEffect(() => {
    const handler = (e) => {
      const { i, color } = e.detail;
      setState((s) => {
        const colors = [...s.colors];
        colors[i] = color;
        return { ...s, colors, paletteKey: "custom" };
      });
    };
    window.addEventListener("update-color", handler);
    return () => window.removeEventListener("update-color", handler);
  }, []);

  // Auto-replay when data changes substantially? Skip - we replay on style/type change.
  const progress = useAnimation(state.duration, state.easing, state.delay, state.replayKey);

  const sty = resolveStyle(state.styleKey, state.bgPreset, state.customBg);

  // ESC exits pure mode
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && state.pureMode) {
        setState((s) => ({ ...s, pureMode: false }));
      }
      if (e.key === " " && state.pureMode) {
        e.preventDefault();
        setState((s) => ({ ...s, replayKey: s.replayKey + 1 }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.pureMode]);

  const switchType = (type) => {
    setState((s) => ({ ...s, chartType: type, replayKey: s.replayKey + 1 }));
  };

  const replay = () => setState((s) => ({ ...s, replayKey: s.replayKey + 1 }));

  const renderChart = () => {
    const common = {
      data: state.data,
      colors: state.colors,
      styleKey: state.styleKey,
      style: sty,
      progress,
      stagger: state.stagger,
      showValues: state.showValues,
      showAxis: state.showAxis,
      showGrid: state.showGrid,
      numberScale: state.numberScale,
    };
    if (state.styleKey === "threed") {
      return (
        <Chart3D
          chartType={state.chartType}
          {...common}
          sty={sty}
          autoRotate={state.autoRotate3D}
          rotateSpeed={state.rotateSpeed3D}
          replayKey={state.replayKey}
          viewSignal={state.view3DReset}
          material={state.material3D}
          introFraction={state.intro3DFraction}
        />
      );
    }
    switch (state.chartType) {
      case "bar": return <BarChart {...common} />;
      case "line": return <LineChart {...common} />;
      case "pie": return <PieChart {...common} donut={false} />;
      case "donut": return <PieChart {...common} donut={true} />;
      default: return null;
    }
  };

  // Compute canvas styling
  const canvasStyle = {
    background: sty.bg,
    color: sty.text,
    boxShadow:
      state.bgPreset !== "default"
        ? "0 30px 80px -20px rgba(0,0,0,0.45)"
        : state.styleKey === "neon"
        ? "0 0 0 1px rgba(120,90,255,0.18), 0 30px 80px -20px rgba(80,40,180,0.5)"
        : state.styleKey === "metal"
        ? "0 0 0 1px rgba(255,255,255,0.05), 0 30px 80px -20px rgba(0,0,0,0.7)"
        : state.styleKey === "glass"
        ? "0 30px 80px -20px rgba(40,40,80,0.4)"
        : state.styleKey === "gradient"
        ? "0 30px 80px -20px rgba(40,40,80,0.18)"
        : "0 30px 80px -20px rgba(0,0,0,0.25)",
  };

  return (
    <div className={`app ${state.pureMode ? "pure" : ""}`}>
      {state.pureMode && (
        <div className="pure-controls">
          <button className="pure-btn" onClick={replay} title="重放动画 (空格)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3.5 2v10l8-5z"/></svg>
          </button>
          <button className="pure-btn" onClick={() => downloadCanvasPNG(state)} title="下载 PNG">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5v8M3.5 6L7 9.5L10.5 6M2 11.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="pure-btn pure-exit" onClick={() => setState((s) => ({ ...s, pureMode: false }))} title="退出纯图形模式 (ESC)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
      )}
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <div className="brand-mark">图</div>
            可视化图表 Studio
          </div>
          <div className="brand-sub">未命名项目 · 自动保存</div>
        </div>
        <div className="topbar-right">
          <div className="tool-chip">
            <span className="live-dot" /> <b>{state.data.length}</b>&nbsp;数据点
          </div>
          <button className="btn" onClick={() => downloadCanvasPNG(state)}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1.5v8M3.5 6L7 9.5L10.5 6M2 11.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            下载 PNG
          </button>
          <button className="btn" onClick={() => setState((s) => ({ ...s, pureMode: true }))}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 5V2h3M9 2h3v3M12 9v3H9M5 12H2V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            纯图形
          </button>
          <button className="btn primary">发布</button>
        </div>
      </header>

      <main className="stage">
        <div className="stage-dotgrid" />
        <div className="stage-header">
          <div className="chart-tabs">
            {CHART_TYPES.map((t) => (
              <button
                key={t.key}
                className={`chart-tab ${state.chartType === t.key ? "active" : ""}`}
                onClick={() => switchType(t.key)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div className="stage-tools">
            {state.styleKey === "threed" && (
              <div className="tool-chip" style={{ background: "var(--accent-soft)", borderColor: "rgba(255,107,53,0.35)", color: "var(--accent)" }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6c0-2.2 1.8-4 4-4s4 1.8 4 4M10 6c0 2.2-1.8 4-4 4S2 8.2 2 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <path d="M9.5 3.5L10 2l1.5.5M2.5 8.5L2 10l-1.5-.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" transform="translate(0,0)" />
                </svg>
                <span style={{ fontFamily: "var(--font-ui)" }}>拖动旋转 · 滚轮缩放</span>
              </div>
            )}
            <div className="tool-chip">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M6 3.5V6L7.5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <b>{state.duration.toFixed(1)}</b>s
            </div>
            <button className="icon-btn accent" onClick={replay} title="重放动画">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3.5 2.5v9l7-4.5z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="canvas-wrap">
          <div className="canvas" style={canvasStyle}>
            <div className="canvas-meta">
              <div>
                <div className="title" style={{ color: sty.text }}>{state.title}</div>
                <div className="subtitle" style={{ color: sty.textSoft }}>{state.subtitle}</div>
              </div>
              {state.showLegend && (
                <div className="legend">
                  {state.data.map((d, i) => (
                    <div className="legend-item" key={i} style={{ color: sty.textSoft }}>
                      <div className="legend-swatch" style={{ background: state.colors[i % state.colors.length] }} />
                      {d.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {renderChart()}
          </div>
        </div>
      </main>

      <Panel state={state} setState={setState} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

// =============================================================
// PNG download
// =============================================================

async function downloadCanvasPNG(state) {
  const node = document.querySelector(".canvas");
  if (!node) return;
  const rect = node.getBoundingClientRect();
  const scale = 2; // 2x retina
  const w = rect.width;
  const h = rect.height;

  try {
    if (window.htmlToImage) {
      const dataUrl = await window.htmlToImage.toPng(node, {
        pixelRatio: scale,
        cacheBust: true,
        skipFonts: false,
      });
      _trigger(dataUrl, `${state.title || "chart"}.png`);
      return;
    }
  } catch (err) {
    console.warn("htmlToImage failed, falling back to SVG-only:", err);
  }

  // Fallback: serialize the SVG only
  const svg = node.querySelector(".chart-svg");
  if (!svg) return;
  const clone = svg.cloneNode(true);
  // Replace CSS variables in font-family attributes
  clone.querySelectorAll("text").forEach((t) => {
    const f = t.getAttribute("font-family");
    if (f && f.includes("var(--font-mono)")) t.setAttribute("font-family", "JetBrains Mono, monospace");
    if (f && f.includes("var(--font-ui)")) t.setAttribute("font-family", "Manrope, system-ui, sans-serif");
  });
  clone.setAttribute("width", w * scale);
  clone.setAttribute("height", h * scale);
  const xml = new XMLSerializer().serializeToString(clone);
  const svg64 = btoa(unescape(encodeURIComponent(xml)));
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d");
    // Try to paint background
    const bg = getComputedStyle(node).background;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    _trigger(canvas.toDataURL("image/png"), `${state.title || "chart"}.png`);
  };
  img.src = "data:image/svg+xml;base64," + svg64;
}

function _trigger(url, name) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
