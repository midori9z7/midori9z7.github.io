# -*- coding: utf-8 -*-
"""把《幻灵》系列合成一个 docx：exports/诗歌/幻灵（合集）.docx

每首诗独占一页，页内只有「诗题（加粗）+ 逐行正文」，与单篇导出保持一致。
"""
import html as htmllib
import os
import re

from docx import Document

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT, "exports", "诗歌")
OUT = os.path.join(OUT_DIR, "幻灵（合集）.docx")

SOURCES = [
    "posts/poems/2026/幻灵，第4号.html",
    "posts/poems/2026/幻灵，第6号.html",
    "posts/poems/2026/幻灵，第8号.html",
    "posts/poems/2026/幻灵，第13号.html",
    "posts/poems/2026/幻灵，第14号.html",
]


def load(rel):
    text = open(os.path.join(ROOT, rel), encoding="utf-8").read()
    title = htmllib.unescape(re.search(r'<h1 class="title">(.*?)</h1>', text, re.S).group(1)).strip()
    verse = re.search(r'<pre class="verse">(.*?)</pre>', text, re.S).group(1)
    verse = htmllib.unescape(verse).replace("\r\n", "\n").strip("\n")
    lines = [ln.rstrip() for ln in verse.split("\n")]
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return title, lines


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    doc = Document()
    normal = doc.styles["Normal"].paragraph_format
    normal.space_before = 0
    normal.space_after = 0
    normal.line_spacing = 1.0

    doc.add_paragraph().add_run("幻灵").bold = True

    for idx, rel in enumerate(SOURCES):
        title, lines = load(rel)
        p = doc.add_paragraph()
        if idx > 0:
            p.paragraph_format.page_break_before = True
        p.add_run(title).bold = True
        for line in lines:
            doc.add_paragraph(line)

    cp = doc.core_properties
    cp.title = "幻灵"
    cp.author = ""
    cp.last_modified_by = ""
    cp.comments = ""
    doc.save(OUT)
    print("saved", os.path.relpath(OUT, ROOT))


if __name__ == "__main__":
    main()
