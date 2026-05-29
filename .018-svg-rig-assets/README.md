# 018 · SVG 骨骼小人动画系统（MVP）

把上游对话里的结论落成可运行系统：**与其「生成一张会动的图」，不如建一个可组合的 SVG 动画角色系统** —— 固定骨骼规范 + 角色素材库 + 动作模板库 + Agent 输出结构化 JSON + 渲染器组装。

让 SVG「真正动起来」的唯一前提：**它必须以内联 DOM 存在、内部部件有可识别的分组**，而不是当一张 `<img>` 用。

## 文件职责

| 文件 | 职责 |
|---|---|
| `rig-spec.js` | **唯一真源**：画布 `300×380` + 每根骨头的关节锚点坐标（绝对用户单位）。其余文件全部以此为准。 |
| `characters.js` | 角色库。每个角色 = 内联 SVG，可动部件包在 `<g class="bone NAME">`，全部画在同一套骨骼上。 |
| `motions.js` | 动作模板库。每个动作 = 一组 WAAPI 轨道 `{bone, keyframes, options}`。 |
| `sequences.js` | 套路 / 连贯动作库。每个套路 = 一串有名字的招式（pose 序列），如八极拳八大招。 |
| `scenes.js` | 示例场景配置 = Agent 应输出的 JSON。 |
| `rig.js` | `RigSystem` 引擎：build / mount / play / **renderScene(jsonConfig)**。可复用核心。 |
| `app.js` | Playground 页面控制器（演示壳，非核心）。 |
| `boot.js` | 注入 `/fonts/` 字体并启动。 |
| `styles.css` | 页面外观 + `.rig` / `.rig-scene` 可复用样式（含双主题）。 |

## Agent 集成契约

Agent **不创作 SVG、不写动画**，只输出选择：

```js
RigSystem.renderScene({
  character: 'cheer',                       // characters.js 里的 id
  motion: ['raise-arms', 'idle-breathe'],   // motions.js 里的 id，可叠加
  intensity: 1,                             // 幅度，等比缩放 rotate/translate（scale 不缩放）
  speed: 1,                                 // playbackRate
  title: '人从什么时候开始不再一味迁就',
  tag: '知识分享',
  subtitleZh: '但其实那些你开始不愿迁就的瞬间',
  subtitleEn: 'But actually, those moments...',
  theme: 'paper',                           // 'paper' | 'dark'
}, mountEl);
```

返回 `{ el, handle, controller }`；`controller.pause()/play()/setSpeed()/cancel()`。

## 固定骨骼规范

核心 7 根（所有动作都基于它们，保证任意角色 × 任意动作可组合）：
`root`（整体）`head`（绕脖子）`torso`（绕胯）`arm-l` `arm-r`（绕肩）`leg-l` `leg-r`（绕胯）。
可选：`prop`（手持物）`bubble`（想法气泡）—— 动作命中不到时**静默跳过**。

旋转中心用 `transform-box: view-box` + 绝对用户单位 `transform-origin`，rotate 永远绕真实关节转，不受肢体绘制方向影响 —— 比 `fill-box + 百分比` 稳。

**二段肢体（肘 / 膝关节）**：需要关节细节的角色（如「武者」）用嵌套骨头：前臂 `arm-l-lower` 嵌在上臂 `arm-l-upper` 里，小腿 `leg-l-lower` 嵌在大腿 `leg-l-upper` 里。SVG 子元素共享父坐标系 + 各骨头按 view-box 绝对锚点旋转 → 正向运动学（FK）：上段转动带着下段走，下段再绕肘/膝单独转，关节始终连接。二段骨头标 `segmented:true`；单段角色仍用 `arm-l`/`leg-l`，互不影响。

## 套路 / 连贯动作

`motions.js` 是单一循环叠加层；`sequences.js` 是「连贯动作」——一串有名字的招式按时序衔接：

```js
RigSystem.playSequence(handle, 'baji8', { speed: 1, loop: true });
// 返回 controller：.currentMove() 报当前第几招（用于实时显示招式名），
// .pause()/.play()/.setSpeed()/.cancel()。
```

引擎把每根骨头在各招的目标 `pose` 串成一条带 offset 的 keyframe 轨道，整体播放并在结尾收势归预备。套路只用到二段肢体骨头，需配合「武者」这类二段角色。内置 `baji8` = 八极拳八大招。

## 扩展

- **加角色**：在 `characters.js` 加一条，`svg` 里的 `<g class="bone …">` 只用规范里的骨头名，几何画在对应关节附近即可。所有现有动作立即可用。
- **加动作**：在 `motions.js` 加一条，`tracks[].bone` 只引用规范骨头名，`keyframes` 用 `transform` 字符串。所有现有角色立即可用。
- **加关节（如肘/膝二段肢体）**：在 `rig-spec.js` 的 `BONES` 注册新名 + 锚点（建议 `optional: true`），再在需要的角色/动作里引用。角色 SVG 里把下段骨头 `<g>` 嵌进上段骨头 `<g>` 即可获得 FK。
- **加套路**：在 `sequences.js` 加一条 `{id, name, moves:[{name, desc, duration, easing, pose:{bone:'transform'}}]}`，pose 写相对预备式的偏移，未写到的骨头自动保持上一招姿态。

## 本地预览

```bash
# 必须用 HTTP（页面用 /fonts/ 绝对路径，file:// 解析不到）
python3 -m http.server 8018   # 仓库根目录
# 打开 http://127.0.0.1:8018/018-svg-rig.html
```
