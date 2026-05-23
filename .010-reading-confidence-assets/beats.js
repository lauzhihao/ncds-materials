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
  // ── 开场：双行对仗标题 ──
  { zh: "读书不是唯一出路", en: "Studying isn't the only way out", scene: "title" },
  { zh: "但它是普通人最公平的那条", en: "but it's the fairest path for ordinary people", scene: "title" },

  // ── 一、先把"读书没用"说清楚 ──
  { zh: "一、先把\"读书没用\"说清楚", en: "1. Let's settle 'school is useless' first", scene: "ch1", chapter: 1 },

  { zh: "你以为上不上学", en: "You think going to school", scene: "alone" },
  { zh: "真的只是你一个人的事吗", en: "is really just your own business?", scene: "alone" },
  { zh: "别天真了", en: "Don't be naive", scene: "alone" },

  { zh: "你今天坐在教室里", en: "You're sitting in class today", scene: "seat-future" },
  { zh: "看起来是在听课、写作业、背书、考试", en: "looks like listening, homework, memorizing, exams", scene: "seat-future" },
  { zh: "实际上你是在给未来的自己争位置", en: "really you're claiming a spot for your future self", scene: "seat-future" },

  { zh: "你不是在和一张试卷较劲", en: "You're not wrestling with a test paper", scene: "arena" },
  { zh: "你是在和十年后的工作、收入、家庭责任较劲", en: "you're wrestling with the job, income, family load of ten years from now", scene: "arena" },

  { zh: "很多人一厌学就会说", en: "Many give up on school and say", scene: "excuse" },
  { zh: "我不想学了，学这些有什么用", en: "I'm done, what's the point of all this?", scene: "excuse" },
  { zh: "听起来好像有道理", en: "Sounds reasonable", scene: "excuse" },

  { zh: "但读书不是要你保证以后过得轻松", en: "But studying doesn't promise an easy life later", scene: "saving-up" },
  { zh: "它是在你没有资源、没有兜底的时候", en: "it's for when you have no resources, no safety net", scene: "saving-up" },
  { zh: "给自己多攒一点说\"不\"的力气", en: "to save up a bit more strength to say 'no'", scene: "saving-up" },

  { zh: "读书也不是唯一出路", en: "Studying isn't the only way out", scene: "fair-road" },
  { zh: "但对普通家庭的孩子来说", en: "but for kids from ordinary families", scene: "fair-road" },
  { zh: "它是最公平的那条", en: "it's the fairest road there is", scene: "fair-road" },

  // ── 二、你逃避的不是作业，是未来的余地 ──
  { zh: "二、你逃避的不是作业，是未来的余地", en: "2. You're not dodging homework, you're dodging future room to move", scene: "ch2", chapter: 2 },

  { zh: "普通家庭的孩子", en: "Kids from ordinary families", scene: "narrow-paths" },
  { zh: "最怕的不是现在多写几套题", en: "fear nothing more than this:", scene: "narrow-paths" },
  { zh: "而是长大以后才发现", en: "growing up and realizing", scene: "narrow-paths" },
  { zh: "自己手里能选的路太少", en: "the paths they can choose are too few", scene: "narrow-paths" },

  { zh: "你今天逃避的不是作业", en: "What you're dodging isn't homework", scene: "bill-pressure" },
  { zh: "不是考试，不是老师的要求", en: "isn't exams, isn't the teacher's demands", scene: "bill-pressure" },
  { zh: "你逃避的是未来面对账单、房贷、工作压力时", en: "you're dodging the moment, years from now, facing bills, mortgage, work pressure", scene: "bill-pressure" },
  { zh: "连一句\"我不接受\"都说不出来的那一刻", en: "when you can't even say 'I refuse'", scene: "bill-pressure" },

  { zh: "真正的苦是什么", en: "What real hardship is", scene: "age-20" },
  { zh: "是二十岁的时候，别人有得选，你只能将就", en: "At 20: others have choices, you settle", scene: "age-20" },
  { zh: "是三十岁的时候，账单摆在面前，你连换一份工作都不敢", en: "At 30: bills in front of you, no nerve to change jobs", scene: "age-30" },
  { zh: "是四十岁的时候，家庭责任压下来", en: "At 40: family weight bears down", scene: "age-40" },
  { zh: "你才发现自己当年没攒够退路", en: "and you realize you never saved enough fallback", scene: "age-40" },

  { zh: "生活不会因为你讨厌竞争", en: "Life won't cancel the race", scene: "no-pass" },
  { zh: "就取消比赛", en: "just because you hate competition", scene: "no-pass" },
  { zh: "你可以不学、可以躲、可以混", en: "You can skip, hide, coast", scene: "no-pass" },
  { zh: "可社会不会因为你一句\"不想学\"就给你让路", en: "but society won't step aside because you said 'I don't want to'", scene: "no-pass" },

  { zh: "今天你不愿意面对试卷", en: "Today you won't face a test paper", scene: "escalation" },
  { zh: "明天就可能要面对更难的选择", en: "tomorrow you may face harder choices", scene: "escalation" },
  { zh: "今天你不愿意听父母唠叨", en: "Today you won't hear out your parents", scene: "escalation" },
  { zh: "明天催你的就不是父母", en: "tomorrow it won't be parents pushing you", scene: "escalation" },
  { zh: "而是工作、收入和账单", en: "it'll be work, income, and bills", scene: "escalation" },

  // ── 三、别把"不擅长"当成清醒 ──
  { zh: "三、别把\"不擅长\"当成清醒", en: "3. Don't dress 'not my thing' up as clarity", scene: "ch3", chapter: 3 },

  { zh: "身边那些被生活推着走的成年人", en: "Those adults you see, pushed around by life", scene: "adults-carry" },
  { zh: "他们真的都不努力吗", en: "Are they really all lazy?", scene: "adults-carry" },
  { zh: "不是", en: "No", scene: "adults-carry" },
  { zh: "很多人很努力，每天都在扛", en: "Many work hard, carrying it every day", scene: "adults-carry" },

  { zh: "他们缺的不是现在不肯吃苦", en: "What they lack isn't willingness to suffer now", scene: "no-chips" },
  { zh: "而是当年没有攒够筹码", en: "it's chips they didn't save back then", scene: "no-chips" },
  { zh: "不是不想换一种活法", en: "Not unwilling to switch lives", scene: "no-chips" },
  { zh: "而是手里能动的牌太少", en: "but their hand has too few cards to play", scene: "no-chips" },

  { zh: "所以你别总说读书没用", en: "So stop saying school is useless", scene: "one-page" },
  { zh: "它有没有用", en: "Whether it's useful", scene: "one-page" },
  { zh: "不看你今天背的这一页书明天能不能换钱", en: "isn't about whether today's page turns into cash tomorrow", scene: "one-page" },
  { zh: "而看它能不能在未来某一天", en: "it's whether someday in the future", scene: "one-page" },
  { zh: "让你多一条路", en: "it gives you one more road", scene: "one-page" },
  { zh: "多一个机会", en: "one more chance", scene: "one-page" },
  { zh: "多一点不被动的资格", en: "a bit more right to not be pushed around", scene: "one-page" },

  { zh: "你现在练出来的坚持", en: "The persistence you're training now", scene: "inner-skill" },
  { zh: "理解、判断、扛压力的能力", en: "understanding, judgment, stress-bearing", scene: "inner-skill" },
  { zh: "都会变成以后面对现实的本事", en: "all become real-world skills later", scene: "inner-skill" },

  { zh: "还有人说", en: "Some also say", scene: "excuse-mask" },
  { zh: "我不是不想学，我就是不擅长", en: "I want to, I'm just not good at it", scene: "excuse-mask" },
  { zh: "说真的", en: "Honestly", scene: "excuse-mask" },
  { zh: "绝大多数人的努力程度", en: "most people's level of effort", scene: "excuse-mask" },
  { zh: "还没到拼天赋的时候", en: "is nowhere near needing talent to break the tie", scene: "excuse-mask" },

  { zh: "你是真的不擅长", en: "Are you really 'not good at it'", scene: "self-quiz" },
  { zh: "还是一遇难题就放弃", en: "or do you quit at the first hard problem?", scene: "self-quiz" },
  { zh: "你是真的学不会", en: "Are you really unable to learn", scene: "self-quiz" },
  { zh: "还是没认真坐下来弄明白", en: "or have you never sat down and figured it out?", scene: "self-quiz" },
  { zh: "你是真的没有机会", en: "Are you really out of chances", scene: "self-quiz" },
  { zh: "还是一直用\"我不行\"给自己找台阶", en: "or always using 'I can't' as an exit ramp?", scene: "self-quiz" },

  { zh: "别把一时的懒当成清醒", en: "Don't mistake momentary laziness for clarity", scene: "real-choice" },
  { zh: "也别把逃避包装成选择", en: "don't wrap avoidance as choice", scene: "real-choice" },
  { zh: "真正的选择", en: "Real choice", scene: "real-choice" },
  { zh: "是你有能力之后再决定走哪条路", en: "is deciding which road after you have the ability", scene: "real-choice" },
  { zh: "没有能力的时候", en: "Without that ability", scene: "real-choice" },
  { zh: "你所谓的选择", en: "what you call a choice", scene: "real-choice" },
  { zh: "常常只是被现实推着走", en: "is often just being pushed by reality", scene: "real-choice" },

  // ── 四、父母不是想逼你，是想推你一把 ──
  { zh: "四、父母不是想逼你，是想推你一把", en: "4. Parents aren't pressing you, they're pushing you forward", scene: "ch4", chapter: 4 },

  { zh: "你现在讨厌父母催你", en: "You hate your parents pushing you", scene: "parents-nag" },
  { zh: "对不对", en: "right?", scene: "parents-nag" },
  { zh: "觉得他们不懂你", en: "feel they don't get you", scene: "parents-nag" },
  { zh: "觉得他们只会说学习", en: "feel all they say is study", scene: "parents-nag" },
  { zh: "觉得他们把成绩看得太重", en: "feel they care too much about grades", scene: "parents-nag" },

  { zh: "可是要明白", en: "But you have to see this", scene: "parents-elder" },
  { zh: "父母不是不知道你烦", en: "they know you're annoyed", scene: "parents-elder" },
  { zh: "也不是不知道你累", en: "they know you're tired", scene: "parents-elder" },
  { zh: "他们只是比你更早见过生活的另一面", en: "they've just seen life's other side earlier than you", scene: "parents-elder" },

  { zh: "他们知道", en: "They know", scene: "no-mercy" },
  { zh: "未来真正来催你的东西", en: "the things that'll really come after you in the future", scene: "no-mercy" },
  { zh: "不会像他们这样还给你留情面", en: "won't spare your feelings like they do", scene: "no-mercy" },

  { zh: "父母催你写作业", en: "Parents nag about homework", scene: "society-blunt" },
  { zh: "最多语气重一点", en: "at worst, a heavier tone", scene: "society-blunt" },
  { zh: "老师催你学习", en: "Teachers push you to study", scene: "society-blunt" },
  { zh: "最多批评几句", en: "at worst, a few scoldings", scene: "society-blunt" },
  { zh: "可社会毒打你的时候", en: "But when society hits you", scene: "society-blunt" },
  { zh: "它不会问你心情好不好", en: "it won't ask how you feel", scene: "society-blunt" },
  { zh: "也不会因为你后悔就让你重来", en: "and won't let you redo because you regret", scene: "society-blunt" },

  { zh: "父母现在看起来是在逼你", en: "Parents look like they're pressing you", scene: "gentle-push" },
  { zh: "其实是想在你还来得及的时候", en: "really they want, while there's still time", scene: "gentle-push" },
  { zh: "把你往前推一把", en: "to push you forward", scene: "gentle-push" },

  { zh: "他们在乎的不是分数", en: "What they care about isn't scores", scene: "parent-care" },
  { zh: "是你将来有没有得选", en: "it's whether you'll have choices later", scene: "parent-care" },
  { zh: "有没有退路", en: "whether you'll have a fallback", scene: "parent-care" },
  { zh: "有没有不那么被动的可能", en: "any chance of not being so passive", scene: "parent-care" },

  { zh: "他们不是要你替他们争面子", en: "They don't want you saving face for them", scene: "parent-care" },
  { zh: "而是不想看你长大以后", en: "they just don't want to watch you grow up", scene: "parent-care" },
  { zh: "因为今天的混日子", en: "and, because of today's coasting", scene: "parent-care" },
  { zh: "去吃更多没必要的苦", en: "swallow more pointless suffering", scene: "parent-care" },

  // ── 五、给未来的自己，留一句感谢 ──
  { zh: "五、给未来的自己，留一句感谢", en: "5. Leave a 'thank you' for your future self", scene: "ch5", chapter: 5 },

  { zh: "读书不是让你变成只会考试的人", en: "Studying isn't turning you into an exam machine", scene: "common-path" },
  { zh: "更不是说成绩代表一切", en: "grades don't equal everything", scene: "common-path" },
  { zh: "可对普通人来说", en: "but for ordinary people", scene: "common-path" },
  { zh: "读书至少是一条看得见、摸得着", en: "school is at least a visible, tangible road", scene: "common-path" },
  { zh: "努力就可能往前走的路", en: "one where effort can move you forward", scene: "common-path" },

  { zh: "你现在多坚持一天", en: "Every extra day you hold on", scene: "recharge" },
  { zh: "不是为了取悦父母", en: "isn't to please your parents", scene: "recharge" },
  { zh: "你每认真听一节课", en: "every class you truly attend", scene: "recharge" },
  { zh: "也不是为了让老师满意", en: "isn't to please the teacher", scene: "recharge" },
  { zh: "你每一次把想放弃的念头压下去", en: "every time you push down 'I give up'", scene: "recharge" },
  { zh: "更不是为了给谁交差", en: "isn't to clock in for anyone", scene: "recharge" },

  { zh: "你是在给自己的未来充值", en: "You're topping up your own future", scene: "recharge" },

  { zh: "想象一下", en: "Imagine it", scene: "mirror-future" },
  { zh: "五年后的你回头看今天", en: "five years from now, looking back at today", scene: "mirror-future" },
  { zh: "会希望现在的自己再坚持一下", en: "will you wish today's you held on longer?", scene: "mirror-future" },
  { zh: "还是希望就这样混过去", en: "or wish you'd just coasted through?", scene: "mirror-future" },
  { zh: "十年后的你", en: "Ten years from now", scene: "mirror-future" },
  { zh: "面对工作、收入、家庭责任的时候", en: "facing work, income, family load", scene: "mirror-future" },
  { zh: "会感谢今天那个咬牙学下去的自己", en: "will you thank the one who grit and pushed on?", scene: "mirror-future" },
  { zh: "还是埋怨当年为什么那么轻易放弃", en: "or blame the one who gave up so easily?", scene: "mirror-future" },

  { zh: "如果你现在正想放弃", en: "If right now you're ready to quit", scene: "small-step" },
  { zh: "就别想太远", en: "don't look that far ahead", scene: "small-step" },
  { zh: "今天就先做一件小事——", en: "today, just do one small thing —", scene: "small-step" },

  { zh: "把眼前这一节课听完", en: "finish this one class in front of you", scene: "small-step" },
  { zh: "把眼前这一道题做完", en: "finish this one problem in front of you", scene: "small-step" },
  { zh: "把这一个想放弃的瞬间", en: "this single moment of wanting to quit", scene: "small-step" },
  { zh: "撑过去", en: "ride it out", scene: "small-step" },

  { zh: "读书不是替任何人完成任务", en: "Studying isn't a task you complete for anyone", scene: "thanks-note" },
  { zh: "而是给你自己留退路", en: "it's leaving yourself a fallback", scene: "thanks-note" },

  { zh: "未来的你", en: "The future you", scene: "thanks-note" },
  { zh: "真的会感谢现在这个没有混过去的自己", en: "will truly thank the one who didn't coast through", scene: "thanks-note" },
];

