/*
 * 字幕节拍 + 中央图分镜数据
 *
 * BEATS：每条对应一行字幕 / 一段 TTS 朗读
 *   zh      中文字幕（朗读内容）
 *   en      英文字幕
 *   scene   引用 SCENES 中的图 id（连续相同 id 表示同一张图持续）
 *   chapter 可选：1-5，章节封面卡（特殊版式）
 *
 * SCENES：每张中央图
 *   prompt  给文生图工具的提示词（中文）
 *   label   可选，叠在图上的大标题（保留扩展）
 */

window.BEATS = [
  // ── 开场钩子 ──
  { zh: "真正危险的，不是不想上班", en: "The real danger isn't not wanting to work", scene: "hook" },
  { zh: "而是把一份工作误当成一辈子的安全感", en: "It's mistaking one job for lifelong security", scene: "hook" },

  // ── 一、先把"不上班"说清楚 ──
  { zh: "一、先把「不上班」说清楚", en: "1. Let's define 'not working' first", scene: "ch1", chapter: 1 },

  { zh: "一提到不上班", en: "When people hear 'not working'", scene: "lying-flat" },
  { zh: "很多人脑子里会自动跳出一个画面", en: "a picture pops into their head", scene: "lying-flat" },
  { zh: "人瘫在床上刷短视频", en: "sprawled in bed scrolling short videos", scene: "lying-flat" },
  { zh: "外卖盒子堆成山", en: "takeout boxes piling up", scene: "lying-flat" },
  { zh: "存款一天天变薄", en: "savings shrinking by the day", scene: "lying-flat" },
  { zh: "最后又狼狈地回去投简历", en: "eventually crawling back to send résumés", scene: "lying-flat" },

  { zh: "这种想象有它的现实来源", en: "That image has real roots", scene: "old-path" },
  { zh: "过去我们熟悉的生存路线很固定", en: "The old life route was rigid", scene: "old-path" },
  { zh: "上学、考大学、找工作", en: "School, college, job", scene: "old-path" },
  { zh: "升职加薪、退休养老", en: "Promotion, raise, retirement", scene: "old-path" },
  { zh: "只要按流程走", en: "Follow the steps", scene: "old-path" },
  { zh: "日子大概率不会太差", en: "and life would probably turn out fine", scene: "old-path" },

  { zh: "但今天的外部环境已经变了", en: "But today's environment has changed", scene: "world-shift" },
  { zh: "讨论不上班，不是在鼓励谁躺下", en: "This isn't a call to lie flat", scene: "world-shift" },
  { zh: "也不是劝人立刻辞职", en: "or to quit your job tomorrow", scene: "world-shift" },
  { zh: "而是重新理解一件事", en: "It's a redefinition", scene: "world-shift" },
  { zh: "不上班不等于摆烂", en: "Not working ≠ giving up", scene: "world-shift" },
  { zh: "它也可以是换一种方式创造价值", en: "It can be another way to create value", scene: "world-shift" },

  // ── 二、上班的风险，常常被包装成稳定 ──
  { zh: "二、上班的风险，常被包装成稳定", en: "2. Job risks dressed up as stability", scene: "ch2", chapter: 2 },

  { zh: "很多人觉得自由职业飘", en: "Freelancing seems unstable", scene: "stable-illusion" },
  { zh: "打工才稳", en: "salaried work seems safe", scene: "stable-illusion" },
  { zh: "可所谓稳定", en: "But 'stability'", scene: "stable-illusion" },
  { zh: "很多时候只是公司暂时把岗位、工资", en: "is often the company temporarily lending you", scene: "borrowed" },
  { zh: "头衔和资源交给你使用", en: "a role, salary, title, and resources", scene: "borrowed" },

  { zh: "公司需要你，你就有工位和绩效", en: "Needed = desk and bonus", scene: "borrowed" },
  { zh: "公司不需要你", en: "Not needed", scene: "borrowed" },
  { zh: "这些东西可能很快被收回", en: "and it all gets taken back", scene: "borrowed" },

  { zh: "大公司裁员、行业收缩", en: "Big-co layoffs, shrinking industries", scene: "layoff" },
  { zh: "岗位消失、新技术替代人工", en: "vanishing roles, tech replacing labor", scene: "layoff" },
  { zh: "都已经不是传说", en: "are no longer rumors", scene: "layoff" },

  { zh: "尤其是AI进入更多工作流程后", en: "Especially as AI enters more workflows", scene: "ai-reprice" },
  { zh: "过去靠熟练度吃饭的岗位", en: "Jobs that paid for proficiency", scene: "ai-reprice" },
  { zh: "正在被重新定价", en: "are being repriced", scene: "ai-reprice" },
  { zh: "你今天引以为傲的技能", en: "Skills you brag about today", scene: "ai-reprice" },
  { zh: "明天可能就变成工具按钮的一部分", en: "may become a button tomorrow", scene: "ai-reprice" },

  { zh: "更麻烦的是", en: "Worse still", scene: "trapped-experience" },
  { zh: "你以为自己在积累经验", en: "you think you're building experience", scene: "trapped-experience" },
  { zh: "但有些经验只长在公司的系统、流程和客户资源里", en: "but some of it only lives inside the company's systems", scene: "trapped-experience" },
  { zh: "离开平台后", en: "Once you leave the platform", scene: "trapped-experience" },
  { zh: "你还能带走多少能独立变现的能力", en: "how much can you actually monetize alone?", scene: "trapped-experience" },
  { zh: "才是真正需要盘点的问题", en: "That's the real question", scene: "trapped-experience" },

  { zh: "按部就班上班并非没有价值", en: "Steady work isn't worthless", scene: "all-eggs" },
  { zh: "它能提供现金流和训练场", en: "It gives cash flow and a training ground", scene: "all-eggs" },
  { zh: "但如果一个人把全部安全感", en: "But staking all your safety", scene: "all-eggs" },
  { zh: "都押在一家公司身上", en: "on a single company", scene: "all-eggs" },
  { zh: "那才是最大的隐患", en: "is the biggest risk of all", scene: "all-eggs" },

  // ── 三、不上班不轻松，只是积累属于自己 ──
  { zh: "三、不上班不轻松，只是积累属于自己", en: "3. Working for yourself: accumulation, not ease", scene: "ch3", chapter: 3 },

  { zh: "真正靠自己吃饭的人", en: "People who truly work for themselves", scene: "freelance-life" },
  { zh: "并没有想象中轻松", en: "aren't as relaxed as you'd think", scene: "freelance-life" },

  { zh: "自由摄影师要找客户、拍摄、修片", en: "Photographers: clients, shoots, edits", scene: "photographer" },
  { zh: "沟通需求，还要面对淡季", en: "negotiations, slow seasons", scene: "photographer" },

  { zh: "独立开发者要写产品、改 bug、做推广", en: "Indie devs build, debug, market", scene: "indie-dev" },
  { zh: "也要承受没人买单的阶段", en: "and endure no-sales phases", scene: "indie-dev" },

  { zh: "做内容、做咨询、做手艺", en: "Content, consulting, crafts", scene: "indie-dev" },
  { zh: "都离不开持续交付和自我管理", en: "all require constant output and self-discipline", scene: "indie-dev" },

  { zh: "不同的是", en: "The difference", scene: "accumulate" },
  { zh: "这些辛苦会慢慢沉淀到自己身上", en: "is that the effort settles into YOU", scene: "accumulate" },
  { zh: "审美、作品、客户理解", en: "Taste, portfolio, client insight", scene: "accumulate" },
  { zh: "表达能力、解决问题的经验", en: "communication, problem-solving", scene: "accumulate" },
  { zh: "都会变成下一次机会的底层资产", en: "become the foundation for the next opportunity", scene: "accumulate" },

  { zh: "这也是为什么很多自由职业者能长期撑下去", en: "That's why freelancers last", scene: "marathon" },
  { zh: "往往不是因为一开始就会赚钱", en: "not because they made money early", scene: "marathon" },
  { zh: "而是因为他们对某件事有持续热爱", en: "but because they had lasting passion", scene: "marathon" },

  { zh: "热爱不是万能药", en: "Passion isn't a cure-all", scene: "flame" },
  { zh: "但在没人催、没人管", en: "But when no one is pushing you", scene: "flame" },
  { zh: "没人发固定工资的时候", en: "and no salary arrives", scene: "flame" },
  { zh: "它能让你继续往前做", en: "it keeps you moving forward", scene: "flame" },

  // ── 四、找不到热爱，就翻过去三个月 ──
  { zh: "四、找不到热爱，就翻过去三个月", en: "4. No passion? Audit the last three months", scene: "ch4", chapter: 4 },

  { zh: "很多人说，我也想做点自己的事", en: "Many say: I want my own thing", scene: "find-passion" },
  { zh: "但不知道喜欢什么", en: "but I don't know what I love", scene: "find-passion" },
  { zh: "别急着报课", en: "Don't rush to enroll in a course", scene: "find-passion" },
  { zh: "也别急着买设备", en: "or buy gear", scene: "find-passion" },
  { zh: "先做一个低成本排查", en: "Run a low-cost check first", scene: "find-passion" },

  { zh: "回头看过去三个月", en: "Look back at the last 3 months", scene: "calendar" },
  { zh: "你下班后、周末、碎片时间", en: "After work, weekends, spare moments", scene: "calendar" },
  { zh: "最愿意把精力放在哪里", en: "Where did your energy actually go?", scene: "calendar" },
  { zh: "你总是忍不住研究什么", en: "What can't you stop researching?", scene: "calendar" },
  { zh: "就算没人给钱", en: "Even unpaid", scene: "calendar" },
  { zh: "也会主动翻资料、看案例、动手试的东西是什么", en: "what do you dig into and try?", scene: "calendar" },

  { zh: "答案通常就藏在这些时间里", en: "The answer hides in those hours", scene: "calendar" },

  { zh: "如果你总在研究拍摄、剪辑、穿搭", en: "Whether it's photo, editing, style", scene: "skill-grid" },
  { zh: "编程、理财、健身", en: "coding, money, fitness", scene: "skill-grid" },
  { zh: "写作、做饭、收纳", en: "writing, cooking, organizing", scene: "skill-grid" },
  { zh: "二手交易、账号运营", en: "reselling, account-running", scene: "skill-grid" },
  { zh: "它未必立刻就是事业", en: "It may not be a career yet", scene: "skill-grid" },
  { zh: "但至少说明你有持续注意力", en: "but it proves sustained attention", scene: "skill-grid" },

  { zh: "原文里提到一个判断", en: "Here's one rule of thumb", scene: "two-hours" },
  { zh: "每天拿出 2 小时", en: "Take 2 hours a day", scene: "two-hours" },
  { zh: "长期投入到一个具体技能里", en: "and pour them into one skill", scene: "two-hours" },
  { zh: "差距会被慢慢拉开", en: "The gap widens, slowly", scene: "two-hours" },

  { zh: "这个说法不必理解成保证超过谁", en: "It isn't a guarantee to outdo anyone", scene: "scroll-time" },
  { zh: "更不是发财承诺", en: "nor a get-rich promise", scene: "scroll-time" },
  { zh: "它提醒的是", en: "It reminds us", scene: "scroll-time" },
  { zh: "普通人的机会", en: "Ordinary people's opportunities", scene: "scroll-time" },
  { zh: "常常来自别人无意识刷过去的时间", en: "live in the hours others scroll past", scene: "scroll-time" },

  // ── 五、别急着裸辞，先把副业跑通 ──
  { zh: "五、别急着裸辞，先把副业跑通", en: "5. Don't quit cold—prove the side gig first", scene: "ch5", chapter: 5 },

  { zh: "对普通人来说", en: "For most people", scene: "fork-road" },
  { zh: "真正稳的选择", en: "the truly stable choice", scene: "fork-road" },
  { zh: "不是情绪上头就离开职场", en: "isn't quitting on impulse", scene: "fork-road" },

  { zh: "房租、家庭、贷款、社保、现金流", en: "Rent, family, loans, insurance, cash flow", scene: "burden" },
  { zh: "都是现实压力", en: "are real pressure", scene: "burden" },

  { zh: "盲目裸辞", en: "Blindly quitting cold", scene: "cliff-jump" },
  { zh: "很可能不是自由", en: "often isn't freedom", scene: "cliff-jump" },
  { zh: "而是把自己推向更紧的焦虑", en: "but tighter anxiety", scene: "cliff-jump" },

  { zh: "更可行的方式", en: "A more workable path", scene: "day-night" },
  { zh: "是边上班边试错", en: "is to test while still working", scene: "day-night" },
  { zh: "白天保住现金流", en: "Days: protect cash flow", scene: "day-night" },
  { zh: "晚上把热爱变成可交付的东西", en: "Nights: turn passion into deliverables", scene: "day-night" },

  { zh: "一个作品集，一个小单", en: "A portfolio, a small order", scene: "deliverables" },
  { zh: "一个账号，一款小工具", en: "An account, a small tool", scene: "deliverables" },
  { zh: "一份能公开展示的案例", en: "A public case study", scene: "deliverables" },

  { zh: "你要验证的不是「我想不想自由」", en: "Don't validate \"do I want freedom\"", scene: "pay-for-value" },
  { zh: "而是「有没有人愿意为我提供的价值付费」", en: "Validate \"will anyone pay for my value\"", scene: "pay-for-value" },

  { zh: "等副业有了稳定反馈", en: "Once the side gig gets steady signal", scene: "hedge" },
  { zh: "再逐步调整工作节奏", en: "adjust your work rhythm bit by bit", scene: "hedge" },
  { zh: "降低依赖、扩大投入", en: "lower dependency, scale up", scene: "hedge" },
  { zh: "这比突然切断收入来源更现实", en: "More realistic than cutting income cold", scene: "hedge" },
  { zh: "也更像一种风险对冲", en: "It's risk hedging", scene: "hedge" },

  // ── 结尾 ──
  { zh: "有时候", en: "Sometimes", scene: "patching" },
  { zh: "世界并没有我们想象得那么严丝合缝", en: "the world isn't as tight as it seems", scene: "patching" },
  { zh: "很多行业、公司和项目", en: "Many industries, companies, projects", scene: "patching" },
  { zh: "本质上都在边做边补", en: "are patching as they go", scene: "patching" },
  { zh: "看清这一点", en: "See this clearly", scene: "patching" },
  { zh: "人就不会轻易把岗位、平台、头衔", en: "and you won't lean on role, platform, or title", scene: "patching" },
  { zh: "当成终身靠山", en: "as a lifelong shelter", scene: "patching" },

  { zh: "真正的稳定", en: "Real stability", scene: "true-stable" },
  { zh: "不是永远有一张工牌", en: "isn't a permanent badge", scene: "true-stable" },
  { zh: "而是你持续创造价值", en: "It's your ability to keep creating value", scene: "true-stable" },
  { zh: "解决问题、被别人需要的能力", en: "solving problems, being needed", scene: "true-stable" },

  { zh: "所以，不上班不是口号", en: "So \"not working\" isn't a slogan", scene: "another-path" },
  { zh: "上班也不是原罪", en: "and \"working\" isn't a sin", scene: "another-path" },
  { zh: "关键是", en: "The point is:", scene: "another-path" },
  { zh: "你有没有在工资之外", en: "outside your salary", scene: "another-path" },
  { zh: "给自己留一条能走的路", en: "have you built another path?", scene: "another-path" },

  { zh: "如果每天只能挤出 2 小时", en: "If you only have 2 hours a day", scene: "start-now" },
  { zh: "就先从这 2 小时开始", en: "start with those 2 hours", scene: "start-now" },
];

