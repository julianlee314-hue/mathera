// node build.js  (from app/)  or  node app/build.js  (from repo root)
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = __dirname;                                 // …/app
const repo = path.join(root, '..');                     // repo root
const lab = (...p) => path.join(repo, 'lab', ...p);
const up = (...p) => path.join(repo, 'up', ...p);
const rev = (...p) => path.join(repo, 'rev', ...p);
const here = (...p) => path.join(root, ...p);

const ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(lab('s3.js'), 'utf8') + ';this.S=STONES', ctx);
const st = Object.fromEntries(Object.entries(ctx.S).filter(([k]) => /^(I|II|III)\./.test(k)));
// Eras IV–V: the Class-depth stone from the Stone Library
{ const h = fs.readFileSync(rev('stone_v2.html'), 'utf8'), i = h.indexOf('CARDS=[') + 6; let depth = 0, j = i; for (; j < h.length; j++) { const c = h[j]; if (c === '"') { j++; while (h[j] !== '"') { if (h[j] === '\\') j++; j++; } continue; } if (c === '[' || c === '{') depth++; if (c === ']' || c === '}') { depth--; if (!depth) break; } }
  JSON.parse(h.slice(i, j + 1)).forEach(c => { if (/^(IV|V)\./.test(c.id)) st[c.id] = c.class.stone; }); }
const t = fs.readFileSync(here('template.html'), 'utf8');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
const out = t.replace('%ENGINE%', () => ['s0.js', 's1.js', 's2.js', 'b1.js', 'b2.js', 'b3.js'].map(f => safe(fs.readFileSync(lab(f), 'utf8'))).join('\n;\n'))
  .replace('%UPPER%', () => [up('core4.js'), ...fs.readdirSync(up('units')).filter(f => /^u[45]_.*\.js$/.test(f)).sort().map(f => up('units', f))].map(f => safe(fs.readFileSync(f, 'utf8'))).join('\n;\n'))
  .replace('%STONES%', () => 'const STONES=' + safe(JSON.stringify(st)) + ';')
  .replace('%MASTERY%', () => safe(fs.readFileSync(here('mastery.js'), 'utf8')))
  .replace('%APP%', () => safe(fs.readFileSync(here('app.js'), 'utf8')));
fs.writeFileSync(here('mathera.html'), out);
const pages = '<!DOCTYPE html>\n<html lang="en">\n<meta charset="utf-8">\n' + out;
fs.writeFileSync(path.join(repo, 'index.html'), pages);
console.log('stones', Object.keys(st).length, 'bytes', out.length, '→ mathera.html + ../index.html');