// ─────────────────────────────────────────────────────────────────────────
// 中央图配置：每张图的中文文生图 prompt，方便你用即梦/豆包/midjourney 生成。
// 风格统一：暖色纸质感、简约扁平插画、留白多、主体居中、不要写实照片。
// 你也可以全部换成手绘 icon、3D 黏土、写实卡通等任意风格——只要风格统一即可。
// ─────────────────────────────────────────────────────────────────────────
window.SCENES = {
  // ── 开场标题卡 ──
  title: {
    prompt: "扁平插画。米黄纸质底，画面中央一支红色蘸水笔正在纸上书写，笔尖下留下一道红色墨迹。墨迹未成字。四周大面积留白。主体黑色简约线条，墨迹饱和红色。",
    label: "",
    overlays: [
      { text: "最公平的那条路", xPct: 50, yPct: 70, style: "os-handwrite", animation: "oa-fade", delay: 300 },
    ]
  },

  // ── 第一章 ──
  ch1: { prompt: "章节封面卡：米黄底，居中大字 \"一\" 用毛笔感衬线字体，下方一行小字 \"先把『读书没用』说清楚\"，极简留白。", label: "" },
  alone: {
    prompt: "扁平插画。画面中央一个小人独自站立，身后是一片由许多小人组成的人群剪影。中间小人头顶有一个问号气泡。米黄底色，人群灰色，主体小人黑色，问号红色。",
    label: ""
  },
  "seat-future": {
    prompt: "扁平插画。画面中央一个教室的座位，桌面上摊开课本和试卷。座椅背后投出一个高大的人形剪影（代表未来的自己）。米黄底色，桌椅黑色线条，剪影深棕色。",
    label: "",
    overlays: [
      { text: "争位置", xPct: 70, yPct: 30, style: "os-callout-red", animation: "oa-fly-right", delay: 200 },
    ]
  },
  arena: {
    prompt: "扁平插画。画面分两半：左侧一个学生面对一张试卷；右侧一个成年人面对账单、办公桌、家庭背景。中间用一条红色虚线相连。米黄底色，左半浅色调，右半深色调。",
    label: ""
  },
  excuse: {
    prompt: "扁平插画。画面中央一个小人嘴边飘出一个对话气泡，气泡里是一个大大的问号。小人耸肩。米黄底色，气泡浅灰，问号红色，小人黑色。",
    label: ""
  },
  "saving-up": {
    prompt: "扁平插画。画面中央一个储蓄罐，罐口正在落入硬币，硬币上不是数字而是\"力气\"\"机会\"等抽象图标。罐子下方四周留白。米黄底色，储蓄罐深棕色，硬币金黄色。",
    label: "",
    overlays: [
      { text: "攒底气", xPct: 50, yPct: 30, style: "os-stamp", animation: "oa-stamp-hit", delay: 200 },
    ]
  },
  "fair-road": {
    prompt: "扁平插画。画面中央一条笔直的道路通向远方地平线，路两侧是空旷的田野。路上没有路障没有岔口。米黄底色，道路深灰色，地平线一抹暖光。",
    label: "",
    overlays: [
      { text: "公平", xPct: 50, yPct: 35, style: "os-tag-pill", delay: 200 },
    ]
  },

  // ── 第二章 ──
  ch2: { prompt: "章节封面卡：米黄底，居中大字 \"二\"，下方小字 \"你逃避的不是作业，是未来的余地\"。极简留白。", label: "" },
  "narrow-paths": {
    prompt: "扁平插画。画面中央一个小人站在一个狭窄的岔口前，只剩两三条很窄的路向前延伸，其它路口都被横木挡住。米黄底色，小人黑色，路深灰色，横木红色。",
    label: ""
  },
  "bill-pressure": {
    prompt: "扁平插画。画面中央一张桌子，桌上堆着账单、信封、计算器、一杯没喝完的咖啡。桌子后一个成年人背影，肩膀微塌。米黄底色，桌面深色，账单白色，背影黑色。",
    label: "",
    overlays: [
      { text: "账单", xPct: 28, yPct: 50, style: "os-tag-pill", delay: 0 },
      { text: "房贷", xPct: 72, yPct: 50, style: "os-tag-pill", delay: 200 },
    ]
  },
  "age-20": {
    prompt: "扁平插画。画面中央一个年轻人站在两条岔路前，两条路都被淡淡的灰色虚线圈住，意味着选不到。米黄底色，年轻人黑色，路灰色。",
    label: "",
    overlays: [
      { text: "20", xPct: 50, yPct: 25, style: "os-stamp", animation: "oa-stamp-hit" },
    ]
  },
  "age-30": {
    prompt: "扁平插画。画面中央一个成年人坐在办公桌前，桌上一摞账单，桌角一个小行李箱但他没有起身。米黄底色，桌椅深色，行李箱浅棕，账单白色。",
    label: "",
    overlays: [
      { text: "30", xPct: 50, yPct: 25, style: "os-stamp", animation: "oa-stamp-hit" },
    ]
  },
  "age-40": {
    prompt: "扁平插画。画面中央一个中年人，肩上压着几个抽象方块（代表房子、孩子、老人），脚下是一条向后看的虚影路径。米黄底色，主体黑色，方块深棕色。",
    label: "",
    overlays: [
      { text: "40", xPct: 50, yPct: 25, style: "os-stamp", animation: "oa-stamp-hit" },
    ]
  },
  "no-pass": {
    prompt: "扁平插画。画面中央一条跑道，跑道上其他选手都在向前奔跑，画面前景一个小人站着不动，跑道继续延伸不为他停下。米黄底色，跑道灰色，奔跑者黑色，主体小人深色。",
    label: ""
  },
  escalation: {
    prompt: "扁平插画。画面中央一组从小到大依次排列的方块，从左到右分别标注\"试卷\"\"父母唠叨\"\"工作\"\"账单\"（用空白方框代替文字），方块上方有一个小人逐级被推着走。米黄底色，方块灰色渐深，小人黑色。",
    label: ""
  },

  // ── 第三章 ──
  ch3: { prompt: "章节封面卡：米黄底，居中大字 \"三\"，下方小字 \"别把『不擅长』当成清醒\"。极简留白。", label: "" },
  "adults-carry": {
    prompt: "扁平插画。画面中央三个成年人侧身排队前行，每个人肩上都扛着抽象的方块（行李、责任、压力）。每个人都微微前倾。米黄底色，人物黑色，方块深棕色。",
    label: ""
  },
  "no-chips": {
    prompt: "扁平插画。画面中央一张牌桌，桌上散落几张牌和很少的几个筹码。一只手垂在桌边没有出牌。米黄底色，牌桌深绿色，筹码金色，手黑色线条。",
    label: "",
    overlays: [
      { text: "筹码", xPct: 50, yPct: 30, style: "os-callout-red", animation: "oa-zoom", delay: 200 },
    ]
  },
  "one-page": {
    prompt: "扁平插画。画面中央一本翻开的书，书页中央的字被风吹起来变成了几条向远处延伸的小路径。米黄底色，书本白色，路径浅红色虚线。",
    label: ""
  },
  "inner-skill": {
    prompt: "扁平插画。画面中央一个小人胸口位置长出一棵小树，树根扎进胸口，树枝上挂着四个发光的叶片（标着\"坚持\"\"理解\"\"判断\"\"抗压\"——用空白方框代替）。米黄底色，小人黑色，树绿色，叶片金黄色。",
    label: ""
  },
  "excuse-mask": {
    prompt: "扁平插画。画面中央一个小人手里举着一张面具，面具上写着一个大大的\"不擅长\"（用空白方框代替）。小人正在把面具往自己脸上扣。米黄底色，小人黑色，面具深棕色，方框红色。",
    label: ""
  },
  "self-quiz": {
    prompt: "扁平插画。画面中央一个小人面前飘浮三个问号气泡。每个气泡里都是一个大大的\"?\"。小人摸着下巴思考。米黄底色，问号红色，气泡浅灰，小人黑色。",
    label: ""
  },
  "real-choice": {
    prompt: "扁平插画。画面分两半：左侧一个小人被一只大手推着往前走（被动）；右侧同一个小人长出翅膀，主动向前飞（主动）。中间一道分割。米黄底色，左半灰色调，右半暖色调。",
    label: "",
    overlays: [
      { text: "有能力之后才有选择", xPct: 50, yPct: 75, style: "os-handwrite", animation: "oa-fade", delay: 300 },
    ]
  },

  // ── 第四章 ──
  ch4: { prompt: "章节封面卡：米黄底，居中大字 \"四\"，下方小字 \"父母不是想逼你，是想推你一把\"。极简留白。", label: "" },
  "parents-nag": {
    prompt: "扁平插画。画面中央一个小人坐在书桌前，身后两个大人（父母）头顶各有一个对话气泡，气泡里都是省略号。小人捂着耳朵。米黄底色，父母灰色，小人黑色。",
    label: ""
  },
  "parents-elder": {
    prompt: "扁平插画。画面分两半：左侧父母背影，眼前是一片风雨场景（已经走过）；右侧孩子背影，眼前是晴朗的小操场（还没经历）。中间一道竖线分隔。米黄底色，左半深色，右半浅色。",
    label: ""
  },
  "no-mercy": {
    prompt: "扁平插画。画面中央一个大门紧闭，门上没有窗，门前一个小人正在敲门，门没有任何反应。米黄底色，门深棕色，小人黑色。",
    label: "",
    overlays: [
      { text: "不留情面", xPct: 50, yPct: 75, style: "os-callout-red", animation: "oa-fade", delay: 300 },
    ]
  },
  "society-blunt": {
    prompt: "扁平插画。画面中央三层力度从轻到重的箭头叠在一起：最浅的标\"父母\"，中等的标\"老师\"，最重的红色箭头标\"社会\"（用空白代替文字）。下方一个小人被最重的箭头推得后退。米黄底色，箭头从灰到红渐变，小人黑色。",
    label: ""
  },
  "gentle-push": {
    prompt: "扁平插画。画面中央一个小人面朝前方，背后一只大手轻轻推他的后背（不是用力推倒）。前方是一条向前的小路。米黄底色，大手深灰色，小人黑色，路浅色。",
    label: "",
    overlays: [
      { text: "推你一把", xPct: 50, yPct: 30, style: "os-stamp", animation: "oa-stamp-hit", delay: 200 },
    ]
  },
  "parent-care": {
    prompt: "扁平插画。画面中央两个大人（父母）并排站着，他们身前一个小孩正抬头看远方的一条小路。父母手里没有任何\"成绩单\"道具，只是注视。米黄底色，父母深色，孩子黑色，路浅色。",
    label: ""
  },

  // ── 第五章 ──
  ch5: { prompt: "章节封面卡：米黄底，居中大字 \"五\"，下方小字 \"给未来的自己，留一句感谢\"。极简留白。", label: "" },
  "common-path": {
    prompt: "扁平插画。画面中央一条朴素的乡间小路向远方延伸，路两边是田野和电线杆。没有任何捷径标志。米黄底色，路深灰，田野浅黄绿，电线杆黑色。",
    label: ""
  },
  recharge: {
    prompt: "扁平插画。画面中央一只手机或电池图标，正在通过一根线连接到一个小人头顶。电量条慢慢变满。米黄底色，电池金黄色，线深色，小人黑色。",
    label: "",
    overlays: [
      { text: "充值", xPct: 50, yPct: 25, style: "os-stamp", animation: "oa-stamp-hit", delay: 200 },
    ]
  },
  "mirror-future": {
    prompt: "扁平插画。画面中央一面椭圆形镜子，镜框深棕色。镜子里映出一个更年长的自己，正在抬头看回来。镜子前一个年轻人站着。米黄底色，镜框深棕，人物黑色。",
    label: "",
    overlays: [
      { text: "5年后", xPct: 28, yPct: 30, style: "os-tag-pill", delay: 0 },
      { text: "10年后", xPct: 72, yPct: 30, style: "os-tag-pill", delay: 200 },
    ]
  },
  "small-step": {
    prompt: "扁平插画。画面中央一只手正在合上一本笔记本（不是合上整个人生，只是收束这一刻）。笔记本旁边有一支铅笔。米黄底色，笔记本浅色，铅笔黑色。",
    label: "",
    overlays: [
      { text: "今天先做一件小事", xPct: 50, yPct: 70, style: "os-handwrite", animation: "oa-fade", delay: 300 },
    ]
  },
  "thanks-note": {
    prompt: "扁平插画。画面中央一张便签纸，纸上写着一个红色的\"谢\"字（用空白红色方框代替）。便签的角微微卷起。米黄底色，便签米白，红字鲜艳。",
    label: "",
    overlays: [
      { text: "感谢现在的自己", xPct: 50, yPct: 75, style: "os-handwrite", animation: "oa-fade", delay: 300 },
    ]
  },
};
