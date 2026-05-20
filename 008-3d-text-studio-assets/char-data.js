/* 常用汉字数据 — 拼音、部首、笔画估算、语义推荐
   不是完整字典，但覆盖常见演示字。用户输入未知字时降级处理。 */

window.CharData = (function() {
  // 单字数据 [pinyin, 部首, 笔画, 语义类别]
  // 语义类别用于推荐字效: fire/water/metal/wood/earth/light/dark/celestial/joyful/serious
  const DATA = {
    '能': ['néng', '月', 10, 'serious'],
    '成': ['chéng', '戈', 6, 'serious'],
    '大': ['dà', '大', 3, 'serious'],
    '事': ['shì', '亅', 8, 'serious'],
    '福': ['fú', '礻', 13, 'joyful'],
    '禄': ['lù', '礻', 12, 'joyful'],
    '寿': ['shòu', '寸', 7, 'joyful'],
    '喜': ['xǐ', '口', 12, 'joyful'],
    '新': ['xīn', '斤', 13, 'joyful'],
    '年': ['nián', '干', 6, 'joyful'],
    '春': ['chūn', '日', 9, 'wood'],
    '夏': ['xià', '夂', 10, 'fire'],
    '秋': ['qiū', '禾', 9, 'wood'],
    '冬': ['dōng', '冫', 5, 'water'],
    '快': ['kuài', '忄', 7, 'joyful'],
    '乐': ['lè', '丿', 5, 'joyful'],
    '火': ['huǒ', '火', 4, 'fire'],
    '焰': ['yàn', '火', 12, 'fire'],
    '炎': ['yán', '火', 8, 'fire'],
    '热': ['rè', '灬', 10, 'fire'],
    '日': ['rì', '日', 4, 'light'],
    '阳': ['yáng', '阝', 6, 'light'],
    '光': ['guāng', '儿', 6, 'light'],
    '明': ['míng', '日', 8, 'light'],
    '月': ['yuè', '月', 4, 'celestial'],
    '星': ['xīng', '日', 9, 'celestial'],
    '天': ['tiān', '大', 4, 'celestial'],
    '云': ['yún', '二', 4, 'celestial'],
    '水': ['shuǐ', '水', 4, 'water'],
    '冰': ['bīng', '冫', 6, 'water'],
    '海': ['hǎi', '氵', 10, 'water'],
    '雨': ['yǔ', '雨', 8, 'water'],
    '雪': ['xuě', '雨', 11, 'water'],
    '金': ['jīn', '金', 8, 'metal'],
    '银': ['yín', '钅', 11, 'metal'],
    '铁': ['tiě', '钅', 10, 'metal'],
    '木': ['mù', '木', 4, 'wood'],
    '林': ['lín', '木', 8, 'wood'],
    '花': ['huā', '艹', 7, 'wood'],
    '草': ['cǎo', '艹', 9, 'wood'],
    '叶': ['yè', '口', 5, 'wood'],
    '土': ['tǔ', '土', 3, 'earth'],
    '山': ['shān', '山', 3, 'earth'],
    '石': ['shí', '石', 5, 'earth'],
    '中': ['zhōng', '丨', 4, 'serious'],
    '国': ['guó', '囗', 8, 'serious'],
    '龙': ['lóng', '龙', 5, 'celestial'],
    '凤': ['fèng', '几', 4, 'celestial'],
    '虎': ['hǔ', '虍', 8, 'fire'],
    '鼠': ['shǔ', '鼠', 13, 'earth'],
    '牛': ['niú', '牛', 4, 'earth'],
    '兔': ['tù', '丶', 8, 'wood'],
    '蛇': ['shé', '虫', 11, 'water'],
    '马': ['mǎ', '马', 3, 'fire'],
    '羊': ['yáng', '羊', 6, 'wood'],
    '猴': ['hóu', '犭', 12, 'wood'],
    '鸡': ['jī', '鸟', 7, 'fire'],
    '狗': ['gǒu', '犭', 8, 'earth'],
    '猪': ['zhū', '犭', 11, 'water'],
    '心': ['xīn', '心', 4, 'joyful'],
    '爱': ['ài', '爪', 10, 'joyful'],
    '财': ['cái', '贝', 7, 'metal'],
    '富': ['fù', '宀', 12, 'metal'],
    '贵': ['guì', '贝', 9, 'metal'],
    '兴': ['xīng', '八', 6, 'joyful'],
    '旺': ['wàng', '日', 8, 'fire'],
    '吉': ['jí', '口', 6, 'joyful'],
    '祥': ['xiáng', '礻', 10, 'joyful'],
    '安': ['ān', '宀', 6, 'serious'],
    '康': ['kāng', '广', 11, 'joyful'],
    '健': ['jiàn', '亻', 10, 'serious'],
    '运': ['yùn', '辶', 7, 'celestial'],
    '风': ['fēng', '风', 4, 'celestial'],
    '电': ['diàn', '电', 5, 'fire'],
    '雷': ['léi', '雨', 13, 'fire'],
    '梦': ['mèng', '夕', 11, 'celestial'],
    '夜': ['yè', '夂', 8, 'dark'],
    '影': ['yǐng', '彡', 15, 'dark'],
    '黑': ['hēi', '黑', 12, 'dark'],
    '白': ['bái', '白', 5, 'light'],
    '红': ['hóng', '纟', 6, 'fire'],
    '绿': ['lǜ', '纟', 11, 'wood'],
    '蓝': ['lán', '艹', 13, 'water'],
    '紫': ['zǐ', '糸', 12, 'dark'],
    '黄': ['huáng', '黄', 11, 'earth'],
    '王': ['wáng', '王', 4, 'metal'],
    '帝': ['dì', '巾', 9, 'metal'],
    '神': ['shén', '礻', 9, 'celestial'],
    '仙': ['xiān', '亻', 5, 'celestial'],
    '道': ['dào', '辶', 12, 'serious'],
    '法': ['fǎ', '氵', 8, 'water'],
    '酷': ['kù', '酉', 14, 'dark'],
    '潮': ['cháo', '氵', 15, 'water'],
    '燃': ['rán', '火', 16, 'fire'],
    '炸': ['zhà', '火', 9, 'fire'],
    '萌': ['méng', '艹', 11, 'wood'],
  };

  const CATEGORY_NAMES = {
    fire: '火属·热烈',
    water: '水属·清冽',
    metal: '金属·璀璨',
    wood: '木属·生机',
    earth: '土属·厚重',
    light: '光属·明亮',
    dark: '暗属·神秘',
    celestial: '天属·缥缈',
    joyful: '喜庆·欢愉',
    serious: '正·端庄',
  };

  // 类别 → 推荐材质 id
  const CATEGORY_TO_MATERIAL = {
    fire: ['neon-pink', 'lava', 'molten', 'jelly-red'],
    water: ['glass', 'ice', 'aqua', 'crystal'],
    metal: ['gold', 'chrome', 'copper', 'iridescent'],
    wood: ['jade', 'matcha', 'matte-green', 'jelly-green'],
    earth: ['marble', 'sandstone', 'matte-tan', 'rough-copper'],
    light: ['holographic', 'iridescent', 'neon-yellow', 'pearl'],
    dark: ['obsidian', 'velvet', 'glitch', 'amethyst'],
    celestial: ['holographic', 'iridescent', 'aqua', 'pearl'],
    joyful: ['neon-pink', 'jelly-red', 'gold', 'iridescent'],
    serious: ['marble', 'obsidian', 'chrome', 'gold'],
  };

  // 类别 → 推荐字效组合
  const CATEGORY_TO_EFFECTS = {
    fire: { glow: true, glowColor: '#ff4d2d', particles: 'sparks' },
    water: { glow: false, particles: 'bubbles' },
    metal: { glow: false, particles: 'sparks' },
    wood: { glow: false, particles: 'leaves' },
    earth: { glow: false, particles: 'none' },
    light: { glow: true, glowColor: '#fff3a8', particles: 'sparks' },
    dark: { glow: true, glowColor: '#b78bff', particles: 'none' },
    celestial: { glow: true, glowColor: '#7ad6ff', particles: 'stars' },
    joyful: { glow: true, glowColor: '#ff6db5', particles: 'stars' },
    serious: { glow: false, particles: 'none' },
  };

  function lookup(ch) {
    const d = DATA[ch];
    if (d) {
      return {
        char: ch,
        pinyin: d[0],
        radical: d[1],
        strokes: d[2],
        category: d[3],
        categoryName: CATEGORY_NAMES[d[3]],
        known: true,
      };
    }
    return {
      char: ch,
      pinyin: '—',
      radical: '?',
      strokes: estimateStrokes(ch),
      category: 'serious',
      categoryName: '未知字符',
      known: false,
    };
  }

  function estimateStrokes(ch) {
    // very rough: complexity ~ unicode codepoint hash
    const code = ch.charCodeAt(0);
    if (code < 128) return 1;
    return 5 + (code % 18);
  }

  // 综合分析整串文本 → 主导类别
  function analyzeString(s) {
    const chars = [...s].filter(c => c.trim());
    const cats = {};
    chars.forEach(c => {
      const d = lookup(c);
      cats[d.category] = (cats[d.category] || 0) + (d.known ? 2 : 0.5);
    });
    let best = 'serious', bestScore = -1;
    Object.entries(cats).forEach(([k, v]) => {
      if (v > bestScore) { best = k; bestScore = v; }
    });
    return {
      chars: chars.map(lookup),
      dominantCategory: best,
      dominantName: CATEGORY_NAMES[best],
      suggestedMaterials: CATEGORY_TO_MATERIAL[best] || [],
      suggestedEffects: CATEGORY_TO_EFFECTS[best] || {},
    };
  }

  return { lookup, analyzeString, CATEGORY_NAMES };
})();
