/* eslint-disable */
/* ============================================================
   Right-side settings panel
   ============================================================ */

const PALETTES = {
  sunrise: { name: "日出", colors: ["#FF6B35", "#F7B538", "#FFAC81", "#E63946", "#FF5E5B", "#FBC740"] },
  ocean:   { name: "海洋", colors: ["#0077B6", "#00B4D8", "#48CAE4", "#90E0EF", "#0096C7", "#023E8A"] },
  forest:  { name: "森林", colors: ["#2D6A4F", "#52B788", "#95D5B2", "#74C69D", "#40916C", "#1B4332"] },
  candy:   { name: "糖果", colors: ["#FF006E", "#FB5607", "#FFBE0B", "#8338EC", "#3A86FF", "#06D6A0"] },
  mono:    { name: "单色", colors: ["#2B2D42", "#4A4E69", "#8D99AE", "#B0B6C5", "#D6D9E3", "#EDEFF5"] },
  earth:   { name: "大地", colors: ["#9C6644", "#C68B59", "#DDA15E", "#E9C46A", "#BC6C25", "#606C38"] },
};

function PanelIcon({ name }) {
  const icons = {
    style:  <path d="M3 4h14M3 9h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
    data:   <><rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" /></>,
    motion: <><circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6v4l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
    color:  <><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M10 3a4 7 0 100 14" stroke="currentColor" strokeWidth="1.5" /></>,
  };
  return <svg width="14" height="14" viewBox="0 0 20 20" fill="none">{icons[name]}</svg>;
}

// ---------- 3D material preview thumbnails ----------

function MaterialPreview({ matKey, accent }) {
  const a = accent || "#FF6B35";
  const W = 64, H = 48;
  // A simple cuboid: top, front, right faces
  const top   = [[12, 6], [44, 6], [56, 18], [24, 18]];
  const front = [[12, 6], [24, 18], [24, 42], [12, 30]];
  const right = [[24, 18], [56, 18], [56, 42], [24, 42]];

  const pp = (pts) => pts.map((p) => p.join(",")).join(" ");

  const renderShape = () => {
    switch (matKey) {
      case "matte":
        return (
          <>
            <polygon points={pp(front)} fill={shade3D(a, 0.62)} />
            <polygon points={pp(right)} fill={shade3D(a, 0.55)} />
            <polygon points={pp(top)} fill={shade3D(a, 0.72)} />
          </>
        );
      case "metal": {
        const gid = `mp-metal-${matKey}-${a.replace("#", "")}`;
        return (
          <>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0.85" y2="1">
                <stop offset="0%" stopColor={shade3D(a, 0.95)} />
                <stop offset="35%" stopColor={shade3D(a, 0.55)} />
                <stop offset="60%" stopColor={shade3D(a, 0.82)} />
                <stop offset="100%" stopColor={shade3D(a, 0.25)} />
              </linearGradient>
            </defs>
            <polygon points={pp(front)} fill={`url(#${gid})`} stroke={shade3D(a, 0.2)} strokeWidth="0.5" />
            <polygon points={pp(right)} fill={`url(#${gid})`} stroke={shade3D(a, 0.2)} strokeWidth="0.5" />
            <polygon points={pp(top)} fill={`url(#${gid})`} stroke={shade3D(a, 0.2)} strokeWidth="0.5" />
          </>
        );
      }
      case "glass":
        return (
          <>
            <polygon points={pp(front)} fill={a} fillOpacity="0.5" stroke="rgba(255,255,255,0.65)" strokeWidth="1" />
            <polygon points={pp(right)} fill={a} fillOpacity="0.45" stroke="rgba(255,255,255,0.65)" strokeWidth="1" />
            <polygon points={pp(top)} fill={a} fillOpacity="0.6" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
          </>
        );
      case "neon": {
        const fid = `mp-neon-${a.replace("#", "")}`;
        return (
          <>
            <defs>
              <filter id={fid} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.3" />
              </filter>
            </defs>
            <g filter={`url(#${fid})`}>
              <polygon points={pp(front)} fill="none" stroke={a} strokeWidth="1.5" />
              <polygon points={pp(right)} fill="none" stroke={a} strokeWidth="1.5" />
              <polygon points={pp(top)} fill="none" stroke={a} strokeWidth="1.5" />
            </g>
            <polygon points={pp(front)} fill={a} fillOpacity="0.12" />
            <polygon points={pp(right)} fill={a} fillOpacity="0.1" />
            <polygon points={pp(top)} fill={a} fillOpacity="0.15" />
          </>
        );
      }
      case "wireframe":
        return (
          <>
            <polygon points={pp(front)} fill="none" stroke={a} strokeWidth="1.2" />
            <polygon points={pp(right)} fill="none" stroke={a} strokeWidth="1.2" />
            <polygon points={pp(top)} fill="none" stroke={a} strokeWidth="1.2" />
          </>
        );
      case "plastic":
      default:
        return (
          <>
            <polygon points={pp(front)} fill={shade3D(a, 0.55)} />
            <polygon points={pp(right)} fill={shade3D(a, 0.5)} />
            <polygon points={pp(top)} fill={shade3D(a, 0.78)} />
          </>
        );
    }
  };

  return (
    <div className="mat-preview">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {renderShape()}
      </svg>
    </div>
  );
}


