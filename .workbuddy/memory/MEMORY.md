# 项目长期记忆（midori9z7.github.io）

## present_files 预览的坑（重要）

- 预览打开时会向磁盘源文件注入 ` data-page-node-id="..."` 垃圾属性（每次 present 都会重新注入）。
- 更危险：present 之后短时间内做的 Edit 可能被预览的延迟回写**整体回滚**（回滚成预览缓存的旧 DOM + 注入属性）。本次 5 个 Edit 全部被回滚过一次。
- 安全流程：**先 Write/Edit → 立即 grep 验证落盘 → present_files → 用 `perl -pi -e 's/ data-page-node-id="[^"]*"//g' index.html` 清理注入 → 再验证**（内容不会被清坏，perl 只删 ASCII 属性子串）。

## 首页设计约定

- index.html = Apple 风格（Jobs 式克制配色）：**只用黑、白、灰 + 链接蓝**（light #0066cc / dark #2997ff），用户明确不要渐变等多彩色。
- 动效照苹果官网：**滚动联动浮现**（opacity/translateY 由 scrollY 实时驱动，非定时动画）+ **Hero 视差淡出**（25% 速度上移、85% 视口后全隐）+ `›` 箭头位移。用户要求「快速、简洁」。
- 保留用户的沙盘粒子效果（现为中性灰：白底黑尘 rgba(0,0,0,.12) / 黑底白尘 rgba(255,255,255,.16)），逻辑勿动。
- 头像深浅色双图切换（shiina 2.jpg / Shiina 1.jpg），大圆角方形（26%）。
- aboutme.html 与文章页仍是旧衬线风格，未统一。

## 仓库结构备忘

- GitHub 用户站点仓库（midori9z7.github.io），根绝对路径 `/assets/...` 有效。
- `assets/css/style.css` 只服务文章页（body 衬线字体），index.html 未引用它。
- mindmaps/*.mm 由文章页 markmap 方案渲染（vendor: d3 + markmap-view）。
- `.workbuddy/memory/` 目录曾被整体删除过一次（2026-10-03 22:54 发现，含已跟踪的 2026-10-02.md），已用 git 恢复；原因未明，留意。
