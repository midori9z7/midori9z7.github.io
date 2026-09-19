/* mindmap.js — 把 FreeMind 的 .mm 渲染成导图
   <div class="mindmap" data-src="/mindmaps/x.mm"></div>
   <script src="/mindmap.js" defer></script>
   d3 与 markmap-view 只在页面出现导图时才加载 */

(function () {
  'use strict';

  var containers = document.querySelectorAll('.mindmap[data-src]');
  if (!containers.length) return;

  // vendor/ 以本文件位置为基准
  var base = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/[^/]*$/, '')
    : '/';

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('加载失败：' + src)); };
      document.head.appendChild(s);
    });
  }

  var libs = null;
  function loadLibs() {
    if (!libs) {
      libs = loadScript(base + 'vendor/d3.min.js')
        .then(function () { return loadScript(base + 'vendor/markmap-view.min.js'); });
    }
    return libs;
  }

  function escapeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function build(el) {
    // children 必须是数组，叶子也不能省
    var node = { content: escapeHTML(el.getAttribute('TEXT') || ''), children: [] };
    for (var i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      if (child.tagName === 'node') node.children.push(build(child));
    }
    if (el.getAttribute('FOLDED') === 'true') node.payload = { fold: 1 };
    return node;
  }

  function parseMM(text) {
    var doc = new DOMParser().parseFromString(text, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('.mm 不是有效的 XML');

    var map = doc.querySelector('map');
    var root = null;
    if (map) {
      for (var i = 0; i < map.children.length; i++) {
        if (map.children[i].tagName === 'node') { root = map.children[i]; break; }
      }
    }
    if (!root) throw new Error('.mm 里没有找到根节点');
    return build(root);
  }

  function lineColor() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--mm-line');
    return (v || '').trim() || '#8a8a8a';
  }

  var entries = [];
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function draw(entry) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    entry.svg.replaceWith(svg);
    entry.svg = svg;

    var line = lineColor();

    // color / lineWidth 必须是函数，markmap 内部会直接调用
    var mm = new window.markmap.Markmap(svg, {
      duration: 300,
      autoFit: true,
      initialExpandLevel: -1,
      maxWidth: 260,
      nodeMinHeight: 16,
      paddingX: 10,
      spacingHorizontal: 64,
      spacingVertical: 8,
      zoom: false,   // 开着的话，鼠标停在图上滚轮会变成缩放，页面滚不动
      pan: false,
      color: function () { return line; },   // 连线单色
      lineWidth: function () { return 1.1; }
    });

    return mm.setData(entry.tree).then(function () { mm.fit(); });
  }

  function fail(box, src, err) {
    box.classList.add('mindmap-error');
    box.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'mindmap-src';
    p.innerHTML = '这张导图没能渲染出来（' + escapeHTML(String(err && err.message || err)) +
      '）。<a href="' + src + '">下载 .mm 源文件</a>';
    box.appendChild(p);
    if (window.console) console.error('[mindmap]', src, err);
  }

  function sourceLink(box, src) {
    var p = document.createElement('p');
    p.className = 'mindmap-src';
    p.innerHTML = '<a href="' + src + '">.mm 源文件</a>';
    box.parentNode.insertBefore(p, box.nextSibling);
  }

  Array.prototype.forEach.call(containers, function (box) {
    var src = box.getAttribute('data-src');
    box.setAttribute('aria-busy', 'true');
    box.textContent = '正在加载导图…';

    var entry = { box: box, src: src, svg: null, tree: null };
    entries.push(entry);

    fetch(src)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (text) {
        entry.tree = parseMM(text);
        return loadLibs();
      })
      .then(function () {
        box.textContent = '';
        var svg = document.createElementNS(SVG_NS, 'svg');
        box.appendChild(svg);
        entry.svg = svg;
        return draw(entry);
      })
      .then(function () {
        box.removeAttribute('aria-busy');
        sourceLink(box, src);
      })
      .catch(function (err) { fail(box, src, err); });
  });

  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var onChange = function () {
    entries.forEach(function (entry) {
      if (entry.svg && entry.tree) {
        draw(entry).catch(function (err) { console.error('[mindmap] redraw failed', err); });
      }
    });
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
})();
