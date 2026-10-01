import json, sys, os, re
era = sys.argv[1] if len(sys.argv) > 1 else None
src = json.load(open('/home/claude/guide/source.json'))
probs, nsk, nlines = [], 0, 0
for e in src['eras']:
    if era and e['id'] != era: continue
    for u in e['units']:
        p = f"/home/claude/guide/out/{u['id']}.json"
        if not os.path.exists(p): probs.append(f"{u['id']}: file missing"); continue
        try: d = json.load(open(p))
        except Exception as ex: probs.append(f"{u['id']}: bad JSON {ex}"); continue
        if not d.get('intro'): probs.append(f"{u['id']}: no intro")
        for s in u['skills']:
            nsk += 1
            o = d.get('skills', {}).get(s['id'])
            if not o: probs.append(f"{s['id']}: missing"); continue
            w = o.get('what', '')
            if not w: probs.append(f"{s['id']}: no what")
            if len(w.split()) > (70 if e['id'] in ('V', 'VI', 'VII') else 40): probs.append(f"{s['id']}: what too long ({len(w.split())} words)")
            for k in s['steps']:
                t = o.get('levels', {}).get(k, '')
                nlines += 1
                if not t: probs.append(f"{s['id']}.{k}: missing level")
                elif len(t.split()) > 28: probs.append(f"{s['id']}.{k}: level too long ({len(t.split())} words)")
                if re.search(r'[²³√∫∑≤≥]|\^', t + w): probs.append(f"{s['id']}.{k}: symbol in text")
                if re.search(r'(?i)students will|your child|!', t + w): probs.append(f"{s['id']}.{k}: banned phrasing")
for p in probs[:60]: print(p)
print(f"checked {nsk} skills, {nlines} levels: {len(probs)} problems")
