# 仓库共享字体目录

所有素材共用一份字体。新素材**不要**在 `.<slug>-assets/fonts/` 里再放一份，直接引用根目录的 `/fonts/...`。

## 现存字体

| 路径 | family 名 | 来源 | 字符数 | 大小 |
|---|---|---|---|---|
| `/fonts/xy-kaiti/Regular.woff2` | `XY Kaiti` | ziti666.cn 行韵楷体 (id 30)，TTF → fontTools woff2 | 9796 | 3.8 MB |
| `/fonts/zs-fangsong/Regular.woff2` | `ZS Fangsong` | ziti666.cn 智枢仿宋 (id 26)，TTF → fontTools woff2 | 10506 | 7.1 MB |

完整字符 woff2，未 subset，跨素材复用。30 天 immutable 缓存，浏览器第一次加载之后基本不再请求。

## 在 episode.json 里引用

`src` 必须用**绝对路径** `/fonts/...`（开头带 `/`），bootstrap.js 会照原样写进 `@font-face src`：

```json
"fonts": [
  { "family": "XY Kaiti",    "src": "/fonts/xy-kaiti/Regular.woff2",    "weight": 400, "format": "woff2", "display": "swap" },
  { "family": "ZS Fangsong", "src": "/fonts/zs-fangsong/Regular.woff2", "weight": 400, "format": "woff2", "display": "swap" }
]
```

声明后在 `scenes[id].style.numFont` / `subtitleFont` / `overlays[*].style.font` 里用 family 名引用。

## 加新字体

1. 从 ziti666.cn 拉完整 ttf：`curl -sL https://www.ziti666.cn/api/download-all/<id> -o /tmp/x.zip && unzip -o /tmp/x.zip -d /tmp/x/`（zip 里那个超小的 woff/woff2 只有 30 来个预览字符，**别用**，用 ttf）
2. ttf → woff2（不 subset）：
   ```bash
   uvx --with brotli --from fonttools python3 -c "from fontTools.ttLib import TTFont; f=TTFont('/tmp/x/SRC.ttf'); f.flavor='woff2'; f.save('fonts/<family>/Regular.woff2')"
   ```
3. 在新素材的 episode.json `fonts[]` 加一条 `{"family":"…","src":"/fonts/<family>/Regular.woff2", ...}`

## 为什么不放在 `.fonts/`

ncds.cc nginx vhost 的 `location ~ /\.(?!well-known/|\d) { deny all; }` 只放行 `.well-known/` 和 `.数字开头/`，`.fonts/` 会被 403。改 nginx 不如直接用不带 dot 的 `fonts/`——会在 / autoindex 里露出一项，可接受。
