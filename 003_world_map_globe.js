const W = 1920;
const H = 1080;
const CX = W / 2;
const CY = H / 2;
const GLOBE_RADIUS = 460;
const STRETCH_X = 1.12;
const STRETCH_Y = 1;

const defaultTheme = {
  sceneBg: '#050a1a',
  ocean: '#0d2148',
  country: '#0c1c34',
  countryStroke: '#1d3e66',
  gridLine: '#163766',
  route: '#4dd4ff',
  routeActive: '#eaf8ff',
  city: '#4dd4ff',
  label: '#d8ecff',
  labelMuted: '#7da3cf',
};

const presets = {
  classic: defaultTheme,
  aurora: {
    sceneBg: '#07130f',
    ocean: '#12382f',
    country: '#17342b',
    countryStroke: '#2d6b58',
    gridLine: '#2f6f63',
    route: '#4ade80',
    routeActive: '#ecfdf5',
    city: '#34d399',
    label: '#e7fff4',
    labelMuted: '#94d8c2',
  },
  ember: {
    sceneBg: '#160806',
    ocean: '#331311',
    country: '#402015',
    countryStroke: '#8f4d2f',
    gridLine: '#7c3f28',
    route: '#fb923c',
    routeActive: '#fff7ed',
    city: '#facc15',
    label: '#fff4df',
    labelMuted: '#f0b987',
  },
};

const cities = [
  { name: '北京', en: 'BEIJING', coords: [116.4074, 39.9042], off: [0, -24] },
  { name: '东京', en: 'TOKYO', coords: [139.6503, 35.6762], off: [0, 26] },
  { name: '香港', en: 'HONG KONG', coords: [114.1694, 22.3193], off: [-32, 26] },
  { name: '新加坡', en: 'SINGAPORE', coords: [103.8198, 1.3521], off: [0, 26] },
  { name: '迪拜', en: 'DUBAI', coords: [55.2708, 25.2048], off: [0, 26] },
  { name: '法兰克福', en: 'FRANKFURT', coords: [8.6821, 50.1109], off: [0, -24] },
  { name: '纽约', en: 'NEW YORK', coords: [-74.006, 40.7128], off: [0, -24] },
  { name: '旧金山', en: 'SAN FRANCISCO', coords: [-122.4194, 37.7749], off: [0, -24] },
  { name: '布宜诺斯艾利斯', en: 'BUENOS AIRES', coords: [-58.3816, -34.6037], off: [0, 26] },
  { name: '开普敦', en: 'CAPE TOWN', coords: [18.4241, -33.9249], off: [0, 26] },
  { name: '悉尼', en: 'SYDNEY', coords: [151.2093, -33.8688], off: [0, 26] },
];

const sequence = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
  [6, 7], [7, 8], [8, 9], [9, 10], [10, 1],
];

const state = {
  mode: 'map',
  runId: 0,
  countries: null,
  timers: new Set(),
  frames: new Set(),
  globeRotater: null,
  drawnGlobeArcs: [],
};

const root = document.documentElement;
const body = document.body;
const themeForm = document.querySelector('#themeForm');
const themeStatus = document.querySelector('#themeStatus');
const modeBadge = document.querySelector('#modeBadge');
const modeMeta = document.querySelector('#modeMeta');
const presetButtons = document.querySelectorAll('.preset');
const projectedLayer = d3.select('#projectedLayer');
const graticuleLayer = d3.select('#graticuleLayer');
const countryLayer = d3.select('#countryLayer');
const routeBaseLayer = d3.select('#routeBaseLayer');
const routeActiveLayer = d3.select('#routeActiveLayer');
const arcHead = d3.select('#arcHeadLayer circle');
const cityLayer = d3.select('#cityLayer');

const mapProjection = d3.geoMiller()
  .scale(290)
  .translate([CX, CY]);
const mapPath = d3.geoPath(mapProjection);
const mapGraticule = d3.geoGraticule().step([20, 20])();

const globeProjection = d3.geoOrthographic()
  .scale(GLOBE_RADIUS)
  .translate([CX, CY])
  .clipAngle(90)
  .rotate([-cities[0].coords[0], -cities[0].coords[1]]);
const globePath = d3.geoPath(globeProjection);
const globeGraticule = d3.geoGraticule().step([15, 15])();

const stars = d3.range(150).map(() => ({
  cx: Math.random() * W,
  cy: Math.random() * H,
  r: Math.random() * 1.1 + 0.25,
  opacity: Math.random() * 0.5 + 0.22,
}));

