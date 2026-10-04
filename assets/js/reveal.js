/* reveal.js — 通用滚动动效（苹果风格，供所有页面复用）
   - Hero / 标题区（.hero / .paper-head）滚动视差淡出
   - 内容块滚动联动浮现：.reveal、文章页标题·图·代码·思维导图、aboutme section、目录页
   尊重 prefers-reduced-motion；打印时由 paper.css 的 !important 兜底复位。 */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var FLOAT_SEL = '.reveal, article h2, article h3, article figure, article .mindmap, ' +
                  'article pre, article blockquote, article table, article .unit, ' +
                  'article .toc, article .verse, .wrap section, .post h1, .post ul';
  var floats = Array.prototype.slice.call(document.querySelectorAll(FLOAT_SEL));
  var hero = document.querySelector('.hero, .paper-head');

  var ticking = false;
  function update() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var y = window.scrollY || document.documentElement.scrollTop || 0;

    // 视差淡出：以 25% 速度上移，滑过约 85% 视口后完全隐藏
    if (hero) {
      var f = Math.max(0, 1 - y / (vh * 0.85));
      hero.style.opacity = String(f);
      hero.style.transform = 'translateY(' + (y * 0.25).toFixed(2) + 'px)';
      hero.style.pointerEvents = f < 0.05 ? 'none' : '';
    }

    // 滚动联动浮现：元素顶部从视口底部进入、到 90% 视口高度处完全显现
    var start = vh, end = vh * 0.9, range = start - end;
    for (var i = 0; i < floats.length; i++) {
      var el = floats[i];
      if (el._done) continue;
      var top = el.getBoundingClientRect().top;
      var p = (start - top) / range;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      if (p >= 1) { el._done = true; p = 1; }
      el.style.opacity = String(p);
      el.style.transform = 'translateY(' + ((1 - p) * 20).toFixed(2) + 'px)';
    }
    ticking = false;
  }
  function request() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
})();
