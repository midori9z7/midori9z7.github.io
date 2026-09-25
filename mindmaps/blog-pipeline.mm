<map version="1.0.1">
<node TEXT="从 .mm 到页面" POSITION="right">
<font NAME="SansSerif" SIZE="12"/>
<edge COLOR="#808080" WIDTH="thin"/>
<node TEXT="作者这一侧" POSITION="right">
<node TEXT="在 FreeMind 里画导图"/>
<node TEXT="存成 .mm：就是一个 XML 纯文本"/>
<node TEXT="丢进 mindmaps/ 目录"/>
<node TEXT="文章里写一行 div 引用它"/>
</node>
<node TEXT="页面这一侧" POSITION="right">
<node TEXT="mindmap.js 找到 .mindmap[data-src]"/>
<node TEXT="fetch 取回 .mm"/>
<node TEXT="DOMParser 解析 XML"/>
<node TEXT="每个 node 取 TEXT，按嵌套组成树"/>
<node TEXT="按需加载 d3 与 markmap-view"/>
<node TEXT="markmap 画成 SVG"/>
</node>
<node TEXT="主题怎么跟上" POSITION="right">
<node TEXT="连线颜色读 CSS 变量 --mm-line"/>
<node TEXT="文字颜色读 --markmap-text-color"/>
<node TEXT="字体用浏览器默认，不指定"/>
<node TEXT="深色模式由 prefers-color-scheme 触发重画"/>
</node>
<node TEXT="出问题时的兜底" POSITION="left" FOLDED="true">
<node TEXT="404 或坏 XML 都显示原因"/>
<node TEXT="图下面永远留一个 .mm 源文件链接"/>
<node TEXT="没有导图的页面不加载 d3 和 markmap"/>
</node>
</node>
</map>