d3.select('#stars')
  .selectAll('circle')
  .data(stars)
  .join('circle')
  .attr('class', 'star')
  .attr('cx', d => d.cx)
  .attr('cy', d => d.cy)
  .attr('r', d => d.r)
  .attr('opacity', d => d.opacity);

function setThemeControls(theme) {
  Object.entries(theme).forEach(([key, value]) => {
    const input = themeForm.elements[key];
    if (input) input.value = value;
  });
}

function readThemeControls() {
  const data = new FormData(themeForm);
  return Object.fromEntries(Object.keys(defaultTheme).map(key => [key, data.get(key) || defaultTheme[key]]));
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const value = parseInt(normalized.length === 3
    ? normalized.split('').map(ch => ch + ch).join('')
    : normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function mixHex(a, b, amount) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * amount,
    g: ca.g + (cb.g - ca.g) * amount,
    b: ca.b + (cb.b - ca.b) * amount,
  });
}

function applyTheme(theme, label = '配色已生效。') {
  root.style.setProperty('--scene-bg', theme.sceneBg);
  root.style.setProperty('--scene-glow', mixHex(theme.sceneBg, theme.route, 0.18));
  root.style.setProperty('--country', theme.country);
  root.style.setProperty('--country-stroke', theme.countryStroke);
  root.style.setProperty('--grid-line', theme.gridLine);
  root.style.setProperty('--route', theme.route);
  root.style.setProperty('--route-active', theme.routeActive);
  root.style.setProperty('--city', theme.city);
  root.style.setProperty('--label', theme.label);
  root.style.setProperty('--label-muted', theme.labelMuted);
  root.style.setProperty('--ocean', theme.ocean);
  root.style.setProperty('--ocean-light', mixHex(theme.ocean, theme.routeActive, 0.22));
  root.style.setProperty('--ocean-dark', mixHex(theme.ocean, theme.sceneBg, 0.54));
  themeStatus.textContent = label;
}

function isActive(runId) {
  return state.runId === runId;
}

function trackedTimeout(fn, ms) {
  const timer = {
    id: window.setTimeout(() => {
      state.timers.delete(timer);
      fn();
    }, ms),
  };
  state.timers.add(timer);
  return timer;
}

function sleep(ms, runId) {
  return new Promise(resolve => {
    const timer = {
      resolve,
      id: window.setTimeout(() => {
        state.timers.delete(timer);
        resolve(isActive(runId));
      }, ms),
    };
    state.timers.add(timer);
  });
}

function trackedFrame(fn) {
  const id = requestAnimationFrame(ts => {
    state.frames.delete(id);
    fn(ts);
  });
  state.frames.add(id);
  return id;
}

function stopAnimations() {
  state.timers.forEach(timer => {
    clearTimeout(timer.id);
    if (timer.resolve) timer.resolve(false);
  });
  state.timers.clear();
  routeBaseLayer.selectAll('*').interrupt();
  routeActiveLayer.selectAll('*').interrupt();
  cityLayer.selectAll('*').interrupt();
}

function clearScene() {
  stopAnimations();
  graticuleLayer.selectAll('*').remove();
  countryLayer.selectAll('*').remove();
  routeBaseLayer.selectAll('*').remove();
  routeActiveLayer.selectAll('*').remove();
  cityLayer.selectAll('*').remove();
  arcHead.attr('r', 0);
  state.drawnGlobeArcs = [];
}