// ─────────────────────────────────────────────────────────────────────────
// 中央图配置：每张图的中文文生图 prompt，方便你用即梦/豆包/midjourney 生成。
// 风格统一：暖色纸质感、简约扁平插画、留白多、主体居中、不要写实照片。
// 你也可以全部换成手绘 icon、3D 黏土、写实卡通等任意风格——只要风格统一即可。
// ─────────────────────────────────────────────────────────────────────────
window.SCENES = {
  hook: {
    prompt: "扁平插画风格，一个站立的小人，脖子上挂着一张巨大的工牌，工牌上有一根铁链锁在脚踝，米黄底色，主体黑色简约线条，留白多，居中构图。",
    label: "工牌＝靠山？"
  },
  ch1: { prompt: "章节封面卡：米黄底，居中大字 \"一\" 用毛笔感衬线字体，下方一行小字\"先把不上班说清楚\"，极简留白。", label: "" },
  "lying-flat": {
    prompt: "扁平插画：一个人侧躺在床上举着手机刷视频，旁边地上堆着外卖盒，钱包里飘出几张钞票。米黄底色，主体黑+灰，少量红色点缀（钱包/外卖盒）。",
    label: ""
  },
  "old-path": {
    prompt: "扁平插画：一条向上走的阶梯路径，每一级台阶上标着图标——书本/学士帽/公文包/向上箭头/摇椅。米黄底，路径深棕色，图标黑色。",
    label: ""
  },
  "world-shift": {
    prompt: "扁平插画：一个传统的旧地图被一阵风吹散，碎片重组成一些新形状（电脑、相机、画笔、对话气泡）。米黄底，旧地图泛黄，新元素彩色但低饱和。",
    label: ""
  },
  ch2: { prompt: "章节封面卡：米黄底，居中大字 \"二\"，下方小字 \"上班的风险，常被包装成稳定\"。极简留白。", label: "" },
  "stable-illusion": {
    prompt: "扁平插画：一个被精致礼物盒包装的炸弹，礼物盒上的标签写着 \"稳定\"。米黄底，礼物盒红丝带，炸弹黑色。",
    label: "稳定 ?"
  },
  borrowed: {
    prompt: "扁平插画：一座公司大楼伸出几只手，把工牌/工资袋/头衔奖章/桌椅 通过细绳吊给下方一个小人。米黄底，公司大楼深灰，物品红+黑。",
    label: ""
  },
  layoff: {
    prompt: "扁平插画：一排倒下的多米诺骨牌，每一块都贴着 \"岗位\"\"部门\"\"项目\" 的小标签，最后一块刚刚倒下。米黄底，骨牌黑色，最后一块红色。",
    label: ""
  },
  "ai-reprice": {
    prompt: "扁平插画：一个机器人手臂正在给一个写着\"技能\"的标签贴价格条，标签上的价格从高变低。米黄底，机器人灰色，价格标签红色。",
    label: ""
  },
  "trapped-experience": {
    prompt: "扁平插画：一个小人从大楼门口走出来，但他的工具（电脑/文件夹/客户名单）都被门里的钩子拉住带不走。米黄底，大楼深色，工具浅色。",
    label: ""
  },
  "all-eggs": {
    prompt: "扁平插画：一个篮子里装着所有的鸡蛋，每个鸡蛋上写着\"工资\"\"安全感\"\"未来\"\"身份\"，篮子的提手已经开裂。米黄底，篮子棕色，鸡蛋米白。",
    label: ""
  },
  ch3: { prompt: "章节封面卡：米黄底，居中大字 \"三\"，下方小字 \"不上班不轻松，只是积累属于自己\"。极简留白。", label: "" },
  "freelance-life": {
    prompt: "扁平插画：一个小人背着工具包独自爬山，山坡上散落着相机/键盘/画笔。米黄底，山深灰，小人黑色。",
    label: ""
  },
  photographer: {
    prompt: "扁平插画：一位摄影师举着相机，旁边一台显示器显示修图软件，桌上一杯凉了的咖啡。米黄底，主体黑色线条+少量绿色点缀。",
    label: ""
  },
  "indie-dev": {
    prompt: "扁平插画：一个人对着笔记本电脑，屏幕上是代码和bug图标，旁边放着外卖和咖啡。米黄底，主体黑色，屏幕蓝光。",
    label: ""
  },
  accumulate: {
    prompt: "扁平插画：树木横切面的年轮，每一圈标注着\"作品\"\"客户\"\"审美\"\"表达\"。米黄底，年轮棕色，标签黑色。",
    label: ""
  },
  marathon: {
    prompt: "扁平插画：一个长跑选手在长长的赛道上独自奔跑，身后一串脚印。米黄底，跑者黑色，赛道浅灰。",
    label: ""
  },
  flame: {
    prompt: "扁平插画：一只手心里捧着一小簇火苗，周围是漆黑的背景。米黄底，手黑色，火苗红橙渐变。",
    label: ""
  },
  ch4: { prompt: "章节封面卡：米黄底，居中大字 \"四\"，下方小字 \"找不到热爱，就翻过去三个月\"。极简留白。", label: "" },
  "find-passion": {
    prompt: "扁平插画：一个人挠头站在三条岔路口，每条路通向不同的图标（相机/键盘/画笔）。米黄底，主体黑色。",
    label: ""
  },
  calendar: {
    prompt: "扁平插画：一本翻开的日历，三个月的页面上分别用放大镜圈出几个晚上和周末。米黄底，日历白色，放大镜红色。",
    label: ""
  },
  "skill-grid": {
    prompt: "扁平插画：3x3 九宫格图标——相机/剪刀/衣架/代码/钱币/哑铃/钢笔/锅铲/收纳盒，每个图标在一个浅色方块里。米黄底，图标黑色。",
    label: ""
  },
  "two-hours": {
    prompt: "扁平插画：一个沙漏中间标着 \"2h\"，下方堆积着一摞摞小方块，越堆越高。米黄底，沙漏黑色，方块由浅入深。",
    label: ""
  },
  "scroll-time": {
    prompt: "扁平插画：一个人低头刷手机，手机屏幕里时间像沙子一样流走。米黄底，人黑色，时间沙粒金色。",
    label: ""
  },
  ch5: { prompt: "章节封面卡：米黄底，居中大字 \"五\"，下方小字 \"别急着裸辞，先把副业跑通\"。极简留白。", label: "" },
  "fork-road": {
    prompt: "扁平插画：一个人站在一个 \"Y\" 形岔路口前，一条路标 \"裸辞\" 通向悬崖，另一条标 \"副业\" 通向远方建筑。米黄底，主体黑色，悬崖路用红色虚线。",
    label: ""
  },
  burden: {
    prompt: "扁平插画：一个小人扛着一个巨大的杠铃，杠铃两端是分别贴着 \"房租\"\"家庭\"\"贷款\"\"社保\" 的圆盘。米黄底，小人黑色，圆盘深灰。",
    label: ""
  },
  "cliff-jump": {
    prompt: "扁平插画：一个蒙着眼的人从悬崖边纵身跳下，下方是问号云雾。米黄底，人黑色，问号红色。",
    label: ""
  },
  "day-night": {
    prompt: "扁平插画：画面分两半，左半：白天，办公桌+电脑；右半：夜晚，家里书桌+笔记本+台灯。米黄底，左半浅蓝调，右半深蓝调，中间分隔。",
    label: ""
  },
  deliverables: {
    prompt: "扁平插画：一个货架上整齐摆放着——作品集本子、订单纸条、手机里的账号、小工具齿轮、案例文件夹。米黄底，物品黑色+少量红色标签。",
    label: ""
  },
  "pay-for-value": {
    prompt: "扁平插画：一个天平，左边放着 \"我提供的价值\"，右边放着钱袋。米黄底，天平黑色，钱袋红色。",
    label: ""
  },
  hedge: {
    prompt: "扁平插画：一个跷跷板，一端坐着 \"工资\" 字样的圆球，另一端坐着 \"副业\" 字样的圆球，趋于平衡。米黄底，跷跷板棕色，圆球红绿。",
    label: ""
  },
  patching: {
    prompt: "扁平插画：一座未完工的建筑，外面是脚手架，工人在补墙补漏。米黄底，建筑灰色，脚手架黑色。",
    label: ""
  },
  "true-stable": {
    prompt: "扁平插画：左边一张工牌打着叉，右边一个小人手里拿着工具箱+作品集+人脉关系图。米黄底，工牌红叉，工具黑色。",
    label: ""
  },
  "another-path": {
    prompt: "扁平插画：一条主路旁边分出一条窄窄的小路，小路上有一个小人在散步。米黄底，主路深灰，小路浅棕。",
    label: ""
  },
  "start-now": {
    prompt: "扁平插画：一个时钟特写，指针指着 2 小时区间，钟面下方一行小字 \"START\"。米黄底，时钟黑色，2 小时区域填红色。",
    label: ""
  },
};
