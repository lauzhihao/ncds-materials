/* 预设中文字体（fontsource CDN）
   每个有不同风格，覆盖一线设计场景：黑体、宋体、圆润粗体、手写、行楷
*/
window.PRESET_FONTS = [
  {
    id: 'noto-sc-regular',
    name: '思源黑体',
    desc: '现代 / 完整',
    sample: '中',
    urls: [
      'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-500-normal.woff',
      'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff',
    ],
  },
  {
    id: 'noto-sc-black',
    name: '思源黑体 Black',
    desc: '厚重 / 标题',
    sample: '黑',
    urls: [
      'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-900-normal.woff',
      'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff',
    ],
  },
  {
    id: 'noto-serif',
    name: '思源宋体',
    desc: '经典 / 雅致',
    sample: '宋',
    urls: [
      'https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-700-normal.woff',
      'https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-400-normal.woff',
    ],
  },
  {
    id: 'zcool-qkhy',
    name: 'ZCOOL 青柯黄油',
    desc: '圆润 / 活泼',
    sample: '糖',
    urls: [
      'https://cdn.jsdelivr.net/npm/@fontsource/zcool-qingke-huangyou/files/zcool-qingke-huangyou-chinese-simplified-400-normal.woff',
    ],
  },
  {
    id: 'ma-shan-zheng',
    name: '马善政书法',
    desc: '毛笔 / 手写',
    sample: '墨',
    urls: [
      'https://cdn.jsdelivr.net/npm/@fontsource/ma-shan-zheng/files/ma-shan-zheng-chinese-simplified-400-normal.woff',
    ],
  },
];

/* 16 个材质预设
   每个 preset 给 React 端用 (swatch CSS) + Three.js 端用 (material config)
*/