function updateModeLabels(mode) {
  const isMap = mode === 'map';
  modeBadge.textContent = isMap ? '世界地图' : '地球模型';
  modeMeta.textContent = isMap ? '世界地图 · 平面连线视图' : '地球模型 · 旋转连线视图';
  document.querySelectorAll('.mode-btn').forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setActivePreset(presetName) {
  presetButtons.forEach(button => {
    const active = button.dataset.preset === presetName;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function createCityGroups() {
  const groups = cityLayer
    .selectAll('g.city')
    .data(cities)
    .join('g')
    .attr('class', 'city')
    .attr('data-city-index', (d, i) => i);

  groups.append('circle').attr('class', 'city-pulse').attr('r', 5);
  groups.append('circle').attr('class', 'city-dot-outer').attr('r', 6);
  groups.append('circle').attr('class', 'city-dot-inner').attr('r', 2.4);
  groups.append('text')
    .attr('class', 'city-label')
    .attr('x', d => d.off[0])
    .attr('y', d => d.off[1])
    .text(d => d.name);
  groups.append('text')
    .attr('class', 'city-label-en')
    .attr('x', d => d.off[0])
    .attr('y', d => d.off[1] + (d.off[1] > 0 ? 13 : -15))
    .text(d => d.en);

  return groups;
}

function flashCity(index) {
  const node = cityLayer.select(`[data-city-index="${index}"]`);
  if (node.empty()) return;

  if (state.mode === 'map') {
    node.style('opacity', 1);
  }

  node.select('.city-dot-inner')
    .interrupt('flash-inner')
    .transition('flash-inner')
    .duration(140)
    .ease(d3.easeQuadOut)
    .attr('r', 5.5)
    .transition('flash-inner')
    .duration(450)
    .ease(d3.easeQuadOut)
    .attr('r', 2.4);

  node.select('.city-dot-outer')
    .interrupt('flash-outer')
    .transition('flash-outer')
    .duration(140)
    .ease(d3.easeQuadOut)
    .attr('r', 13)
    .transition('flash-outer')
    .duration(500)
    .ease(d3.easeQuadOut)
    .attr('r', 6);

  node.select('.city-pulse')
    .interrupt('flash-pulse')
    .attr('r', 6)
    .attr('opacity', 0.95)
    .attr('stroke-width', 2)
    .transition('flash-pulse')
    .duration(850)
    .ease(d3.easeQuadOut)
    .attr('r', 36)
    .attr('opacity', 0);
}

function mapArcPath(p1, p2) {
  const [x1, y1] = mapProjection(p1);
  const [x2, y2] = mapProjection(p2);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;
  const lift = Math.min(dist * 0.3, 220);
  let nx = -dy / dist;
  let ny = dx / dist;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const mx = (x1 + x2) / 2 + nx * lift;
  const my = (y1 + y2) / 2 + ny * lift;
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
}

function renderMap(runId) {
  projectedLayer.attr('transform', null);
  graticuleLayer.append('path')
    .attr('class', 'graticule')
    .attr('d', mapPath(mapGraticule));

  if (state.countries) {
    countryLayer.selectAll('path')
      .data(state.countries.features)
      .join('path')
      .attr('class', 'country')
      .attr('d', mapPath);
  }

  const cityGroups = createCityGroups()
    .attr('transform', d => {
      const [x, y] = mapProjection(d.coords);
      return `translate(${x},${y})`;
    })
    .style('opacity', 0);

  cityGroups.select('.city-label-en')
    .attr('y', d => d.off[1] + (d.off[1] > 0 ? 13 : -15));

  const arcData = sequence.map(([from, to]) => ({
    from,
    to,
    d: mapArcPath(cities[from].coords, cities[to].coords),
  }));

  const baseRoutes = routeBaseLayer.selectAll('path')
    .data(arcData)
    .join('path')
    .attr('class', 'route-base')
    .attr('d', d => d.d)
    .each(function() {
      const length = this.getTotalLength();
      d3.select(this)
        .attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length);
    });

  const highlightRoutes = routeActiveLayer.selectAll('path')
    .data(arcData)
    .join('path')
    .attr('class', 'route-highlight')
    .attr('d', d => d.d)
    .style('opacity', 0);

  flashCity(0);

  const drawDuration = 1100;
  const step = drawDuration - 250;

  baseRoutes.each(function(d, index) {
    const length = this.getTotalLength();
    d3.select(this)
      .transition()
      .delay(index * step)
      .duration(drawDuration)
      .ease(d3.easeCubicInOut)
      .attr('stroke-dashoffset', 0);
  });

  arcData.forEach((arc, index) => {
    trackedTimeout(() => {
      if (isActive(runId)) flashCity(arc.to);
    }, index * step + drawDuration);
  });

  const totalDraw = (arcData.length - 1) * step + drawDuration;
  trackedTimeout(() => {
    if (isActive(runId)) runMapLoop(highlightRoutes, arcData, runId, 0);
  }, totalDraw + 500);
}

function runMapLoop(routes, arcData, runId, index) {
  if (!isActive(runId) || state.mode !== 'map') return;
  if (index === 0) flashCity(arcData[0].from);

  const node = routes.nodes()[index];
  if (!node) return;
  const length = node.getTotalLength();
  const segment = Math.max(length * 0.35, 60);

  d3.select(node)
    .interrupt()
    .attr('stroke-dasharray', `${segment} ${length}`)
    .attr('stroke-dashoffset', segment)
    .style('opacity', 1)
    .transition()
    .duration(900)
    .ease(d3.easeQuadInOut)
    .attr('stroke-dashoffset', -length)
    .on('end', () => {
      if (!isActive(runId) || state.mode !== 'map') return;
      d3.select(node).style('opacity', 0);
      flashCity(arcData[index].to);
      runMapLoop(routes, arcData, runId, (index + 1) % routes.size());
    });
}

function lonLatTo3D(lon, lat, radius = 1) {
  const l = lon * Math.PI / 180;
  const p = lat * Math.PI / 180;
  return [
    radius * Math.cos(p) * Math.cos(l),
    radius * Math.cos(p) * Math.sin(l),
    radius * Math.sin(p),
  ];
}

function updateGlobeRotater() {
  state.globeRotater = d3.geoRotation(globeProjection.rotate());
}

function rotate3D(point) {
  const radius = Math.hypot(point[0], point[1], point[2]);
  if (radius === 0) return [0, 0, 0];
  const lon = Math.atan2(point[1], point[0]) * 180 / Math.PI;
  const lat = Math.asin(point[2] / radius) * 180 / Math.PI;
  const [rotatedLon, rotatedLat] = state.globeRotater([lon, lat]);
  const rl = rotatedLon * Math.PI / 180;
  const rp = rotatedLat * Math.PI / 180;
  return [
    radius * Math.cos(rp) * Math.cos(rl),
    radius * Math.cos(rp) * Math.sin(rl),
    radius * Math.sin(rp),
  ];
}

function projectStretched(rotated) {
  let x = CX + GLOBE_RADIUS * rotated[1];
  let y = CY - GLOBE_RADIUS * rotated[2];
  x = CX + (x - CX) * STRETCH_X;
  y = CY + (y - CY) * STRETCH_Y;
  return [x, y, rotated[0] > 0];
}

function compute3DCtrl(c1, c2) {
  const mid = [(c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2, (c1[2] + c2[2]) / 2];
  const midLength = Math.hypot(mid[0], mid[1], mid[2]) || 1;
  const chord = Math.hypot(c1[0] - c2[0], c1[1] - c2[1], c1[2] - c2[2]);
  const liftFactor = 1 + chord * 0.42;
  return [
    (mid[0] / midLength) * liftFactor,
    (mid[1] / midLength) * liftFactor,
    (mid[2] / midLength) * liftFactor,
  ];
}

function ensureArc3D(arc) {
  if (arc.c1) return;
  arc.c1 = lonLatTo3D(cities[arc.from].coords[0], cities[arc.from].coords[1]);
  arc.c2 = lonLatTo3D(cities[arc.to].coords[0], cities[arc.to].coords[1]);
  arc.ctrl = compute3DCtrl(arc.c1, arc.c2);
}

function bezierPoint3D(arc, t) {
  const u = 1 - t;
  return [
    u * u * arc.c1[0] + 2 * u * t * arc.ctrl[0] + t * t * arc.c2[0],
    u * u * arc.c1[1] + 2 * u * t * arc.ctrl[1] + t * t * arc.c2[1],
    u * u * arc.c1[2] + 2 * u * t * arc.ctrl[2] + t * t * arc.c2[2],
  ];
}

function globeArcPath(arc) {
  ensureArc3D(arc);
  const segments = 70;
  const tMax = arc.progress;
  let d = '';
  let wasVisible = false;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * tMax;
    const rotated = rotate3D(bezierPoint3D(arc, t));
    const [x, y, visible] = projectStretched(rotated);
    if (visible) {
      d += (wasVisible ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2);
    }
    wasVisible = visible;
  }
  return d;
}

function redrawGlobe() {
  updateGlobeRotater();

  if (state.countries) {
    countryLayer.selectAll('path').attr('d', globePath);
    graticuleLayer.select('path').attr('d', globePath(globeGraticule));
  }

  routeBaseLayer.selectAll('path')
    .data(state.drawnGlobeArcs)
    .join('path')
    .attr('class', d => d.progress < 1 ? 'route-active' : 'route-drawn')
    .attr('d', globeArcPath);

  const last = state.drawnGlobeArcs[state.drawnGlobeArcs.length - 1];
  if (last && last.progress > 0.02 && last.progress < 1) {
    ensureArc3D(last);
    const [x, y, visible] = projectStretched(rotate3D(bezierPoint3D(last, last.progress)));
    arcHead.attr('cx', x).attr('cy', y).attr('r', visible ? 5 : 0);
  } else {
    arcHead.attr('r', 0);
  }

  cityLayer.selectAll('g.city').each(function(d) {
    const rotated = rotate3D(lonLatTo3D(d.coords[0], d.coords[1]));
    const [x, y] = projectStretched(rotated);
    const opacity = rotated[0] > 0 ? Math.min(1, rotated[0] / 0.18) : 0;
    d3.select(this)
      .attr('transform', `translate(${x},${y})`)
      .style('opacity', opacity);
  });
}

function animate(runId, duration, onTick) {
  return new Promise(resolve => {
    const start = performance.now();
    function frame(now) {
      if (!isActive(runId)) {
        resolve(false);
        return;
      }
      const raw = Math.min((now - start) / duration, 1);
      onTick(d3.easeCubicInOut(raw), raw);
      redrawGlobe();
      if (raw < 1) {
        trackedFrame(frame);
      } else {
        resolve(true);
      }
    }
    trackedFrame(frame);
  });
}

function animateGlobeArc(arc, duration, runId) {
  const rotationStart = globeProjection.rotate().slice();
  const rotationEnd = [-cities[arc.to].coords[0], -cities[arc.to].coords[1]];
  return animate(runId, duration, eased => {
    globeProjection.rotate([
      rotationStart[0] + (rotationEnd[0] - rotationStart[0]) * eased,
      rotationStart[1] + (rotationEnd[1] - rotationStart[1]) * eased,
    ]);
    arc.progress = eased;
  });
}

function rotateGlobeTo(coords, duration, runId) {
  const rotationStart = globeProjection.rotate().slice();
  const rotationEnd = [-coords[0], -coords[1]];
  return animate(runId, duration, eased => {
    globeProjection.rotate([
      rotationStart[0] + (rotationEnd[0] - rotationStart[0]) * eased,
      rotationStart[1] + (rotationEnd[1] - rotationStart[1]) * eased,
    ]);
  });
}

function fadeOutGlobeArcs(duration, runId) {
  return animate(runId, duration, eased => {
    routeBaseLayer.selectAll('path').attr('opacity', 1 - eased);
  }).then(active => {
    if (!active) return false;
    routeBaseLayer.selectAll('path').attr('opacity', 1);
    state.drawnGlobeArcs = [];
    redrawGlobe();
    return true;
  });
}

async function renderGlobe(runId) {
  projectedLayer.attr('transform', `matrix(${STRETCH_X} 0 0 ${STRETCH_Y} ${CX * (1 - STRETCH_X)} ${CY * (1 - STRETCH_Y)})`);
  globeProjection.rotate([-cities[0].coords[0], -cities[0].coords[1]]);
  updateGlobeRotater();

  graticuleLayer.append('path')
    .attr('class', 'graticule');

  if (state.countries) {
    countryLayer.selectAll('path')
      .data(state.countries.features)
      .join('path')
      .attr('class', 'country');
  }

  createCityGroups();
  redrawGlobe();
  flashCity(0);

  if (!(await sleep(700, runId))) return;

  while (isActive(runId) && state.mode === 'globe') {
    for (let i = 0; i < sequence.length; i++) {
      if (!isActive(runId)) return;
      const [from, to] = sequence[i];
      const arc = { from, to, progress: 0 };
      state.drawnGlobeArcs.push(arc);
      const active = await animateGlobeArc(arc, 1800, runId);
      if (!active) return;
      flashCity(to);
      if (!(await sleep(150, runId))) return;
    }
    if (!(await sleep(2200, runId))) return;
    if (!(await fadeOutGlobeArcs(700, runId))) return;
    if (!(await rotateGlobeTo(cities[0].coords, 1400, runId))) return;
    flashCity(0);
    if (!(await sleep(500, runId))) return;
  }
}

function setMode(mode) {
  if (!['map', 'globe'].includes(mode)) return;
  state.mode = mode;
  state.runId += 1;
  clearScene();
  body.dataset.mode = mode;
  updateModeLabels(mode);

  const runId = state.runId;
  if (mode === 'map') {
    renderMap(runId);
  } else {
    renderGlobe(runId);
  }
}

document.querySelectorAll('.mode-btn').forEach(button => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

presetButtons.forEach(button => {
  button.addEventListener('click', () => {
    const preset = presets[button.dataset.preset] || defaultTheme;
    setThemeControls(preset);
    setActivePreset(button.dataset.preset);
    themeStatus.textContent = '预设已载入，点击确定生效。';
  });
});

themeForm.addEventListener('input', () => {
  setActivePreset(null);
});

document.querySelector('#applyTheme').addEventListener('click', () => {
  applyTheme(readThemeControls());
});

document.querySelector('#resetTheme').addEventListener('click', () => {
  setThemeControls(defaultTheme);
  setActivePreset('classic');
  applyTheme(defaultTheme, '已恢复默认配色。');
});

d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
  .then(world => {
    state.countries = topojson.feature(world, world.objects.countries);
    setMode('map');
  })
  .catch(error => {
    console.warn('map load failed', error);
    setMode('map');
  });

setThemeControls(defaultTheme);
applyTheme(defaultTheme, '当前使用默认配色。');
