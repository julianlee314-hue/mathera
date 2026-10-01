"""Build the Mathera curriculum guide: HTML → PDF (Chromium), two passes for contents page numbers."""
import json, html, os, re, subprocess, sys
G = '/home/claude/guide'
src = json.load(open(f'{G}/source.json'))
ERA = json.load(open(f'{G}/eras.json'))
out = {}
for e in src['eras']:
    for u in e['units']:
        out[u['id']] = json.load(open(f"{G}/out/{u['id']}.json"))
pages = json.load(open(f'{G}/pages.json')) if os.path.exists(f'{G}/pages.json') else {}
esc = lambda s: html.escape(s, quote=False)
mk = lambda k: 'zq' + k.replace('.', 'x') + 'zq'
LV = {'a': '1', 'b': '2', 'c': '3', 'd': '4', 'e': '★', 'f': '★★'}
nsk = sum(len(u['skills']) for e in src['eras'] for u in e['units'])
nbr = sum(len(e['units']) for e in src['eras'])

css = """
@page { size: A4; margin: 18mm 17mm 20mm 17mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: 'Carlito', 'DejaVu Sans', sans-serif; color: #1d1d1b; font-size: 10.6pt; line-height: 1.38; margin: 0; }
.mono { font-family: 'DejaVu Sans Mono', monospace; }
.sans { font-family: 'Carlito', 'DejaVu Sans', sans-serif; }
.mark { color: #fff; font-size: 1px; line-height: 0; }
h1, h2, h3, h4 { font-family: 'Caladea', 'DejaVu Serif', serif; font-weight: bold; margin: 0; }
.page { page-break-after: always; }
/* cover */
.cover { height: 255mm; display: flex; flex-direction: column; justify-content: space-between; padding: 12mm 4mm 4mm; }
.cover .brand { font-family: 'Carlito', sans-serif; letter-spacing: .2em; text-transform: uppercase; font-size: 11pt; color: #1f7a3f; }
.cover h1 { font-size: 40pt; line-height: 1.05; margin: 10mm 0 6mm; letter-spacing: -.01em; }
.cover .sub { font-size: 15pt; color: #444; max-width: 130mm; }
.cover .eras { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3mm; margin-top: 16mm; }
.cover .eras div { border-top: 5px solid; padding-top: 2mm; font-family: 'Carlito', sans-serif; font-size: 9.5pt; line-height: 1.2; }
.cover .eras b { display: block; font-size: 12pt; }
.cover .foot { font-family: 'Carlito', sans-serif; font-size: 10pt; color: #666; display: flex; justify-content: space-between; border-top: 1px solid #ccc; padding-top: 3mm; }
/* prose pages */
.prose { font-size: 10.1pt; } .prose h2 { font-size: 20pt; margin-bottom: 4mm; }
.prose h3 { font-size: 12.5pt; margin: 4.5mm 0 1.2mm; }
.prose p { margin: 0 0 2mm; max-width: 160mm; }
.lvtable { border-collapse: collapse; margin: 2mm 0 3mm; width: 100%; font-size: 9.8pt; }
.lvtable td { border-top: 1px solid #ddd; padding: 1.2mm 2mm; vertical-align: top; }
.lvtable td:first-child { width: 22mm; font-family: 'Carlito', sans-serif; font-weight: bold; white-space: nowrap; }
.pill { display: inline-block; min-width: 6.2mm; text-align: center; border-radius: 3mm; padding: 0 1.4mm; font-family: 'Carlito', sans-serif; font-weight: bold; font-size: 8.6pt; line-height: 4.4mm; border: 1px solid #bbb; color: #333; }
.pill.brave { background: #fbe9b7; border-color: #e0bf5a; color: #6d5410; }
/* overview */
.ov { width: 100%; border-collapse: collapse; font-size: 9.6pt; }
.ov td { border-top: 1px solid #ddd; padding: 2.2mm 2mm; vertical-align: top; }
.ov .en { font-family: 'Carlito', sans-serif; font-weight: bold; font-size: 11.5pt; white-space: nowrap; }
.ov .n { font-family: 'Carlito', sans-serif; color: #666; white-space: nowrap; text-align: right; }
/* contents */
.toc h2 { font-size: 20pt; margin-bottom: 4mm; }
.toc .cols { column-count: 2; column-gap: 9mm; font-size: 9pt; }
.toc .era { break-inside: avoid; margin-bottom: 2.6mm; }
.toc .era > div:first-child { font-family: 'Carlito', sans-serif; font-weight: bold; font-size: 10.5pt; border-bottom: 2px solid; margin-bottom: 1mm; display: flex; justify-content: space-between; }
.toc .row { display: flex; gap: 2mm; line-height: 1.32; }
.toc .row .id { font-family: 'DejaVu Sans Mono', monospace; font-size: 7.6pt; color: #888; width: 11mm; padding-top: .6mm; }
.toc .row .nm { flex: 1; overflow: hidden; white-space: nowrap; }
.toc .row .nm::after { content: ' . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .'; color: #bbb; }
.toc .row .pg { font-family: 'Carlito', sans-serif; width: 8mm; text-align: right; }
/* era opener */
.opener { height: 255mm; display: flex; flex-direction: column; justify-content: flex-end; padding-bottom: 20mm; }
.opener .num { font-family: 'Carlito', sans-serif; font-weight: bold; font-size: 96pt; line-height: .9; }
.opener h2 { font-size: 34pt; margin: 2mm 0 1mm; }
.opener .school { font-family: 'Carlito', sans-serif; font-size: 11.5pt; color: #555; margin-bottom: 7mm; }
.opener p { font-size: 12pt; line-height: 1.5; max-width: 150mm; margin: 0 0 8mm; }
.opener .bl { column-count: 2; column-gap: 10mm; font-size: 10pt; border-top: 3px solid; padding-top: 3mm; }
.opener .bl div { display: flex; gap: 2mm; } .opener .bl .id { font-family: 'DejaVu Sans Mono', monospace; font-size: 8pt; color: #888; width: 12mm; padding-top: .7mm; }
.opener .bl .c { color: #888; font-family: 'Carlito', sans-serif; margin-left: auto; }
/* branches and skills */
.branch { break-before: page; }
.bh { border-bottom: 3px solid; padding-bottom: 2mm; margin-bottom: 3mm; }
.bh .kick { font-family: 'Carlito', sans-serif; font-size: 9pt; letter-spacing: .12em; text-transform: uppercase; }
.bh h3 { font-size: 19pt; line-height: 1.15; margin-top: .5mm; }
.bintro { font-size: 10.8pt; color: #333; margin: 0 0 4mm; max-width: 160mm; }
.skill { break-inside: avoid; padding: 2.6mm 0 2.8mm; border-top: 1px solid #e3e3e3; display: grid; grid-template-columns: 15mm 1fr; column-gap: 3mm; }
.skill .sid { font-family: 'DejaVu Sans Mono', monospace; font-size: 7.4pt; color: #999; padding-top: 1.1mm; }
.skill h4 { font-size: 11.8pt; margin: 0 0 .4mm; }
.skill .what { margin: 0 0 1.4mm; color: #333; }
.skill ol { list-style: none; margin: 0; padding: 0; }
.skill li { display: grid; grid-template-columns: 9mm 1fr; column-gap: 1.5mm; margin: .7mm 0; font-size: 10.1pt; line-height: 1.35; }
.skill li.bv { color: #5b4610; }
.skill li .pill { justify-self: start; }
"""

