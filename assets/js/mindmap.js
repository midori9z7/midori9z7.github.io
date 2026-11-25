/* mindmap.js — 把 FreeMind / Freeplane 的 .mm 渲染成导图
   <div class="mindmap" data-src="/mindmaps/x.mm"></div>
   <div class="mindmap" data-src="/mindmaps/x.mm" data-plain></div>   ← 只读文字，不要富文本
   <script src="/assets/js/mindmap.js" defer></script>
   d3 与 markmap-view 只在页面出现导图、且导图滚到眼前时才加载

   Freeplane 的东西：富文本节点（richcontent）、备注与详情、内置图标、
   标签、属性、节点链接、节点颜色与字号、连线颜色。 */

(function () {
  'use strict';

  var containers = document.querySelectorAll('.mindmap[data-src]');
  if (!containers.length) return;

  // d3 / markmap-view 在 assets/vendor/，以本文件（assets/js/mindmap.js）位置为基准
  var base = '/assets/vendor/';
  if (document.currentScript && document.currentScript.src) {
    try { base = new URL('../vendor/', document.currentScript.src).href; } catch (e) { /* 保持默认 */ }
  }

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
      libs = loadScript(base + 'd3.min.js')
        .then(function () { return loadScript(base + 'markmap-view.min.js'); });
    }
    return libs;
  }

  // ---------- 文本与颜色的小工具 ----------

  function escapeHTML(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escapeAttr(s) {
    return escapeHTML(s).replace(/"/g, '&quot;');
  }

  function textOf(html) {
    return String(html).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }

  var darkMQ = window.matchMedia('(prefers-color-scheme: dark)');

  function hexRGB(c) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})(?:[0-9a-f]{2})?$/i.exec(String(c || '').trim());
    if (!m) return null;
    var h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function lumOf(c) {
    var p = hexRGB(c);
    if (!p) return null;
    return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;
  }

  function lighten(c, k) {
    var p = hexRGB(c);
    if (!p) return c;
    return '#' + p.map(function (x) {
      var v = Math.round(x + (255 - x) * k);
      return ('0' + v.toString(16)).slice(-2);
    }).join('');
  }

  // 深色模式下，Freeplane 里写死的近黑色文字会看不见，往白色提一提
  function textColor(c) {
    var l = lumOf(c);
    if (l === null) return c;
    return (darkMQ.matches && l < 0.38) ? lighten(c, 0.55) : c;
  }

  // ---------- 富文本清洗 ----------

  var SKIP = { HEAD: 1, STYLE: 1, SCRIPT: 1, TITLE: 1, META: 1, LINK: 1 };
  var KEEP = {
    B: 'b', STRONG: 'b', I: 'i', EM: 'i', U: 'u', S: 's', STRIKE: 's', DEL: 's',
    SUP: 'sup', SUB: 'sub', CODE: 'code', KBD: 'code',
    H1: 'b', H2: 'b', H3: 'b', H4: 'b', H5: 'b', H6: 'b'
  };
  var STYLE_OK = /^(color|background-color|font-weight|font-style|text-decoration|text-decoration-line|font-size|vertical-align)$/;

  function safeStyle(text) {
    var out = [];
    String(text || '').split(';').forEach(function (decl) {
      var i = decl.indexOf(':');
      if (i < 1) return;
      var k = decl.slice(0, i).trim().toLowerCase();
      var v = decl.slice(i + 1).trim();
      if (!v || !STYLE_OK.test(k)) return;
      if (/url\(|expression|javascript:/i.test(v)) return;
      // 字号只收 px / em / %，别让一句 font-size:999px 把整张图撑坏
      if (k === 'font-size' && !/^\d+(\.\d+)?(px|em|%)$/.test(v)) return;
      out.push(k + ':' + v);
    });
    return out.join(';');
  }

  function safeHref(href) {
    var h = String(href || '').trim();
    if (/^(https?:\/\/|mailto:)/i.test(h)) return h;
    if (/^(\/|\.{0,2}\/)/.test(h) || /^[\w.-]+\.(html?|pdf|png|jpe?g|svg|gif)$/i.test(h)) return h;
    return '';   // file:、javascript: 之类在网页上没有意义，只留文字
  }

  function imgHTML(el) {
    var src = String(el.getAttribute('src') || '').trim();
    if (!/^(data:image\/|https?:\/\/|\/)/i.test(src)) return '';
    return '<img src="' + escapeAttr(src) + '" alt="" style="max-height:4em;max-width:100%;vertical-align:middle">';
  }

  function tableHTML(table) {
    var lines = [];
    var rows = table.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].getElementsByTagName('*');
      var cols = [];
      for (var j = 0; j < cells.length; j++) {
        var t = cells[j].tagName.toUpperCase();
        if (t !== 'TD' && t !== 'TH') continue;
        var v = textOf(inlineHTML(cells[j]));
        if (v) cols.push(v);
      }
      if (cols.length) lines.push(cols.join(' · '));
    }
    return lines.join('<br>');
  }

  // 把 Freeplane 的 HTML 压成一行行内元素：段落 → <br>，列表 → 「· 」
  function inlineHTML(el) {
    var out = '';
    var nodes = el.childNodes;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.nodeType === 3) { out += escapeHTML(n.nodeValue.replace(/\s+/g, ' ')); continue; }
      if (n.nodeType !== 1) continue;
      var tag = n.tagName.toUpperCase();
      if (SKIP[tag]) continue;

      var inner, href, style, c;
      if (tag === 'P' || tag === 'DIV' || tag === 'BLOCKQUOTE' || tag === 'BODY') {
        var s = inlineHTML(n);
        out += (tag === 'BODY') ? s : s.replace(/^\s+|\s+$/g, '') + '<br>';
      } else if (tag === 'BR') {
        out += '<br>';
      } else if (tag === 'UL' || tag === 'OL') {
        var idx = 1;
        for (var j = 0; j < n.children.length; j++) {
          var li = n.children[j];
          if (li.tagName.toUpperCase() !== 'LI') continue;
          out += '<br>' + (tag === 'OL' ? (idx++) + '. ' : '· ') +
            inlineHTML(li).replace(/^\s+|\s+$/g, '');
        }
        out += '<br>';
      } else if (tag === 'TABLE') {
        out += tableHTML(n) + '<br>';
      } else if (tag === 'IMG') {
        out += imgHTML(n);
      } else if (tag === 'A') {
        inner = inlineHTML(n);
        href = safeHref(n.getAttribute('href'));
        out += href
          ? '<a href="' + escapeAttr(href) + '" target="_blank" rel="noopener">' + inner + '</a>'
          : inner;
      } else if (tag === 'FONT' || tag === 'SPAN') {
        inner = inlineHTML(n);
        style = [];
        var st = safeStyle(n.getAttribute('style'));
        if (st) style.push(st);
        c = n.getAttribute('color') || n.getAttribute('COLOR');
        if (c) style.push('color:' + textColor(c));
        if (tag === 'FONT') {
          // 旧式 1—7 号字，换算成 em
          var scale = { 1: 0.75, 2: 0.85, 3: 1, 4: 1.15, 5: 1.4, 6: 1.7, 7: 2 }[n.getAttribute('size')];
          if (scale) style.push('font-size:' + scale + 'em');
        }
        out += style.length ? '<span style="' + escapeAttr(style.join(';')) + '">' + inner + '</span>' : inner;
      } else if (KEEP[tag]) {
        out += '<' + KEEP[tag] + '>' + inlineHTML(n) + '</' + KEEP[tag] + '>';
      } else {
        out += inlineHTML(n);   // 不认识的标签只留文字
      }
    }
    return out;
  }

  // ---------- 图标 ----------

  var ICONS = {
    'help': '❓', 'info': 'ℹ️', 'messagebox_warning': '⚠️', 'stop-sign': '⛔',
    'closed': '🔒', 'button_ok': '✅', 'button_cancel': '❌', 'yes': '✔️', 'no': '✖️',
    'checked': '☑️', 'unchecked': '☐', 'idea': '💡', 'bookmark': '🔖', 'penguin': '🐧',
    'licq': '💬', 'knight': '♞', 'flag': '🚩', 'go-home': '🏠', 'folder': '📁',
    'file': '📄', 'desktop_new': '💻', 'edit': '✏️', 'launch': '🚀', 'attach': '📎',
    'clock': '⏰', 'calendar': '📅', 'family': '👪', 'female': '♀', 'male': '♂',
    'sport': '⚽', 'book': '📖', 'pencil': '✏️', 'prepare': '🛠️', 'choose': '☑️',
    'list': '📋', 'add': '➕', 'remove': '➖', 'up': '⬆️', 'down': '⬇️',
    'back': '◀️', 'forward': '▶️', 'video': '🎬', 'audio': '🎵', 'image': '🖼️',
    'document': '📄', 'mail': '✉️', 'phone': '📞', 'star': '⭐', 'heart': '❤️',
    'smiley-laugh': '😄', 'smiley-smile': '🙂', 'smiley-sad': '🙁', 'smiley-cry': '😢',
    'smiley-mad': '😠', 'smiley-wink': '😉', 'smiley-cool': '😎', 'smiley-confuse': '😕',
    'smiley-surprise': '😮', 'smiley-evil': '😈', 'smiley-angel': '😇', 'smiley-roll': '🙄',
    'smiley-razz': '😛', 'smiley-neutral': '😐', 'smiley-yell': '😱', 'smiley-red': '😡'
  };

  function iconHTML(el) {
    var out = '';
    for (var i = 0; i < el.children.length; i++) {
      var icon = el.children[i];
      if (icon.tagName !== 'icon') continue;
      var name = icon.getAttribute('BUILTIN') || '';
      if (!name) continue;
      var g = ICONS[name];
      out += g
        ? '<span class="mm-icon">' + g + '</span>'
        : '<span class="mm-icon" title="icon: ' + escapeAttr(name) + '">•</span>';
    }
    return out;
  }

  // ---------- 解析 ----------

  function direct(el, tag) {
    for (var i = 0; i < el.children.length; i++) {
      if (el.children[i].tagName === tag) return el.children[i];
    }
    return null;
  }

  function directRich(el, type) {
    var only = null;
    for (var i = 0; i < el.children.length; i++) {
      var c = el.children[i];
      if (c.tagName !== 'richcontent') continue;
      if (c.getAttribute('TYPE') === type) return c;
      if (!c.getAttribute('TYPE')) only = c;
    }
    // 没写 TYPE 的 richcontent 就是节点正文
    return (type === 'NODE') ? only : null;
  }

  // 地图样式里给标签配的颜色：<tags tagcolor1="名字#rrggbbaa"/>
  function tagPalette(map) {
    var out = {};
    var list = map.getElementsByTagName('tags');
    for (var i = 0; i < list.length; i++) {
      var attrs = list[i].attributes;
      for (var j = 0; j < attrs.length; j++) {
        if (!/^(tagcolor|category)/i.test(attrs[j].name)) continue;
        String(attrs[j].value).split('\n').forEach(function (line) {
          var m = /^(.*)#([0-9a-f]{6,8})$/i.exec(line.trim());
          if (m && m[1].trim()) out[m[1].trim()] = '#' + m[2].slice(0, 6);
        });
      }
    }
    return out;
  }

  function build(el, ctx) {
    // children 必须是数组，叶子也不能省
    var node = { content: '', children: [] };
    var payload = null;
    var html, style = [];

    if (ctx.plain) {
      var rawText = el.getAttribute('TEXT');
      // Freeplane 存了 richcontent 就不写 TEXT，纯文字模式得从 HTML 里抠回来
      if (!rawText) {
        var plainRich = directRich(el, 'NODE');
        if (plainRich) rawText = textOf(inlineHTML(plainRich));
      }
      html = escapeHTML(rawText || '');
    } else {
      var rich = directRich(el, 'NODE');
      html = rich ? inlineHTML(rich).replace(/(<br>)+$/, '') : escapeHTML(el.getAttribute('TEXT') || '');
      html = html.replace(/\n/g, '<br>');

      var font = direct(el, 'font');
      if (font) {
        var size = parseFloat(font.getAttribute('SIZE'));
        if (size && Math.abs(size - 12) > 0.01) style.push('font-size:' + (size / 12).toFixed(2) + 'em');
        if (font.getAttribute('BOLD') === 'true') style.push('font-weight:700');
        if (font.getAttribute('ITALIC') === 'true') style.push('font-style:italic');
      }

      var bg = el.getAttribute('BACKGROUND_COLOR');
      var fg = el.getAttribute('COLOR');
      if (bg) {
        style.push('background-color:' + bg, 'padding:0 .25em', 'border-radius:3px');
      }
      if (fg) style.push('color:' + (bg ? fg : textColor(fg)));
      else if (bg) style.push('color:' + (lumOf(bg) > 0.55 ? '#1b1b1b' : '#f2f2f2'));
    }

    if (style.length) html = '<span style="' + escapeAttr(style.join(';')) + '">' + html + '</span>';

    var href = ctx.plain ? '' : safeHref(el.getAttribute('LINK'));
    if (href) {
      html = '<a href="' + escapeAttr(href) + '" target="_blank" rel="noopener">' + html + '</a>';
    }

    var icons = ctx.plain ? '' : iconHTML(el);
    if (icons) html = '<span class="mm-icons">' + icons + '</span>' + html;

    var tags = ctx.plain ? [] : String(el.getAttribute('TAGS') || '').split('\n')
      .map(function (t) { return t.trim(); })
      .filter(Boolean);
    if (tags.length) {
      html += '<span class="mm-tags">' + tags.map(function (t) {
        var col = ctx.tagColors[t];
        var st = col ? ' style="color:' + col + ';border-color:' + col + '"' : '';
        return '<span class="mm-tag"' + st + '>' + escapeHTML(t) + '</span>';
      }).join('') + '</span>';
    }

    if (!ctx.plain) {
      var tip = '';
      var note = directRich(el, 'NOTE');
      var details = directRich(el, 'DETAILS');
      var noteHTML = note ? inlineHTML(note).replace(/(<br>)+$/, '') : '';
      var detailHTML = details ? inlineHTML(details).replace(/(<br>)+$/, '') : '';
      if (textOf(noteHTML)) tip += '<div class="mm-tip-h">备注</div><div class="mm-tip-b">' + noteHTML + '</div>';
      if (textOf(detailHTML)) tip += '<div class="mm-tip-h">详情</div><div class="mm-tip-b">' + detailHTML + '</div>';
      if (tip) {
        html += '<span class="mm-mark" tabindex="0" role="button" aria-label="备注与详情"' +
          ' data-tip="' + escapeAttr(tip) + '">i</span>';
      }
    }

    var attrs = [];
    if (!ctx.plain) {
      for (var i = 0; i < el.children.length; i++) {
        var a = el.children[i];
        if (a.tagName !== 'attribute') continue;
        var name = a.getAttribute('NAME');
        var value = a.getAttribute('VALUE');
        if (!name) continue;
        attrs.push('<span class="mm-attr"><span class="mm-attr-k">' + escapeHTML(name) + '</span>' +
          (value ? ' ' + escapeHTML(value) : '') + '</span>');
      }
    }
    if (attrs.length) html += '<br><span class="mm-attrs">' + attrs.join('') + '</span>';

    node.content = html;

    var edge = ctx.plain ? null : direct(el, 'edge');
    var stroke = edge && edge.getAttribute('COLOR');
    if (stroke) payload = { stroke: stroke };
    if (el.getAttribute('FOLDED') === 'true') {
      payload = payload || {};
      payload.fold = 1;
    }
    if (payload) node.payload = payload;

    for (var k = 0; k < el.children.length; k++) {
      var child = el.children[k];
      if (child.tagName === 'node') node.children.push(build(child, ctx));
    }
    return node;
  }

  function parseMM(text, plain) {
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

    return build(root, { plain: !!plain, tagColors: tagPalette(map) });
  }

  // ---------- 画 ----------

  function lineColor() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--mm-line');
    return (v || '').trim() || '#8a8a8a';
  }

  var entries = [];
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function draw(entry) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    if (entry.svg) entry.svg.replaceWith(svg);
    else entry.box.appendChild(svg);
    entry.svg = svg;

    var line = lineColor();
    entry.line = line;

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
      // 连线默认单色；Freeplane 里给节点指定过 edge 颜色的就跟图走
      color: function (n) { return (n && n.payload && n.payload.stroke) || line; },
      lineWidth: function () { return 1.1; }
    });
    entry.mm = mm;

    return mm.setData(entry.tree).then(function () {
      // 折叠着的 <details> 里容器宽度是 0，这时 fit() 会把图缩坏，等展开再贴合
      if (entry.box.clientWidth > 0) mm.fit();
    });
  }

  function fail(box, src, err) {
    box.classList.add('mindmap-error');
    box.removeAttribute('aria-busy');
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

  function load(entry) {
    if (entry.state !== 'idle') return;
    entry.state = 'loading';

    var box = entry.box, src = entry.src;
    box.setAttribute('aria-busy', 'true');
    box.textContent = '正在加载导图…';

    fetch(src)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (text) {
        entry.text = text;
        entry.tree = parseMM(text, entry.plain);
        return loadLibs();
      })
      .then(function () {
        box.textContent = '';
        return draw(entry);
      })
      .then(function () {
        box.removeAttribute('aria-busy');
        entry.state = 'done';
        sourceLink(box, src);
      })
      .catch(function (err) {
        entry.state = 'failed';
        fail(box, src, err);
      });
  }

  function redraw(entry) {
    // 颜色写在节点上，深浅色切换要重新解析一遍
    try { entry.tree = parseMM(entry.text, entry.plain); } catch (e) { /* 用旧树 */ }
    draw(entry).catch(function (err) { console.error('[mindmap] redraw failed', err); });
  }

  Array.prototype.forEach.call(containers, function (box) {
    entries.push({
      box: box,
      src: box.getAttribute('data-src'),
      plain: box.hasAttribute('data-plain'),
      svg: null,
      mm: null,
      text: '',
      tree: null,
      line: null,
      state: 'idle'
    });
  });

  // 滚到眼前才去 fetch + 画。折叠在 <details> 里的导图不会命中，
  // 所以「展开某个单元」本身就是一次懒加载的触发。
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (records) {
      records.forEach(function (rec) {
        if (!rec.isIntersecting) return;
        io.unobserve(rec.target);
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].box === rec.target) { load(entries[i]); return; }
        }
      });
    }, { rootMargin: '400px 0px' });
    entries.forEach(function (entry) { io.observe(entry.box); });
  } else {
    entries.forEach(load);
  }

  // <details> 收起时容器宽度归零，重新展开要重新贴合；主题换过色则重画
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (!d || d.tagName !== 'DETAILS' || !d.open) return;
    entries.forEach(function (entry) {
      if (!entry.mm || !d.contains(entry.box)) return;
      if (entry.line !== lineColor()) redraw(entry);
      else if (entry.box.clientWidth > 0) entry.mm.fit();
    });
  }, true);

  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var onChange = function () {
    entries.forEach(function (entry) {
      if (entry.tree && entry.mm) redraw(entry);
    });
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);

  // ---------- 备注的气泡 ----------

  var tip = null;
  var currentMark = null;
  function tipEl() {
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'mm-tip';
      tip.setAttribute('role', 'tooltip');
      document.body.appendChild(tip);
    }
    return tip;
  }

  function showTip(mark) {
    var html = mark.getAttribute('data-tip');
    if (!html) return;
    currentMark = mark;
    var el = tipEl();
    el.innerHTML = html;
    el.classList.add('is-open');

    var r = mark.getBoundingClientRect();
    var w = el.offsetWidth, h = el.offsetHeight;
    var left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
    var top = r.bottom + 8;
    if (top + h > window.innerHeight - 8) top = r.top - h - 8;
    el.style.left = left + 'px';
    el.style.top = Math.max(8, top) + 'px';
  }

  function hideTip() {
    currentMark = null;
    if (tip) tip.classList.remove('is-open');
  }

  function markOf(e) {
    var t = e.target;
    return (t && t.closest) ? t.closest('.mm-mark') : null;
  }

  document.addEventListener('mouseover', function (e) { var m = markOf(e); if (m) showTip(m); });
  document.addEventListener('mouseout', function (e) { if (markOf(e)) hideTip(); });
  document.addEventListener('focusin', function (e) { var m = markOf(e); if (m) showTip(m); });
  document.addEventListener('focusout', function (e) { if (markOf(e)) hideTip(); });
  document.addEventListener('click', function (e) {
    var m = markOf(e);
    if (!m) { hideTip(); return; }
    // 触屏没有 hover，点一下就开合
    e.preventDefault();
    if (currentMark === m) hideTip();
    else showTip(m);
  });
  window.addEventListener('scroll', hideTip, true);
  window.addEventListener('resize', hideTip);
})();