window.MATERIALS = [
  {
    id: 'gold', name: '黄金', swatchCss: 'linear-gradient(135deg, #ffe17a, #b8860b 60%, #5c3d00)',
    cfg: { type: 'physical', color: 0xffd66b, metalness: 1.0, roughness: 0.18, clearcoat: 0.3, envMapIntensity: 1.4 }
  },
  {
    id: 'chrome', name: '铬钢', swatchCss: 'linear-gradient(160deg, #e9eef5 0%, #6b7280 50%, #c4c8d0 100%)',
    cfg: { type: 'physical', color: 0xeef2f7, metalness: 1.0, roughness: 0.05, envMapIntensity: 1.6 }
  },
  {
    id: 'copper', name: '紫铜', swatchCss: 'linear-gradient(135deg, #ffb088, #b25531 60%, #4a1f10)',
    cfg: { type: 'physical', color: 0xd97a4d, metalness: 1.0, roughness: 0.32, envMapIntensity: 1.3 }
  },
  {
    id: 'iridescent', name: '幻彩', swatchCss: 'linear-gradient(135deg, #ff6db5 0%, #b78bff 35%, #7ad6ff 70%, #ffe17a 100%)',
    cfg: { type: 'physical', color: 0xc2c8d0, metalness: 0.7, roughness: 0.15, iridescence: 1.0, iridescenceIOR: 1.8, envMapIntensity: 1.2 }
  },
  {
    id: 'glass', name: '玻璃', swatchCss: 'linear-gradient(135deg, rgba(180,220,255,.9), rgba(120,160,210,.4))',
    cfg: { type: 'physical', color: 0xeaf4ff, metalness: 0, roughness: 0.05, transmission: 0.95, ior: 1.5, thickness: 0.6, transparent: true, opacity: 0.95, envMapIntensity: 1.0 }
  },
  {
    id: 'ice', name: '寒冰', swatchCss: 'linear-gradient(135deg, #ddf4ff, #74b9ff 70%, #2c4d80)',
    cfg: { type: 'physical', color: 0xb8e6ff, metalness: 0, roughness: 0.12, transmission: 0.7, ior: 1.31, thickness: 0.4, transparent: true, opacity: 0.92, clearcoat: 0.8 }
  },
  {
    id: 'crystal', name: '水晶', swatchCss: 'linear-gradient(135deg, #f3e8ff, #b78bff 60%, #5b21b6)',
    cfg: { type: 'physical', color: 0xdac9ff, metalness: 0, roughness: 0.03, transmission: 0.85, ior: 1.7, thickness: 0.8, transparent: true, opacity: 0.93, clearcoat: 1.0 }
  },
  {
    id: 'aqua', name: '湖水', swatchCss: 'linear-gradient(135deg, #c4f1ff, #2dd4bf 60%, #0e7490)',
    cfg: { type: 'physical', color: 0x6ce0d6, metalness: 0.2, roughness: 0.18, transmission: 0.55, ior: 1.4, transparent: true, opacity: 0.94, clearcoat: 0.7 }
  },
  {
    id: 'marble', name: '大理石', swatchCss: 'linear-gradient(135deg, #fbf7f0 0%, #e8dfd0 50%, #b8a888 100%)',
    cfg: { type: 'physical', color: 0xf5efe2, metalness: 0.05, roughness: 0.55, clearcoat: 0.4, useNoise: 'marble' }
  },
  {
    id: 'obsidian', name: '黑曜石', swatchCss: 'linear-gradient(135deg, #2a2a35, #06060a 70%)',
    cfg: { type: 'physical', color: 0x0a0c14, metalness: 0.3, roughness: 0.18, clearcoat: 0.9 }
  },
  {
    id: 'jade', name: '碧玉', swatchCss: 'linear-gradient(135deg, #b8e6c8, #2f8255 70%, #0d3b22)',
    cfg: { type: 'physical', color: 0x5da37a, metalness: 0.1, roughness: 0.25, transmission: 0.45, ior: 1.55, thickness: 0.5, transparent: true, opacity: 0.95, clearcoat: 0.6 }
  },
  {
    id: 'amethyst', name: '紫晶', swatchCss: 'linear-gradient(135deg, #e9d5ff, #7c3aed 65%, #2e1065)',
    cfg: { type: 'physical', color: 0x9d6bd9, metalness: 0.2, roughness: 0.1, transmission: 0.6, ior: 1.55, transparent: true, opacity: 0.92, clearcoat: 0.9 }
  },
  {
    id: 'holographic', name: '全息', swatchCss: 'linear-gradient(135deg, #00f5d4 0%, #ff006e 30%, #fb5607 60%, #ffbe0b 80%, #8338ec 100%)',
    cfg: { type: 'physical', color: 0xffffff, metalness: 0.9, roughness: 0.05, iridescence: 1.0, iridescenceIOR: 2.3, envMapIntensity: 1.5 }
  },
  {
    id: 'neon-pink', name: '霓虹粉', swatchCss: 'radial-gradient(circle at 35% 30%, #ffadd6, #ff2e9c 60%, #b00d6e)',
    cfg: { type: 'standard', color: 0xff3d8a, metalness: 0.1, roughness: 0.4, emissive: 0xff3d8a, emissiveIntensity: 0.85 }
  },
  {
    id: 'neon-yellow', name: '霓虹黄', swatchCss: 'radial-gradient(circle at 35% 30%, #fff7b0, #ffe14d 50%, #c69100)',
    cfg: { type: 'standard', color: 0xffe14d, metalness: 0, roughness: 0.5, emissive: 0xffe14d, emissiveIntensity: 0.8 }
  },
  {
    id: 'lava', name: '熔岩', swatchCss: 'radial-gradient(circle at 35% 35%, #fff3a0, #ff5d2e 45%, #4d0a00 80%)',
    cfg: { type: 'standard', color: 0xff5b2e, metalness: 0.2, roughness: 0.6, emissive: 0xff3500, emissiveIntensity: 0.55 }
  },
  {
    id: 'molten', name: '岩浆', swatchCss: 'linear-gradient(135deg, #ffd166 0%, #ef476f 50%, #1a0b1f 100%)',
    cfg: { type: 'standard', color: 0xff8c42, metalness: 0.6, roughness: 0.3, emissive: 0xff4d00, emissiveIntensity: 0.35 }
  },
  {
    id: 'jelly-red', name: '红果冻', swatchCss: 'radial-gradient(circle at 35% 30%, #ffb6c1, #ef476f 60%, #6e0029)',
    cfg: { type: 'physical', color: 0xff3858, metalness: 0, roughness: 0.15, transmission: 0.5, ior: 1.4, thickness: 0.6, transparent: true, opacity: 0.95, clearcoat: 1.0, sheen: 0.6, sheenColor: 0xff8a9a }
  },
  {
    id: 'jelly-green', name: '青果冻', swatchCss: 'radial-gradient(circle at 35% 30%, #c8f5d2, #2ecc71 60%, #044d2b)',
    cfg: { type: 'physical', color: 0x44dd66, metalness: 0, roughness: 0.15, transmission: 0.5, ior: 1.4, thickness: 0.6, transparent: true, opacity: 0.95, clearcoat: 1.0 }
  },
  {
    id: 'velvet', name: '丝绒', swatchCss: 'radial-gradient(circle at 35% 30%, #5b3b8a, #2c1556 70%, #0a041f)',
    cfg: { type: 'physical', color: 0x3a1f7a, metalness: 0, roughness: 0.95, sheen: 1.0, sheenColor: 0xa78bfa, sheenRoughness: 0.4 }
  },
  {
    id: 'pearl', name: '珍珠', swatchCss: 'radial-gradient(circle at 35% 30%, #ffffff, #fff0f5 40%, #d3c4d8 80%)',
    cfg: { type: 'physical', color: 0xfff8f0, metalness: 0.1, roughness: 0.2, clearcoat: 1.0, iridescence: 0.6, iridescenceIOR: 1.4, sheen: 0.5, sheenColor: 0xffe4f0 }
  },
  {
    id: 'matte-green', name: '亚绿', swatchCss: 'linear-gradient(135deg, #5a8a3b, #2f5a1e)',
    cfg: { type: 'standard', color: 0x6ea84b, metalness: 0, roughness: 0.85 }
  },
  {
    id: 'matcha', name: '抹茶', swatchCss: 'linear-gradient(135deg, #b8d68c, #6b8e3a 70%, #2c3e16)',
    cfg: { type: 'physical', color: 0x9bba5d, metalness: 0.05, roughness: 0.6, clearcoat: 0.3 }
  },
  {
    id: 'matte-tan', name: '陶土', swatchCss: 'linear-gradient(135deg, #e0b58a, #8a5b35 70%, #3a230e)',
    cfg: { type: 'standard', color: 0xc99069, metalness: 0, roughness: 0.92 }
  },
  {
    id: 'sandstone', name: '砂岩', swatchCss: 'linear-gradient(135deg, #f0d4a3, #b8865a 60%, #5c3e22)',
    cfg: { type: 'physical', color: 0xd9b07e, metalness: 0.05, roughness: 0.78 }
  },
  {
    id: 'rough-copper', name: '锈铜', swatchCss: 'linear-gradient(135deg, #6fb3a8, #2e6f5d 50%, #8b3a1e 100%)',
    cfg: { type: 'physical', color: 0x5d9b8d, metalness: 0.8, roughness: 0.7 }
  },
  {
    id: 'glitch', name: '故障', swatchCss: 'linear-gradient(90deg, #ff00ff 0%, #00ffff 50%, #ff00ff 100%)',
    cfg: { type: 'standard', color: 0xff00ff, metalness: 0.4, roughness: 0.4, emissive: 0x00ffff, emissiveIntensity: 0.4 }
  },
];

// 默认选中的 16 个
window.MATERIALS_16 = [
  'gold', 'chrome', 'iridescent', 'glass',
  'ice', 'marble', 'obsidian', 'jade',
  'holographic', 'neon-pink', 'lava', 'jelly-red',
  'velvet', 'pearl', 'amethyst', 'glitch'
].map(id => window.MATERIALS.find(m => m.id === id));