def cover():
    eras = ''.join(f'<div style="border-color:{ERA[e["id"]]["color"]}"><b>{e["id"]}</b>{e["name"]}</div>' for e in src['eras'])
    return f"""<section class="page cover"><div><div class="brand">Mathera</div>
<h1>Curriculum Guide</h1><div class="sub">Every skill from counting to college mathematics, explained in plain English for parents, grandparents and anyone helping a learner.</div>
<div class="eras">{eras}</div></div>
<div class="foot"><span>7 eras · {nbr} branches · {nsk:,} skills</span><span>Beta edition · October 2026</span></div></section>"""

def howto():
    return f"""<section class="page prose"><h2>How to read this guide</h2>
<p>Mathera is a free app that teaches math from first counting all the way to second-year college mathematics. It is laid out like a tree that grows from the roots up. This guide lists every skill in that tree, in order, with a plain-English description of each one.</p>
<h3>Eras, branches and skills</h3>
<p><b>Eras.</b> The math is divided into seven eras, from Era I (Count) to Era VII (Space). Each era is roughly a stage of schooling.</p>
<p><b>Branches.</b> Each era is split into branches, each one a single topic such as <i>Fractions</i> or <i>Quadratics</i>.</p>
<p><b>Skills.</b> Each branch holds a handful of skills: one clear thing a learner can learn to do, like <i>Add and subtract tens</i>.</p>
<p>Each skill below has its name, its code (for example <span class="mono" style="font-size:8.5pt">I.4.21</span>: Era I, branch 4, skill 21), one sentence on what it is, and a line for each level.</p>
<h3>Four levels for every skill</h3>
<p>Every skill is practiced in four levels, from a gentle first try to real mastery:</p>
<table class="lvtable">
<tr><td><span class="pill">1</span></td><td>The simplest version of the idea, often with small numbers or a picture to help.</td></tr>
<tr><td><span class="pill">2</span></td><td>The same idea with a little more to keep track of.</td></tr>
<tr><td><span class="pill">3</span></td><td>The idea in a less familiar form, or with a step added.</td></tr>
<tr><td><span class="pill">4</span></td><td>The full skill, often applied to a real situation or explained in the learner's own words.</td></tr>
</table>
<p>A level is <b>planted</b> once the learner gets three questions in a row right, and planting a level also plants every easier level. When level 4 is planted, the skill is <b>proven</b>.</p>
<h3>Brave and Legend: the optional challenge levels</h3>
<p>For learners who finish quickly, some skills have two extra levels: about half the skills in Era IV, and about a quarter in Eras I–III and V, chosen where a challenge really helps. They open only once the skill is proven. They are always optional and never hold anyone back.</p>
<table class="lvtable">
<tr><td><span class="pill brave">★</span> Brave</td><td>The skill with a twist: working backwards, combining it with an earlier skill, or finding a missing value that makes something work.</td></tr>
<tr><td><span class="pill brave">★★</span> Legend</td><td>Puzzle-style problems in the spirit of math competitions, which need a flash of insight rather than longer arithmetic.</td></tr>
</table>
<p>Eras VI and VII arrive in Mathera 2.0; their skills are listed here so you can see where the road leads, but they have no practice yet.</p>
<h3>Keeping skills alive</h3>
<p>Skills in the tree need occasional watering. The app brings back each proven skill for a quick review, at first after a day, then after longer and longer gaps. A skill left too long starts to wilt, and the app gently steers the learner back to it. This spaced review is what turns something learned once into something kept for good.</p>
<h3>A note for helpers</h3>
<p>You do not need to know the math to help. Use this guide to see what a skill is about, ask the learner to show you a question, and celebrate each level planted. Later editions may include versions written for different kinds of helper, such as parents, tutors and classroom teachers.</p>
</section>"""

