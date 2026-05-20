/* 立体字工作台 — React 主应用 */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ============ 字体加载 ============
function useFontLoader() {
  const [font, setFont] = useState(null);
  const [fontMeta, setFontMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadFromBuffer = useCallback((buffer, sourceName) => {
    try {
      const f = window.opentype.parse(buffer);
      const familyName =
        f.names.fullName?.zh || f.names.fullName?.en ||
        f.names.fontFamily?.zh || f.names.fontFamily?.en ||
        sourceName || '未命名';
      setFont(f);
      setFontMeta({
        name: familyName,
        glyphs: f.glyphs.length,
        source: sourceName,
        unitsPerEm: f.unitsPerEm,
      });
      setError(null);
      return f;
    } catch (e) {
      setError('字体解析失败: ' + e.message);
      return null;
    }
  }, []);

  const loadFromUrl = useCallback(async (url, name) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const buf = await r.arrayBuffer();
      loadFromBuffer(buf, name || url.split('/').pop());
    } catch (e) {
      setError('加载失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [loadFromBuffer]);

  const loadFromFile = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      loadFromBuffer(buf, file.name);
    } catch (e) {
      setError('读取失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [loadFromBuffer]);

  const loadFromUrls = useCallback(async (urls) => {
    setLoading(true);
    setError(null);
    for (const [url, name] of urls) {
      try {
        const r = await fetch(url);
        if (!r.ok) { console.warn('[font] HTTP', r.status, url); continue; }
        const buf = await r.arrayBuffer();
        const result = loadFromBuffer(buf, name || url.split('/').pop());
        if (result) {
          setLoading(false);
          return true;
        }
      } catch (e) {
        console.warn('[font] failed', url, e.message);
      }
    }
    setError('所有候选字体均加载失败，请手动拖入字体文件');
    setLoading(false);
    return false;
  }, [loadFromBuffer]);

  return { font, fontMeta, loading, error, loadFromUrl, loadFromUrls, loadFromFile };
}

// ============ 工具栏组件 ============
function TopBar({ text, onTextChange, onExportPNG, onExportGIF, onResetView, exporting }) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">立</div>
        <div>立体字 工作台</div>
        <div className="brand-sub">/ STUDIO v0.1</div>
      </div>
      <div className="menu">
        <button>文件</button>
        <button>编辑</button>
        <button>视图</button>
        <button>帮助</button>
      </div>
      <div className="topbar-spacer" />
      <div className="text-input-wrap">
        <label>文字</label>
        <input
          value={text}
          onChange={e => onTextChange(e.target.value)}
          placeholder="输入文字…"
          maxLength={20}
        />
        <span className="kbd">{text.length}</span>
      </div>
      <button className="btn btn-ghost" onClick={onResetView} title="重置视图 (R)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
        </svg>
      </button>
      <button className="btn" onClick={onExportPNG} disabled={exporting}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" />
          <path d="m21 15-5-5-9 9" />
        </svg>
        PNG
      </button>
      <button className="btn btn-primary" onClick={onExportGIF} disabled={exporting}>
        {exporting ? (
          <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>导出中…</>
        ) : (
          <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>导出 GIF</>
        )}
      </button>
    </div>
  );
}

// ============ 左面板 - 字体 ============
function FontBar({ fontMeta, loading, onUploadClick }) {
  return (
    <div className="font-bar" onClick={onUploadClick}>
      <div className="font-icon">{loading ? '⟳' : 'Aa'}</div>
      <div className="font-info">
        <div className="font-name">{fontMeta?.name || '未加载字体'}</div>
        <div className="font-meta">
          {loading ? '加载中…' : (
            fontMeta ? `${fontMeta.glyphs} 字形 · ${fontMeta.source}` : '点击或拖入 .ttf / .otf'
          )}
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: 'var(--text-3)'}}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    </div>
  );
}

