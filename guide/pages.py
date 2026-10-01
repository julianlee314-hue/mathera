import json, re
from pypdf import PdfReader
r = PdfReader('/home/claude/guide/Mathera-Curriculum-Guide.pdf'); pg = {}
for i, p in enumerate(r.pages):
    for m in re.findall(r'zq([IVX]+(?:x\d+)?)zq', (p.extract_text() or '').replace(' ', '')):
        pg.setdefault(m.replace('x', '.'), i + 1)
json.dump(pg, open('/home/claude/guide/pages.json', 'w')); print(len(r.pages), 'pages;', len(pg), 'markers')