def overview():
    rows = ''.join(f"""<tr><td class="en" style="color:{ERA[e['id']]['color']}">Era {e['id']}<br>{e['name']}</td><td>{esc(ERA[e['id']]['intro'])}<br><span class="sans" style="color:#666">{ERA[e['id']]['school']}</span></td><td class="n">{len(e['units'])} branches<br>{sum(len(u['skills']) for u in e['units'])} skills</td></tr>""" for e in src['eras'])
    return f"""<section class="page prose"><h2>The seven eras at a glance</h2>
<p>The school stages are a rough guide only. Learners of any age can start wherever the math feels new.</p>
<table class="ov">{rows}</table></section>"""

def toc():
    blocks = []
    for e in src['eras']:
        c = ERA[e['id']]['color']
        rows = ''.join(f"<div class='row'><span class='id'>{u['id']}</span><span class='nm'>{esc(u['name'])}</span><span class='pg'>{pages.get(u['id'], '')}</span></div>" for u in e['units'])
        blocks.append(f"<div class='era'><div style='border-color:{c};color:{c}'><span>Era {e['id']} · {e['name']}</span><span>{pages.get(e['id'], '')}</span></div>{rows}</div>")
    return f"<section class='page toc'><h2>Contents</h2><div class='cols'>{''.join(blocks)}</div></section>"

def era_section(e):
    c = ERA[e['id']]['color']
    bl = ''.join(f"<div><span class='id'>{u['id']}</span><span>{esc(u['name'])}</span><span class='c'>{len(u['skills'])}</span></div>" for u in e['units'])
    parts = [f"""<section class="page opener"><span class="mark">{mk(e['id'])}</span><div class="num" style="color:{c}">{e['id']}</div>
<h2>Era {e['id']} · {e['name']}</h2><div class="school">{ERA[e['id']]['school']}</div><p>{esc(ERA[e['id']]['intro'])}</p>
<div class="bl" style="border-color:{c}">{bl}</div></section>"""]
    for u in e['units']:
        o = out[u['id']]
        sk = []
        for s in u['skills']:
            t = o['skills'][s['id']]
            lis = ''.join(f"<li class='{'bv' if k in 'ef' else ''}'><span class='pill{' brave' if k in 'ef' else ''}'>{LV[k]}</span><span>{esc(t['levels'][k])}</span></li>" for k in s['steps'])
            sk.append(f"<div class='skill'><div class='sid'>{s['id']}</div><div><h4>{esc(s['name'])}</h4><p class='what'>{esc(t['what'])}</p><ol>{lis}</ol></div></div>")
        parts.append(f"""<section class="branch"><div class="bh" style="border-color:{c}"><span class="mark">{mk(u['id'])}</span><div class="kick" style="color:{c}">Era {e['id']} · {e['name']} · Branch {u['id']}</div><h3>{esc(u['name'])}</h3></div>
<p class="bintro">{esc(o['intro'])}</p>{''.join(sk)}</section>""")
    return ''.join(parts)

body = cover() + howto() + overview() + toc() + ''.join(era_section(e) for e in src['eras'])
open(f'{G}/guide.html', 'w').write(f"<!doctype html><html lang='en'><head><meta charset='utf-8'><title>Mathera Curriculum Guide</title><style>{css}</style></head><body>{body}</body></html>")
print('html written', len(body))