// ============ 预设字体网格 ============
function FontPresetGrid({ active, loading, onPick }) {
  return (
    <div className="font-preset-grid">
      {window.PRESET_FONTS.map(p => (
        <div
          key={p.id}
          className={'font-preset' + (active === p.id ? ' active' : '')}
          onClick={() => onPick(p.id)}
        >
          <div className="fp-sample" style={{fontFamily: p.id === 'noto-serif' ? 'serif' : 'inherit'}}>
            {p.sample}
          </div>
          <div className="fp-meta">
            <div className="fp-name">{p.name}</div>
            <div className="fp-desc">{p.desc}</div>
          </div>
          {active === p.id && loading && (
            <div className="fp-loading">
              <svg className="spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============ 材质网格 ============
function MaterialGrid({ activeId, onPick }) {
  return (
    <div className="material-grid">
      {window.MATERIALS_16.map(m => (
        <div
          key={m.id}
          className={'mat-swatch' + (activeId === m.id ? ' active' : '')}
          style={{ background: m.swatchCss }}
          onClick={() => onPick(m.id)}
          title={m.name}
        >
          <div className="mat-label">{m.name}</div>
        </div>
      ))}
    </div>
  );
}

// ============ 折叠面板 ============
function Section({ title, defaultOpen = true, badge, right, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={'panel-section' + (open ? '' : ' collapsed')}>
      <div className="panel-section-header" onClick={() => setOpen(!open)}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span className="chev">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor"><path d="M3 4l3 3 3-3z"/></svg>
          </span>
          <span>{title}</span>
          {badge && <span className={'badge ' + badge.type}>{badge.text}</span>}
        </div>
        {right}
      </div>
      <div className="panel-section-body">{children}</div>
    </div>
  );
}

// ============ 滑杆 ============
function Slider({ label, value, min, max, step = 1, format = v => v, onChange }) {
  return (
    <div className="row">
      <div className="row-label">{label}</div>
      <input className="slider" type="range" min={min} max={max} step={step}
        value={value} onChange={e => onChange(Number(e.target.value))} />
      <div className="row-value">{format(value)}</div>
    </div>
  );
}

// ============ 开关 ============
function ToggleRow({ label, value, onChange, hint }) {
  return (
    <div className="row" style={{ cursor: 'pointer' }} onClick={() => onChange(!value)}>
      <div className="row-label" style={{flex: 1}}>
        {label}
        {hint && <div style={{fontSize:10, color:'var(--text-3)', marginTop:2}}>{hint}</div>}
      </div>
      <div className={'toggle' + (value ? ' on' : '')} />
    </div>
  );
}

// ============ 视口 HUD ============
function ViewportHUD({ fps, polyCount, charCount, view, onView, anaCategory }) {
  return (
    <>
      <div className="viewport-hud hud-tl">
        <div className="hud-line"><span className="hud-key">SCN /</span> <span className="hud-val">立体字预览</span></div>
        <div className="hud-line"><span className="hud-key">CHR /</span> <span className="hud-val">{charCount} 字</span></div>
        <div className="hud-line"><span className="hud-key">CAT /</span> <span className="hud-val">{anaCategory || '—'}</span></div>
      </div>
      <div className="viewport-hud hud-tr">
        <div className="hud-line"><span className="hud-key">FPS</span> <span className="hud-val">{fps}</span></div>
        <div className="hud-line"><span className="hud-key">TRI</span> <span className="hud-val">{(polyCount/1000).toFixed(1)}k</span></div>
        <div className="hud-line"><span className="hud-key">RGB</span> <span className="hud-val">linear-sRGB</span></div>
      </div>
      <div className="viewport-hud hud-bl">
        <div className="hud-line"><span className="hud-key">⌘</span> <span className="hud-val">拖动旋转</span></div>
        <div className="hud-line"><span className="hud-key">⌥</span> <span className="hud-val">滚轮缩放</span></div>
        <div className="hud-line"><span className="hud-key">R</span> <span className="hud-val">复位</span></div>
      </div>
    </>
  );
}

function ViewportToolbar({ view, onView, autoRot, onAutoRot, showGrid, onGrid, showShadow, onShadow }) {
  return (
    <div className="viewport-toolbar">
      <button className={'vt-btn' + (view==='persp'?' active':'')} title="透视" onClick={() => onView('persp')}>P</button>
      <button className={'vt-btn' + (view==='front'?' active':'')} title="正面" onClick={() => onView('front')}>F</button>
      <button className={'vt-btn' + (view==='side'?' active':'')} title="侧视" onClick={() => onView('side')}>S</button>
      <button className={'vt-btn' + (view==='top'?' active':'')} title="顶视" onClick={() => onView('top')}>T</button>
      <div className="vt-divider" />
      <button className={'vt-btn' + (autoRot?' active':'')} title="自动旋转" onClick={() => onAutoRot(!autoRot)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" /></svg>
      </button>
      <button className={'vt-btn' + (showGrid?' active':'')} title="网格" onClick={() => onGrid(!showGrid)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" /><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
      </button>
      <button className={'vt-btn' + (showShadow?' active':'')} title="阴影" onClick={() => onShadow(!showShadow)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="9" r="4"/><ellipse cx="12" cy="18" rx="6" ry="2"/></svg>
      </button>
    </div>
  );
}

// ============ 轴向指示器 ============
function AxisGizmo({ scene }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!scene || !ref.current) return;
    let raf;
    const update = () => {
      raf = requestAnimationFrame(update);
      const cam = scene.camera;
      if (!cam) return;
      // 取相机相对原点的方向，反推显示
      const e = new THREE.Euler();
      e.setFromQuaternion(cam.quaternion);
      ref.current.querySelector('.gizmo-inner').style.transform =
        `rotateX(${-e.x}rad) rotateY(${-e.y}rad) rotateZ(${-e.z}rad)`;
    };
    update();
    return () => cancelAnimationFrame(raf);
  }, [scene]);

  return (
    <div className="viewport-axisgizmo" ref={ref}>
      <div className="gizmo-inner" style={{
        position:'absolute', inset:0, transformStyle:'preserve-3d',
        perspective:'200px'
      }}>
        {[
          {axis:'x', color:'#ff5d63', label:'X', tr:'rotateY(90deg) translateZ(28px)'},
          {axis:'y', color:'#66e3a2', label:'Y', tr:'rotateX(-90deg) translateZ(28px)'},
          {axis:'z', color:'#4dd0ff', label:'Z', tr:'translateZ(28px)'},
        ].map(a => (
          <div key={a.axis} style={{
            position:'absolute', left:'50%', top:'50%', width:0, height:0,
            transform: a.tr,
          }}>
            <div style={{
              position:'absolute', left:-7, top:-7, width:14, height:14,
              background:a.color, borderRadius:'50%',
              fontSize:9, color:'white', display:'grid', placeItems:'center',
              fontFamily:'var(--mono)', fontWeight:700,
              boxShadow:'0 0 8px ' + a.color,
            }}>{a.label}</div>
          </div>
        ))}
        <div style={{
          position:'absolute', left:'50%', top:'50%',
          width:6, height:6, marginLeft:-3, marginTop:-3,
          background:'#fff', borderRadius:'50%',
        }} />
      </div>
    </div>
  );
}

// ============ 字符分析面板 ============
function CharAnalysis({ analysis, perCharMaterial, onPerCharMaterial, onResetPerChar }) {
  if (!analysis || analysis.chars.length === 0) return (
    <div style={{padding:'20px 0', color:'var(--text-3)', textAlign:'center', fontSize:12}}>
      输入文字后显示分析
    </div>
  );

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', margin:'0 0 8px'}}>
        <div style={{fontSize:10, letterSpacing:'0.1em', color:'var(--text-2)', fontFamily:'var(--mono)', textTransform:'uppercase'}}>
          逐字解析（点击切换材质）
        </div>
        {Object.keys(perCharMaterial).length > 0 && (
          <span className="sg-action" style={{fontSize:10}} onClick={onResetPerChar}>清除</span>
        )}
      </div>

      <div className="char-list">
        {analysis.chars.map((c, i) => {
          const matId = perCharMaterial[i];
          const matMini = matId ? window.MATERIALS.find(m=>m.id===matId) : null;
          return (
            <div key={i} className="char-card">
              <div className="char-big">{c.char}</div>
              <div className="char-info">
                <div className="char-pinyin">{c.pinyin}</div>
                <div className="char-meta">
                  <span>部首 {c.radical}</span>
                  <span>{c.strokes} 画</span>
                  <span style={{color:'var(--accent-2)'}}>{c.categoryName}</span>
                </div>
                <div style={{marginTop:6, display:'flex', flexWrap:'wrap', gap:3}}>
                  {(window.CharData && ['gold','chrome','jade','marble','neon-pink','glass','obsidian','lava','holographic']).map(mid => {
                    const m = window.MATERIALS.find(x=>x.id===mid);
                    if (!m) return null;
                    return (
                      <div
                        key={mid}
                        title={m.name}
                        onClick={() => onPerCharMaterial(i, mid)}
                        style={{
                          width:14, height:14, borderRadius:'50%',
                          background:m.swatchCss, cursor:'pointer',
                          border: matId===mid ? '2px solid var(--accent)' : '1px solid var(--line)',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ 主 App ============
function App() {
  const [text, setText] = useState('能成大事');
  const [material, setMaterial] = useState('gold');
  const [perCharMaterial, setPerCharMaterial] = useState({});
  const [extrudeDepth, setExtrudeDepth] = useState(14);
  const [bevelEnabled, setBevelEnabled] = useState(false);
  const [bevelSize, setBevelSize] = useState(1.0);
  const [letterSpacing, setLetterSpacing] = useState(14);
  const [outline, setOutline] = useState(false);
  const [outlineWidth, setOutlineWidth] = useState(1.5);
  const [animMaster, setAnimMaster] = useState(true);
  const [autoRot, setAutoRot] = useState(true);
  const [rotateSpeed, setRotateSpeed] = useState(0.6);
  const [breathe, setBreathe] = useState(true);
  const [breatheSpeed, setBreatheSpeed] = useState(1.0);
  const [breatheAmp, setBreatheAmp] = useState(1.0);
  const [bounceIn, setBounceIn] = useState(true);
  const [entranceType, setEntranceType] = useState('bounce');
  const [entranceDuration, setEntranceDuration] = useState(800);
  const [entranceStagger, setEntranceStagger] = useState(80);
  const [focalLength, setFocalLength] = useState(60);  // mm (35mm equiv)
  const [shine, setShine] = useState(true);
  const [shineSpeed, setShineSpeed] = useState(1.0);
  const [parallax, setParallax] = useState(true);
  const [glitch, setGlitch] = useState(false);
  const [particles, setParticles] = useState('none');
  const [particleSpeed, setParticleSpeed] = useState(1.0);
  const [missingGlyphs, setMissingGlyphs] = useState([]);
  const [showGrid, setShowGrid] = useState(true);
  const [showShadow, setShowShadow] = useState(false);
  const [view, setView] = useState('persp');
  const [decorations, setDecorations] = useState(true);
  const [bgMode, setBgMode] = useState('transparent');
  const [bgColor, setBgColor] = useState('#0c0d12');
  const [bgGradFrom, setBgGradFrom] = useState('#1e2230');
  const [bgGradTo, setBgGradTo] = useState('#06070a');
  const [pureMode, setPureMode] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [fps, setFps] = useState(60);
  const [dragOver, setDragOver] = useState(false);

  const viewportRef = useRef(null);
  const sceneRef = useRef(null);
  const fileInputRef = useRef(null);

  const fontLoader = useFontLoader();

  // 中文分析
  const analysis = useMemo(() => window.CharData.analyzeString(text), [text]);

  // 初始化场景
  useEffect(() => {
    if (!viewportRef.current) return;
    const s = new window.Scene3D.TextScene(viewportRef.current);
    s.onMissingGlyphs = (list) => setMissingGlyphs(list);
    sceneRef.current = s;
    return () => s.dispose();
  }, []);

  // 预设字体加载
  const [activePresetId, setActivePresetId] = useState(window.PRESET_FONTS[0].id);
  const loadPreset = useCallback(async (presetId) => {
    const preset = window.PRESET_FONTS.find(p => p.id === presetId);
    if (!preset) return;
    setActivePresetId(presetId);
    const tuples = preset.urls.map(u => [u, preset.name]);
    await fontLoader.loadFromUrls(tuples);
  }, [fontLoader]);

  // 首次默认加载
  useEffect(() => {
    loadPreset(window.PRESET_FONTS[0].id);
    // eslint-disable-next-line
  }, []);

  // 同步字体到场景
  useEffect(() => {
    if (fontLoader.font && sceneRef.current) {
      sceneRef.current.setFont(fontLoader.font);
    }
  }, [fontLoader.font]);

  // 同步文字
  useEffect(() => {
    if (sceneRef.current && fontLoader.font) {
      sceneRef.current.setText(text);
    }
  }, [text, fontLoader.font]);

  // 同步选项
  useEffect(() => {
    const s = sceneRef.current; if (!s) return;
    s.setOption('material', material);
  }, [material]);
  useEffect(() => {
    const s = sceneRef.current; if (!s) return;
    s.setOption('extrudeDepth', extrudeDepth);
  }, [extrudeDepth]);
  useEffect(() => {
    const s = sceneRef.current; if (!s) return;
    s.setOption('bevelEnabled', bevelEnabled);
    s.setOption('bevelSize', bevelEnabled ? bevelSize : 0);
    s.setOption('bevelThickness', bevelEnabled ? Math.min(bevelSize * 0.7, extrudeDepth / 2 - 0.5) : 0);
  }, [bevelEnabled, bevelSize, extrudeDepth]);
  useEffect(() => {
    const s = sceneRef.current; if (!s) return;
    s.setOption('letterSpacing', letterSpacing);
  }, [letterSpacing]);
  useEffect(() => { sceneRef.current?.setOption('outline', outline); }, [outline]);
  useEffect(() => { sceneRef.current?.setOption('outlineWidth', outlineWidth); }, [outlineWidth]);
  useEffect(() => { sceneRef.current?.setOption('rotateAuto', autoRot); }, [autoRot]);
  useEffect(() => { sceneRef.current?.setOption('rotateSpeed', rotateSpeed); }, [rotateSpeed]);
  useEffect(() => { sceneRef.current?.setOption('breathe', breathe); }, [breathe]);
  useEffect(() => { sceneRef.current?.setOption('breatheSpeed', breatheSpeed); }, [breatheSpeed]);
  useEffect(() => { sceneRef.current?.setOption('breatheAmp', breatheAmp); }, [breatheAmp]);
  useEffect(() => { sceneRef.current?.setOption('bounceIn', bounceIn); }, [bounceIn]);
  useEffect(() => { sceneRef.current?.setOption('entranceType', entranceType); }, [entranceType]);
  useEffect(() => { sceneRef.current?.setOption('entranceDuration', entranceDuration); }, [entranceDuration]);
  useEffect(() => { sceneRef.current?.setOption('entranceStagger', entranceStagger); }, [entranceStagger]);
  useEffect(() => { sceneRef.current?.setFocalLength(focalLength); }, [focalLength]);
  useEffect(() => { sceneRef.current?.setOption('shine', shine); }, [shine]);
  useEffect(() => { sceneRef.current?.setOption('shineSpeed', shineSpeed); }, [shineSpeed]);
  useEffect(() => { sceneRef.current?.setOption('parallax', parallax); }, [parallax]);
  useEffect(() => { sceneRef.current?.setOption('glitch', glitch); }, [glitch]);
  useEffect(() => { sceneRef.current?.setOption('particles', particles); }, [particles]);
  useEffect(() => { sceneRef.current?.setOption('particleSpeed', particleSpeed); }, [particleSpeed]);
  useEffect(() => { sceneRef.current?.setOption('animMaster', animMaster); }, [animMaster]);
  useEffect(() => { sceneRef.current?.setOption('shadow', showShadow); }, [showShadow]);

  // FPS 监测
  useEffect(() => {
    let frames = 0, last = performance.now();
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0; last = now;
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  // 视图切换
  useEffect(() => {
    sceneRef.current?.snapView(view);
  }, [view]);

  // perCharMaterial 同步
  useEffect(() => {
    const s = sceneRef.current; if (!s) return;
    s.options.perCharMaterial = perCharMaterial;
    s.applyMaterials();
  }, [perCharMaterial]);

  // ===== 拖放 =====
  useEffect(() => {
    const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
    const onDragLeave = (e) => {
      if (e.target === document.documentElement || !e.relatedTarget) setDragOver(false);
    };
    const onDrop = async (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && (file.name.endsWith('.ttf') || file.name.endsWith('.otf') || file.name.endsWith('.woff'))) {
        await fontLoader.loadFromFile(file);
        showToast(`✓ 字体已加载: ${file.name}`);
      }
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [fontLoader]);

  // 纯视觉模式切换时触发画布重新测尺（ResizeObserver 兜底，下面是保险）
  useEffect(() => {
    const t1 = setTimeout(() => sceneRef.current?._onResize(), 60);
    const t2 = setTimeout(() => sceneRef.current?._onResize(), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pureMode]);

  // 键盘快捷键
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'r' || e.key === 'R') sceneRef.current?.resetCamera();
      if (e.key === ' ') { e.preventDefault(); setAnimMaster(a => !a); }
      if (e.key === 'Tab') { e.preventDefault(); setPureMode(p => !p); }
      if (e.key === 'Escape') setPureMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 背景同步
  useEffect(() => {
    const s = sceneRef.current; if (!s) return;
    if (bgMode === 'transparent') s.setBackground('transparent');
    else if (bgMode === 'solid') s.setBackground('solid', bgColor);
    else if (bgMode === 'gradient') s.setBackground('gradient', { from: bgGradFrom, to: bgGradTo });
  }, [bgMode, bgColor, bgGradFrom, bgGradTo]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function handlePNG() {
    const url = sceneRef.current?.capturePNG(bgMode === 'transparent');
    if (!url) return;
    const a = document.createElement('a');
    a.href = url; a.download = `立体字_${text}_${Date.now()}.png`;
    a.click();
    showToast('✓ PNG 已保存');
  }

  async function handleGIF() {
    if (!window.GIF) { showToast('GIF 编码器尚未加载'); return; }
    setExporting(true);
    showToast('录制 GIF 中 (3秒)…');
    try {
      const s = sceneRef.current;
      const w = s.renderer.domElement.width;
      const h = s.renderer.domElement.height;
      const gif = new window.GIF({
        workers: 2, quality: 8, width: Math.min(w, 720), height: Math.min(h, 405),
        workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js',
        transparent: bgMode === 'transparent' ? 0x000000 : null,
      });
      const fps = 18;
      const duration = 3000;
      const frames = Math.round(duration * fps / 1000);
      const delay = 1000 / fps;

      for (let i = 0; i < frames; i++) {
        await new Promise(r => setTimeout(r, delay));
        const canvas = s.renderer.domElement;
        gif.addFrame(canvas, { copy: true, delay });
      }
      gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `立体字_${text}_${Date.now()}.gif`;
        a.click();
        setExporting(false);
        showToast('✓ GIF 已保存');
      });
      gif.render();
    } catch (e) {
      console.error(e);
      setExporting(false);
      showToast('GIF 导出失败');
    }
  }

  function applySuggestion() {
    const mats = analysis.suggestedMaterials;
    if (mats && mats[0]) setMaterial(mats[0]);
    const eff = analysis.suggestedEffects;
    if (eff.particles) setParticles(eff.particles);
    if (eff.glow) { /* could enable bloom — emissive handles glow visually */ }
    // 逐字赋予建议材质
    const newPerChar = {};
    analysis.chars.forEach((c, i) => {
      const list = window.CharData.lookup(c.char) ;
      const cat = list.category;
      // 取该类别第一个推荐材质
      const Card = window.CharData;
      const arr = (function(){
        // 用 hack: 调用相同映射
        const cats = analysis.suggestedMaterials; // 全局; per-char 改用 lookup-based
        return arr;
      })();
    });
    // 简化：随机给每字一个该意象类别下的材质
    const result = {};
    analysis.chars.forEach((c, i) => {
      const data = window.CharData.lookup(c.char);
      const cat = data.category;
      const ALL = {
        fire: ['neon-pink', 'lava', 'jelly-red'],
        water: ['glass', 'ice', 'aqua'],
        metal: ['gold', 'chrome', 'copper'],
        wood: ['jade', 'matcha', 'jelly-green'],
        earth: ['marble', 'sandstone'],
        light: ['holographic', 'pearl', 'neon-yellow'],
        dark: ['obsidian', 'velvet', 'amethyst'],
        celestial: ['holographic', 'iridescent'],
        joyful: ['neon-pink', 'gold', 'iridescent'],
        serious: ['marble', 'obsidian', 'chrome'],
      };
      const pool = ALL[cat] || ['gold'];
      result[i] = pool[i % pool.length];
    });
    setPerCharMaterial(result);
    showToast(`✓ 已套用「${analysis.dominantName}」字效`);
  }

  return (
    <div className={pureMode ? 'pure-mode' : ''}>
      {pureMode && (
        <button className="pure-exit-btn" onClick={() => setPureMode(false)} title="退出纯视觉模式 (Esc)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M9 9L4 4m0 0v5m0-5h5M15 9l5-5m0 0v5m0-5h-5M9 15l-5 5m0 0v-5m0 5h5M15 15l5 5m0 0v-5m0 5h-5"/>
          </svg>
          <span className="kbd">Esc</span>
        </button>
      )}
      <TopBar
        text={text} onTextChange={setText}
        onExportPNG={handlePNG} onExportGIF={handleGIF}
        onResetView={() => sceneRef.current?.resetCamera()}
        exporting={exporting}
      />
      <div className="workspace">
        {/* ============ 左面板 ============ */}
        <div className="panel panel-left">
          <div className="panel-content">
            <Section title="字体">
              <FontPresetGrid
                active={activePresetId}
                loading={fontLoader.loading}
                onPick={(id) => { setActivePresetId(id); loadPreset(id); }}
              />
              <div style={{display:'flex', alignItems:'center', gap:6, margin:'10px 0 6px'}}>
                <div style={{flex:1, height:1, background:'var(--line)'}} />
                <div style={{fontSize:9, color:'var(--text-3)', letterSpacing:'0.1em'}}>本地字体</div>
                <div style={{flex:1, height:1, background:'var(--line)'}} />
              </div>
              <FontBar
                fontMeta={fontLoader.fontMeta}
                loading={fontLoader.loading}
                onUploadClick={() => fileInputRef.current.click()}
              />
              <input
                type="file" accept=".ttf,.otf,.woff" className="hidden-input"
                ref={fileInputRef}
                onChange={async e => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setActivePresetId(null);
                    await fontLoader.loadFromFile(f);
                    showToast(`✓ 字体已加载: ${f.name}`);
                  }
                }}
              />
              {fontLoader.error && (
                <div style={{marginTop:8, fontSize:11, color:'var(--danger)'}}>
                  {fontLoader.error}
                </div>
              )}
              <div style={{marginTop:8, fontSize:10, color:'var(--text-3)', lineHeight:1.5}}>
                也可直接 <b style={{color:'var(--text-2)'}}>拖拽</b> .ttf / .otf / .woff 到任何位置
              </div>
            </Section>

            <Section title="材质库" badge={{type:'pro', text:'16'}}>
              <MaterialGrid activeId={material} onPick={setMaterial} />
              <div style={{marginTop:10, fontSize:10, color:'var(--text-3)'}}>
                技巧 → 在右侧逐字解析中可分别上色
              </div>
            </Section>

            <Section title="字效">
              <div className="chip-row">
                {[
                  {id:'none', label:'无'},
                  {id:'sparks', label:'✦ 火星'},
                  {id:'stars', label:'★ 星辰'},
                  {id:'bubbles', label:'○ 气泡'},
                  {id:'leaves', label:'❋ 落叶'},
                ].map(p => (
                  <div key={p.id}
                    className={'chip' + (particles===p.id?' active':'')}
                    onClick={() => setParticles(p.id)}>
                    {p.label}
                  </div>
                ))}
              </div>
              <ToggleRow label="发光描边" value={outline} onChange={setOutline} />
              {outline && (
                <Slider label="描边粗细" value={outlineWidth} min={0.5} max={6} step={0.5}
                  format={v => v.toFixed(1)} onChange={setOutlineWidth} />
              )}
              <ToggleRow label="故障艺术" value={glitch} onChange={setGlitch}
                hint="字符随机抖动错位" />
            </Section>

            <Section title="动画" right={
              <div
                className={'toggle' + (animMaster ? ' on' : '')}
                onClick={(e) => { e.stopPropagation(); setAnimMaster(!animMaster); }}
                title="动画总开关"
              />
            }>
              <div style={{
                opacity: animMaster ? 1 : 0.4,
                pointerEvents: animMaster ? 'auto' : 'none',
                transition: 'opacity 200ms',
              }}>
                <ToggleRow label="自动旋转" value={autoRot} onChange={setAutoRot} />
                {autoRot && (
                  <Slider label="  · 速度" value={rotateSpeed} min={0} max={2.5} step={0.05}
                    format={v => v.toFixed(2) + 'x'} onChange={setRotateSpeed} />
                )}
                <ToggleRow label="呼吸浮动" value={breathe} onChange={setBreathe} />
                {breathe && (
                  <>
                    <Slider label="  · 速度" value={breatheSpeed} min={0.1} max={3} step={0.1}
                      format={v => v.toFixed(1) + 'x'} onChange={setBreatheSpeed} />
                    <Slider label="  · 幅度" value={breatheAmp} min={0} max={3} step={0.1}
                      format={v => v.toFixed(1) + 'x'} onChange={setBreatheAmp} />
                  </>
                )}
                <ToggleRow label="入场动画" value={bounceIn} onChange={setBounceIn}
                  hint="切换文字时播放，可手动 Replay" />
                {bounceIn && (
                  <>
                    <div className="entrance-grid">
                      {[
                        {id:'bounce', label:'弹跳', icon:'↓'},
                        {id:'slide',  label:'滑入', icon:'→'},
                        {id:'fly',    label:'飞入', icon:'⊙'},
                        {id:'spin',   label:'旋转', icon:'↻'},
                        {id:'rise',   label:'浮起', icon:'↑'},
                        {id:'flip',   label:'翻转', icon:'⇋'},
                      ].map(p => (
                        <div key={p.id}
                          className={'ent-chip' + (entranceType === p.id ? ' active' : '')}
                          onClick={() => { setEntranceType(p.id); sceneRef.current?.replayEntrance(); }}>
                          <div className="ent-icon">{p.icon}</div>
                          <div className="ent-label">{p.label}</div>
                        </div>
                      ))}
                    </div>
                    <Slider label="  · 时长" value={entranceDuration} min={200} max={2400} step={50}
                      format={v => v + 'ms'} onChange={setEntranceDuration} />
                    <Slider label="  · 间隔" value={entranceStagger} min={0} max={300} step={10}
                      format={v => v + 'ms'} onChange={setEntranceStagger} />
                    <button className="btn replay-btn" onClick={() => sceneRef.current?.replayEntrance()}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
                      Replay
                    </button>
                  </>
                )}
                <ToggleRow label="材质流光" value={shine} onChange={setShine} />
                {shine && (
                  <Slider label="  · 速度" value={shineSpeed} min={0.1} max={3} step={0.1}
                    format={v => v.toFixed(1) + 'x'} onChange={setShineSpeed} />
                )}
                <ToggleRow label="鼠标视差" value={parallax} onChange={setParallax} />
                {particles !== 'none' && (
                  <Slider label="粒子速度" value={particleSpeed} min={0.1} max={3} step={0.1}
                    format={v => v.toFixed(1) + 'x'} onChange={setParticleSpeed} />
                )}
              </div>
              <div style={{
                marginTop: 8, padding: '6px 8px',
                fontSize: 10, color: 'var(--text-3)',
                background: 'var(--bg-2)', borderRadius: 4,
                lineHeight: 1.5,
              }}>
                <span className="kbd">space</span> 切换动画 · 顶部总开关控制全部
              </div>
            </Section>
          </div>
        </div>

        {/* ============ 中央视口 ============ */}
        <div className="viewport" ref={viewportRef}>
          {showGrid && <div className="viewport-grid" />}
          <div className="viewport-vignette" />
          <ViewportToolbar
            view={view} onView={setView}
            autoRot={autoRot} onAutoRot={setAutoRot}
            showGrid={showGrid} onGrid={setShowGrid}
            showShadow={showShadow} onShadow={setShowShadow}
          />
          <ViewportHUD
            fps={fps} polyCount={analysis.chars.length * 4000}
            charCount={analysis.chars.length}
            anaCategory={analysis.dominantName}
          />
          <AxisGizmo scene={sceneRef.current} />
          {missingGlyphs.length > 0 && (
            <div className="missing-warn">
              <span style={{color:'var(--danger)', marginRight:6}}>⚠</span>
              当前字体缺失字符：
              <b style={{color:'var(--text-0)', margin:'0 6px'}}>{missingGlyphs.join(' ')}</b>
              · 请试试其他预设字体
            </div>
          )}
          {!fontLoader.font && (
            <div className="empty-state">
              <div className="empty-state-inner">
                <h2>{fontLoader.loading ? '字体加载中…' : '准备就绪'}</h2>
                <p>
                  {fontLoader.loading
                    ? '首次加载中文字体约 5MB，请稍候'
                    : '拖入 .ttf / .otf 文件，或点左侧上传'}
                </p>
              </div>
            </div>
          )}
          {dragOver && (
            <div className="drop-overlay">
              <div className="drop-overlay-msg">
                释放以加载字体
                <small>支持 .ttf / .otf / .woff</small>
              </div>
            </div>
          )}
        </div>

        {/* ============ 右面板 ============ */}
        <div className="panel panel-right">
          <div className="panel-content">
            <Section title="摄像机 · Camera">
              <Slider label="焦距" value={focalLength} min={14} max={200} step={1}
                format={v => v + 'mm'} onChange={setFocalLength} />
              <div style={{fontSize:10, color:'var(--text-3)', marginTop:-4, marginBottom:6, fontFamily:'var(--mono)', lineHeight:1.5}}>
                {focalLength < 24 ? '超广角 · 强透视' :
                 focalLength < 40 ? '广角 · 略夸张' :
                 focalLength < 70 ? '标准 · 自然' :
                 focalLength < 135 ? '中长焦 · 压缩感' : '长焦 · 平面化'}
              </div>
              <div className="focal-chips">
                {[24, 35, 50, 85, 135].map(mm => (
                  <div key={mm}
                    className={'focal-chip' + (focalLength === mm ? ' active' : '')}
                    onClick={() => setFocalLength(mm)}>
                    {mm}<sub>mm</sub>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="几何 · Geometry">
              <Slider label="厚度" value={extrudeDepth} min={2} max={40}
                format={v => v + 'mm'} onChange={setExtrudeDepth} />
              <ToggleRow label="启用倒角" value={bevelEnabled} onChange={setBevelEnabled}
                hint="关闭可避免复杂笔画的穿模现象" />
              {bevelEnabled && (
                <Slider label="倒角大小" value={bevelSize} min={0.1} max={2.5} step={0.1}
                  format={v => v.toFixed(1)} onChange={setBevelSize} />
              )}
              <Slider label="字距" value={letterSpacing} min={-5} max={40}
                onChange={setLetterSpacing} />
            </Section>

            <Section title="背景 · Background">
              <div className="bg-mode-row">
                {[
                  {id:'transparent', label:'透明', icon:'▦'},
                  {id:'solid', label:'纯色', icon:'■'},
                  {id:'gradient', label:'渐变', icon:'◐'},
                ].map(b => (
                  <div key={b.id}
                    className={'bg-mode-chip' + (bgMode===b.id?' active':'')}
                    onClick={() => setBgMode(b.id)}>
                    <span className="bg-mode-icon">{b.icon}</span>
                    {b.label}
                  </div>
                ))}
              </div>

              {bgMode === 'solid' && (
                <>
                  <div className="bg-color-row">
                    <input type="color" className="bg-color-picker"
                      value={bgColor} onChange={e => setBgColor(e.target.value)} />
                    <input type="text" className="bg-color-hex"
                      value={bgColor} onChange={e => setBgColor(e.target.value)} />
                  </div>
                  <div className="bg-preset-row">
                    <div className="bg-preset-label">抠像预设</div>
                    {[
                      {c:'#00ff00', n:'绿幕'},
                      {c:'#0000ff', n:'蓝幕'},
                      {c:'#ff00ff', n:'品红'},
                      {c:'#000000', n:'黑'},
                      {c:'#ffffff', n:'白'},
                    ].map(p => (
                      <div key={p.c}
                        className={'bg-swatch' + (bgColor === p.c ? ' active' : '')}
                        style={{background: p.c, color: p.c === '#ffffff' ? '#000' : '#fff'}}
                        title={p.n}
                        onClick={() => setBgColor(p.c)}>
                        {p.n}
                      </div>
                    ))}
                  </div>
                  <div className="bg-preset-row" style={{marginTop:4}}>
                    <div className="bg-preset-label">主题色</div>
                    {['#0c0d12','#1e2230','#2a2030','#1a2a3a','#1d2a1d','#3a1f1f','#f5efe2','#ffd66b']
                      .map(c => (
                      <div key={c}
                        className={'bg-swatch-small' + (bgColor === c ? ' active' : '')}
                        style={{background: c}}
                        onClick={() => setBgColor(c)} />
                    ))}
                  </div>
                </>
              )}

              {bgMode === 'gradient' && (
                <>
                  <div className="row">
                    <div className="row-label">起始色</div>
                    <input type="color" className="bg-color-picker bg-color-inline"
                      value={bgGradFrom} onChange={e => setBgGradFrom(e.target.value)} />
                    <code className="row-value" style={{color:'var(--text-2)'}}>{bgGradFrom}</code>
                  </div>
                  <div className="row">
                    <div className="row-label">结束色</div>
                    <input type="color" className="bg-color-picker bg-color-inline"
                      value={bgGradTo} onChange={e => setBgGradTo(e.target.value)} />
                    <code className="row-value" style={{color:'var(--text-2)'}}>{bgGradTo}</code>
                  </div>
                  <div className="bg-grad-presets">
                    {[
                      ['#1e2230','#06070a','深空'],
                      ['#ff6b9d','#ffd166','夕阳'],
                      ['#5e60ce','#48bfe3','黎明'],
                      ['#06b6d4','#0e7490','深海'],
                      ['#fca311','#14213d','暖夜'],
                      ['#1a1a2e','#16213e','午夜蓝'],
                    ].map(([from, to, name]) => (
                      <div key={name}
                        className="bg-grad-preset"
                        style={{background: `linear-gradient(180deg, ${from}, ${to})`}}
                        title={name}
                        onClick={() => { setBgGradFrom(from); setBgGradTo(to); }}>
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <button
                className={'btn pure-mode-btn' + (pureMode ? ' active' : '')}
                onClick={() => setPureMode(p => !p)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
                {pureMode ? '退出纯视觉模式' : '纯视觉模式'}
                <span className="kbd" style={{marginLeft:'auto'}}>Tab</span>
              </button>
              <div style={{fontSize:10, color:'var(--text-3)', marginTop:6, lineHeight:1.5}}>
                纯视觉模式隐藏所有面板，便于截图与抠像
              </div>
            </Section>

            <Section title="中文解析" badge={{type:'new', text:'AI'}} defaultOpen={true}>
              <CharAnalysis
                analysis={analysis}
                perCharMaterial={perCharMaterial}
                onPerCharMaterial={(i, m) => setPerCharMaterial(p => ({...p, [i]: m}))}
                onResetPerChar={() => setPerCharMaterial({})}
              />
            </Section>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
