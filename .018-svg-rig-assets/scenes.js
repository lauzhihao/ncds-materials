/* scenes.js — 示例场景配置（即 Agent 应当输出的结构化 JSON）
 *
 * 这就是整套系统的「上层契约」：Agent 不创作 SVG、不写动画，只输出下面这种选择，
 * 由 RigSystem.renderScene() 组装成会动的版式卡片。第一条复刻了上游对话里的范例。
 */
(function () {
  window.RIG_SCENES = [
    {
      title: '人从什么时候开始不再一味迁就',
      tag: '知识分享',
      character: 'cheer',
      motion: ['raise-arms', 'idle-breathe'],
      intensity: 1,
      speed: 1,
      subtitleZh: '但其实那些你开始不愿迁就的瞬间',
      subtitleEn: "But actually, those moments when you start refusing to accommodate others",
      theme: 'paper',
    },
    {
      title: '为什么你越解释，别人越不信？',
      tag: '沟通心理',
      character: 'thinking',
      motion: ['think-tilt', 'bubble-float', 'idle-breathe'],
      intensity: 1,
      speed: 0.95,
      subtitleZh: '因为对方记住的是情绪，不是道理',
      subtitleEn: 'Because people remember how you made them feel, not your logic',
      theme: 'paper',
    },
    {
      title: '记住这三个数字就够了',
      tag: '干货拆解',
      character: 'present',
      motion: ['point-right', 'prop-swing', 'idle-breathe'],
      intensity: 1.1,
      speed: 1,
      subtitleZh: '把复杂的事讲简单，是一种能力',
      subtitleEn: 'Making the complex simple is a real skill',
      theme: 'dark',
    },
  ];
})();
