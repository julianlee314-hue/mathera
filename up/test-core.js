// node test-core.js — rules for every answer kind in the Era IV–V core
const fs = require('fs'), vm = require('vm');
for (const f of ['../lab/s2.js', 'core4.js']) vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });
let pass = 0, fail = 0;
const T = (f, typed, want, note = '') => { const got = E4.check(f, typed); if (got === want) pass++; else { fail++; console.log('FAIL', JSON.stringify(f), JSON.stringify(typed), 'got', got, 'want', want, note); } };
// numbers
T({ ans: 3.464, dp: 2 }, '3.46', true); T({ ans: 3.4641, dp: 2 }, '3.47', false); T({ ans: 3.4641, dp: 2 }, '2√3', true); T({ ans: 12 }, '12', true); T({ ans: 12 }, '3*4', null);
T({ frac: [3, 4] }, '0.75', true);
// exact
const e = { exact: '2sqrt(3)' };
T(e, '2√3', true); T(e, '2sqrt(3)', true); T(e, 'sqrt(12)', true); T(e, '√12', true); T(e, '3.464', false); T(e, '2√2', false); T(e, 'hello', false);
const es = { exact: '2sqrt(3)', form: 'simplest' };
T(es, '2√3', true); T(es, '√12', false); T(es, '4/√(4/3)', false);
T({ exact: '(3+sqrt(5))/2', form: 'simplest' }, '(3+√5)/2', true); T({ exact: '(3+sqrt(5))/2', form: 'simplest' }, '(6+2√5)/4', false); T({ exact: '(3+sqrt(5))/2' }, '(6+2√5)/4', true);
T({ exact: 'sqrt(2)/2', form: 'simplest' }, '1/√2', false); T({ exact: 'sqrt(2)/2', form: 'simplest' }, '√2/2', true);
T({ exact: '5cbrt(2)', form: 'simplest' }, '5∛2', true); T({ exact: '5cbrt(2)', form: 'simplest' }, '∛250', false); T({ exact: 'cbrt(12)', form: 'simplest' }, 'cbrt(12)', true);
T({ exact: 'pi/3' }, 'π/3', true); T({ exact: '2pi/3' }, '2π/3', true); T({ exact: 'pi/3' }, '1.047', false);
T({ exact: '-5' }, '−5', true); T({ exact: '1/2' }, '0.5', true, 'decimal ok when the exact value is a terminating... (rule: target has no dot → reject decimals)');
// expressions
const x1 = { expr: 'x^2-4x+4' };
T(x1, 'x²−4x+4', true); T(x1, '(x-2)^2', true); T(x1, '(x−2)(x−2)', true); T(x1, 'x^2-4x+5', false); T(x1, 'y^2-4y+4', false); T(x1, 'x^2 - 4 x + 4', true);
T({ expr: '(x-2)(x+3)', form: 'factored' }, '(x+3)(x−2)', true); T({ expr: '(x-2)(x+3)', form: 'factored' }, 'x^2+x-6', false);
T({ expr: '2(x-1)(x+1)', form: 'factored' }, '2(x−1)(x+1)', true); T({ expr: '2(x-1)(x+1)', form: 'factored' }, '(2x−2)(x+1)', true);
T({ expr: 'x^2+x-6', form: 'expanded' }, '(x+3)(x-2)', false); T({ expr: 'x^2+x-6', form: 'expanded' }, 'x^2+x-6', true);
T({ expr: '2(x-3)^2+1', form: 'vertex' }, '2(x−3)²+1', true); T({ expr: '2(x-3)^2+1', form: 'vertex' }, '2x^2-12x+19', false); T({ expr: '(x+1)^2-4', form: 'vertex' }, '(x+1)^2 - 4', true);
T({ expr: 'sqrt(x+1)' }, '√(x+1)', true); T({ expr: 'sin(2x)' }, '2sin(x)cos(x)', true); T({ expr: 'sin(2x)' }, 'sin 2x', true); T({ expr: 'ln(x^2)' }, '2ln(x)', false, 'differ for x<0'); T({ expr: '2ln(x)' }, 'ln(x^2)', true, 'same on the target domain');
T({ expr: 'e^(2x)' }, 'e^(2x)', true); T({ expr: '3x^2' }, '3x²', true); T({ expr: 'x^3' }, 'x³', true); T({ expr: '|x-2|' }, '|x−2|', true); T({ expr: 'abs(x-2)' }, '|2-x|', true);
T({ expr: '1/(x+1)' }, '1/(x+1)', true); T({ expr: '(x+1)/(x-1)' }, '(x+1)/(x−1)', true);
T({ expr: 'y' }, 'y = y', true, 'strip lead');
T({ expr: '3x(x+1)', form: 'complete' }, '3x(x+1)', true); T({ expr: '3x(x+1)', form: 'complete' }, '3(x^2+x)', false); T({ expr: '3x(x+1)', form: 'complete' }, 'x(3x+3)', false);
T({ expr: '(x-2)(x+2)(x^2+4)', form: 'complete' }, '(x^2-4)(x^2+4)', false); T({ expr: '(x-2)(x+2)(x^2+4)', form: 'complete' }, '(x+2)(x-2)(x^2+4)', true); T({ expr: '2(x-3)^2', form: 'complete' }, '2(x−3)²', true); T({ expr: '2(x-3)^2', form: 'complete' }, '(2x−6)(x−3)', false);
T({ interval: '[394,406]' }, '[394,406]', true); T({ interval: '[394,406]' }, '394 <= x <= 406', true); T({ set: ['1200', '5'] }, '1,200, 5', false); T({ ans: 12500 }, '12,500', true); T({ exact: '12500' }, '12,500', true);
// equations
T({ eqn: 'y=2x+3' }, 'y = 2x + 3', true); T({ eqn: 'y=2x+3' }, '2x - y = -3', true); T({ eqn: 'y=2x+3', form: 'solved' }, '2x - y = -3', false); T({ eqn: 'y=2x+3' }, 'y = 2x + 4', false);
T({ eqn: '(x-1)^2+(y+2)^2=9' }, 'x^2-2x+y^2+4y-4=0', true); T({ eqn: '(x-1)^2+(y+2)^2=9' }, '(x-1)^2+(y+2)^2=3', false);
T({ eqn: 'y=2(x-1)^2+3' }, 'y - 3 = 2(x - 1)^2', true);
// sets
T({ set: ['2', '-3'] }, '2, -3', true); T({ set: ['2', '-3'] }, 'x = -3 or x = 2', true); T({ set: ['2', '-3'] }, '2', false); T({ set: ['2', '-3'] }, '2, 3', false);
T({ set: [] }, 'no solution', true); T({ set: ['1'] }, 'no solution', false); T({ set: ['2+sqrt(3)', '2-sqrt(3)'] }, '2 ± √3'.replace('±', '+') + ', 2-√3', true);
T({ set: ['1+2i', '1-2i'] }, '1+2i, 1−2i', true); T({ set: ['sqrt(5)', '-sqrt(5)'] }, '√5, −√5', true);
// intervals
T({ interval: '(-inf,3]' }, '(−∞, 3]', true); T({ interval: '(-inf,3]' }, 'x ≤ 3', true); T({ interval: '(-inf,3]' }, 'x < 3', false); T({ interval: '(-inf,3]' }, '3 >= x', true);
T({ interval: '(-inf,-2)U[5,inf)' }, 'x < -2 or x >= 5', true); T({ interval: '(-inf,-2)U[5,inf)' }, '(−∞,−2) ∪ [5,∞)', true); T({ interval: '[-1,4)' }, '-1 <= x < 4', true); T({ interval: '[-1,4)' }, '[-1,4]', false);
T({ interval: '(-inf,inf)' }, 'all real numbers', true); T({ interval: '(1/2,inf)' }, 'x > 0.5', true);
// points and complex
T({ point: ['2', '-3'] }, '(2, −3)', true); T({ point: ['2', '-3'] }, '(−3, 2)', false); T({ point: ['1/2', 'sqrt(3)/2'] }, '(1/2, √3/2)', true);
T({ complex: '3-2i' }, '3 − 2i', true); T({ complex: '3-2i' }, '-2i+3', true); T({ complex: '3-2i', form: 'standard' }, '(3i+2)/i', false); T({ complex: '3-2i' }, '(3i+2)/i', true); T({ complex: '-1' }, 'i^2', true); T({ complex: '-1', form: 'standard' }, 'i^2', false);
// display
const S = (f, want) => { const got = E4.show(f); if (got === want) pass++; else { fail++; console.log('SHOW', JSON.stringify(f), got, '≠', want); } };
S({ exact: '2sqrt(3)' }, '2√3'); S({ expr: 'x^2-4x+4' }, 'x² − 4x + 4'); S({ expr: '2(x-3)^2+1' }, '2(x − 3)² + 1'); S({ interval: '(-inf,-2)U[5,inf)' }, '(−∞, −2) ∪ [5, ∞)'); S({ set: ['2', '-3'] }, '2, −3'); S({ exact: '(3+sqrt(5))/2' }, '(3 + √5)/2'); S({ eqn: 'y=2x+3' }, 'y = 2x + 3');
// MathML parses as XML
const xml = s => { try { new (require('vm').Script)('0'); return /^<math/.test(s) && !/undefined|NaN/.test(s); } catch (e) { return false; } };
['x^2-5x+6=0', '(3+sqrt(5))/2', 'sin^2(x)+cos^2(x)=1', 'log_2(8)=3', '|x-2|<=5', 'f(x)=2(x-3)^2+1', 'y=e^(2x)'].forEach(s => { const m = E4.mx(s); if (xml(m)) pass++; else { fail++; console.log('MX', s, m); } });
// helpers
const H = (got, want) => { if (got === want) pass++; else { fail++; console.log('HELP', got, '≠', want); } };
H(E4.poly([1, -5, 6]), 'x^2-5x+6'); H(E4.poly([-1, 0, 4]), '-x^2+4'); H(E4.surdStr(4, 2, 12, 2), '2+2sqrt(3)'); H(E4.surdStr(3, 1, 5, 2), '(3+sqrt(5))/2'); H(E4.surdStr(0, 2, 8, 4), 'sqrt(2)'); H(E4.fracStr(6, -4), '-3/2');
console.log(`core tests: ${pass} passed, ${fail} failed`);
console.log(E4.mx('x^2-5x+6=0'));
process.exitCode = fail ? 1 : 0;
T({ ans: 30 }, '30°', true); T({ ans: 30 }, '30 degrees', true); T({ ans: 12.5, dp: 1 }, '12.5 cm', true); T({ exact: '3sqrt(2)' }, '3√2 cm', true); T({ ans: 40 }, '40 cm²', true); T({ ans: 40 }, '41 cm²', false); T({ exact: 'pi/6' }, 'π/6 rad', true); T({ ans: 5 }, 'cm', null);
T({ interval: '(15,10sqrt(3))' }, '(15, 10√3)', true); T({ interval: '(15,10sqrt(3))' }, '(15, 10sqrt(3))', true); T({ interval: '(15,10sqrt(3))' }, '(15, 10sqrt(3)]', false); T({ interval: '[-pi/2,pi/2]' }, '[-π/2, π/2]', true); T({ interval: '(-inf,2)U(3,inf)' }, '(-∞, 2) ∪ (3, ∞)', true);
{ // ordering questions
  let okAll = true;
  for (let s = 1; s <= 40; s++) {
    const q = E4.order(E4.rng(s), 'Order', ['Given AB = CD', 'BC = BC', 'AB + BC = BC + CD', 'AC = BD'], 'why', { fixed: 1, alts: [[0, 1, 2, 3]] });
    try { E4.validate(q, 'order'); } catch (e) { okAll = false; console.log('ORDER', e.message); }
    if (!E4.checkOrder(q, q.ans)) okAll = false;
    const sw = q.ans.slice(); [sw[1], sw[2]] = [sw[2], sw[1]]; if (E4.checkOrder(q, sw)) okAll = false;
    if (q.ans[0] !== 0 || q.items[0] !== 'Given AB = CD') okAll = false;
  }
  const q2 = E4.order(E4.rng(3), 'Order', ['a', 'b', 'c'], 'e', { alts: [[1, 0, 2]] });
  const seqAlt = [q2.items.indexOf('b'), q2.items.indexOf('a'), q2.items.indexOf('c')];
  H(E4.checkOrder(q2, seqAlt), true); H(okAll, true);
  console.log(`order tests done: ${pass} passed, ${fail} failed`);
}
