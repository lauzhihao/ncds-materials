/* 立体字 Three.js 场景模块
   依赖: THREE, OrbitControls, RoomEnvironment, opentype
*/

window.Scene3D = (function() {
  const THREE = window.THREE;

  // ====== Path → Shapes 转换 ======
  // opentype.js Path.commands → Array<THREE.Shape>
  // 用 point-in-polygon 深度分层判断 hole/shape 嵌套，处理任意复杂中文字形
  function pathToShapes(path, scale = 1) {
    // === Step 1: 解析为子路径 ===
    const subpaths = [];
    let current = null;
    let cx = 0, cy = 0;

    for (const c of path.commands) {
      if (c.type === 'M') {
        if (current && current.cmds.length > 1) subpaths.push(current);
        current = { cmds: [], startX: c.x * scale, startY: -c.y * scale };
        cx = c.x * scale; cy = -c.y * scale;
        current.cmds.push({ type: 'M', x: cx, y: cy });
      } else if (c.type === 'L') {
        const x = c.x * scale, y = -c.y * scale;
        current.cmds.push({ type: 'L', x, y });
        cx = x; cy = y;
      } else if (c.type === 'Q') {
        const x = c.x * scale, y = -c.y * scale;
        const x1 = c.x1 * scale, y1 = -c.y1 * scale;
        current.cmds.push({ type: 'Q', x, y, x1, y1 });
        cx = x; cy = y;
      } else if (c.type === 'C') {
        const x = c.x * scale, y = -c.y * scale;
        const x1 = c.x1 * scale, y1 = -c.y1 * scale;
        const x2 = c.x2 * scale, y2 = -c.y2 * scale;
        current.cmds.push({ type: 'C', x, y, x1, y1, x2, y2 });
        cx = x; cy = y;
      } else if (c.type === 'Z') {
        if (current && current.cmds.length > 1) {
          subpaths.push(current);
          current = null;
        }
      }
    }
    if (current && current.cmds.length > 1) subpaths.push(current);
    if (subpaths.length === 0) return [];

    // === Step 2: 离散化（用于面积 / 点-多边形测试）===
    const polys = subpaths.map(sp => {
      const pts = [];
      let px = 0, py = 0;
      for (const cmd of sp.cmds) {
        if (cmd.type === 'M' || cmd.type === 'L') {
          pts.push([cmd.x, cmd.y]); px = cmd.x; py = cmd.y;
        } else if (cmd.type === 'Q') {
          for (let t = 0.1; t <= 1.0001; t += 0.1) {
            const u = 1 - t;
            const x = u*u*px + 2*u*t*cmd.x1 + t*t*cmd.x;
            const y = u*u*py + 2*u*t*cmd.y1 + t*t*cmd.y;
            pts.push([x, y]);
          }
          px = cmd.x; py = cmd.y;
        } else if (cmd.type === 'C') {
          for (let t = 0.1; t <= 1.0001; t += 0.1) {
            const u = 1 - t;
            const x = u*u*u*px + 3*u*u*t*cmd.x1 + 3*u*t*t*cmd.x2 + t*t*t*cmd.x;
            const y = u*u*u*py + 3*u*u*t*cmd.y1 + 3*u*t*t*cmd.y2 + t*t*t*cmd.y;
            pts.push([x, y]);
          }
          px = cmd.x; py = cmd.y;
        }
      }
      // 有向面积
      let area = 0;
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        area += (x1 * y2 - x2 * y1);
      }
      area /= 2;
      // bbox
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [x, y] of pts) {
        if (x < minX) minX = x; if (y < minY) minY = y;
        if (x > maxX) maxX = x; if (y > maxY) maxY = y;
      }
      // 几何质心（用于点-多边形测试，比第一个点更可靠）
      let cxs = 0, cys = 0;
      for (const [x, y] of pts) { cxs += x; cys += y; }
      cxs /= pts.length; cys /= pts.length;
      // 如果质心不在多边形内（凹形/月牙），fallback 到第一点
      const refPt = pointInPolygon([cxs, cys], pts) ? [cxs, cys] : pts[0];
      return { sp, pts, area, bbox:[minX,minY,maxX,maxY], refPt, absArea: Math.abs(area) };
    });

    // 剔除退化子路径
    const valid = polys.filter(p => p.absArea > 0.5 && p.pts.length >= 3);
    if (valid.length === 0) return [];

    // === Step 3: 容器层级 ===
    // 对每个子路径 p，统计有多少个其他子路径 q 包含它的代表点
    valid.forEach(p => {
      p.containers = [];
      for (const q of valid) {
        if (q === p) continue;
        // bbox 提前剪枝
        if (p.bbox[0] < q.bbox[0] || p.bbox[1] < q.bbox[1] ||
            p.bbox[2] > q.bbox[2] || p.bbox[3] > q.bbox[3]) continue;
        if (pointInPolygon(p.refPt, q.pts)) p.containers.push(q);
      }
      p.depth = p.containers.length;
    });

    // === Step 4: 构造 Shape（偶数深度）+ Path（奇数深度作为 hole）===
    function applyCmds(target, sp) {
      for (const cmd of sp.cmds) {
        if (cmd.type === 'M') target.moveTo(cmd.x, cmd.y);
        else if (cmd.type === 'L') target.lineTo(cmd.x, cmd.y);
        else if (cmd.type === 'Q') target.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
        else if (cmd.type === 'C') target.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
      }
    }

    const result = [];
    valid.forEach(p => {
      if (p.depth % 2 !== 0) return; // 奇数 = hole
      const shape = new THREE.Shape();
      applyCmds(shape, p.sp);
      // 直接子 hole = depth + 1 且 p 在其 containers
      valid.forEach(h => {
        if (h.depth === p.depth + 1 && h.containers.includes(p)) {
          const hole = new THREE.Path();
          applyCmds(hole, h.sp);
          shape.holes.push(hole);
        }
      });
      result.push(shape);
    });

    return result;
  }

  // 射线法点-多边形测试
  function pointInPolygon(pt, polyPts) {
    let inside = false;
    const x = pt[0], y = pt[1];
    for (let i = 0, j = polyPts.length - 1; i < polyPts.length; j = i++) {
      const xi = polyPts[i][0], yi = polyPts[i][1];
      const xj = polyPts[j][0], yj = polyPts[j][1];
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // ====== 主场景 ======
  class TextScene {
    constructor(container) {
      this.container = container;
      this.scene = new THREE.Scene();
      this.scene.background = null;

      const w = container.clientWidth, h = container.clientHeight;
      this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 2000);
      this.camera.position.set(0, 0, 320);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      // r147 兼容的颜色空间设置
      if ('outputColorSpace' in this.renderer) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      } else {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(this.renderer.domElement);

      // env map for reflections
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const env = new THREE.RoomEnvironment();
      this.scene.environment = pmrem.fromScene(env, 0.04).texture;

      // 灯光
      const amb = new THREE.AmbientLight(0xffffff, 0.25);
      this.scene.add(amb);

      const key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(60, 120, 100);
      key.castShadow = true;
      key.shadow.mapSize.width = 1024;
      key.shadow.mapSize.height = 1024;
      key.shadow.camera.left = -150;
      key.shadow.camera.right = 150;
      key.shadow.camera.top = 150;
      key.shadow.camera.bottom = -150;
      key.shadow.bias = -0.0008;
      this.scene.add(key);
      this.keyLight = key;

      const fill = new THREE.DirectionalLight(0x88a8ff, 0.5);
      fill.position.set(-80, 30, 60);
      this.scene.add(fill);

      const rim = new THREE.DirectionalLight(0xff6ba8, 0.7);
      rim.position.set(20, -40, -100);
      this.scene.add(rim);

      // 阴影地面（可选）
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(800, 800),
        new THREE.ShadowMaterial({ opacity: 0.35 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -90;
      floor.receiveShadow = true;
      floor.visible = false;
      this.scene.add(floor);
      this.floor = floor;

      // OrbitControls
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.rotateSpeed = 0.9;
      this.controls.enablePan = false;
      this.controls.minDistance = 120;
      this.controls.maxDistance = 800;

      // 字组容器（每个字一个 mesh，组成一个 group）
      this.textGroup = new THREE.Group();
      this.scene.add(this.textGroup);

      // 粒子组
      this.particleSystem = null;

      // 状态
      this.font = null;
      this.text = '';
      this.charMeshes = [];
      this.options = {
        extrudeDepth: 14,
        bevelEnabled: false,         // 默认不加倍角，避免复杂笔画的自相交穿模
        bevelSize: 0.0,
        bevelThickness: 0.0,
        bevelSegments: 3,
        curveSegments: 8,
        letterSpacing: 14,
        animMaster: true,            // 动画总开关
        rotateAuto: true,
        rotateSpeed: 0.6,            // 0..2 倍速
        breathe: true,
        breatheSpeed: 1.0,
        breatheAmp: 1.0,
        bounceIn: true,
        entranceType: 'bounce',     // bounce | slide | fly | spin | rise | flip
        entranceDuration: 800,      // ms per character
        entranceStagger: 80,        // ms between chars
        shine: true,
        shineSpeed: 1.0,
        parallax: true,
        particles: 'none',
        particleSpeed: 1.0,
        glow: false,
        glowColor: 0xff7a2d,
        glitch: false,
        outline: false,
        outlineColor: 0x000000,
        outlineWidth: 1.5,
        decorations: false,
        material: 'gold',
        perCharMaterial: {},
        background: 'transparent',
        shadow: false,
        showGrid: false,
      };

      this.startTime = performance.now();
      this.mouseX = 0; this.mouseY = 0;
      this.targetMouseX = 0; this.targetMouseY = 0;
      this._bindMouse();

      this._tick = this._tick.bind(this);
      this._tick();

      this._onResize = this._onResize.bind(this);
      window.addEventListener('resize', this._onResize);

      // ResizeObserver 监听容器尺寸变化（处理面板隐藏 / 纯视觉模式切换等）
      if (typeof ResizeObserver !== 'undefined') {
        this._resizeObserver = new ResizeObserver(() => this._onResize());
        this._resizeObserver.observe(container);
      }
    }

    _bindMouse() {
      this.container.addEventListener('mousemove', (e) => {
        const r = this.container.getBoundingClientRect();
        this.targetMouseX = ((e.clientX - r.left) / r.width - 0.5) * 2;
        this.targetMouseY = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
    }

    _onResize() {
      const w = this.container.clientWidth, h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    setFont(font) {
      this.font = font;
      if (this.text) this.rebuild();
    }

    setText(text) {
      this.text = text;
      this.rebuild();
    }

    setOption(key, value) {
      this.options[key] = value;
      if (['extrudeDepth', 'bevelEnabled', 'bevelSize', 'bevelThickness', 'bevelSegments', 'curveSegments', 'letterSpacing', 'outline', 'outlineColor', 'outlineWidth'].includes(key)) {
        this.rebuild();
      } else if (key === 'material') {
        this.applyMaterials();
      } else if (key === 'particles') {
        this.buildParticles();
      } else if (key === 'shadow') {
        this.floor.visible = !!value;
      }
    }

    setPerCharMaterial(idx, matId) {
      this.options.perCharMaterial = { ...this.options.perCharMaterial, [idx]: matId };
      this.applyMaterials();
    }

    clearPerCharMaterial() {
      this.options.perCharMaterial = {};
      this.applyMaterials();
    }

    // ===== 构建几何 =====
    rebuild() {
      // 清掉旧的
      while (this.textGroup.children.length) {
        const m = this.textGroup.children.pop();
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (Array.isArray(m.material)) m.material.forEach(mm => mm.dispose());
          else m.material.dispose();
        }
      }
      this.charMeshes = [];
      if (!this.font || !this.text) return;

      const fontSize = 80;
      const o = this.options;
      const chars = [...this.text];

      // 安全约束 bevel — 防止内孔 self-intersect 穿模
      const useBevel = !!o.bevelEnabled && o.bevelSize > 0.01;
      const safeBevelThickness = useBevel ? Math.min(o.bevelThickness, o.extrudeDepth / 2 - 0.5) : 0;
      const safeBevelSize = useBevel ? Math.min(o.bevelSize, 2.0) : 0;

      // 第一步：为每个字构建几何，得到实际 bbox
      const built = [];
      chars.forEach((ch, i) => {
        if (!ch || ch === ' ' || ch === '　' || ch === '\n') {
          built.push({ ch, blank: true, w: fontSize * 0.5, charIndex: i });
          return;
        }
        const glyph = this.font.charToGlyph(ch);
        const isMissing = !glyph || glyph.index === 0 ||
          !glyph.path || (glyph.getPath(0,0,fontSize).commands.length === 0);
        if (isMissing) {
          built.push({ ch, missing: true, w: fontSize * 0.85, charIndex: i });
          return;
        }
        const path = glyph.getPath(0, 0, fontSize);
        const shapes = pathToShapes(path, 1);
        if (shapes.length === 0) {
          built.push({ ch, missing: true, w: fontSize * 0.85, charIndex: i });
          return;
        }
        const geom = new THREE.ExtrudeGeometry(shapes, {
          depth: o.extrudeDepth,
          bevelEnabled: useBevel,
          bevelSize: safeBevelSize,
          bevelThickness: safeBevelThickness,
          bevelSegments: o.bevelSegments,
          curveSegments: o.curveSegments,
        });
        geom.computeBoundingBox();
        const bb = geom.boundingBox;
        geom.translate(0, 0, -o.extrudeDepth / 2 - safeBevelThickness / 2);
        const w = bb.max.x - bb.min.x;
        const h = bb.max.y - bb.min.y;
        built.push({
          ch, geom, bb, w, h,
          minX: bb.min.x, minY: bb.min.y, charIndex: i,
        });
      });

      // 第二步：按实际 bbox 宽度排版
      const totalWidth = built.reduce((acc, b) => acc + b.w, 0)
        + o.letterSpacing * Math.max(0, built.length - 1);
      let cursor = -totalWidth / 2;

      built.forEach((b, i) => {
        if (b.blank) { cursor += b.w + o.letterSpacing; return; }

        if (b.missing) {
          // 缺字 → 画个占位竹笾：颜色不一样的鲜红边框 + "?"
          const sz = fontSize * 0.7;
          const placeholder = new THREE.Group();
          const frame = new THREE.Mesh(
            new THREE.BoxGeometry(sz, sz, o.extrudeDepth),
            new THREE.MeshStandardMaterial({
              color: 0x2a1015, emissive: 0xff3d63, emissiveIntensity: 0.45,
              metalness: 0.2, roughness: 0.7, transparent: true, opacity: 0.4,
              wireframe: true,
            })
          );
          placeholder.add(frame);
          const q = new THREE.Mesh(
            new THREE.BoxGeometry(sz * 0.5, sz * 0.5, o.extrudeDepth * 0.6),
            new THREE.MeshStandardMaterial({
              color: 0xff5d63, emissive: 0xff3d63, emissiveIntensity: 0.7,
              metalness: 0.3, roughness: 0.4,
            })
          );
          placeholder.add(q);
          placeholder.position.set(cursor + b.w / 2, 0, 0);
          placeholder.userData.charIndex = b.charIndex;
          placeholder.userData.char = b.ch;
          placeholder.userData.basePos = placeholder.position.clone();
          placeholder.userData.missing = true;
          this.textGroup.add(placeholder);
          this.charMeshes.push(placeholder);
          cursor += b.w + o.letterSpacing;
          return;
        }

        const mat = this._makeMaterial(o.perCharMaterial[b.charIndex] || o.material);
        const mesh = new THREE.Mesh(b.geom, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = false;
        const cy = -(b.bb.min.y + b.bb.max.y) / 2;
        mesh.position.set(cursor - b.minX, cy, 0);
        mesh.userData.charIndex = b.charIndex;
        mesh.userData.char = b.ch;
        mesh.userData.basePos = mesh.position.clone();

        this.textGroup.add(mesh);
        this.charMeshes.push(mesh);

        if (o.outline) {
          const outlineMat = new THREE.MeshBasicMaterial({
            color: o.outlineColor, side: THREE.BackSide
          });
          const outlineMesh = new THREE.Mesh(b.geom, outlineMat);
          outlineMesh.position.copy(mesh.position);
          outlineMesh.scale.setScalar(1 + o.outlineWidth / 50);
          this.textGroup.add(outlineMesh);
        }

        cursor += b.w + o.letterSpacing;
      });

      // 报告缺字给 React【供 UI 提示】
      const missing = built.filter(b => b.missing).map(b => b.ch);
      if (this.onMissingGlyphs) this.onMissingGlyphs(missing);

      // 字组整体缩放，以适应视口
      const box = new THREE.Box3().setFromObject(this.textGroup);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 180;
      if (maxDim > 0) {
        const s = targetSize / maxDim;
        this.textGroup.scale.setScalar(s);
      }

      // 入场动画
      if (this.options.bounceIn) {
        this.startTime = performance.now();
        this.charMeshes.forEach((m, i) => {
          m.userData.entryStart = i * (this.options.entranceStagger || 80);
        });
      }
    }

    _makeMaterial(matId) {
      const preset = window.MATERIALS.find(m => m.id === matId) || window.MATERIALS[0];
      const cfg = preset.cfg;
      let mat;
      if (cfg.type === 'physical') {
        mat = new THREE.MeshPhysicalMaterial();
      } else {
        mat = new THREE.MeshStandardMaterial();
      }
      Object.entries(cfg).forEach(([k, v]) => {
        if (k === 'type') return;
        if (k === 'useNoise') return;
        if (k === 'color' || k === 'emissive' || k === 'sheenColor') {
          mat[k] = new THREE.Color(v);
        } else {
          mat[k] = v;
        }
      });
      mat.userData.matId = matId;
      mat.userData.baseEmissiveIntensity = mat.emissiveIntensity || 0;
      return mat;
    }

    applyMaterials() {
      this.charMeshes.forEach((m, i) => {
        const matId = this.options.perCharMaterial[i] || this.options.material;
        const oldMat = m.material;
        const newMat = this._makeMaterial(matId);
        m.material = newMat;
        if (oldMat) {
          if (Array.isArray(oldMat)) oldMat.forEach(mm => mm.dispose());
          else oldMat.dispose();
        }
      });
    }

    // ===== 粒子 =====
    buildParticles() {
      if (this.particleSystem) {
        this.scene.remove(this.particleSystem);
        this.particleSystem.geometry.dispose();
        this.particleSystem.material.dispose();
        this.particleSystem = null;
      }
      const type = this.options.particles;
      if (type === 'none' || !type) return;

      const COUNT = type === 'stars' ? 400 : 220;
      const geom = new THREE.BufferGeometry();
      const pos = new Float32Array(COUNT * 3);
      const vel = new Float32Array(COUNT * 3);
      const phase = new Float32Array(COUNT);
      const sizes = new Float32Array(COUNT);
      for (let i = 0; i < COUNT; i++) {
        const r = 180 + Math.random() * 120;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(phi);
        vel[i*3] = (Math.random() - 0.5) * 0.2;
        vel[i*3+1] = (Math.random() - 0.5) * 0.2;
        vel[i*3+2] = (Math.random() - 0.5) * 0.2;
        phase[i] = Math.random() * Math.PI * 2;
        sizes[i] = 1 + Math.random() * 3;
      }
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geom.setAttribute('velocity', new THREE.BufferAttribute(vel, 3));
      geom.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
      geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

      const colorMap = {
        sparks: 0xffb84d,
        stars:  0xffffff,
        bubbles: 0x7ad6ff,
        leaves: 0x9bce5b,
      };
      const texCanvas = document.createElement('canvas');
      texCanvas.width = texCanvas.height = 64;
      const tctx = texCanvas.getContext('2d');
      const grad = tctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      tctx.fillStyle = grad;
      tctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(texCanvas);

      const mat = new THREE.PointsMaterial({
        color: colorMap[type] || 0xffffff,
        size: 5,
        map: tex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.95,
      });
      const points = new THREE.Points(geom, mat);
      this.scene.add(points);
      this.particleSystem = points;
    }

    // ===== 截图 =====
    capturePNG(transparent = true) {
      // 强制渲染一帧
      const wasBg = this.scene.background;
      if (transparent) this.scene.background = null;
      else this.scene.background = new THREE.Color(0x0c0d12);
      this.renderer.render(this.scene, this.camera);
      const dataUrl = this.renderer.domElement.toDataURL('image/png');
      this.scene.background = wasBg;
      return dataUrl;
    }

    async captureGIF(durationMs = 2000, fps = 20, transparent = true) {
      // 简易帧捕获 (GIF 由外部库处理)
      const frames = Math.round(durationMs * fps / 1000);
      const result = [];
      for (let i = 0; i < frames; i++) {
        // 推进动画
        const t = performance.now() - this.startTime + i * (1000 / fps);
        this._renderFrameAt(t);
        result.push(this.renderer.domElement.toDataURL('image/png'));
        await new Promise(r => setTimeout(r, 1));
      }
      return result;
    }

    _renderFrameAt(t) {
      this._applyAnimations(t);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }

    // ===== 动画 =====
    _applyAnimations(t) {
      const o = this.options;
      const ts = t / 1000;

      // 动画总开关
      if (!o.animMaster) {
        // 冻结到静态姿态
        this.charMeshes.forEach(m => {
          if (m.userData.basePos) {
            m.position.copy(m.userData.basePos);
            m.scale.setScalar(1);
            if (m.material && m.material.transparent !== undefined) {
              m.material.opacity = 1;
            }
          }
        });
        return;
      }

      // 自动旋转
      if (o.rotateAuto) {
        this.textGroup.rotation.y = ts * o.rotateSpeed * 0.6;
      }

      // 视差跟随
      if (o.parallax) {
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;
        if (!o.rotateAuto) {
          this.textGroup.rotation.y = this.mouseX * 0.4;
        }
        this.textGroup.rotation.x = -this.mouseY * 0.25;
      } else {
        this.textGroup.rotation.x *= 0.92;
      }

      // 字符层级动画
      this.charMeshes.forEach((m, i) => {
        const base = m.userData.basePos;
        let y = base.y;
        let x = base.x;
        let z = 0;
        let rx = 0, ry = 0, rz = 0;
        let scale = 1;
        let opacity = 1;

        // 入场动画 — 6 种预设
        if (o.bounceIn) {
          const startMs = m.userData.entryStart || 0;
          const dur = o.entranceDuration || 800;
          const localMs = (t - this.startTime) - startMs;
          if (localMs < dur) {
            const p = Math.max(0, localMs) / dur;
            const ease = 1 - Math.pow(1 - p, 3);  // ease-out cubic
            const easeBack = 1 - Math.pow(1 - p, 2) * (1 - p * 0.5);
            opacity = ease;
            switch (o.entranceType) {
              case 'bounce': {
                // 上方掉落 + 底部挤压回弹
                const drop = (1 - ease) * 80;
                y += drop;
                const squish = Math.sin(p * Math.PI) * 0.15;
                scale = 0.6 + 0.4 * ease + squish;
                break;
              }
              case 'slide': {
                // 从左倒后滑入
                x -= (1 - ease) * 200;
                opacity = Math.min(1, p * 2);
                break;
              }
              case 'fly': {
                // 从远处飞来 (Z+)
                z = (1 - ease) * 300;
                scale = 0.3 + 0.7 * ease;
                break;
              }
              case 'spin': {
                // 绕 Y 轴旋转出现
                ry = (1 - ease) * Math.PI * 2;
                scale = 0.4 + 0.6 * ease;
                break;
              }
              case 'rise': {
                // 从下浮起 + 缩放
                y -= (1 - ease) * 100;
                scale = 0.5 + 0.5 * ease;
                break;
              }
              case 'flip': {
                // 绕 X 轴翻转
                rx = (1 - ease) * Math.PI;
                y += (1 - ease) * 40;
                scale = 0.6 + 0.4 * ease;
                break;
              }
              default: {
                // 纯淕入
                scale = 0.7 + 0.3 * ease;
              }
            }
          } else {
            // 动画结束后重置
            if (m.scale.x !== 1) m.scale.setScalar(1);
            if (m.material && m.material.opacity !== 1) {
              m.material.opacity = 1;
              m.material.transparent = !!m.material.userData?.wasTransparent;
            }
            // 清除旋转
            if (m.rotation.x || m.rotation.y) {
              m.rotation.set(0, 0, 0);
            }
          }
        }

        // 呼吸
        if (o.breathe) {
          y += Math.sin(ts * 1.5 * (o.breatheSpeed || 1) + i * 0.6) * 3 * (o.breatheAmp || 1);
        }
        m.position.x = x;
        m.position.y = y;
        m.position.z = z;
        if (rx || ry || rz) m.rotation.set(rx, ry, rz);
        if (scale !== 1) m.scale.setScalar(scale);
        if (m.material && opacity < 1) {
          m.material.transparent = true;
          m.material.opacity = opacity;
        }

        // 流光
        if (o.shine && m.material && m.material.emissiveIntensity !== undefined) {
          const baseE = m.material.userData?.baseEmissiveIntensity || 0;
          const wave = (Math.sin(ts * 2 * (o.shineSpeed || 1) + i * 0.7) + 1) / 2;
          m.material.emissiveIntensity = baseE + wave * 0.25;
        }

        // 故障抖动
        if (o.glitch) {
          if (Math.random() < 0.05) {
            m.position.x = m.userData.basePos.x + (Math.random() - 0.5) * 4;
          }
        }
      });

      // 粒子
      if (this.particleSystem) {
        const pos = this.particleSystem.geometry.attributes.position.array;
        const vel = this.particleSystem.geometry.attributes.velocity.array;
        const phase = this.particleSystem.geometry.attributes.phase.array;
        const ps = o.particleSpeed || 1;
        for (let i = 0; i < pos.length / 3; i++) {
          const dx = -pos[i*3] * 0.0006;
          const dy = -pos[i*3+1] * 0.0006;
          const dz = -pos[i*3+2] * 0.0006;
          pos[i*3] += (vel[i*3] + dx) * ps + Math.sin(ts + phase[i]) * 0.15 * ps;
          pos[i*3+1] += (vel[i*3+1] + dy) * ps + Math.cos(ts * 1.3 + phase[i]) * 0.15 * ps;
          pos[i*3+2] += (vel[i*3+2] + dz) * ps + Math.sin(ts * 0.7 + phase[i]) * 0.1 * ps;
        }
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.rotation.y = ts * 0.05 * ps;
      }
    }

    _tick() {
      this._raf = requestAnimationFrame(this._tick);
      const t = performance.now();
      this._applyAnimations(t);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }

    // 重播入场动画
    replayEntrance() {
      this.startTime = performance.now();
      this.charMeshes.forEach((m, i) => {
        m.userData.entryStart = i * (this.options.entranceStagger || 80);
      });
    }

    // 镜头焦距 → FOV【输入 mm 当量, 转为 FOV】
    setFocalLength(mm) {
      // 35mm 胶片对角线 43.3mm
      const fov = 2 * Math.atan(43.3 / (2 * mm)) * 180 / Math.PI;
      this.camera.fov = Math.max(8, Math.min(120, fov));
      this.camera.updateProjectionMatrix();
    }

    setBackground(mode, color) {
      this.options.background = mode;
      this.options.backgroundColor = color;
      if (mode === 'transparent' || mode === null) {
        this.scene.background = null;
        this.renderer.setClearColor(0x000000, 0);
      } else if (mode === 'solid') {
        const c = new THREE.Color(color || '#0c0d12');
        this.scene.background = c;
        this.renderer.setClearColor(c, 1);
      } else if (mode === 'gradient') {
        // 用 canvas 生成渐变贴图
        const c1 = color?.from || '#1e2230';
        const c2 = color?.to || '#06070a';
        const canvas = document.createElement('canvas');
        canvas.width = 16; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 512);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        this.scene.background = tex;
      }
    }

    setFOV(deg) {
      this.camera.fov = deg;
      this.camera.updateProjectionMatrix();
    }

    resetCamera() {
      this.camera.position.set(0, 0, 320);
      this.controls.target.set(0, 0, 0);
      this.textGroup.rotation.set(0, 0, 0);
      this.controls.update();
    }

    snapView(view) {
      // view: 'front' | 'side' | 'top' | 'persp'
      this.textGroup.rotation.set(0, 0, 0);
      switch (view) {
        case 'front': this.camera.position.set(0, 0, 320); break;
        case 'side': this.camera.position.set(320, 0, 0); break;
        case 'top': this.camera.position.set(0, 320, 0.1); break;
        case 'persp': this.camera.position.set(180, 120, 240); break;
      }
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }

    dispose() {
      cancelAnimationFrame(this._raf);
      window.removeEventListener('resize', this._onResize);
      if (this._resizeObserver) this._resizeObserver.disconnect();
      this.renderer.dispose();
      this.controls.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }

  return { TextScene, pathToShapes };
})();
