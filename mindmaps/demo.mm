<map version="1.0.1">
<node TEXT="思维导图" POSITION="right">
<font NAME="SansSerif" SIZE="12"/>
<edge COLOR="#808080" WIDTH="thin"/>
<node TEXT="为什么用 .mm" POSITION="right" COLOR="#006699">
<font NAME="SansSerif" SIZE="12" BOLD="true"/>
<node TEXT="纯文本，可以进 git"/>
<node TEXT="在 FreeMind 里画完直接存盘"/>
<node TEXT="改一次导图 = 覆盖一个文件，不用重新导出图片"/>
<node TEXT="没有图床、没有外链，页面自己读它"/>
</node>
<node TEXT="页面这一侧发生了什么" POSITION="right">
<node TEXT="mindmap.js 找到带 data-src 的 div"/>
<node TEXT="fetch 取回 .mm 文件"/>
<node TEXT="DOMParser 解析 XML，取出每个节点的 TEXT"/>
<node TEXT="按嵌套关系组成一棵树，交给 markmap 画成 SVG"/>
<node TEXT="连线和文字颜色读的是页面的 CSS 变量，所以深色模式自动跟上"/>
</node>
<node TEXT="折叠是有效的" POSITION="right" FOLDED="true">
<node TEXT="这个节点在 .mm 里写了 FOLDED=&quot;true&quot;"/>
<node TEXT="页面上点一下圆圈就能展开"/>
<node TEXT="点任何节点都可以折叠 / 展开"/>
<node TEXT="滚轮缩放，拖动平移"/>
</node>
<node TEXT="需要注意" POSITION="left">
<node TEXT="必须通过 http(s) 访问，本地 file:// 双击打不开"/>
<node TEXT="只读取 TEXT 属性，字体、图标、连线颜色不还原"/>
<node TEXT="备注（笔记）和箭头链接也暂时忽略"/>
</node>
</node>
</map>