// ---------- Tiny style preview thumbnails ----------

function StylePreview({ styleKey }) {
  // Same 3-bar sample, rendered in that style
  const accent = "#FF6B35", b = "#4ECDC4", c = "#7B61FF";
  const bg = STYLES[styleKey].bg;

  return (
    <div className="preview" style={{ background: bg }}>
      <svg viewBox="0 0 60 40" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`pv-${styleKey}-grad-a`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lighten(accent, 0.22)} />
            <stop offset="100%" stopColor={darken(accent, 0.2)} />
          </linearGradient>
          <linearGradient id={`pv-${styleKey}-grad-b`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lighten(b, 0.22)} />
            <stop offset="100%" stopColor={darken(b, 0.2)} />
          </linearGradient>
          <linearGradient id={`pv-${styleKey}-grad-c`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lighten(c, 0.22)} />
            <stop offset="100%" stopColor={darken(c, 0.2)} />
          </linearGradient>

          <linearGradient id={`pv-${styleKey}-metal-a`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={darken(accent, 0.4)} />
            <stop offset="50%" stopColor={lighten(accent, 0.3)} />
            <stop offset="100%" stopColor={darken(accent, 0.4)} />
          </linearGradient>
          <linearGradient id={`pv-${styleKey}-metal-b`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={darken(b, 0.4)} />
            <stop offset="50%" stopColor={lighten(b, 0.3)} />
            <stop offset="100%" stopColor={darken(b, 0.4)} />
          </linearGradient>
          <linearGradient id={`pv-${styleKey}-metal-c`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={darken(c, 0.4)} />
            <stop offset="50%" stopColor={lighten(c, 0.3)} />
            <stop offset="100%" stopColor={darken(c, 0.4)} />
          </linearGradient>

          <filter id={`pv-${styleKey}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.3" />
          </filter>
        </defs>
        {renderPreviewBars(styleKey, accent, b, c)}
      </svg>
    </div>
  );
}

function renderPreviewBars(styleKey, a, b, c) {
  const bars = [
    { x: 10, h: 22, color: a, key: "a" },
    { x: 26, h: 30, color: b, key: "b" },
    { x: 42, h: 16, color: c, key: "c" },
  ];
  const W = 10;
  switch (styleKey) {
    case "flat":
      return bars.map(({ x, h, color }) => (
        <rect key={color} x={x} y={36 - h} width={W} height={h} fill={color} rx="1" />
      ));
    case "gradient":
      return bars.map(({ x, h, key }) => (
        <rect key={key} x={x} y={36 - h} width={W} height={h} fill={`url(#pv-${styleKey}-grad-${key})`} rx="2" />
      ));
    case "glass":
      return bars.map(({ x, h, color }) => (
        <g key={color}>
          <rect x={x} y={36 - h} width={W} height={h} fill={color} fillOpacity="0.45" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" rx="2" />
          <rect x={x + 1} y={37 - h} width={2.5} height={h - 2} fill="rgba(255,255,255,0.4)" rx="1" />
        </g>
      ));
    case "threed":
      return bars.map(({ x, h, color }) => {
        const d = 3;
        return (
          <g key={color}>
            <polygon points={`${x + W},${36 - h} ${x + W + d},${36 - h - d} ${x + W + d},${36 - d} ${x + W},36`} fill={darken(color, 0.28)} />
            <polygon points={`${x},${36 - h} ${x + d},${36 - h - d} ${x + W + d},${36 - h - d} ${x + W},${36 - h}`} fill={lighten(color, 0.22)} />
            <rect x={x} y={36 - h} width={W} height={h} fill={color} />
          </g>
        );
      });
    case "metal":
      return bars.map(({ x, h, key, color }) => (
        <g key={key}>
          <rect x={x} y={36 - h} width={W} height={h} fill={`url(#pv-${styleKey}-metal-${key})`} />
          <rect x={x} y={36 - h} width={W} height="1" fill={lighten(color, 0.5)} />
        </g>
      ));
    case "neon":
      return bars.map(({ x, h, color }) => (
        <g key={color} filter={`url(#pv-${styleKey}-glow)`}>
          <rect x={x} y={36 - h} width={W} height={h} fill="none" stroke={color} strokeWidth="1.2" rx="1.5" />
          <rect x={x + 1.5} y={37.5 - h} width={W - 3} height={h - 3} fill={color} fillOpacity="0.2" rx="1" />
        </g>
      ));
    default:
      return null;
  }
}

// ---------- Tweaks Panel ----------

function Panel({ state, setState }) {
  const [tab, setTab] = useState("style");

  const updateData = (i, patch) => {
    setState((s) => ({
      ...s,
      data: s.data.map((d, idx) => (idx === i ? { ...d, ...patch } : d)),
    }));
  };
  const addRow = () => {
    setState((s) => ({
      ...s,
      data: [...s.data, { label: `项目${s.data.length + 1}`, value: 50 }],
    }));
  };
  const delRow = (i) => {
    setState((s) => ({ ...s, data: s.data.filter((_, idx) => idx !== i) }));
  };
  const randomize = () => {
    setState((s) => ({
      ...s,
      data: s.data.map((d) => ({ ...d, value: Math.round(20 + Math.random() * 80) })),
      replayKey: s.replayKey + 1,
    }));
  };
  const replay = () => {
    setState((s) => ({ ...s, replayKey: s.replayKey + 1 }));
  };

  const updateColor = (i, color) => {
    setState((s) => {
      const colors = [...s.colors];
      colors[i] = color;
      return { ...s, colors, paletteKey: "custom" };
    });
  };
  const applyPalette = (key) => {
    setState((s) => ({ ...s, paletteKey: key, colors: [...PALETTES[key].colors] }));
  };

  return (
    <aside className="panel">
      <div className="panel-tabs">
        <button className={`panel-tab ${tab === "style" ? "active" : ""}`} onClick={() => setTab("style")}>
          <PanelIcon name="style" /> 风格
        </button>
        <button className={`panel-tab ${tab === "data" ? "active" : ""}`} onClick={() => setTab("data")}>
          <PanelIcon name="data" /> 数据
        </button>
        <button className={`panel-tab ${tab === "motion" ? "active" : ""}`} onClick={() => setTab("motion")}>
          <PanelIcon name="motion" /> 动画
        </button>
        <button className={`panel-tab ${tab === "color" ? "active" : ""}`} onClick={() => setTab("color")}>
          <PanelIcon name="color" /> 配色
        </button>
      </div>

      {tab === "style" && <StyleTab state={state} setState={setState} />}
      {tab === "data" && (
        <DataTab
          state={state}
          updateData={updateData}
          addRow={addRow}
          delRow={delRow}
          randomize={randomize}
        />
      )}
      {tab === "motion" && <MotionTab state={state} setState={setState} replay={replay} />}
      {tab === "color" && (
        <ColorTab state={state} updateColor={updateColor} applyPalette={applyPalette} />
      )}
    </aside>
  );
}

// ---------- Style tab ----------

function StyleTab({ state, setState }) {
  return (
    <>
      <div className="section">
        <div className="section-head">
          <div className="section-title">视觉风格</div>
          <div className="caption" style={{ marginTop: 0, color: "var(--text-3)" }}>
            6 / 6
          </div>
        </div>
        <div className="style-grid">
          {STYLE_KEYS.map((k) => (
            <button
              key={k}
              className={`style-card ${state.styleKey === k ? "active" : ""}`}
              onClick={() => setState((s) => ({ ...s, styleKey: k, replayKey: s.replayKey + 1 }))}
            >
              <StylePreview styleKey={k} />
              <div className="name">{STYLES[k].label}</div>
            </button>
          ))}
        </div>
        <div className="caption">点击切换风格，切换时图表会重放入场动画。</div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">画布背景</div>
          <div className="caption" style={{ marginTop: 0, color: "var(--text-3)" }}>
            录屏抠图就绪
          </div>
        </div>
        <div className="bg-grid">
          {Object.entries(BACKGROUNDS).map(([k, bg]) => {
            let previewBg;
            if (bg.isCustom) previewBg = state.customBg;
            else if (bg.css == null) previewBg = STYLES[state.styleKey].bg;
            else previewBg = bg.css;
            return (
              <button
                key={k}
                className={`bg-card ${state.bgPreset === k ? "active" : ""}`}
                onClick={() => setState((s) => ({ ...s, bgPreset: k, replayKey: s.replayKey + 1 }))}
                title={bg.name}
              >
                <div className="bg-swatch" style={{ background: previewBg }}>
                  {bg.auto && <span className="bg-auto">A</span>}
                  {bg.isCustom && (
                    <span className="bg-auto" style={{ background: "transparent", color: _isHexDark(state.customBg) ? "#fff" : "#000" }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                    </span>
                  )}
                  {bg.chroma && (
                    <span style={{
                      position: "absolute", top: 3, right: 3,
                      fontSize: 8, fontWeight: 800, padding: "1px 3px",
                      borderRadius: 3, background: "rgba(0,0,0,0.5)", color: "#fff",
                      letterSpacing: "0.04em",
                    }}>KEY</span>
                  )}
                </div>
                <div className="bg-name">{bg.name}</div>
              </button>
            );
          })}
        </div>

        {state.bgPreset === "custom" && (
          <>
            <div className="custom-bg-row">
              <label className="custom-bg-swatch" style={{ background: state.customBg }}>
                <input
                  type="color"
                  value={state.customBg}
                  onChange={(e) => setState((s) => ({ ...s, customBg: e.target.value }))}
                />
              </label>
              <input
                className="custom-bg-hex"
                value={state.customBg.toUpperCase()}
                onChange={(e) => {
                  const v = e.target.value;
                  setState((s) => ({ ...s, customBg: v }));
                }}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (!/^#[0-9a-fA-F]{6}$/.test(v)) setState((s) => ({ ...s, customBg: "#00b140" }));
                }}
              />
            </div>
            <div className="chroma-presets">
              {[
                { c: "#00b140", l: "绿幕" },
                { c: "#0047bb", l: "蓝幕" },
                { c: "#ff00ff", l: "品红" },
                { c: "#000000", l: "黑" },
                { c: "#ffffff", l: "白" },
              ].map((p) => (
                <button
                  key={p.c}
                  className="chroma-chip"
                  onClick={() => setState((s) => ({ ...s, customBg: p.c }))}
                >
                  <span className="chroma-dot" style={{ background: p.c }} />
                  {p.l}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="caption">「跟随风格」沿用所选风格的默认背景；「绿幕/蓝幕」用于录屏后键控抠图；「自定义」可任选 HEX。</div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">文字 & 标签</div>
        </div>
        <div className="row">
          <label>标题</label>
          <input
            className="input"
            value={state.title}
            onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
          />
        </div>
        <div className="row">
          <label>副标题</label>
          <input
            className="input"
            value={state.subtitle}
            onChange={(e) => setState((s) => ({ ...s, subtitle: e.target.value }))}
          />
        </div>
        <div className="slider-row">
          <label>数字大小</label>
          <input
            className="slider"
            type="range"
            min="0.6"
            max="2"
            step="0.05"
            value={state.numberScale}
            onChange={(e) => setState((s) => ({ ...s, numberScale: Number(e.target.value) }))}
          />
          <span className="slider-val">{Math.round(state.numberScale * 100)}%</span>
        </div>
        <div className="row">
          <label>显示数值</label>
          <div className="control" style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              className={`toggle ${state.showValues ? "on" : ""}`}
              onClick={() => setState((s) => ({ ...s, showValues: !s.showValues }))}
            />
          </div>
        </div>
        <div className="row">
          <label>显示图例</label>
          <div className="control" style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              className={`toggle ${state.showLegend ? "on" : ""}`}
              onClick={() => setState((s) => ({ ...s, showLegend: !s.showLegend }))}
            />
          </div>
        </div>
        {(state.chartType === "bar" || state.chartType === "line") && (
          <>
            <div className="row">
              <label>Y 轴数值</label>
              <div className="control" style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  className={`toggle ${state.showAxis ? "on" : ""}`}
                  onClick={() => setState((s) => ({ ...s, showAxis: !s.showAxis }))}
                />
              </div>
            </div>
            <div className="row">
              <label>网格线</label>
              <div className="control" style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  className={`toggle ${state.showGrid ? "on" : ""}`}
                  onClick={() => setState((s) => ({ ...s, showGrid: !s.showGrid }))}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ---------- Data tab ----------

function DataTab({ state, updateData, addRow, delRow, randomize }) {
  return (
    <>
      <div className="section">
        <div className="section-head">
          <div className="section-title">数据序列</div>
          <button className="section-action" onClick={randomize}>随机化 ↻</button>
        </div>
        <div className="data-list">
          {state.data.map((d, i) => (
            <div className="data-row" key={i}>
              <label className="data-swatch" style={{ background: state.colors[i % state.colors.length] }}>
                <input
                  type="color"
                  value={state.colors[i % state.colors.length]}
                  onChange={(e) => {
                    // Update color for this index
                    const newColors = [...state.colors];
                    newColors[i % newColors.length] = e.target.value;
                    // Reach up via custom event? Easier: pipe through updateData side channel.
                    // Use a workaround: dispatch on window.
                    window.dispatchEvent(new CustomEvent("update-color", { detail: { i: i % newColors.length, color: e.target.value } }));
                  }}
                />
              </label>
              <input
                className="data-input"
                value={d.label}
                onChange={(e) => updateData(i, { label: e.target.value })}
              />
              <input
                className="data-input num"
                type="number"
                value={d.value}
                onChange={(e) => updateData(i, { value: Number(e.target.value) || 0 })}
              />
              <button
                className="data-del"
                onClick={() => delRow(i)}
                disabled={state.data.length <= 2}
                title="删除"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button className="add-row-btn" onClick={addRow}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          添加数据项
        </button>
        <div className="caption" style={{ marginTop: 10 }}>
          共 {state.data.length} 条 · 总和 <b style={{ color: "var(--text-1)", fontFamily: "var(--font-mono)" }}>{state.data.reduce((s, d) => s + d.value, 0)}</b>
        </div>
      </div>
    </>
  );
}

// ---------- Motion tab ----------

function MotionTab({ state, setState, replay }) {
  const reset3D = () => setState((s) => ({ ...s, view3DReset: s.view3DReset + 1 }));
  return (
    <>
      <div className="section">
        <div className="section-head">
          <div className="section-title">入场动画</div>
          <button className="section-action" onClick={replay}>重放 ▶</button>
        </div>

        <div className="slider-row">
          <label>时长</label>
          <input
            className="slider"
            type="range"
            min="0.2"
            max="3"
            step="0.05"
            value={state.duration}
            onChange={(e) => setState((s) => ({ ...s, duration: Number(e.target.value) }))}
          />
          <span className="slider-val">{state.duration.toFixed(2)}s</span>
        </div>

        <div className="slider-row">
          <label>延迟</label>
          <input
            className="slider"
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={state.delay}
            onChange={(e) => setState((s) => ({ ...s, delay: Number(e.target.value) }))}
          />
          <span className="slider-val">{state.delay.toFixed(2)}s</span>
        </div>

        <div className="slider-row">
          <label>错峰</label>
          <input
            className="slider"
            type="range"
            min="0"
            max="0.85"
            step="0.05"
            value={state.stagger}
            onChange={(e) => setState((s) => ({ ...s, stagger: Number(e.target.value) }))}
          />
          <span className="slider-val">{(state.stagger * 100).toFixed(0)}%</span>
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <label>缓动</label>
          <div className="control">
            <select
              className="select"
              value={state.easing}
              onChange={(e) => setState((s) => ({ ...s, easing: e.target.value }))}
            >
              <option value="out">缓出 Cubic Out</option>
              <option value="ease">缓入缓出</option>
              <option value="in">缓入 Cubic In</option>
              <option value="bounce">弹跳 Bounce</option>
              <option value="elastic">弹性 Elastic</option>
            </select>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">播放</div>
        </div>
        <button
          className="btn primary"
          style={{ width: "100%", height: 38, justifyContent: "center" }}
          onClick={replay}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M3 2v8l7-4z" />
          </svg>
          重新播放动画
        </button>
        <div className="caption" style={{ marginTop: 10 }}>
          调整数据或切换风格时也会自动重放。
        </div>
      </div>

      {state.styleKey === "threed" && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">3D 材质</div>
            <div className="caption" style={{ marginTop: 0, color: "var(--text-3)" }}>
              6 种
            </div>
          </div>
          <div className="mat-grid">
            {MATERIAL_KEYS_3D.map((k) => (
              <button
                key={k}
                className={`mat-card ${state.material3D === k ? "active" : ""}`}
                onClick={() => setState((s) => ({ ...s, material3D: k }))}
              >
                <MaterialPreview matKey={k} accent={state.colors[0]} />
                <div className="mat-name">{MATERIALS_3D[k].label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {state.styleKey === "threed" && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">3D 视角</div>
            <button className="section-action" onClick={reset3D}>重置 ↺</button>
          </div>

          <div className="caption" style={{ marginBottom: 12, lineHeight: 1.6 }}>
            <b style={{ color: "var(--text-1)" }}>在画布上拖动</b>可旋转视角，<b style={{ color: "var(--text-1)" }}>滚轮</b>可缩放。每次重放会以旋转+缩放动画呈现。
          </div>

          <div className="slider-row">
            <label>入场动画</label>
            <input
              className="slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={state.intro3DFraction}
              onChange={(e) => setState((s) => ({ ...s, intro3DFraction: Number(e.target.value), replayKey: s.replayKey + 1 }))}
            />
            <span className="slider-val">{state.intro3DFraction <= 0.01 ? "关" : Math.round(state.intro3DFraction * 100) + "%"}</span>
          </div>
          <div className="caption" style={{ marginTop: -2, marginBottom: 10 }}>
            视角入场动画占总动画时长的比例。设为「关」则跳过入场旋转/缩放。
          </div>

          <div className="row">
            <label>自动旋转</label>
            <div className="control" style={{ display: "flex", justifyContent: "flex-end" }}>
              <div
                className={`toggle ${state.autoRotate3D ? "on" : ""}`}
                onClick={() => setState((s) => ({ ...s, autoRotate3D: !s.autoRotate3D }))}
              />
            </div>
          </div>

          <div className="slider-row" style={{ opacity: state.autoRotate3D ? 1 : 0.4 }}>
            <label>旋转速度</label>
            <input
              className="slider"
              type="range"
              min="0.05"
              max="1.2"
              step="0.05"
              value={state.rotateSpeed3D}
              disabled={!state.autoRotate3D}
              onChange={(e) => setState((s) => ({ ...s, rotateSpeed3D: Number(e.target.value) }))}
            />
            <span className="slider-val">{state.rotateSpeed3D.toFixed(2)}</span>
          </div>

          <button
            className="btn"
            style={{ width: "100%", height: 32, justifyContent: "center", marginTop: 10 }}
            onClick={reset3D}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6a4 4 0 1 1 1.2 2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              <path d="M2 3.5V6h2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            重置视角
          </button>
        </div>
      )}
    </>
  );
}

// ---------- Color tab ----------

function ColorTab({ state, updateColor, applyPalette }) {
  return (
    <>
      <div className="section">
        <div className="section-head">
          <div className="section-title">配色方案</div>
        </div>
        <div className="palette-row">
          {Object.entries(PALETTES).map(([k, p]) => (
            <button
              key={k}
              className={`palette-preset ${state.paletteKey === k ? "active" : ""}`}
              onClick={() => applyPalette(k)}
              title={p.name}
            >
              {p.colors.slice(0, 6).map((c, i) => (
                <span key={i} style={{ background: c }} />
              ))}
            </button>
          ))}
        </div>
        <div className="caption" style={{ marginTop: 10 }}>
          当前：<b style={{ color: "var(--text-1)" }}>{state.paletteKey === "custom" ? "自定义" : PALETTES[state.paletteKey]?.name}</b>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">单色调整</div>
        </div>
        <div className="data-list">
          {state.colors.map((c, i) => (
            <div className="data-row" key={i} style={{ gridTemplateColumns: "24px 1fr 88px" }}>
              <label className="data-swatch" style={{ background: c }}>
                <input
                  type="color"
                  value={c}
                  onChange={(e) => updateColor(i, e.target.value)}
                />
              </label>
              <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                色彩 {i + 1}
                {state.data[i] && (
                  <span style={{ color: "var(--text-3)", marginLeft: 8, fontSize: 11 }}>
                    {state.data[i].label}
                  </span>
                )}
              </div>
              <input
                className="data-input"
                style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase", textAlign: "center" }}
                value={c}
                onChange={(e) => {
                  if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) updateColor(i, e.target.value);
                  else updateColor(i, e.target.value);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { Panel, PALETTES });
