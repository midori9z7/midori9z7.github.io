/* side-toc.js — 从页面结构生成侧边目录
   宽屏（>=78rem）是纸张右侧的固定栏；窄屏收成右下角「目录」按钮 + 抽屉。

   依赖的页面结构（本页正文自己就是目录的唯一来源，加课/改课名都不用动这个脚本）：
     <details class="unit" id="u01">
       <summary>单元名 · 第1—4课</summary>
       <h3 id="l01">第1课 课名</h3> …
     </details>
   以及：
     <button class="toc-fab">  <nav class="side-toc"><ol class="side-toc-list"></ol></nav>
     <div class="toc-backdrop">                                            */

(function () {
  'use strict';

  var nav = document.querySelector('.side-toc');
  var list = nav && nav.querySelector('.side-toc-list');
  if (!nav || !list) return;

  var fab = document.querySelector('.toc-fab');
  var closeBtn = nav.querySelector('.side-toc-close');
  var backdrop = document.querySelector('.toc-backdrop');

  function textOf(el) { return el ? (el.textContent || '').trim() : ''; }
  // 折叠住的 <details> 里的元素没有布局盒
  function visible(el) { return el.getClientRects().length > 0; }

  // ---- 建目录 ----
  var units = [];
  var lessons = [];

  Array.prototype.forEach.call(document.querySelectorAll('details.unit'), function (box) {
    var summary = box.querySelector('summary');
    var unit = {
      id: box.id,
      box: box,
      // summary 是「单元名 · 第1—4课」，侧栏只要单元名
      label: textOf(summary).split(' · ')[0],
      node: null,
      link: null
    };

    var ol = document.createElement('ol');
    Array.prototype.forEach.call(box.querySelectorAll('h3[id]'), function (h) {
      var lesson = { id: h.id, heading: h, unit: unit, node: null, link: null };

      var li = document.createElement('li');
      li.className = 'side-toc-lesson';
      var a = document.createElement('a');
      a.href = '#' + lesson.id;
      a.textContent = textOf(h);
      li.appendChild(a);
      ol.appendChild(li);

      lesson.node = li;
      lesson.link = a;
      lessons.push(lesson);
    });

    var li = document.createElement('li');
    li.className = 'side-toc-unit';
    var a = document.createElement('a');
    a.href = '#' + unit.id;
    a.textContent = unit.label;
    li.appendChild(a);
    li.appendChild(ol);
    list.appendChild(li);

    unit.node = li;
    unit.link = a;
    units.push(unit);
  });

  if (!lessons.length) return;

  // ---- 当前读到哪儿 ----
  var activeLesson = null;
  var activeUnit = null;

  function update() {
    var threshold = 150;
    var lastUnit = null;
    var lastLesson = null;
    var i;

    for (i = 0; i < units.length; i++) {
      if (visible(units[i].box) && units[i].box.getBoundingClientRect().top <= threshold) {
        lastUnit = units[i];
      }
    }
    for (i = 0; i < lessons.length; i++) {
      if (visible(lessons[i].heading) && lessons[i].heading.getBoundingClientRect().top <= threshold) {
        lastLesson = lessons[i];
      }
    }
    // 还没读到第一课之前，只高亮单元，不硬点某一课
    if (!lastUnit) lastUnit = lastLesson ? lastLesson.unit : (units.length ? units[0] : null);

    if (lastLesson === activeLesson && lastUnit === activeUnit) return;
    activeLesson = lastLesson;
    activeUnit = lastUnit;

    lessons.forEach(function (l) {
      var on = l === activeLesson;
      l.node.classList.toggle('is-active', on);
      if (on) l.link.setAttribute('aria-current', 'true');
      else l.link.removeAttribute('aria-current');
    });
    units.forEach(function (u) {
      u.node.classList.toggle('is-active', u === activeUnit);
    });

    if (activeLesson) reveal(activeLesson.link);
  }

  // 把当前项滚进侧栏视野（已经看得见就不动，免得跟手动滚动打架）
  function reveal(link) {
    var top = link.offsetTop;
    var height = link.offsetHeight;
    var view = nav.scrollTop;
    var viewport = nav.clientHeight;
    if (top < view + 12 || top + height > view + viewport - 12) {
      nav.scrollTop = Math.max(0, top - viewport / 2 + height / 2);
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // ---- 抽屉 ----
  function setDrawer(open) {
    nav.classList.toggle('is-open', open);
    if (backdrop) backdrop.classList.toggle('is-open', open);
    if (fab) fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      update();
      if (activeLesson) reveal(activeLesson.link);
    }
  }

  if (fab) {
    fab.addEventListener('click', function () {
      setDrawer(!nav.classList.contains('is-open'));
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false); });
  if (backdrop) backdrop.addEventListener('click', function () { setDrawer(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) setDrawer(false);
  });

  // ---- 跳转 ----
  function goTo(id) {
    var target = document.getElementById(id);
    if (!target) return;
    var box = target.closest ? target.closest('details') : null;
    if (box && !box.open) box.open = true;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // replaceState：地址栏能分享，但不会把后退键塞满 30 条记录
    if (window.history && history.replaceState) history.replaceState(null, '', '#' + id);
    setDrawer(false);
  }

  list.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    goTo(a.getAttribute('href').slice(1));
  });

  // ---- 带 hash 打开时，先把对应单元展开 ----
  if (location.hash.length > 1) {
    var initial = document.getElementById(location.hash.slice(1));
    if (initial) {
      var owner = initial.closest ? initial.closest('details') : null;
      if (owner && !owner.open) owner.open = true;
    }
  }

  update();
})();
