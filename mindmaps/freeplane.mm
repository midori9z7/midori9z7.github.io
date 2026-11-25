<map version="freeplane 1.12.15">
<!--To view this file, download free mind mapping software Freeplane from https://www.freeplane.org -->
<node TEXT="Freeplane 的样子" FOLDED="false" ID="ID_root" CREATED="1764000000000" MODIFIED="1764000000000">
<font NAME="SansSerif" SIZE="18" BOLD="true"/>
<hook NAME="MapStyle">
    <properties show_icons="BESIDE_NODES" show_tags="UNDER_NODES" show_note_icons="true" show_icon_for_attributes="true" fit_to_viewport="false" showTagCategories="false"/>
    <tags category_separator="::" tagcolor1="重点#c07b2eff" tagcolor2="待办#3f74a8ff" tagcolor3="已读#5d8a5dff"/>
</hook>
<node TEXT="富文本节点" POSITION="right" ID="ID_1" CREATED="1764000000000" MODIFIED="1764000000000">
<icon BUILTIN="edit"/>
<richcontent TYPE="NODE"><html>
  <head>
    
  </head>
  <body>
    <p>
      粗体 <b>bold</b>、斜体 <i>italic</i>、<font color="#1f4e79">蓝色字</font>、<u>下划线</u>
    </p>
    <p>
      第二个段落会折成第二行
    </p>
  </body>
</html></richcontent>
</node>
<node TEXT="备注与详情" POSITION="right" ID="ID_2" CREATED="1764000000000" MODIFIED="1764000000000">
<icon BUILTIN="bookmark"/>
<richcontent TYPE="NOTE"><html>
  <head>
    
  </head>
  <body>
    <p>
      备注平时收在一个小圆圈里，鼠标移上去才出来——和 Freeplane 里的行为一样。
    </p>
    <p>
      里面也可以有 <b>粗体</b> 和 <a href="https://docs.freeplane.org/">链接</a>。
    </p>
  </body>
</html></richcontent>
<richcontent TYPE="DETAILS"><html>
  <head>
    
  </head>
  <body>
    <p>
      详情是更长的一段说明，来源是 Freeplane 的「详情」面板。
    </p>
  </body>
</html></richcontent>
</node>
<node TEXT="图标" POSITION="right" ID="ID_3" CREATED="1764000000000" MODIFIED="1764000000000">
<icon BUILTIN="idea"/>
<icon BUILTIN="messagebox_warning"/>
<icon BUILTIN="button_ok"/>
<icon BUILTIN="star"/>
<node TEXT="一排内置图标，按 BUILTIN 名字换成字形" ID="ID_3_1" CREATED="1764000000000" MODIFIED="1764000000000"/>
</node>
<node TEXT="标签" POSITION="right" ID="ID_4" CREATED="1764000000000" MODIFIED="1764000000000" TAGS="重点&#xa;已读">
<node TEXT="TAGS 里用换行分隔，颜色取地图样式里的 tagcolor" ID="ID_4_1" CREATED="1764000000000" MODIFIED="1764000000000"/>
</node>
<node TEXT="属性" POSITION="right" ID="ID_5" CREATED="1764000000000" MODIFIED="1764000000000">
<attribute NAME="版本" VALUE="1.12.15"/>
<attribute NAME="授权" VALUE="GPLv3"/>
<node TEXT="属性排在节点文字下面一行，小一号的灰字" ID="ID_5_1" CREATED="1764000000000" MODIFIED="1764000000000"/>
</node>
<node TEXT="节点链接" POSITION="right" ID="ID_6" CREATED="1764000000000" MODIFIED="1764000000000" LINK="https://www.freeplane.org">
<node TEXT="LINK 属性让整块文字变成可点的链接" ID="ID_6_1" CREATED="1764000000000" MODIFIED="1764000000000"/>
</node>
<node TEXT="颜色" POSITION="right" ID="ID_7" CREATED="1764000000000" MODIFIED="1764000000000" COLOR="#7a1f1f">
<font NAME="SansSerif" SIZE="12" BOLD="true"/>
<node TEXT="节点自己的文字颜色" ID="ID_7_1" CREATED="1764000000000" MODIFIED="1764000000000" COLOR="#1f4e79">
<edge COLOR="#b3289f"/>
</node>
<node TEXT="有底色的节点" ID="ID_7_2" CREATED="1764000000000" MODIFIED="1764000000000" BACKGROUND_COLOR="#f0e6cf"/>
<node TEXT="连线颜色写在子节点的 edge 上" ID="ID_7_3" CREATED="1764000000000" MODIFIED="1764000000000"/>
</node>
<node TEXT="汇总节点" POSITION="right" ID="ID_9" CREATED="1764000000000" MODIFIED="1764000000000">
<icon BUILTIN="list"/>
<node TEXT="第一条" ID="ID_9_1" CREATED="1764000000000" MODIFIED="1764000000000"/>
<node TEXT="第二条" ID="ID_9_2" CREATED="1764000000000" MODIFIED="1764000000000"/>
<node TEXT="两句合成一句" ID="ID_9_3" CREATED="1764000000000" MODIFIED="1764000000000">
<hook NAME="SummaryNode"/>
</node>
</node>
<node TEXT="折叠" POSITION="left" ID="ID_8" CREATED="1764000000000" MODIFIED="1764000000000" FOLDED="true">
<icon BUILTIN="closed"/>
<node TEXT="FOLDED=&quot;true&quot; 的节点默认收起" ID="ID_8_1" CREATED="1764000000000" MODIFIED="1764000000000"/>
<node TEXT="点左边的小圆圈展开" ID="ID_8_2" CREATED="1764000000000" MODIFIED="1764000000000"/>
<node TEXT="滚进视野才去读文件，一页挂很多张也不怕" ID="ID_8_3" CREATED="1764000000000" MODIFIED="1764000000000"/>
</node>
</node>
</map>
