/* Era V · Unit V.1 Logic & proof (V.1.01–V.1.16) — the pilot for the proof question types */
(function (G) {
  const E = G.E5, V = E.V, C = E.C, M = s => E.mx(s);
  // bare " < " in plain text is escaped so it can never be read as the start of a tag
  const esc = t => typeof t === 'string' ? t.replace(/ < /g, ' &lt; ').replace(/ > /g, ' &gt; ') : t;
  const S = (id, name, steps) => { for (const k of Object.keys(steps)) { const g = steps[k].g; steps[k].g = (R, O) => { const q = g(R, O); q.prompt = esc(q.prompt); q.explain = esc(q.explain); if (q.choices) q.choices = q.choices.map(c => c.startsWith('<svg') ? c : esc(c)); if (q.items) q.items = q.items.map(esc); return q; }; } return E.skill({ id, name, steps }); };
  const YN = { choices: ['Yes', 'No'] };
  const cap = s => /^[a-z]/.test(s) ? s[0].toUpperCase() + s.slice(1) : s;
  const Q = s => `“${s}”`, Qs = s => `“${s.replace(/\.$/, '')}”`;
  const OL = s => `<span style="text-decoration:overline">${s}</span>`;
  const TF = b => b ? 'T' : 'F';
  const tbl = (head, rows) => `<table class="dt"><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');
  const NAMES = ['Ava', 'Ben', 'Chloe', 'Dev', 'Elena', 'Femi', 'Grace', 'Hiro', 'Isla', 'Jamal', 'Kira', 'Leo', 'Maya', 'Nico', 'Omar', 'Priya', 'Quinn', 'Rosa', 'Sam', 'Tariq', 'Uma', 'Yuki', 'Zoe'];
  const isPrime = n => { if (n < 2 || n % 1) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
  // pick distractors: up to k from a pool, never equal to the right answer
  const pickD = (R, pool, right, k = 3) => R.sample(pool.filter(x => x !== right), k);

  /* ---------- ordering: every honest order of the proof lines ----------
     deps[i] = indices line i needs. The last line is the conclusion, so it needs everything. */
  const topo = (deps, fixed) => {
    const n = deps.length, out = [], used = Array(n).fill(false), seq = [];
    for (let i = 0; i < fixed; i++) { used[i] = true; seq.push(i); }
    const rec = () => { if (out.length > 400) return; if (seq.length === n) { out.push(seq.slice()); return; }
      for (let i = 0; i < n; i++) if (!used[i] && deps[i].every(d => used[d])) { used[i] = true; seq.push(i); rec(); seq.pop(); used[i] = false; } };
    rec(); return out;
  };
  const orderQ = (R, prompt, lines, deps, explain, o = {}) => {
    const n = lines.length, d = deps.map((x, i) => i === n - 1 ? [...Array(n - 1).keys()] : x), fixed = o.fixed ?? 1;
    const all = topo(d, fixed), canon = [...Array(n).keys()].join();
    if (!all.some(a => a.join() === canon)) throw new Error('canonical order breaks its own dependencies');
    const alts = all.filter(a => a.join() !== canon);
    return E.order(R, prompt, lines, explain, Object.assign({ fixed }, o.visual ? { visual: o.visual } : {}, alts.length ? { alts } : {}));
  };
  const line = (s, r) => `${s} <i>(${r})</i>`;

  /* ---------- conditional sentences ----------
     e = [subject, pronoun, P, notP, Q, notQ, P→Q true?, Q→P true?, counterexample to P→Q, counterexample to Q→P] */
  const cl = (e, pred, first) => e[0] ? `${first ? e[0] : e[1]} ${pred}` : pred;
  const IF = (e, a, b) => `If ${cl(e, a, 1)}, then ${cl(e, b, 0)}.`;
  const orig = e => IF(e, e[2], e[4]), conv = e => IF(e, e[4], e[2]), inv = e => IF(e, e[3], e[5]), contra = e => IF(e, e[5], e[3]);
  const BI = e => `${cap(cl(e, e[2], 1))} if and only if ${cl(e, e[4], 0)}.`;
  const CB = [
    ['a whole number', 'it', 'is divisible by 6', 'is not divisible by 6', 'is divisible by 3', 'is not divisible by 3', 1, 0, '', '9 is divisible by 3 but not by 6'],
    ['a shape', 'it', 'is a square', 'is not a square', 'is a rectangle', 'is not a rectangle', 1, 0, '', 'a 2 × 5 rectangle is not a square'],
    ['an animal', 'it', 'is a dog', 'is not a dog', 'is a mammal', 'is not a mammal', 1, 0, '', 'a cat is a mammal but not a dog'],
    ['a triangle', 'it', 'has three congruent sides', 'does not have three congruent sides', 'has three congruent angles', 'does not have three congruent angles', 1, 1, '', ''],
    ['', '', 'today is Saturday', 'today is not Saturday', 'tomorrow is Sunday', 'tomorrow is not Sunday', 1, 1, '', ''],
    ['a whole number', 'it', 'is odd', 'is not odd', 'is prime', 'is not prime', 0, 0, '9 is odd but not prime', '2 is prime but not odd'],
    ['a quadrilateral', 'it', 'has four congruent sides', 'does not have four congruent sides', 'is a square', 'is not a square', 0, 1, 'a rhombus with no right angles has four congruent sides but is not a square', ''],
    ['you', 'you', 'live in Paris', 'do not live in Paris', 'live in France', 'do not live in France', 1, 0, '', 'someone from Lyon lives in France but not in Paris'],
    ['a month', 'it', 'is February', 'is not February', 'has fewer than 30 days', 'has 30 or more days', 1, 1, '', ''],
    ['an angle', 'it', 'measures exactly 90°', 'does not measure exactly 90°', 'is a right angle', 'is not a right angle', 1, 1, '', ''],
    ['a whole number', 'it', 'is a multiple of 4', 'is not a multiple of 4', 'is even', 'is odd', 1, 0, '', '6 is even but not a multiple of 4'],
    ['two angles', 'they', 'are vertical angles', 'are not vertical angles', 'are congruent', 'are not congruent', 1, 0, '', 'two 40° angles in different triangles are congruent but not vertical angles'],
    ['an animal', 'it', 'lives in water', 'does not live in water', 'is a fish', 'is not a fish', 0, 1, 'a whale lives in water but is not a fish', ''],
    ['a whole number', 'it', 'ends in 5', 'does not end in 5', 'is divisible by 5', 'is not divisible by 5', 1, 0, '', '10 is divisible by 5 but does not end in 5'],
    ['a year', 'it', 'is a leap year', 'is not a leap year', 'has 366 days', 'does not have 366 days', 1, 1, '', ''],
    ['a polygon', 'it', 'has exactly three sides', 'does not have exactly three sides', 'is a triangle', 'is not a triangle', 1, 1, '', ''],
    ['a whole number', 'it', 'is divisible by 2', 'is not divisible by 2', 'is divisible by 4', 'is not divisible by 4', 0, 1, '6 is divisible by 2 but not by 4', ''],
    ['a shape', 'it', 'is a circle', 'is not a circle', 'has no corners', 'has corners', 1, 0, '', 'an oval has no corners but is not a circle'],
    ['a number', 'it', 'is negative', 'is not negative', 'is less than 5', 'is not less than 5', 1, 0, '', '3 is less than 5 but not negative'],
    ['a rectangle', 'it', 'is a square', 'is not a square', 'has perpendicular diagonals', 'does not have perpendicular diagonals', 1, 1, '', ''],
    ['a triangle', 'it', 'is a right triangle', 'is not a right triangle', 'has an obtuse angle', 'does not have an obtuse angle', 0, 0, 'a 3-4-5 triangle is right but has no obtuse angle', 'a triangle with angles 120°, 30° and 30° has an obtuse angle but is not right'],
    ['a number', 'it', 'is greater than 10', 'is not greater than 10', 'is greater than 20', 'is not greater than 20', 0, 1, '15 is greater than 10 but not greater than 20', ''],
    ['', '', M('x=4'), M('x!=4'), M('x^2=16'), M('x^2!=16'), 1, 0, '', 'x = −4 gives x² = 16, but x ≠ 4'],
    ['', '', M('x+5=12'), M('x+5!=12'), M('x=7'), M('x!=7'), 1, 1, '', ''],
    ['', '', M('x^2=25'), M('x^2!=25'), M('x=5'), M('x!=5'), 0, 1, 'x = −5 gives x² = 25, but x ≠ 5', ''],
    ['a quadrilateral', 'it', 'is a rhombus', 'is not a rhombus', 'has perpendicular diagonals', 'does not have perpendicular diagonals', 1, 0, '', 'a kite that is not a rhombus has perpendicular diagonals'],
    ['a whole number', 'it', 'is a multiple of 10', 'is not a multiple of 10', 'ends in 0', 'does not end in 0', 1, 1, '', ''],
    ['an animal', 'it', 'is a spider', 'is not a spider', 'has eight legs', 'does not have eight legs', 1, 0, '', 'a scorpion has eight legs but is not a spider'],
    ['a whole number', 'it', 'is even', 'is not even', 'is divisible by 6', 'is not divisible by 6', 0, 1, '4 is even but not divisible by 6', ''],
    ['a whole number greater than 1', 'it', 'is prime', 'is not prime', 'has exactly two factors', 'does not have exactly two factors', 1, 1, '', ''],
  ];
  const tv = b => b ? 'true' : 'false';
  // everyday and math sentences that are conditionals in disguise: [sentence, ...e]
  const EV = [
    ['All squares are rectangles.', 'a shape', 'it', 'is a square', 'is not a square', 'is a rectangle', 'is not a rectangle'],
    ['Every multiple of 10 ends in 0.', 'a whole number', 'it', 'is a multiple of 10', 'is not a multiple of 10', 'ends in 0', 'does not end in 0'],
    ['Vertical angles are congruent.', 'two angles', 'they', 'are vertical angles', 'are not vertical angles', 'are congruent', 'are not congruent'],
    ['The game is canceled if it rains.', '', '', 'it rains', 'it does not rain', 'the game is canceled', 'the game is not canceled'],
    ['You can vote only if you are registered.', 'you', 'you', 'can vote', 'cannot vote', 'are registered', 'are not registered'],
    ['A number is divisible by 9 only if it is divisible by 3.', 'a number', 'it', 'is divisible by 9', 'is not divisible by 9', 'is divisible by 3', 'is not divisible by 3'],
    [`Whenever ${M('x>4')}, ${M('x^2>16')}.`, '', '', M('x>4'), M('x<=4'), M('x^2>16'), M('x^2<=16')],
    ['No odd number is divisible by 2.', 'a number', 'it', 'is odd', 'is not odd', 'is not divisible by 2', 'is divisible by 2'],
    ['I wear a coat when it is below 5°C.', '', '', 'it is below 5°C', 'it is not below 5°C', 'I wear a coat', 'I do not wear a coat'],
    ['Members get in free.', 'a person', 'the person', 'is a member', 'is not a member', 'gets in free', 'does not get in free'],
    ['Parallel lines never meet.', 'two lines', 'they', 'are parallel', 'are not parallel', 'never meet', 'meet'],
    ['The store is closed on Sundays.', '', '', 'it is Sunday', 'it is not Sunday', 'the store is closed', 'the store is open'],
    ['You must pass the final exam to pass the course.', 'you', 'you', 'pass the course', 'do not pass the course', 'pass the final exam', 'do not pass the final exam'],
    ['Every right angle measures 90°.', 'an angle', 'it', 'is a right angle', 'is not a right angle', 'measures 90°', 'does not measure 90°'],
    ['The alarm rings whenever smoke is detected.', '', '', 'smoke is detected', 'smoke is not detected', 'the alarm rings', 'the alarm does not ring'],
    ['Only registered players can enter the draw.', 'a player', 'the player', 'can enter the draw', 'cannot enter the draw', 'is registered', 'is not registered'],
    ['Squares of odd whole numbers are odd.', '', '', `${M('n')} is odd`, `${M('n')} is not odd`, `${M('n^2')} is odd`, `${M('n^2')} is not odd`],
    ['Every student who scores 90 or more gets an A.', 'a student', 'the student', 'scores 90 or more', 'scores less than 90', 'gets an A', 'does not get an A'],
    ['The light turns on when you press the switch.', '', '', 'you press the switch', 'you do not press the switch', 'the light turns on', 'the light does not turn on'],
    ['Being a square is enough to make a shape a rhombus.', 'a shape', 'it', 'is a square', 'is not a square', 'is a rhombus', 'is not a rhombus'],
    ['A triangle with a right angle has two acute angles.', 'a triangle', 'it', 'has a right angle', 'does not have a right angle', 'has two acute angles', 'does not have two acute angles'],
    ['Dogs are mammals.', 'an animal', 'it', 'is a dog', 'is not a dog', 'is a mammal', 'is not a mammal'],
  ];
  const evE = x => x.slice(1);

  /* V.1.01 Undefined terms & definitions */
  const MODEL = [['the tip of a sharpened pencil', 0], ['a star seen in the night sky', 0], ['a dot marking a city on a map', 0], ['a grain of sand on a beach', 0], ['the corner where two walls and the floor meet', 0],
    ['a tight string that goes on forever in both directions', 1], ['the crease of a folded sheet, extended both ways without end', 1], ['the edge where a wall meets the floor, extended both ways without end', 1], ['a perfectly straight road with no end in either direction', 1],
    ['the surface of a still pond, extended forever', 2], ['a tabletop that goes on forever in every direction', 2], ['a sheet of paper extended without end', 2], ['a gym floor extended in every direction without end', 2]];
  const FACTS = [
    ['How many points determine exactly one line?', '2', ['1', '3', 'infinitely many'], 'Through any two points there is exactly one line.'],
    ['Two different planes intersect. What is their intersection?', 'a line', ['a point', 'a plane', 'a segment'], 'Two planes that meet cross in a line, like two walls meeting along an edge.'],
    ['Two different lines intersect. In how many points do they meet?', 'exactly one', ['exactly two', 'none', 'infinitely many'], 'If they shared two points they would be the same line, so they meet in exactly one point.'],
    ['Three points that are not on one line lie in how many planes?', 'exactly one', ['none', 'exactly two', 'infinitely many'], 'Three noncollinear points determine exactly one plane.'],
    ['What are points that lie on the same line called?', 'collinear', ['concurrent', 'congruent', 'parallel'], 'Collinear means "on one line".'],
    ['What are points that lie in the same plane called?', 'coplanar', ['collinear', 'congruent', 'concurrent'], 'Coplanar means "in one plane".'],
    ['How many dimensions does a point have?', '0', ['1', '2', '3'], 'A point has position only: no length, width or thickness.'],
    ['How many dimensions does a plane have?', '2', ['0', '1', '3'], 'A plane has length and width but no thickness.'],
    ['How many different lines pass through one given point?', 'infinitely many', ['exactly one', 'exactly two', 'none'], 'One point does not fix a direction, so lines through it can point every way.'],
    ['Why are point, line and plane called undefined terms?', 'They are described, not defined, and other terms are built from them', ['Nobody agrees on what they mean', 'They cannot be drawn', 'They are only used in 3-D geometry'], 'Every definition uses earlier words, so we must start from a few terms we only describe.'],
  ];
  const DEFS = [
    ['a midpoint of a segment', 'the point on the segment that divides it into two congruent segments', ['a point on the segment', 'a point that is equally far from both endpoints', 'a point near the middle of the segment'], 'A point off the segment can be equally far from both ends, so "on the segment" is needed.'],
    ['a right angle', 'an angle that measures exactly 90°', ['an angle that is not acute', 'an angle that looks square', 'an angle bigger than an acute angle'], 'Only "exactly 90°" pins down one kind of angle; the others also fit obtuse angles or are untestable.'],
    ['a square', 'a rectangle with four congruent sides', ['a shape with four right angles', 'a quadrilateral with four congruent sides', 'a shape with four equal parts'], 'Rectangles have four right angles and rhombuses have four congruent sides, so those are too broad.'],
    ['a circle', 'the set of all points in a plane at a fixed distance from a fixed point', ['a round shape', 'the set of all points at a fixed distance from a fixed point', 'a shape with no corners'], 'Without "in a plane" the points at a fixed distance form a sphere.'],
    ['an isosceles triangle', 'a triangle with at least two congruent sides', ['a shape with two congruent sides', 'a triangle with exactly three congruent sides', 'a triangle with two angles'], 'It must name the category (triangle) and the property (two congruent sides).'],
    ['parallel lines', 'coplanar lines that never intersect', ['lines that never intersect', 'lines that point the same way', 'lines that are far apart'], 'Skew lines never meet but are not parallel, so "coplanar" is needed.'],
    ['perpendicular lines', 'lines that intersect to form right angles', ['lines that cross', 'lines that are not parallel', 'lines that meet at a point'], 'Crossing is not enough; the angle must be 90°.'],
    ['an even number', 'an integer that is a multiple of 2', ['a number that can be split in half', 'a number that ends in 2', 'an integer that is not prime'], 'Every number can be halved (3 ÷ 2 = 1.5), so "integer multiple of 2" is what sets evens apart.'],
    ['a rhombus', 'a quadrilateral with four congruent sides', ['a quadrilateral with perpendicular diagonals', 'a tilted square', 'a shape with four sides'], 'Kites also have perpendicular diagonals, so that description is too broad.'],
    ['an acute angle', 'an angle that measures more than 0° and less than 90°', ['a small angle', 'an angle less than 180°', 'an angle that is not obtuse'], '"Not obtuse" also includes right angles, and "small" cannot be tested.'],
    ['a prime number', 'a whole number greater than 1 whose only factors are 1 and itself', ['a number whose only factors are 1 and itself', 'an odd number', 'a number with no factors'], 'Without "greater than 1", the number 1 would count as prime.'],
    ['an angle bisector', 'a ray that divides an angle into two congruent angles', ['a ray that starts at the vertex of an angle', 'a line that passes through an angle', 'a segment inside an angle'], 'Many rays start at the vertex; only one splits the angle into equal halves.'],
    ['a triangle', 'a polygon with exactly three sides', ['a shape with three corners', 'a shape with three lines', 'a polygon with at least three sides'], 'Every polygon has at least three sides, so "exactly" is needed.'],
  ];
  const FLAWS = ['It is too broad: other things fit it too.', 'It is circular: it uses the word it defines.', 'It is too vague to test.', 'Nothing: it is a precise definition.'];
  const FLAWED = [
    ['A right angle is an angle that is right.', 1], ['Perpendicular lines are lines that are perpendicular to each other.', 1], ['An angle bisector is a ray that bisects an angle.', 1], ['An equilateral triangle is a triangle that is equilateral.', 1], ['A tall person is a person who is tall.', 1],
    ['A parallelogram is a shape with parallel sides.', 0], ['A square is a quadrilateral with four right angles.', 0], ['A rhombus is a quadrilateral with perpendicular diagonals.', 0], ['Parallel lines are lines that never intersect.', 0], ['A bicycle is a vehicle with two wheels.', 0],
    ['An acute angle is a small angle.', 2], ['A circle is a round shape.', 2], ['A huge dog is a dog that is really big.', 2], ['A straight line is a line that looks straight.', 2],
    ['An even number is an integer that is a multiple of 2.', 3], ['A right angle is an angle that measures exactly 90°.', 3], ['A triangle is a polygon with exactly three sides.', 3], ['A rhombus is a quadrilateral with four congruent sides.', 3], ['A weekend day is a Saturday or a Sunday.', 3],
  ];
  const FLAW_WHY = ['Something that is not the term also fits the description.', 'Using the word itself explains nothing.', 'Words like these cannot be checked with a measurement or a fact.', 'It names the category and exactly what sets the object apart, so it works both ways.'];
  // candidate definitions: [text, reverse, good?, why]
  const REV = [
    ['A square is a quadrilateral with four right angles.', 'If a quadrilateral has four right angles, then it is a square.', 0, 'A 2 × 5 rectangle has four right angles but is not a square.'],
    ['A rhombus is a quadrilateral with perpendicular diagonals.', 'If a quadrilateral has perpendicular diagonals, then it is a rhombus.', 0, 'A kite can have perpendicular diagonals without being a rhombus.'],
    ['An equilateral triangle is a triangle with two congruent sides.', 'If a triangle has two congruent sides, then it is equilateral.', 0, 'A triangle with sides 5, 5 and 8 has two congruent sides but is not equilateral.'],
    ['A right angle is an angle that is not acute.', 'If an angle is not acute, then it is a right angle.', 0, 'A 120° angle is not acute, but it is not a right angle.'],
    ['A leap year is a year divisible by 4.', 'If a year is divisible by 4, then it is a leap year.', 0, '1900 is divisible by 4 but was not a leap year.'],
    ['A bicycle is a vehicle with two wheels.', 'If a vehicle has two wheels, then it is a bicycle.', 0, 'A motorcycle has two wheels but is not a bicycle.'],
    ['Parallel lines are lines that do not intersect.', 'If two lines do not intersect, then they are parallel.', 0, 'Skew lines, like two edges of a box that never meet, do not intersect but are not parallel.'],
    ['A prime number is a number whose only factors are 1 and itself.', 'If a number has only the factors 1 and itself, then it is prime.', 0, 'The number 1 has only the factors 1 and itself, but it is not prime.'],
    ['A square is a rectangle with four congruent sides.', 'If a rectangle has four congruent sides, then it is a square.', 1, 'Both directions are true, so it works as a definition.'],
    ['A right angle is an angle that measures exactly 90°.', 'If an angle measures exactly 90°, then it is a right angle.', 1, 'Both directions are true.'],
    ['An even number is an integer that is divisible by 2.', 'If an integer is divisible by 2, then it is even.', 1, 'Both directions are true.'],
    ['A rhombus is a quadrilateral with four congruent sides.', 'If a quadrilateral has four congruent sides, then it is a rhombus.', 1, 'Both directions are true.'],
    ['An equilateral triangle is a triangle with three congruent sides.', 'If a triangle has three congruent sides, then it is equilateral.', 1, 'Both directions are true.'],
    ['A leap year is a year with 366 days.', 'If a year has 366 days, then it is a leap year.', 1, 'Both directions are true.'],
    ['Perpendicular lines are lines that intersect to form right angles.', 'If two lines intersect to form right angles, then they are perpendicular.', 1, 'Both directions are true.'],
    ['A dozen is a group of exactly 12 things.', 'If a group has exactly 12 things, then it is a dozen.', 1, 'Both directions are true.'],
  ];
  // flawed definitions with the object that breaks them
  const BREAK = [
    ['A square is a quadrilateral with four right angles.', 'a 2 × 5 rectangle', ['a 3 × 3 square', 'a rhombus with 60° angles', 'a trapezoid'], 'A 2 × 5 rectangle has four right angles but is not a square.'],
    ['A rhombus is a quadrilateral with perpendicular diagonals.', 'a kite with sides 2, 2, 5, 5', ['a square', 'a 2 × 5 rectangle', 'a trapezoid'], 'The kite has perpendicular diagonals but its sides are not all congruent.'],
    ['An equilateral triangle is a triangle with two congruent sides.', 'a triangle with sides 5, 5 and 8', ['a triangle with sides 6, 6 and 6', 'a triangle with sides 3, 4 and 5', 'a triangle with sides 2, 3 and 4'], 'The 5-5-8 triangle has two congruent sides but is not equilateral.'],
    ['A right angle is an angle that is not acute.', 'a 120° angle', ['a 90° angle', 'a 45° angle', 'a 30° angle'], '120° is not acute, yet it is not a right angle.'],
    ['A leap year is a year divisible by 4.', 'the year 1900', ['the year 2024', 'the year 2023', 'the year 2000'], '1900 is divisible by 4 but was not a leap year (century years must be divisible by 400).'],
    ['A bicycle is a vehicle with two wheels.', 'a motorcycle', ['a mountain bike', 'a tricycle', 'a car'], 'A motorcycle has two wheels but is not a bicycle.'],
    ['A prime number is a number whose only factors are 1 and itself.', 'the number 1', ['the number 7', 'the number 9', 'the number 12'], '1 fits the description but is not prime; the definition needs "greater than 1".'],
    ['Parallel lines are lines that never intersect.', 'two skew edges of a box', ['two rails of a straight track', 'two lines that cross', 'two sides of a triangle'], 'Skew lines never meet but are not coplanar, so they are not parallel.'],
    ['A midpoint of a segment AB is a point equally far from A and B.', 'a point above AB on its perpendicular bisector', ['the midpoint of AB', 'the endpoint A', 'a point on AB closer to A'], 'Every point on the perpendicular bisector is equally far from A and B, but only one of them is on AB.'],
    ['A multiple of 10 is an even number.', 'the number 14', ['the number 20', 'the number 15', 'the number 7'], '14 is even but not a multiple of 10.'],
  ];
  S('V.1.01', 'Undefined terms & definitions', {
    a: { t: 'point, line and plane', g: R => { const mode = R.pick([0, 0, 1, 1, 2, 2, 2]);
      if (mode === 0) { const cls = R.int(0, 2), it = R.pick(MODEL.filter(m => m[1] === cls));
        return E.choiceFixed(`Which undefined term best models ${it[0]}?`, ['a point', 'a line', 'a plane'], cls, ['A point has a position but no size.', 'A line is straight, has no thickness and goes on forever both ways.', 'A plane is a flat surface with no thickness that goes on forever.'][cls]); }
      if (mode === 1) { const [q, a, ds, w] = R.pick(FACTS); return E.choice(R, q, a, ds, w); }
      const [A, B, Cc, X] = R.sample(LETTERS, 4), th = R.pick([-35, -20, -10, 10, 20, 35]) * Math.PI / 180, ts = [-3, R.pick([-1, 0, 0.5]), R.pick([2.5, 3])], off = R.pick([-2.2, 2.2]), tx = R.pick([-1.5, 1, 2]);
      const P = (t, h) => [t * Math.cos(th) - h * Math.sin(th), t * Math.sin(th) + h * Math.cos(th)];
      const pts = { [A]: P(ts[0], 0), [B]: P(ts[1], 0), [Cc]: P(ts[2], 0), [X]: P(tx, off) };
      const vis = V.geo({ pts, lines: [[A, Cc]], w: 280, label: 'points and a line' });
      if (R.bool()) return E.choice(R, 'Which three points are collinear?', [A, B, Cc].sort().join(', '), [[A, B, X], [A, Cc, X], [B, Cc, X]].map(t => t.sort().join(', ')), `${A}, ${B} and ${Cc} all lie on the drawn line; ${X} does not.`, { visual: vis });
      return E.choice(R, `Which point is not on line ${A}${Cc}?`, X, [A, B, Cc], `${A}, ${B} and ${Cc} lie on the line, so they are collinear; ${X} is off it.`, { visual: vis }); } },
    b: { t: 'segment, ray and angle', g: R => { const mode = R.int(0, 3), [X, Y, Z] = R.sample(LETTERS, 3);
      if (mode === 0) { const th = R.int(-30, 30) * Math.PI / 180, flip = R.bool() ? 1 : -1, P = t => [flip * t * Math.cos(th), flip * t * Math.sin(th)];
        const vis = V.geo({ pts: { [X]: P(-3), [Y]: P(0), [Z]: P(R.pick([2.5, 3.5])) }, lines: [[X, Z]], w: 280, label: 'three points on a line' });
        const K = R.int(0, 3);
        const set = [[`the same as ray ${X}${Y}`, `ray ${X}${Z}`, [`ray ${Y}${X}`, `ray ${Y}${Z}`, `ray ${Z}${X}`], `Ray ${X}${Y} starts at ${X} and heads through ${Y}; ${Z} is further along the same way, so ray ${X}${Z} is the same ray.`],
          [`the same as ray ${Z}${Y}`, `ray ${Z}${X}`, [`ray ${Y}${Z}`, `ray ${X}${Y}`, `ray ${Y}${X}`], `Ray ${Z}${Y} starts at ${Z} and heads through ${Y}, then on through ${X}, so it is ray ${Z}${X}.`],
          [`opposite to ray ${Y}${X}`, `ray ${Y}${Z}`, [`ray ${X}${Y}`, `ray ${Z}${Y}`, `ray ${X}${Z}`], `Opposite rays share an endpoint and point in opposite directions: ray ${Y}${X} and ray ${Y}${Z}.`],
          [`opposite to ray ${Y}${Z}`, `ray ${Y}${X}`, [`ray ${Z}${Y}`, `ray ${X}${Y}`, `ray ${Z}${X}`], `Opposite rays share an endpoint and point in opposite directions: ray ${Y}${Z} and ray ${Y}${X}.`]][K];
        return E.choice(R, `Points ${X}, ${Y} and ${Z} lie on a line in that order. Which ray is ${set[0]}?`, set[1], set[2], set[3], { visual: vis }); }
      if (mode === 1) return E.choice(R, `What is the vertex of ∠${X}${Y}${Z}?`, `point ${Y}`, [`point ${X}`, `point ${Z}`, `segment ${X}${Z}`], `The middle letter names the vertex: ∠${X}${Y}${Z} has its vertex at ${Y}, with sides ray ${Y}${X} and ray ${Y}${Z}.`);
      if (mode === 2) { const same = R.bool(), k = R.int(0, 1);
        const pair = same ? [[`segment ${X}${Y}`, `segment ${Y}${X}`, 'A segment is just its two endpoints and the points between, so the order of the letters does not matter.'], [`∠${X}${Y}${Z}`, `∠${Z}${Y}${X}`, `Both angles have vertex ${Y} and the same two sides.`]][k]
          : [[`ray ${X}${Y}`, `ray ${Y}${X}`, `Ray ${X}${Y} starts at ${X}; ray ${Y}${X} starts at ${Y} and points the other way.`], [`∠${X}${Y}${Z}`, `∠${Y}${X}${Z}`, `The middle letter is the vertex, so these angles have different vertices, ${Y} and ${X}.`]][k];
        return E.tf(`Are ${pair[0]} and ${pair[1]} the same figure?`, same, (same ? 'Yes. ' : 'No. ') + pair[2], YN); }
      const k = R.int(0, 2), nm = ['a segment', 'a ray', 'a line'][k];
      return E.choiceFixed(`How many endpoints does ${nm} have?`, ['0', '1', '2', 'infinitely many'], [2, 1, 0][k], ['A segment stops at both ends: two endpoints.', 'A ray starts at one endpoint and goes on forever the other way.', 'A line goes on forever both ways, so it has no endpoints.'][k]); } },
    c: { t: 'what makes a definition precise', g: R => {
      if (R.bool(0.55)) { const [term, right, wrong, why] = R.pick(DEFS); return E.choice(R, `Which is a precise definition of ${term}?`, right, wrong, why); }
      const ans = R.int(0, 3), [txt] = R.pick(FLAWED.filter(f => f[1] === ans));
      return E.choiceFixed(`What, if anything, is wrong with this definition? ${Q(txt)}`, FLAWS, ans, FLAW_WHY[ans]); } },
    d: { t: 'reversible definitions and flawed ones', g: R => {
      if (R.bool()) { const good = R.bool(), [txt, rev, , why] = R.pick(REV.filter(r => !!r[2] === good));
        return E.tf(`A good definition works in both directions. Is this a good definition? ${Q(txt)}`, good, `Its reverse is ${Q(rev)} ${good ? why : 'That is false: ' + why[0].toLowerCase() + why.slice(1)}`, YN); }
      const [txt, right, wrong, why] = R.pick(BREAK);
      return E.choice(R, `This definition is flawed: ${Q(txt)} Which object fits the description but is not the thing being defined?`, right, wrong, why); } },
  });

  /* V.1.02 Conditional statements */
  S('V.1.02', 'Conditional statements', {
    a: { t: 'hypothesis and conclusion', g: R => { const e = R.pick(CB), hyp = R.bool();
      const P = cl(e, e[2], 1), Qc = cl(e, e[4], 0), nP = cl(e, e[3], 1), nQ = cl(e, e[5], 0);
      return E.choice(R, `What is the ${hyp ? 'hypothesis' : 'conclusion'} of this conditional? ${Q(orig(e))}`, hyp ? P : Qc, hyp ? [Qc, nP, nQ] : [P, nQ, nP], `The hypothesis follows “if” (${P}); the conclusion follows “then” (${Qc}).`); } },
    b: { t: 'if–then form', g: R => { const x = R.pick(EV), e = evE(x);
      if (R.bool(0.55)) return E.choice(R, `Write this statement in if–then form: ${Q(x[0])}`, orig(e), [conv(e), inv(e), IF(e, e[2], e[5])], `The part that guarantees the other is the hypothesis: ${orig(e)}`);
      const P1 = cl(e, e[2], 1), Q1 = cl(e, e[4], 1);
      return E.choice(R, `What is the hypothesis of this statement? ${Q(x[0])}`, P1, [Q1, cl(e, e[3], 1), cl(e, e[5], 1)], `As a conditional: ${orig(e)} The hypothesis is ${Q(P1)}.${/only if/.test(x[0]) ? ' “p only if q” means “if p, then q”.' : ''}`); } },
    c: { t: 'truth value', g: R => { const want = R.bool(), fam = R.int(0, 4);
      const out = (p, w) => E.tf(`Is this conditional true or false? ${Q(p)}`, want, w);
      if (fam === 0) { let a, b; do { a = R.int(1, 20); b = R.int(1, 25); } while (a === b || (b <= a) !== want);
        return out(`If a whole number n is greater than ${a}, then n is greater than ${b}.`, want ? `True: every whole number above ${a} is at least ${a + 1}, which is more than ${b}.` : `False: n = ${b} is greater than ${a} but not greater than ${b}.`); }
      if (fam === 1) { const [a, b] = want ? R.pick([[12, 4], [12, 6], [15, 5], [18, 9], [20, 10], [24, 8], [30, 6], [14, 7], [21, 3], [16, 8]]) : R.pick([[4, 8], [6, 4], [9, 6], [10, 4], [12, 8], [15, 10], [8, 12], [6, 9], [14, 4], [20, 8]]);
        return out(`If a whole number is divisible by ${a}, then it is divisible by ${b}.`, want ? `True: ${a} = ${b} × ${a / b}, so any multiple of ${a} is a multiple of ${b}.` : `False: ${a} itself is divisible by ${a} but not by ${b}.`); }
      if (fam === 2) { const k = R.int(2, 12);
        return want ? out(`If ${E.pt('x=-' + k)}, then ${E.pt('x^2=' + k * k)}.`, `True: (−${k})² = ${k * k}.`) : out(`If ${E.pt('x^2=' + k * k)}, then ${E.pt('x=' + k)}.`, `False: x = −${k} makes the hypothesis true and the conclusion false.`); }
      if (fam === 3) { const m = R.pick([9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55]), p = R.pick([3, 5, 7, 11, 13, 17, 19, 23, 29, 31]), k = R.int(0, 1);
        if (want) return k ? out(`If ${m} is prime, then ${m} is even.`, `True: the hypothesis “${m} is prime” is false (${m} is not prime), and a conditional with a false hypothesis is true.`) : out(`If ${p} is prime, then ${p} is odd.`, `True: ${p} is prime and ${p} is odd, so the hypothesis and the conclusion are both true.`);
        return k ? out(`If ${m} is odd, then ${m} is prime.`, `False: ${m} is odd, but ${m} is not prime, so the hypothesis is true and the conclusion is false.`) : out(`If ${p} is prime, then ${p} is even.`, `False: ${p} is prime but not even.`); }
      const e = R.pick(CB.filter(x => !!x[6] === want));
      return out(orig(e), want ? 'True: whenever the hypothesis holds, so does the conclusion.' : `False: ${e[8]}.`); } },
    d: { t: 'rewrite everyday claims', g: R => { const mode = R.int(0, 2);
      const EVD = [['If it snows, school closes.', 'It snowed', 'It did not snow', 'school closed', 'school stayed open'],
        ['If you order online, delivery is free.', 'You ordered online', 'You ordered in the shop', 'delivery was free', 'you paid for delivery'],
        ['If the team wins on Saturday, it makes the playoffs.', 'The team won on Saturday', 'The team lost on Saturday', 'it made the playoffs', 'it missed the playoffs'],
        ['If you press the red button, the door opens.', 'You pressed the red button', 'You did not press the red button', 'the door opened', 'the door stayed shut'],
        ['If the temperature drops below 0°C, the pond freezes.', 'The temperature dropped below 0°C', 'The temperature stayed above 0°C', 'the pond froze', 'the pond did not freeze'],
        ['If Mia studies, she passes the test.', 'Mia studied', 'Mia did not study', 'she passed the test', 'she failed the test'],
        ['If the battery is charged, the phone turns on.', 'The battery was charged', 'The battery was flat', 'the phone turned on', 'the phone did not turn on'],
        ['If you buy two, you get one free.', 'You bought two', 'You bought only one', 'you got one free', 'you did not get one free'],
        ['If the bus is late, Leo misses the start of class.', 'The bus was late', 'The bus was on time', 'Leo missed the start of class', 'Leo was on time for class'],
        ['If it is sunny, we eat outside.', 'It was sunny', 'It was cloudy', 'we ate outside', 'we ate inside'],
        ['If a plant gets no water, it wilts.', 'The plant got no water', 'The plant got water', 'it wilted', 'it did not wilt'],
        ['If the store has milk, Dad buys some.', 'The store had milk', 'The store had no milk', 'Dad bought some', 'Dad bought none']];
      if (mode === 0) { const x = R.pick(EV), e = evE(x);
        return E.choice(R, `Rewrite the claim ${Q(x[0])} in if–then form.`, orig(e), [conv(e), inv(e), IF(e, e[5], e[2])], `The condition that guarantees the result goes after “if”: ${orig(e)}`); }
      const [cl0, pT, pF, qT, qF] = R.pick(EVD);
      if (mode === 1) return E.choice(R, `Which situation shows that the claim ${Q(cl0)} is false?`, `${pT}, and ${qF}.`, [`${pF}, and ${qT}.`, `${pF}, and ${qF}.`, `${pT}, and ${qT}.`], `A conditional is broken only when the hypothesis happens and the conclusion does not: “${pT}, and ${qF}.”`);
      const broke = R.bool(), sit = broke ? `${pT}, and ${qF}.` : R.pick([`${pF}, and ${qT}.`, `${pF}, and ${qF}.`, `${pT}, and ${qT}.`]);
      return E.tf(`The claim was ${Q(cl0)} ${sit} Does this show the claim is false?`, broke, broke ? 'Yes: the hypothesis happened and the conclusion did not.' : 'No: the claim is broken only if the hypothesis happens and the conclusion does not. When the hypothesis does not happen, the claim makes no promise.', YN); } },
  });

  /* V.1.03 Related conditionals */
  const relChoice = (R, which) => { const e = R.pick(CB);
    const F = { converse: conv(e), inverse: inv(e), contrapositive: contra(e) }, rule = { converse: 'swap the hypothesis and the conclusion', inverse: 'negate both parts', contrapositive: 'swap and negate both parts' }[which];
    const wrong = Object.keys(F).filter(k => k !== which).map(k => F[k]).concat([IF(e, e[2], e[5])]);
    return E.choice(R, `What is the ${which} of this statement? ${Q(orig(e))}`, F[which], wrong, `To form the ${which}, ${rule}: ${F[which]}`); };
  const relTruth = (R, which) => { const want = R.bool(), key = which === 'contrapositive' ? 6 : 7, e = R.pick(CB.filter(x => !!x[key] === want));
    const f = { converse: conv, inverse: inv, contrapositive: contra }[which](e);
    const why = want ? (which === 'contrapositive' ? 'It has the same truth value as the original, which is true.' : which === 'converse' ? `Whenever ${cl(e, e[4], 1)}, ${cl(e, e[2], 0)}.` : `Whenever ${cl(e, e[3], 1)}, ${cl(e, e[5], 0)}.`) : `It is false: ${e[which === 'contrapositive' ? 8 : 9]}.`;
    return E.tf(`Statement: ${Q(orig(e))} Its ${which}: ${Q(f)} Is the ${which} true?`, want, `${want ? 'Yes' : 'No'}. ${why}`, YN); };
  S('V.1.03', 'Related conditionals', {
    a: { t: 'converse', g: R => R.bool(0.6) ? relChoice(R, 'converse') : relTruth(R, 'converse') },
    b: { t: 'inverse', g: R => R.bool(0.6) ? relChoice(R, 'inverse') : relTruth(R, 'inverse') },
    c: { t: 'contrapositive', g: R => R.bool(0.6) ? relChoice(R, 'contrapositive') : relTruth(R, 'contrapositive') },
    d: { t: 'which ones are equivalent', g: R => { const mode = R.pick([0, 1, 1, 2]), e = R.pick(CB);
      if (mode === 0) { const toConv = R.bool();
        return toConv ? E.choice(R, `Which statement always has the same truth value as the converse of this statement? ${Q(orig(e))}`, inv(e), [contra(e), orig(e), IF(e, e[4], e[3])], `The converse ${Qs(conv(e))} and the inverse ${Qs(inv(e))} are contrapositives of each other, so they are equivalent.`)
          : E.choice(R, `Which statement always has the same truth value as this one? ${Q(orig(e))}`, contra(e), [conv(e), inv(e), IF(e, e[2], e[5])], `A conditional and its contrapositive are logically equivalent: ${contra(e)}`); }
      if (mode === 1) { const want = R.bool(), ask = R.pick(['inverse', 'contrapositive']), e2 = R.pick(CB.filter(x => !!x[ask === 'contrapositive' ? 6 : 7] === want));
        return E.tf(`The statement ${Qs(orig(e2))} is ${tv(e2[6])}, and its converse is ${tv(e2[7])}. Is its ${ask} true?`, want, ask === 'inverse' ? `The inverse is the contrapositive of the converse, so it matches the converse: ${tv(e2[7])}.` : `The contrapositive always matches the original statement: ${tv(e2[6])}.`, YN); }
      const pairs = [['p → q', '¬q → ¬p', ['q → p', '¬p → ¬q', 'p → ¬q'], 'A conditional is equivalent to its contrapositive.'], ['q → p', '¬p → ¬q', ['¬q → ¬p', 'p → q', 'q → ¬p'], 'The converse q → p is equivalent to the inverse ¬p → ¬q (each is the contrapositive of the other).'],
        ['¬p → ¬q', 'q → p', ['p → q', '¬q → ¬p', '¬p → q'], 'The inverse ¬p → ¬q is the contrapositive of the converse q → p.'], ['¬q → ¬p', 'p → q', ['q → p', '¬p → ¬q', '¬q → p'], 'The contrapositive ¬q → ¬p is equivalent to the original p → q.']];
      const [a, r, w, why] = R.pick(pairs); return E.choice(R, `Which statement is logically equivalent to ${a}?`, r, w, why); } },
  });

  /* V.1.04 Biconditionals */
  const lc1 = s => s.replace(/^If/, 'if');
  const DEFB = [['an angle', 'a right angle', 'measures exactly 90°', 'is not acute', 0, 'A right angle is an angle that measures exactly 90°.'],
    ['a triangle', 'equilateral', 'has three congruent sides', 'has two congruent sides', 0, 'An equilateral triangle is a triangle with three congruent sides.'],
    ['an integer', 'even', 'is divisible by 2', 'is divisible by 4', 0, 'An even number is an integer that is divisible by 2.'],
    ['a quadrilateral', 'a rhombus', 'has four congruent sides', 'has perpendicular diagonals', 0, 'A rhombus is a quadrilateral with four congruent sides.'],
    ['two lines', 'perpendicular', 'meet to form right angles', 'intersect', 1, 'Perpendicular lines are lines that meet to form right angles.'],
    ['a whole number greater than 1', 'prime', 'has exactly two factors', 'is odd', 0, 'A prime is a whole number greater than 1 with exactly two factors.'],
    ['an angle', 'acute', 'measures more than 0° and less than 90°', 'measures less than 180°', 0, 'An acute angle is an angle that measures more than 0° and less than 90°.'],
    ['a year', 'a leap year', 'has 366 days', 'is divisible by 4', 0, 'A leap year is a year with 366 days.'],
    ['a polygon', 'a triangle', 'has exactly three sides', 'has three angles or more', 0, 'A triangle is a polygon with exactly three sides.'],
    ['a triangle', 'isosceles', 'has at least two congruent sides', 'has a right angle', 0, 'An isosceles triangle is a triangle with at least two congruent sides.'],
    ['a rectangle', 'a square', 'has four congruent sides', 'has four right angles', 0, 'A square is a rectangle with four congruent sides.'],
    ['two angles', 'supplementary', 'have measures that add to 180°', 'form a linear pair', 1, 'Supplementary angles are two angles whose measures add to 180°.'],
    ['two angles', 'complementary', 'have measures that add to 90°', 'are both acute', 1, 'Complementary angles are two angles whose measures add to 90°.'],
    ['an angle', 'obtuse', 'measures more than 90° and less than 180°', 'measures more than 90°', 0, 'An obtuse angle is an angle that measures more than 90° and less than 180°.']];
  const defBI = (d, prop) => `${cap(d[0])} ${d[4] ? 'are' : 'is'} ${d[1]} if and only if ${d[4] ? 'they' : 'it'} ${prop}.`;
  const defIF = (d, prop, rev) => rev ? `If ${d[0]} ${prop}, then ${d[4] ? 'they are' : 'it is'} ${d[1]}.` : `If ${d[0]} ${d[4] ? 'are' : 'is'} ${d[1]}, then ${d[4] ? 'they' : 'it'} ${prop}.`;
  const DIR = ['True: both directions hold', 'False: the left-to-right direction fails', 'False: the right-to-left direction fails', 'False: both directions fail'];
  const dirOf = (lr, rl) => lr ? (rl ? 0 : 2) : (rl ? 1 : 3);
  S('V.1.04', 'Biconditionals', {
    a: { t: 'if and only if', g: R => {
      if (R.bool(0.6)) { const want = R.bool(), e = R.pick(CB.filter(x => !!(x[6] && x[7]) === want));
        return E.tf(`Is this biconditional true? ${Q(BI(e))}`, want, want ? `Yes: ${Q(orig(e))} and ${Q(conv(e))} are both true.` : `No: a biconditional needs both directions. ${!e[6] ? Q(orig(e)) + ' is false: ' + e[8] + '.' : Q(conv(e)) + ' is false: ' + e[9] + '.'}`, YN); }
      const e = R.pick(CB);
      return E.choice(R, `Which means the same as this biconditional? ${Q(BI(e))}`, `${orig(e)} Also, ${lc1(conv(e))}`, [orig(e), conv(e), `${orig(e)} Also, ${lc1(contra(e))}`], '“p if and only if q” is the conditional and its converse together: p → q and q → p. The contrapositive only repeats p → q.'); } },
    b: { t: 'split into two conditionals', g: R => {
      if (R.bool(0.55)) { const e = R.pick(CB);
        return E.choice(R, `The biconditional ${Qs(BI(e))} combines ${Qs(orig(e))} with which other conditional?`, conv(e), [contra(e), IF(e, e[2], e[5]), IF(e, e[5], e[2])], `The two directions are p → q and q → p, so the other one is the converse: ${conv(e)} (The contrapositive is just p → q again.)`); }
      const a = R.pick([2, 3, 4, 5]), k = R.int(-6, 9), b = R.pick([-9, -7, -5, -4, -3, -2, -1, 1, 2, 3, 5, 6, 8]), c = a * k + b, sb = b > 0 ? '+' + b : String(b);
      const p = M(`${a}x${sb}=${c}`), q = M(`x=${k}`), np = M(`${a}x${sb}!=${c}`), nq = M(`x!=${k}`);
      return E.choice(R, `Which two conditionals make up ${p} if and only if ${q}?`, `If ${p}, then ${q}. If ${q}, then ${p}.`, [`If ${p}, then ${q}. If ${nq}, then ${np}.`, `If ${q}, then ${p}. If ${np}, then ${nq}.`, `If ${p}, then ${nq}. If ${q}, then ${np}.`], `A biconditional is p → q together with its converse q → p. A contrapositive only repeats a direction you already have.`); } },
    c: { t: 'test both directions', g: R => { const want = R.int(0, 3), fam = R.int(0, 2), k = R.int(2, 9); let st, lr, rl, wl = '', wr = '';
      if (fam === 0) { const e = R.pick(CB.filter(x => dirOf(x[6], x[7]) === want)); st = BI(e); lr = !!e[6]; rl = !!e[7]; wl = e[8]; wr = e[9]; }
      else if (fam === 1) {
        if (want === 0) { const a = R.pick([2, 3, 5]), b = R.int(1, 9); st = `${M(`${a}x+${b}=${a * k + b}`)} if and only if ${M('x=' + k)}.`; lr = rl = true; }
        else if (want === 1) { st = `${M(`x^2=${k * k}`)} if and only if ${M('x=' + k)}.`; lr = false; rl = true; wl = `x = −${k} gives x² = ${k * k}, but x ≠ ${k}`; }
        else if (want === 2) { lr = true; rl = false;
          if (R.bool()) { st = `${M('x=' + k)} if and only if ${M(`x^2=${k * k}`)}.`; wr = `x = −${k} gives x² = ${k * k}, but x ≠ ${k}`; }
          else { st = `${M('x>' + k)} if and only if ${M(`x^2>${k * k}`)}.`; wr = `x = −${k + 1} gives x² = ${(k + 1) ** 2}, which is greater than ${k * k}, but x is not greater than ${k}`; } }
        else { const b = k + R.int(2, 6); st = `${M('x>' + k)} if and only if ${M('x<' + b)}.`; lr = rl = false; wl = `x = ${b + 1} is greater than ${k} but not less than ${b}`; wr = `x = ${k - 1} is less than ${b} but not greater than ${k}`; } }
      else {
        if (want === 0) { st = R.pick(['A whole number is a multiple of 10 if and only if its last digit is 0.', 'A whole number is even if and only if its last digit is even.', 'A whole number is a multiple of 5 if and only if its last digit is 0 or 5.']); lr = rl = true; }
        else { const DV = [[6, 3], [12, 4], [15, 5], [20, 10], [18, 6], [10, 5], [3, 6], [4, 12], [5, 15], [10, 20], [6, 18], [5, 10], [4, 6], [6, 9], [10, 4], [8, 12], [9, 6], [14, 4]];
          const [a, b] = R.pick(DV.filter(([a, b]) => dirOf(a % b === 0, b % a === 0) === want));
          st = `A whole number is divisible by ${a} if and only if it is divisible by ${b}.`; lr = a % b === 0; rl = b % a === 0; wl = `${a} is divisible by ${a} but not by ${b}`; wr = `${b} is divisible by ${b} but not by ${a}`; } }
      const ans = dirOf(lr, rl);
      const why = ans === 0 ? 'Each direction holds, so the biconditional is true.' : [lr ? 'Left to right holds.' : `Left to right fails: ${wl}.`, rl ? 'Right to left holds.' : `Right to left fails: ${wr}.`].join(' ');
      return E.choiceFixed(`Test both directions of this biconditional: ${Q(st)}`, DIR, ans, why); } },
    d: { t: 'definitions as biconditionals', g: R => { const d = R.pick(DEFB);
      if (R.bool()) return E.choice(R, `Write this definition as a biconditional: ${Q(d[5])}`, defBI(d, d[2]), [defIF(d, d[2], false), defIF(d, d[2], true), defBI(d, d[3])], `A definition works both ways, so it is a biconditional: ${defBI(d, d[2])} A single “if … then” gives only one direction.`);
      const others = R.sample(DEFB.filter(x => x !== d), 3);
      return E.choice(R, 'Which of these biconditionals is true, so it could serve as a definition?', defBI(d, d[2]), others.map(o => defBI(o, o[3])), `${Q(defBI(d, d[2]))} holds in both directions. Each of the others fails at least one direction.`); } },
  });

  /* ---------- formulas over p, q, r ---------- */
  const At = n => ({ t: n, f: v => v[n], at: 1, vars: [n], kids: [] });
  const W = A => A.at ? A.t : `(${A.t})`;
  const Not = A => ({ t: '¬' + W(A), f: v => !A.f(v), at: 1, vars: A.vars, kids: [A], neg: 1 });
  const OPF = { '∧': (a, b) => a && b, '∨': (a, b) => a || b, '→': (a, b) => !a || b, '↔': (a, b) => a === b };
  const Bin = (A, op, B) => ({ t: `${W(A)} ${op} ${W(B)}`, f: v => OPF[op](A.f(v), B.f(v)), vars: [...new Set([...A.vars, ...B.vars])], kids: [A, B], op, A, B });
  const p = At('p'), q = At('q'), r = At('r');
  const rowsOf = vs => { const out = []; const n = vs.length; for (let m = 0; m < 1 << n; m++) { const v = {}; vs.forEach((x, i) => v[x] = !((m >> (n - 1 - i)) & 1)); out.push(v); } return out; };
  const vec = (F, vs) => rowsOf(vs).map(v => F.f(v));
  const sameF = (A, B, vs = ['p', 'q']) => vec(A, vs).every((x, i) => x === vec(B, vs)[i]);
  const ttab = (vs, cols, hide) => tbl([...vs, ...cols.map(c => c.t)], rowsOf(vs).map((v, i) => [...vs.map(x => TF(v[x])), ...cols.map((c, j) => hide && hide[0] === i && hide[1] === j ? '<b>?</b>' : TF(c.f(v)))]));
  const rowName = (v, vs) => vs.map(x => `${x} = ${TF(v[x])}`).join(', ');
  const LIT2 = [p, q, Not(p), Not(q)];
  // subformulas in the order you would build the columns (no bare letters)
  const subs = F => { const out = []; const walk = X => { X.kids.forEach(walk); if (!X.at || X.neg) if (!out.some(o => o.t === X.t)) out.push(X); }; walk(F); return out; };
  const randF = (R, vs) => { for (;;) { const lits = vs.flatMap(x => [At(x), Not(At(x))]), L = () => R.pick(lits), op = () => R.pick(['∧', '∨', '→', '∨', '∧', '→', '↔']);
      const k = R.int(0, 3); let F;
      if (k === 0) F = Bin(Bin(L(), op(), L()), op(), L());
      else if (k === 1) F = Bin(L(), op(), Bin(L(), op(), L()));
      else if (k === 2) F = Bin(Not(Bin(L(), op(), L())), op(), L());
      else F = Not(Bin(L(), op(), Bin(L(), op(), L())));
      const lt = []; (function w(X) { if (X.at && (!X.neg || X.kids[0].at)) { lt.push(X.t); return; } X.kids.forEach(w); })(F);
      if (F.vars.length === vs.length && new Set(lt).size === lt.length && new Set(lt.map(t => t.replace('¬', ''))).size >= Math.min(3, lt.length) - (vs.length === 2 ? 1 : 0)) return F; } };
  // facts with a known truth value, for p and q
  const fact = R => { const k = R.int(0, 4);
    if (k === 0) { const n = R.int(10, 60); return [`${n} is even`, n % 2 === 0]; }
    if (k === 1) { const n = R.int(10, 60); return [`${n} is prime`, isPrime(n)]; }
    if (k === 2) { const a = R.int(-9, 20), b = R.int(-9, 20); return [`${M(`${a}>${b}`)}`, a > b]; }
    if (k === 3) { const b = R.int(3, 9), n = R.int(12, 70); return [`${n} is a multiple of ${b}`, n % b === 0]; }
    const n = R.pick([16, 20, 25, 30, 36, 40, 49, 50, 64, 72, 81, 90, 100]); return [`${n} is a perfect square`, Number.isInteger(Math.sqrt(n))]; };
  const twoFacts = R => { let a, b; do { a = fact(R); b = fact(R); } while (a[0] === b[0]); return [a, b]; };

  /* V.1.05 Truth tables */
  const F_AO = [Not(p), Bin(p, '∧', q), Bin(p, '∨', q), Bin(Not(p), '∧', q), Bin(p, '∨', Not(q)), Not(Bin(p, '∧', q)), Not(Bin(p, '∨', q)), Bin(Not(p), '∨', Not(q)), Bin(p, '∧', Not(q)), Not(q)];
  const F_IF = [Bin(p, '→', q), Bin(q, '→', p), Bin(Not(p), '→', q), Bin(p, '→', Not(q)), Bin(Not(q), '→', Not(p)), Bin(Not(p), '→', Not(q))];
  const missCell = (R, forms, want, lead) => { for (;;) { const F = R.pick(forms), i = R.int(0, 3), v = rowsOf(['p', 'q'])[i];
      if (F.f(v) !== want) continue;
      const cols = subs(F).filter(s => s.t !== F.t && s.neg && s.kids[0].at).concat([F]);
      return E.choiceFixed(`${lead} What goes in the box marked ?`, ['T', 'F'], want ? 0 : 1, `In the row ${rowName(v, ['p', 'q'])}${cols.length > 1 ? ' (so ' + cols.slice(0, -1).map(c => `${c.t} is ${TF(c.f(v))}`).join(', ') + ')' : ''}, ${F.t} is ${TF(want)}.${F.op === '→' && !want ? ' A conditional is false only when its hypothesis is true and its conclusion is false.' : ''}`, { prompt: `${lead} What goes in the box marked ?` + ttab(['p', 'q'], cols, [i, cols.length - 1]) }); } };
  const factEval = (R, forms, want) => { for (let n = 0; ; n++) { const [[pt, pv], [qt, qv]] = twoFacts(R), F = R.pick(forms), v = { p: pv, q: qv };
      if (F.f(v) !== want) continue;
      return E.tf(`Let p be “${pt}” and q be “${qt}”. Is ${F.t} true or false?`, want, `p is ${tv(pv)} and q is ${tv(qv)}, so ${F.t} is ${tv(want)}.${F.op === '→' && !pv ? ' A conditional with a false hypothesis is true.' : ''}`); } };
  // truth-value puzzles: clues that pin down p, q, r
  const clueBank = () => { const L = ['p', 'q', 'r'].flatMap(x => [At(x), Not(At(x))]), out = [];
    for (const A of L) for (const B of L) if (A.vars[0] < B.vars[0]) for (const op of ['∧', '∨', '→', '↔']) { out.push(Bin(A, op, B)); if (op === '→') out.push(Bin(B, op, A)); }
    return out; };
  const CLUES = clueBank();
  const asg = v => `p: ${TF(v.p)}, q: ${TF(v.q)}, r: ${TF(v.r)}`;
  // knights and knaves
  const KK = (X, Y, Z) => [
    [`${Y} is a knave.`, k => !k[Y]], [`${Y} is a knight.`, k => k[Y]], [`${Y} and I are both knights.`, k => k[X] && k[Y]], [`${Y} and I are both knaves.`, k => !k[X] && !k[Y]],
    [`At least one of ${Y} and I is a knave.`, k => !k[X] || !k[Y]], [`${Y} and I are the same type.`, k => k[X] === k[Y]], [`${Y} and I are different types.`, k => k[X] !== k[Y]], [`If I am a knight, then so is ${Y}.`, k => !k[X] || k[Y]],
    ...(Z ? [[`${Y} and ${Z} are both knaves.`, k => !k[Y] && !k[Z]], [`Exactly one of us three is a knight.`, k => [X, Y, Z].filter(w => k[w]).length === 1], [`At least two of us three are knaves.`, k => [X, Y, Z].filter(w => !k[w]).length >= 2], [`${Y} and ${Z} are the same type.`, k => k[Y] === k[Z]]] : [])];
  S('V.1.05', 'Truth tables', {
    a: { t: 'not, and, or', g: R => { const want = R.bool();
      return R.bool() ? factEval(R, F_AO, want) : missCell(R, F_AO, want, 'Here is part of a truth table.'); } },
    b: { t: "the conditional's table", g: R => { const want = R.bool();
      return R.bool(0.55) ? missCell(R, F_IF, want, 'Here is part of a truth table.') : factEval(R, F_IF, want); } },
    c: { t: 'build a table', g: R => { const vs = R.bool(0.7) ? ['p', 'q'] : ['p', 'q', 'r'], F = randF(R, vs), rows = rowsOf(vs), col = rows.map(v => F.f(v));
      if (R.bool(0.55)) { const n = col.filter(Boolean).length;
        return E.num(`Build the truth table for ${F.t}. In how many of its ${rows.length} rows is it true?`, [{ ans: n }], `Its column reads ${col.map(TF).join(', ')} (rows in the order ${rows.slice(0, 2).map(v => vs.map(x => TF(v[x])).join('')).join(', ')}, …), so it is true in ${n} row${n === 1 ? '' : 's'}.`); }
      const want = R.bool(), idx = rows.map((v, i) => i).filter(i => col[i] === want); if (!idx.length) return E.num(`Build the truth table for ${F.t}. In how many of its ${rows.length} rows is it true?`, [{ ans: col.filter(Boolean).length }], `Its column reads ${col.map(TF).join(', ')}.`);
      const i = R.pick(idx), cols = subs(F).filter(s => s.t !== F.t).concat([F]), v = rows[i];
      return E.choiceFixed(`Complete the truth table for ${F.t}. What goes in the box marked ?` + ttab(vs, cols, [i, cols.length - 1]), ['T', 'F'], want ? 0 : 1, `In the row ${rowName(v, vs)}: ${cols.slice(0, -1).map(c => `${c.t} is ${TF(c.f(v))}`).join(', ')}, so ${F.t} is ${TF(want)}.`); } },
    d: { t: 'prove equivalence by table', g: R => {
      const TGT = [Not(Bin(p, '∧', q)), Not(Bin(p, '∨', q)), Bin(p, '→', q), Not(Bin(p, '→', q)), Bin(q, '→', p), Bin(Not(p), '→', q), Bin(p, '∨', Not(q)), Not(Bin(Not(p), '∧', q)), Not(Bin(p, '∧', Not(q)))];
      const POOL = []; for (const A of LIT2) for (const B of LIT2) if (A.vars[0] !== B.vars[0]) for (const op of ['∧', '∨', '→']) { POOL.push(Bin(A, op, B)); POOL.push(Not(Bin(A, op, B))); }
      const norm = F => F.op && (F.op === '∧' || F.op === '∨') ? [W(F.A), W(F.B)].sort().join(F.op) : F.neg && F.kids[0].op ? '¬' + norm(F.kids[0]) : F.t;
      const T = R.pick(TGT), eq = POOL.filter(X => sameF(X, T) && norm(X) !== norm(T)), vt = vec(T, ['p', 'q']);
      const diff = X => vec(X, ['p', 'q']).filter((x, i) => x !== vt[i]).length, near = POOL.filter(X => !sameF(X, T) && diff(X) <= 2);
      if (R.bool(0.55)) { const right = R.pick(eq), wrong = R.sample(near, 3);
        return E.choice(R, `Which statement is logically equivalent to ${T.t}? Use a truth table to check.`, right.t, wrong.map(w => w.t), `Both columns read ${vt.map(TF).join(', ')} (rows TT, TF, FT, FF). Each of the others differs from ${T.t} in at least one row.`); }
      const want = R.bool(), B = want ? R.pick(eq) : R.pick(near), vb = vec(B, ['p', 'q']), bad = vb.findIndex((x, i) => x !== vt[i]);
      return E.tf(`The table shows the column for ${T.t}. Is ${B.t} logically equivalent to it?` + ttab(['p', 'q'], [T]), want, want ? `Yes: the column for ${B.t} is also ${vb.map(TF).join(', ')}, matching in every row.` : `No: in the row ${rowName(rowsOf(['p', 'q'])[bad], ['p', 'q'])}, ${T.t} is ${TF(vt[bad])} but ${B.t} is ${TF(vb[bad])}.`, YN); } },
    e: { t: 'truth-value puzzles', g: R => { const all = rowsOf(['p', 'q', 'r']);
      for (;;) { const v = R.pick(all), pool = R.shuffle(CLUES.filter(c => c.f(v))), clues = [];
        for (const c of pool) { if (clues.length >= 3) break; const before = all.filter(w => clues.every(k => k.f(w))).length; clues.push(c); const after = all.filter(w => clues.every(k => k.f(w))).length; if (after === before) clues.pop(); }
        const fit = all.filter(w => clues.every(k => k.f(w)));
        if (fit.length !== 1 || clues.length < 3) continue;
        if (clues.some(c => all.filter(w => c.f(w)).length <= 2)) continue;          // no clue gives two letters away at once
        const others = R.sample(all.filter(w => w !== v), 3), brk = w => clues.findIndex(k => !k.f(w)) + 1;
        return E.choice(R, `All three statements are true: ${clues.map((c, i) => `(${i + 1}) ${c.t}`).join(', ')}. What are the truth values of p, q and r?`, asg(v), others.map(asg), `Only ${asg(v)} makes all three true. ${others.map(w => `${asg(w)} breaks statement ${brk(w)}`).join('; ')}.`); } } },
    f: { t: 'knights and knaves', g: R => { const [X, Y, Z] = ['A', 'B', 'C'], three = R.bool(0.45), ppl = three ? [X, Y, Z] : [X, Y];
      const allK = []; for (let m = 0; m < 1 << ppl.length; m++) { const k = {}; ppl.forEach((w, i) => k[w] = !!((m >> i) & 1)); allK.push(k); }
      const show = k => ppl.map(w => `${w} is a ${k[w] ? 'knight' : 'knave'}`).join(', ');
      for (;;) { const truth = R.pick(allK), says = [];
        for (const w of ppl) { const rest = ppl.filter(u => u !== w), [y, z] = R.shuffle(rest), opts = KK(w, y, three ? z : null).filter(s => s[1](truth) === truth[w]); says.push([w, R.pick(opts)]); }
        const speak = three && R.bool(0.4) ? says.slice(0, 2) : says;
        const fit = allK.filter(k => speak.every(([w, s]) => s[1](k) === k[w]));
        if (fit.length !== 1) continue;
        const others = R.sample(allK.filter(k => k !== truth), 3);
        return E.choice(R, `On an island, knights always tell the truth and knaves always lie. ${speak.map(([w, s]) => `${w} says, “${s[0]}”`).join(' ')} Who is what?`, show(truth), others.map(show), `Check: ${speak.map(([w, s]) => `${w} is a ${truth[w] ? 'knight, and the statement is true' : 'knave, and the statement is false'}`).join('; ')}. Every other combination makes someone's statement clash with their type.`); } } },
  });

  /* V.1.06 Inductive vs deductive */
  const seqQ = R => { const k = R.int(0, 5); let t, rule;
    if (k === 0) { const a = R.int(-10, 20), d = R.pick([-9, -7, -6, -4, -3, 3, 4, 5, 6, 7, 8, 9, 11]); t = [0, 1, 2, 3, 4, 5].map(i => a + d * i); rule = `add ${d}`.replace('add -', 'subtract '); }
    else if (k === 1) { const a = R.int(1, 5), m = R.pick([2, 3, -2]); t = [0, 1, 2, 3, 4, 5].map(i => a * m ** i); rule = `multiply by ${m}`; }
    else if (k === 2) { const c = R.int(-3, 5); t = [1, 2, 3, 4, 5, 6].map(i => i * i + c); rule = c ? `square numbers ${c > 0 ? 'plus ' + c : 'minus ' + -c}` : 'square numbers'; }
    else if (k === 3) { const x = R.int(1, 6), y = R.int(x, 9); t = [x, y]; while (t.length < 6) t.push(t[t.length - 1] + t[t.length - 2]); rule = 'add the two previous terms'; }
    else if (k === 4) { const a = R.int(1, 9), d = R.int(1, 4); t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] + d + i - 1); rule = `the gaps grow by 1 (${d}, ${d + 1}, ${d + 2}, …)`; }
    else { const c = R.int(0, 4); t = [1, 2, 3, 4, 5, 6].map(i => i * (i + 1) / 2 + c); rule = `the gaps are 2, 3, 4, …`; }
    return E.num(`Look for a pattern: ${t.slice(0, 5).join(', ')}, … Based on the pattern, what is the next number?`, [{ ans: t[5] }], `The pattern: ${rule}. The next term is ${t[5]}. This is inductive reasoning: a reasonable conjecture, not a proof.`); };
  const CONJ = [
    [R => { let xs; do xs = R.sample([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21], 3).sort((a, b) => a - b); while (xs.every(x => (2 * x + 2) % 8 === 0)); return xs.map(x => `${x} + ${x + 2} = ${2 * x + 2}`); }, 'the sum of two consecutive odd numbers is a multiple of 4', ['the sum of two consecutive odd numbers is a multiple of 8', 'the sum of two consecutive odd numbers is odd', 'the sum of two consecutive odd numbers is a perfect square'], 'Each total is a multiple of 4, but not all are multiples of 8, none are odd, and not all are squares.'],
    [R => { let xs; do xs = R.sample([2, 3, 4, 5, 6, 7, 8, 9, 10], 3).sort((a, b) => a - b); while (xs.every(x => (x * (x + 1)) % 4 === 0)); return xs.map(x => `${x} × ${x + 1} = ${x * (x + 1)}`); }, 'the product of two consecutive whole numbers is even', ['the product of two consecutive whole numbers is a multiple of 4', 'the product of two consecutive whole numbers is odd', 'the product of two consecutive whole numbers is a perfect square'], 'Every product is even; at least one is not a multiple of 4.'],
    [R => { let xs; do xs = R.sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 3).sort((a, b) => a - b); while (xs.every(x => (3 * x + 3) % 2 === 0) || xs.every(x => (3 * x + 3) % 9 === 0)); return xs.map(x => `${x} + ${x + 1} + ${x + 2} = ${3 * x + 3}`); }, 'the sum of three consecutive whole numbers is a multiple of 3', ['the sum of three consecutive whole numbers is even', 'the sum of three consecutive whole numbers is a multiple of 9', 'the sum of three consecutive whole numbers is odd'], 'Every total is a multiple of 3; the totals are not all even, not all odd and not all multiples of 9.'],
    [R => { let xs; do xs = R.sample([[3, 5], [3, 7], [5, 7], [7, 9], [3, 11], [5, 9], [9, 11], [7, 11]], 3); while (xs.every(([a, b]) => (a * b) % 3 === 0) || !xs.some(([a, b]) => !isPrime(a * b))); return xs.map(([a, b]) => `${a} × ${b} = ${a * b}`); }, 'the product of two odd numbers is odd', ['the product of two odd numbers is prime', 'the product of two odd numbers is even', 'the product of two odd numbers is a multiple of 3'], 'Every product is odd; none is prime and not all are multiples of 3.'],
    [R => { let xs; do xs = R.sample([3, 5, 7, 9, 11], 3).sort((a, b) => a - b); while (xs.every(x => (x * x - 1) % 16 === 0)); return xs.map(x => `${x}² − 1 = ${x * x - 1}`); }, 'one less than the square of an odd number is a multiple of 8', ['one less than the square of an odd number is a multiple of 16', 'one less than the square of an odd number is odd', 'one less than the square of an odd number is a perfect square'], 'Each result is a multiple of 8; not all are multiples of 16.'],
  ];
  const ARG_I = [R => `${R.pick(NAMES)} noticed that the last ${R.int(4, 9)} buses were late, so the next bus will be late too.`,
    R => `In each of the ${R.int(5, 12)} triangles ${R.pick(NAMES)} measured, the angles added to 180°. So the angles of every triangle add to 180°.`,
    R => { const a = R.int(1, 9), d = R.int(2, 7); return `The numbers ${a}, ${a + d}, ${a + 2 * d}, ${a + 3 * d} go up by ${d} each time, so the next one will be ${a + 4 * d}.`; },
    R => `It has rained on each of the last ${R.int(3, 6)} Mondays, so it will rain next Monday.`,
    R => `${R.pick(NAMES)} tested n = 1 to ${R.int(6, 20)} and found that n² + n was even every time, so n² + n is always even.`,
    R => `Every swan ${R.pick(NAMES)} has seen in ${R.int(10, 30)} years of birdwatching is white, so all swans are white.`,
    R => `The first ${R.int(5, 15)} odd numbers ${R.pick(NAMES)} squared all gave odd results, so the square of every odd number is odd.`,
    R => `The café has sold out of muffins by ${R.int(9, 11)} a.m. on each of the last ${R.int(4, 8)} Saturdays, so it will sell out this Saturday.`];
  const ARG_D = [R => { const b = R.int(2, 7), a = b * R.int(2, 4), n = a * R.int(3, 12); return `All multiples of ${a} are multiples of ${b}. ${n} is a multiple of ${a}, so ${n} is a multiple of ${b}.`; },
    R => { const x = R.int(20, 160); return `Vertical angles are congruent. ∠1 and ∠2 are vertical angles and m∠1 = ${x}°, so m∠2 = ${x}°.`; },
    R => { const x = R.int(30, 80), y = R.int(30, 80); return `The angles of a triangle add to 180°. Two angles of a triangle are ${x}° and ${y}°, so the third is ${180 - x - y}°.`; },
    R => 'Every square is a rectangle, and every rectangle has four right angles, so every square has four right angles.',
    R => { const h = R.int(5, 9); return `The library closes at ${h} p.m. on Fridays. Today is Friday, so the library closes at ${h} p.m. today.`; },
    R => { const a = R.pick([3, 5, 7, 9, 11]), b = R.pick([13, 15, 17, 19]); return `An odd number times an odd number is odd. ${a} and ${b} are odd, so ${a * b} is odd.`; },
    R => { const n = R.int(2, 9); return `If a number ends in 0, it is divisible by 10. ${n}${R.int(1, 9)}0 ends in 0, so it is divisible by 10.`; },
    R => `All members of the chess club are in grade 10. ${R.pick(NAMES)} is in the chess club, so ${R.pick(['she', 'he'])} is in grade 10.`];
  // short deductions: two facts, then three lines (given, Fact 1, Fact 2)
  const DEDUCE = [
    R => { const n = R.pick(['PQRS', 'ABCD', 'JKLM', 'WXYZ']); return ['If a quadrilateral is a square, then it is a rhombus.', 'If a quadrilateral is a rhombus, then its diagonals are perpendicular.', [`${n} is a square.`, `${n} is a rhombus.`, `The diagonals of ${n} are perpendicular.`]]; },
    R => { const n = R.pick(['PQRS', 'ABCD', 'JKLM', 'WXYZ']); return ['If a quadrilateral is a rectangle, then it is a parallelogram.', 'If a quadrilateral is a parallelogram, then its diagonals bisect each other.', [`${n} is a rectangle.`, `${n} is a parallelogram.`, `The diagonals of ${n} bisect each other.`]]; },
    R => { const n = 12 * R.int(3, 40); return ['If a whole number is a multiple of 12, then it is a multiple of 6.', 'If a whole number is a multiple of 6, then it is even.', [`${n} is a multiple of 12.`, `${n} is a multiple of 6.`, `${n} is even.`]]; },
    R => { const n = R.pick(['△ABC', '△PQR', '△XYZ', '△JKL']); return ['If a triangle is equilateral, then it is isosceles.', 'If a triangle is isosceles, then it has two congruent angles.', [`${n} is equilateral.`, `${n} is isosceles.`, `${n} has two congruent angles.`]]; },
    R => { const a = R.pick(['∠1', '∠2', '∠A', '∠P']), b = R.pick(['∠3', '∠4', '∠B', '∠Q']); return ['If two angles are vertical angles, then they are congruent.', 'If two angles are congruent, then they have equal measures.', [`${a} and ${b} are vertical angles.`, `${a} ≅ ${b}`, `m${a} = m${b}`]]; },
    R => { const n = 10 * R.int(3, 60); return ['If a whole number ends in 0, then it is a multiple of 10.', 'If a whole number is a multiple of 10, then it is a multiple of 5.', [`${n} ends in 0.`, `${n} is a multiple of 10.`, `${n} is a multiple of 5.`]]; }];
  S('V.1.06', 'Inductive vs deductive', {
    a: { t: 'patterns and conjectures', g: R => { if (R.bool(0.55)) return seqQ(R);
      const [ex, right, wrong, why] = R.pick(CONJ);
      return E.choice(R, `Look at these examples: ${ex(R).join('; ')}. Which conjecture fits all of them best?`, right, wrong, why); } },
    b: { t: 'why patterns can fail', g: R => { const k = R.int(0, 3);
      if (k === 0) { const pp = R.pick([11, 17, 41]), first = [0, 1, 2, 3].map(n => n * n + n + pp), good = []; for (let n = 4; n < pp - 1; n++) if (isPrime(n * n + n + pp)) good.push(n);
        const ds = R.sample(good, 3);
        return E.choice(R, `For n = 0, 1, 2, 3, the expression ${M(`n^2+n+${pp}`)} gives ${first.join(', ')}, all prime. Which value of n shows that it is not always prime?`, `n = ${pp - 1}`, ds.map(d => `n = ${d}`), `At n = ${pp - 1}: ${(pp - 1) ** 2} + ${pp - 1} + ${pp} = ${pp * pp} = ${pp} × ${pp}, which is not prime. The early examples could not prove it.`); }
      if (k === 1) { const f = R.pick(['1/2', '1/3', '2/3', '1/4', '3/4', '2/5', '0.5', '0.2']), v = E.value(f)[0];
        return E.choice(R, `${M('1^2>=1')}, ${M('2^2>=2')}, ${M('3^2>=3')}, ${M('10^2>=10')}. Which number breaks the conjecture “${M('x^2>=x')} for every number x”?`, `x = ${E.pt(f)}`, [`x = ${R.int(4, 9)}`, 'x = 0', 'x = 1'], `(${E.pt(f)})² = ${+(v * v).toFixed(4)}, which is less than ${E.pt(f)}. Numbers between 0 and 1 get smaller when squared.`); }
      if (k === 2) { const ds = R.sample(['p = 2', 'p = 3', 'p = 5', 'p = 7', 'p = 13'], 3);
        return E.choice(R, `${M('2^2-1=3')}, ${M('2^3-1=7')}, ${M('2^5-1=31')} and ${M('2^7-1=127')} are all prime. Which value of p shows that ${M('2^p-1')} is not prime for every prime p?`, 'p = 11', ds, `2¹¹ − 1 = 2047 = 23 × 89. The other listed values of p all give primes, so they cannot disprove it.`); }
      const pts = R.int(5, 6), vals = [1, 2, 4, 8, 16, 31];
      return E.choice(R, `Place n points on a circle and join every pair with a chord. The regions for n = 1 to 5 are 1, 2, 4, 8, 16. With n = 6 you get ${vals[5]}, not 32. What does this show?`, 'A pattern from examples can fail, however convincing it looks', ['The count for n = 6 must be wrong', 'The doubling rule is proved for n = 1 to 5', 'Patterns never work'], `Five examples fitted doubling, yet the sixth does not. Only a deductive proof can show a pattern holds every time.`); } },
    c: { t: 'deduction from facts', g: R => { const k = R.int(0, 7);
      if (k >= 5) { const [f1, f2, st] = R.pick(DEDUCE)(R), ln = R.int(2, 3), rs = ['Given', 'Fact 1', 'Fact 2'], lines = [st[0], st[1], st[2]];
        const why = ln === 2 ? `Line 2 applies Fact 1 to line 1: “${st[0]}” matches the “if” part of Fact 1.` : `Line 3 applies Fact 2 to line 2: “${st[1]}” matches the “if” part of Fact 2.`;
        return E.choice(R, `Fact 1: ${Q(f1)} Fact 2: ${Q(f2)} Which reason belongs in the box marked ?${tbl(['', 'Statement', 'Reason'], lines.map((l, i) => [i + 1, l, i + 1 === ln ? '<b>?</b>' : rs[i]]))}`, rs[ln - 1],
          [rs[ln === 2 ? 2 : 1], 'The converse of Fact 1', 'It seems obvious'], `${why} Each step of a deduction must use a given fact or an accepted statement, applied the right way round.`); }
      if (k === 0) { const x = R.int(25, 155); return E.num(`Vertical angles are congruent. ∠1 and ∠2 are vertical angles, and m∠1 = ${x}°. What must m∠2 be?`, [{ label: 'm∠2 =', ans: x }], `By the stated fact, m∠2 = m∠1 = ${x}°. This is deduction: it follows from accepted facts.`); }
      if (k === 1) { const x = R.int(25, 85), y = R.int(20, 150 - x); return E.num(`The angles of a triangle add to 180°. Two angles of a triangle measure ${x}° and ${y}°. What is the third angle?`, [{ ans: 180 - x - y }], `180° − ${x}° − ${y}° = ${180 - x - y}°.`); }
      if (k === 2) { const x = R.int(20, 160); return E.num(`Angles that form a linear pair add to 180°. ∠A and ∠B form a linear pair, and m∠A = ${x}°. Find m∠B.`, [{ label: 'm∠B =', ans: 180 - x }], `180° − ${x}° = ${180 - x}°.`); }
      if (k === 3) { const b = R.int(2, 7), a = b * R.int(2, 4), n = a * R.int(3, 15), m = b * R.int(2, 9) * (a / b) + b;
        return E.choice(R, `Facts: every multiple of ${a} is a multiple of ${b}, and ${n} is a multiple of ${a}. What can you deduce?`, `${n} is a multiple of ${b}`, [`${n} is a multiple of ${a * b}`, `every multiple of ${b} is a multiple of ${a}`, `${m} is a multiple of ${a}`], `Apply the general fact to ${n}: it is a multiple of ${a}, so it is a multiple of ${b}. The other claims do not follow.`); }
      const nm = R.pick(NAMES), g = R.int(9, 11), h = g + 1, lo = R.int(6, 8);
      return E.choice(R, `Facts: every member of the robotics club is in grade ${g} or ${h}. ${nm} is in grade ${lo}. What can you deduce?`, `${nm} is not in the robotics club`, [`${nm} is in the robotics club`, `everyone in grade ${g} is in the robotics club`, 'nothing at all'], `If ${nm} were a member, ${nm} would be in grade ${g} or ${h}. ${nm} is in grade ${lo}, so ${nm} is not a member.`); } },
    d: { t: 'classify an argument', g: R => { const ind = R.bool(), txt = R.pick(ind ? ARG_I : ARG_D)(R);
      return E.choiceFixed(`Is this argument inductive or deductive? ${Q(txt)}`, ['inductive', 'deductive'], ind ? 0 : 1, ind ? 'Inductive: it generalizes from observed examples, so the conclusion is likely at best, not certain.' : 'Deductive: it applies accepted facts to a case, so the conclusion must follow.'); } },
  });

  /* V.1.07 Counterexamples */
  const DIVF = [[4, 8], [6, 4], [9, 6], [10, 4], [12, 8], [15, 10], [8, 12], [6, 9], [14, 4], [20, 8], [3, 6], [5, 10], [12, 9], [18, 12]];
  const pickMult = (R, a, b, isA, isB) => { for (let t = 0; t < 400; t++) { const n = R.int(2, 99); if ((n % a === 0) === isA && (n % b === 0) === isB) return n; } return null; };
  const canMult = (a, b, isA, isB) => { for (let n = 2; n < 100; n++) if ((n % a === 0) === isA && (n % b === 0) === isB) return true; return false; };
  S('V.1.07', 'Counterexamples', {
    a: { t: 'what one counterexample does', g: R => { const yes = R.bool(), fam = R.int(0, 2);
      if (fam === 0) { const [a, b] = R.pick(DIVF), cs = yes ? [true, false] : R.pick([[true, true], [false, false], [false, true]].filter(c => canMult(a, b, c[0], c[1]))), n = pickMult(R, a, b, cs[0], cs[1]);
        return E.tf(`Claim: “If a whole number is divisible by ${a}, then it is divisible by ${b}.” Is ${n} a counterexample?`, yes, `A counterexample must make the hypothesis true and the conclusion false. ${n} is ${cs[0] ? '' : 'not '}divisible by ${a} and is ${cs[1] ? '' : 'not '}divisible by ${b}, so it ${yes ? 'is' : 'is not'} a counterexample.`, YN); }
      if (fam === 1) { const k = R.int(2, 9), m = R.int(1, 5), x = yes ? -(k + m) : R.pick([k + m, 0, -R.int(0, k - 1)]), hyp = x * x > k * k, con = x > k;
        return E.tf(`Claim: “If ${M(`x^2>${k * k}`)}, then ${M(`x>${k}`)}.” Is ${M('x=' + x)} a counterexample?`, yes, `Check both parts: x² = ${x * x}, so the hypothesis is ${tv(hyp)}; x ${con ? '>' : '≤'} ${k}, so the conclusion is ${tv(con)}. ${yes ? 'True hypothesis, false conclusion: a counterexample.' : 'A counterexample needs a true hypothesis and a false conclusion, so this is not one.'}`, YN); }
      const opts = yes ? [[2, 'it is prime and even']] : [[R.pick([3, 5, 7, 11, 13, 17, 19, 23]), 'it is prime and odd, which agrees with the claim'], [R.pick([9, 15, 21, 25, 27, 33]), 'it is not prime, so the hypothesis is false'], [R.pick([4, 6, 8, 10, 12]), 'it is not prime, so the hypothesis is false']];
      const [n, why] = R.pick(opts);
      return E.tf(`Claim: “If a whole number is prime, then it is odd.” Is ${n} a counterexample?`, yes, `${yes ? 'Yes' : 'No'}: ${why}.`, YN); } },
    b: { t: 'find one', g: R => { const k = R.int(0, 4);
      if (k === 0) { const [a, b] = R.pick(DIVF), right = pickMult(R, a, b, true, false), ds = [pickMult(R, a, b, true, true), pickMult(R, a, b, false, false), pickMult(R, a, b, false, true), pickMult(R, a, b, false, false)].filter(x => x !== null && x !== right).slice(0, 3);
        return E.choice(R, `Which number is a counterexample to “If a whole number is divisible by ${a}, then it is divisible by ${b}”?`, String(right), ds.map(String), `${right} is divisible by ${a} but not by ${b}. The others either agree with the claim or do not meet the hypothesis.`); }
      if (k === 1) { const kk = R.int(2, 8), right = -(kk + R.int(1, 4));
        return E.choice(R, `Which value of x is a counterexample to “If ${M(`x^2>${kk * kk}`)}, then ${M(`x>${kk}`)}”?`, M('x=' + right), [M('x=' + (kk + R.int(1, 4))), M('x=0'), M('x=' + (-R.int(1, kk - 1)))], `x = ${right} gives x² = ${right * right} > ${kk * kk}, but x is not greater than ${kk}.`); }
      if (k === 2) { const a = R.int(2, 6), b = -(a + R.int(1, 4)), c = R.int(1, 4);
        return E.choice(R, `Which pair (a, b) is a counterexample to “If a > b, then ${M('a^2>b^2')}”?`, `a = ${a}, b = ${b}`, [`a = ${a + c + 3}, b = ${a}`, `a = ${b}, b = ${a}`, `a = ${a + c}, b = ${c}`], `${a} > ${b}, but ${a}² = ${a * a} is not greater than (${b})² = ${b * b}. The others either satisfy the claim or have a ≤ b.`); }
      if (k === 3) { const oc = R.pick([9, 15, 21, 25, 27, 33, 35, 39, 45, 49]), op = R.pick([3, 5, 7, 11, 13, 17, 19]), ev = R.pick([4, 6, 8, 10, 12, 14]);
        return E.choice(R, 'Which number is a counterexample to “If a whole number is odd, then it is prime”?', String(oc), [String(op), String(ev), '2'], `${oc} is odd but not prime (${oc} = ${[3, 5, 7].find(d => oc % d === 0)} × ${oc / [3, 5, 7].find(d => oc % d === 0)}).`); }
      const q2 = R.pick([3, 5, 7, 11, 13, 17, 19, 23]), pairs = R.sample([[3, 5], [5, 7], [3, 11], [7, 13], [5, 11], [11, 13], [3, 17], [13, 19]], 3);
      return E.choice(R, 'Which pair of primes is a counterexample to “The sum of two primes is always even”?', `2 and ${q2}`, pairs.map(([x, y]) => `${x} and ${y}`), `2 + ${q2} = ${2 + q2}, which is odd. Two odd primes always add to an even number.`); } },
    c: { t: 'fix a false claim', g: R => { const k = R.int(0, 4);
      if (k === 0) { const n = R.int(2, 12);
        return E.choice(R, `${Qs(`If x² = ${n * n}, then x = ${n}.`)} is false. Which change makes it true?`, `If x² = ${n * n} and x > 0, then x = ${n}.`, [`If x² = ${n * n} and x < ${n + 5}, then x = ${n}.`, `If x² = ${n * n}, then x = −${n}.`, `If x² = ${n * n} and x is a whole number, then x > ${n}.`], `The counterexample x = −${n} must be ruled out. Requiring x > 0 does that; x < ${n + 5} still allows −${n}.`); }
      if (k === 1) { const [a, b] = R.pick([[4, 8], [6, 4], [9, 6], [10, 4], [12, 8], [6, 9], [14, 4], [20, 8]]), l = a * b / E.gcd(a, b);
        const wrongs = [2, 3, 4, 5, 6].map(m => a * m).filter(m => m % b !== 0).slice(0, 2);
        return E.choice(R, `${Qs(`If a whole number is divisible by ${a}, then it is divisible by ${b}.`)} is false. Which change makes it true?`, `If a whole number is divisible by ${l}, then it is divisible by ${b}.`, [...wrongs.map(m => `If a whole number is divisible by ${m}, then it is divisible by ${b}.`), `If a whole number is divisible by ${b}, then it is divisible by ${a}.`].slice(0, 3), `Every multiple of ${l} is a multiple of ${b}, since ${l} = ${b} × ${l / b}. The other versions still have counterexamples.`); }
      if (k === 2) return E.choice(R, `${Qs('If a > b, then a² > b².')} is false. Which change makes it true?`, 'If a > b > 0, then a² > b².', ['If a > b and a > 0, then a² > b².', 'If a > b, then a² ≥ b².', 'If a > b and b < 0, then a² > b².'], 'With both numbers positive, a > b does give a² > b². The others fail: a = 1, b = −5 breaks the first two, and a = 1, b = −3 breaks the last.');
      if (k === 3) { const m = R.pick([3, 5, 7]);
        return E.choice(R, `${Qs('Every prime number is odd.')} is false. Which change makes it true?`, 'Every prime number greater than 2 is odd.', [`Every prime number less than ${m * 4} is odd.`, 'Every odd number is prime.', 'Every prime number is even.'], 'The only counterexample is 2, so excluding it fixes the claim. Primes less than a bound still include 2.'); }
      return E.choice(R, `${Qs('If a quadrilateral has four congruent sides, then it is a square.')} is false. Which change makes it true?`, 'If a quadrilateral has four congruent sides and a right angle, then it is a square.', ['If a quadrilateral has four congruent sides and two pairs of parallel sides, then it is a square.', 'If a quadrilateral has four congruent sides and perpendicular diagonals, then it is a square.', 'If a quadrilateral has four congruent sides, then it is a rectangle.'], 'A rhombus with no right angle is the counterexample. It has parallel sides and perpendicular diagonals, so only “a right angle” rules it out.'); } },
    d: { t: 'examples never prove "all"', g: R => { const k = R.int(0, 2);
      const TU = ['Every multiple of 6 is even.', 'The square of every odd number is odd.', 'Every square is a rectangle.', 'Every multiple of 10 ends in 0.', 'The sum of any two even numbers is even.', 'Every prime greater than 2 is odd.', 'The angles of every triangle add to 180°.'];
      const b = R.pick([4, 6, 8, 9]), a = R.pick([2, 3, 5, 7].filter(x => b % x !== 0 || x < b)), pp = R.pick([5, 11, 17, 41]);
      const FU = [`Every multiple of ${b / E.gcd(b, 2) === b ? 2 : 3} is a multiple of ${b}.`, 'Every odd number is prime.', 'Every prime is odd.', `${E.pt('n^2+n+' + pp)} is prime for every whole number n.`, 'Every even number is a multiple of 4.', 'Every number is less than its square.'];
      const TE = ['Some prime number is even.', `Some multiple of ${a} is a multiple of ${b}.`, 'There is a rectangle that is a square.', 'There is a number equal to its own square.', `Some odd number is a multiple of ${R.pick([7, 9, 11, 13])}.`];
      if (k === 0) return E.choice(R, 'Which statement can be proved true with a single example?', R.pick(TE), R.sample(TU, 3), 'One example proves a “some” (there exists) statement. An “every” statement needs a general proof, however many examples agree.');
      if (k === 1) return E.choice(R, 'Which statement can be proved false with a single example?', R.pick(FU), [...R.sample(TU, 2), R.pick(TE)], 'A single counterexample disproves an “every” statement that is false. The others are true, so no example can disprove them.');
      const nm = R.pick(NAMES), N = R.int(10, 1000), claim = R.pick(['n² + n + 41 is prime', 'n³ − n is a multiple of 6', 'n² − n is even', '2ⁿ > n']);
      return E.choice(R, `${nm} checked the claim “${claim} for every whole number n ≥ 1” for n = 1 to ${N}, and it worked every time. What has ${nm} shown?`, 'Nothing certain about every n: examples cannot prove an “every” statement', [`The claim is proved for every n`, `The claim is proved for every n up to ${2 * N}`, 'The claim is false'], `Checking cases is evidence, not proof. (Some such claims are true and some fail later: n² + n + 41 breaks at n = 40.)`); } },
  });

  /* V.1.08 Detachment & syllogism */
  // each: valid → [rule, fact, conclusion, 3 wrong]; invalid (fact = conclusion) → [rule, fact, 3 wrong]
  // valid: [rule, fact, conclusion, 2 wrong]; the invalid version (fact = conclusion) only for rules where arithmetic cannot settle it: [.., Qg, Pg, notPg, notQg]
  const DET = [
    R => { const b = R.pick([3, 4, 5]), a = b * R.pick([2, 3]), n = a * R.int(3, 12);
      return [`If a whole number is divisible by ${a}, then it is divisible by ${b}.`, `${n} is divisible by ${a}`, `${n} is divisible by ${b}`, [`${n} is divisible by ${a * b}`, `${n} is not divisible by ${b}`]]; },
    R => { const k = R.int(2, 12), m = R.pick([3, 4, 5, 6]);
      return [`If a number x satisfies x = ${k}, then ${m}x = ${m * k}.`, `x = ${k}`, `${m}x = ${m * k}`, [`x = ${m * k}`, `${m}x ≠ ${m * k}`]]; },
    R => { const nm = R.pick(NAMES), s = R.int(91, 99);
      return ['If a student scores above 90, then the student earns an A.', `${nm} scored ${s}`, `${nm} earns an A`, [`${nm} scored 100`, `${nm} does not earn an A`], `${nm} earned an A`, `${nm} scored above 90`, `${nm} did not score above 90`, `${nm} did not earn an A`]; },
    R => { const [x, y] = R.sample(LETTERS, 2);
      return ['If two angles are vertical angles, then they are congruent.', `∠${x} and ∠${y} are vertical angles`, `∠${x} ≅ ∠${y}`, [`∠${x} and ∠${y} form a linear pair`, `∠${x} and ∠${y} are right angles`], `∠${x} ≅ ∠${y}`, `∠${x} and ∠${y} are vertical angles`, `∠${x} and ∠${y} are not vertical angles`, `∠${x} and ∠${y} are not congruent`]; },
    R => { const t = R.int(2, 12);
      return ['If the temperature is below 0°C, then the pond freezes.', `today it is −${t}°C`, 'the pond freezes today', [`it will be −${t}°C tomorrow`, 'the pond does not freeze today'], 'the pond froze today', 'it was below 0°C today', 'it was not below 0°C today', 'the pond did not freeze today']; },
    R => { const nm = R.pick(NAMES);
      return ['If a library book is returned late, then there is a fine.', `${nm}'s book was returned late`, `there is a fine on ${nm}'s book`, [`${nm} lost the book`, `there is no fine on ${nm}'s book`], `there is a fine on ${nm}'s book`, `${nm}'s book was returned late`, `${nm}'s book was not returned late`, `there is no fine on ${nm}'s book`]; },
    R => { const nm = R.pick(NAMES);
      return [`If ${nm} has a fever, then ${nm} stays home from school.`, `${nm} has a fever`, `${nm} stays home from school`, [`${nm} goes to the doctor`, `${nm} goes to school`], `${nm} stayed home from school`, `${nm} has a fever`, `${nm} does not have a fever`, `${nm} did not stay home from school`]; },
  ];
  const CH3 = [
    R => { const c = R.pick([2, 3, 5]), b = c * R.pick([2, 3]), a = b * R.pick([2, 3, 5]); return ['a whole number', 'it', [`is divisible by ${a}`, `is divisible by ${b}`, `is divisible by ${c}`]]; },
    R => ['a shape', 'it', ['is a square', 'is a rhombus', 'is a parallelogram']],
    R => ['an animal', 'it', [R.pick(['is a robin', 'is a parrot', 'is a penguin']), 'is a bird', 'has feathers']],
    R => { const [c, n, k] = R.pick([['Lyon', 'France', 'Europe'], ['Osaka', 'Japan', 'Asia'], ['Toronto', 'Canada', 'North America'], ['Nairobi', 'Kenya', 'Africa'], ['Chiang Mai', 'Thailand', 'Asia'], ['Lima', 'Peru', 'South America']]); return ['you', 'you', [`live in ${c}`, `live in ${n}`, `live in ${k}`]]; },
    R => { const a = R.int(21, 60), b = R.int(8, 20); return ['a number', 'it', [`is greater than ${a}`, `is greater than ${b}`, 'is positive']]; },
    R => ['a quadrilateral', 'it', ['is a rectangle', 'is a parallelogram', 'has opposite sides congruent']],
    R => ['', '', ['it snows', 'school is closed', `${R.pick(NAMES)} goes sledding`]],
  ];
  // invalid pairs, all premises true: [s, pr, X, Y, Z, kind] kind 0: X→Z and Y→Z; kind 1: X→Y and X→Z
  const BADP = [
    R => ['a shape', 'it', 'is a rectangle', 'is a rhombus', 'is a parallelogram', 0], R => ['an animal', 'it', 'is a robin', 'is a penguin', 'is a bird', 0], R => ['you', 'you', 'live in Lyon', 'live in Paris', 'live in France', 0],
    R => { const [x, y] = R.sample([4, 6, 8, 10, 14], 2); return ['a whole number', 'it', `is divisible by ${x}`, `is divisible by ${y}`, 'is even', 0]; },
    R => ['', '', 'it snows', 'it rains', 'the path is wet', 0], R => ['a shape', 'it', 'is a square', 'is a rectangle', 'is a rhombus', 1],
    R => { const [x, y] = R.sample([2, 3, 5], 2); return ['a whole number', 'it', `is divisible by ${x * y * 2}`, `is divisible by ${x}`, `is divisible by ${y}`, 1]; },
    R => ['an animal', 'it', 'is a dog', 'is a mammal', 'has four legs', 1]];
  const IFx = (s, pr, a, b) => IF([s, pr], a, b);
  const CH5 = [
    R => ['a shape', 'it', ['is a square', 'is a rhombus', 'is a parallelogram', 'is a quadrilateral', 'is a polygon']],
    R => ['an animal', 'it', ['is a golden retriever', 'is a dog', 'is a mammal', 'is a vertebrate', 'is a living thing']],
    R => { const t = R.sample([200, 150, 100, 60, 40, 25, 12, 5], 4).sort((a, b) => b - a); return ['a number', 'it', [...t.map(x => `is greater than ${x}`), 'is positive']]; },
    R => { const ps = R.shuffle([2, 3, 5, 2, 3]).slice(0, 3), v = [1]; ps.forEach(x => v.push(v[v.length - 1] * x)); const c = v.slice(1).reverse(); return ['a whole number', 'it', [`is divisible by ${c[0] * 2}`, ...c.map(x => `is divisible by ${x}`)]]; },
    R => { const nm = R.pick(NAMES); return ['', '', ['it rains on Friday', 'the match is moved to Saturday', `${nm} misses the match`, `${nm}'s team plays one short`, `${nm}'s team uses a substitute`]]; },
  ];
  // arguments for validity: each rule gives the text of an argument in a given form, using true facts
  const ARGS = [
    f => R => { const x = R.pick(['Rex', 'Tom', 'Luna', 'Milo', 'Bella', 'Coco']); return 'If an animal is a cat, then it is a mammal. ' + { det: `${x} is a cat. So ${x} is a mammal.`, con: `${x} is not a mammal. So ${x} is not a cat.`, conv: `${x} is a mammal. So ${x} is a cat.`, inv: `${x} is not a cat. So ${x} is not a mammal.` }[f]; },
    f => R => { const n = { det: 10 * R.int(2, 40), con: 2 * R.int(5, 49) + 1, conv: 10 * R.int(1, 9) + R.pick([2, 4, 6, 8]), inv: 10 * R.int(1, 9) + R.pick([2, 4, 6, 8]) }[f];
      return 'If a whole number is divisible by 10, then it is even. ' + { det: `${n} is divisible by 10. So ${n} is even.`, con: `${n} is not even. So ${n} is not divisible by 10.`, conv: `${n} is even. So ${n} is divisible by 10.`, inv: `${n} is not divisible by 10. So ${n} is not even.` }[f]; },
    f => R => { const nm = R.pick(NAMES); return 'If a student is in the band, then the student plays an instrument. ' + { det: `${nm} is in the band. So ${nm} plays an instrument.`, con: `${nm} does not play an instrument. So ${nm} is not in the band.`, conv: `${nm} plays an instrument. So ${nm} is in the band.`, inv: `${nm} is not in the band. So ${nm} does not play an instrument.` }[f]; },
    f => R => { const t = R.sample(LETTERS, 3).join(''); return 'If a triangle is equilateral, then it is isosceles. ' + { det: `△${t} is equilateral. So △${t} is isosceles.`, con: `△${t} is not isosceles. So △${t} is not equilateral.`, conv: `△${t} is isosceles. So △${t} is equilateral.`, inv: `△${t} is not equilateral. So △${t} is not isosceles.` }[f]; },
    f => R => 'If it rains, then the picnic is canceled. ' + { det: 'It is raining. So the picnic is canceled.', con: 'The picnic is not canceled. So it is not raining.', conv: 'The picnic is canceled. So it is raining.', inv: 'It is not raining. So the picnic is not canceled.' }[f],
    f => R => { const nm = R.pick(NAMES); return 'If a phone is out of charge, then it will not turn on. ' + { det: `${nm}'s phone is out of charge. So it will not turn on.`, con: `${nm}'s phone turns on. So it is not out of charge.`, conv: `${nm}'s phone will not turn on. So it is out of charge.`, inv: `${nm}'s phone is not out of charge. So it will turn on.` }[f]; }];
  const WHYARG = { det: 'Valid (law of detachment): the hypothesis holds, so the conclusion follows.', con: 'Valid: the conclusion fails, so the hypothesis must fail too. This uses the contrapositive.', conv: 'Invalid: it runs the conditional backwards. The conclusion being true says nothing about the hypothesis.', inv: 'Invalid: when the hypothesis is false, the conditional makes no promise about the conclusion.' };
  // made-up categories for the sorites (so everyday knowledge cannot help)
  const NONSENSE = ['zibs', 'wugs', 'blickets', 'floms', 'tarks', 'quibs', 'gorps', 'mims', 'veps', 'snarks'];
  const sg = w => w.replace(/s$/, '');
  S('V.1.08', 'Detachment & syllogism', {
    a: { t: 'law of detachment', g: R => { const valid = R.bool(0.55), [rule, P, Qx, wV, Qg, Pg, nPg, nQg] = R.pick(valid ? DET : DET.slice(2))(R);
      if (valid) return E.choice(R, `Given: ${Q(rule)} Also, ${P}. What can you conclude?`, cap(Qx) + '.', [...wV.map(w => cap(w) + '.'), 'No valid conclusion.'], `Law of detachment: the hypothesis is true (${P}), so the conclusion follows: ${Qx}.`);
      return E.choice(R, `Given: ${Q(rule)} Also, ${Qg}. What can you conclude?`, 'No valid conclusion.', [cap(Pg) + '.', cap(nPg) + '.', cap(nQg) + '.'], `The known fact matches the conclusion, not the hypothesis. Running a conditional backwards is invalid, so you cannot tell whether ${Pg}.`); } },
    b: { t: 'law of syllogism', g: R => { const sw = R.bool();
      if (R.bool(0.6)) { const [s, pr, [A, B, Cc]] = R.pick(CH3)(R), st = [IFx(s, pr, A, B), IFx(s, pr, B, Cc)]; if (sw) st.reverse();
        return E.choice(R, `Given: ${Qs(st[0])} and ${Qs(st[1])}. What can you conclude?`, IFx(s, pr, A, Cc), [IFx(s, pr, Cc, A), IFx(s, pr, B, A), 'No valid conclusion.'], `The conclusion of one is the hypothesis of the other, so they chain: ${IFx(s, pr, A, Cc)}`); }
      const [s, pr, X, Y, Z, kind] = R.pick(BADP)(R), st = kind ? [IFx(s, pr, X, Y), IFx(s, pr, X, Z)] : [IFx(s, pr, X, Z), IFx(s, pr, Y, Z)]; if (sw) st.reverse();
      const wrong = kind ? [IFx(s, pr, Y, Z), IFx(s, pr, Z, Y), IFx(s, pr, Y, X)] : [IFx(s, pr, X, Y), IFx(s, pr, Y, X), IFx(s, pr, Z, X)];
      return E.choice(R, `Given: ${Qs(st[0])} and ${Qs(st[1])}. What can you conclude?`, 'No valid conclusion.', wrong, kind ? 'Both statements start from the same hypothesis, so neither conclusion leads to the other. They do not form a chain.' : 'Both statements end in the same conclusion, so neither hypothesis leads to the other. They do not form a chain.'); } },
    c: { t: 'chain statements', g: R => { const [s, pr, ch] = R.pick(CH5)(R), links = ch.slice(0, -1).map((c, i) => IFx(s, pr, c, ch[i + 1]));
      if (R.bool(0.55)) { const n = R.pick([3, 4]), L = links.slice(0, n);
        return orderQ(R, 'Assume these statements are true. Put them in order to form a chain, where each conclusion is the next hypothesis.', L, L.map((x, i) => i ? [i - 1] : []), `The chain runs ${ch.slice(0, n + 1).map(c => Q(cl([s, pr], c, 1))).join(' → ')}.`, { fixed: 0 }); }
      const L = links.slice(0, 3), neg = ch[3].replace(/^is /, 'is not ');
      return E.choice(R, `Assume these are true: ${R.shuffle(L).map(Q).join(' ')} What can you conclude?`, IFx(s, pr, ch[0], ch[3]), [IFx(s, pr, ch[3], ch[0]), IFx(s, pr, ch[2], ch[0]), neg !== ch[3] ? IFx(s, pr, ch[0], neg) : IFx(s, pr, ch[3], ch[1])], `Link them: ${ch.slice(0, 4).map(c => Q(cl([s, pr], c, 1))).join(' → ')}. So ${lc1(IFx(s, pr, ch[0], ch[3]))}`); } },
    d: { t: 'spot invalid reasoning', g: R => {
      if (R.bool()) { const want = R.bool(), f = want ? R.pick(['det', 'con']) : R.pick(['conv', 'inv']);
        return E.tf(`Is this argument valid? ${Q(R.pick(ARGS)(f)(R))}`, want, WHYARG[f], YN); }
      const bad = R.pick(['conv', 'inv']), rs = R.sample(ARGS, 4), goods = R.shuffle(['det', 'con', R.pick(['det', 'con'])]);
      return E.choice(R, 'Which argument is invalid?', rs[0](bad)(R), goods.map((g, i) => rs[i + 1](g)(R)), WHYARG[bad]); } },
    e: { t: 'run the chain backwards', g: R => { const nm = R.pick(NAMES);
      const PLOTS = [[`${nm} is picked for the team`, `${nm} trains on Saturday`, `${nm} misses the concert`, `${nm} is not picked for the team`, `${nm} does not train on Saturday`, `${nm} does not miss the concert`],
        [`${nm} buys a ticket`, `${nm} can board the train`, `${nm} reaches the city by noon`, `${nm} does not buy a ticket`, `${nm} cannot board the train`, `${nm} does not reach the city by noon`],
        ['the alarm is set', `${nm} wakes at 6`, `${nm} catches the early bus`, 'the alarm is not set', `${nm} does not wake at 6`, `${nm} does not catch the early bus`],
        [`${nm} finishes the essay`, `${nm} gets a grade`, `${nm} passes the course`, `${nm} does not finish the essay`, `${nm} does not get a grade`, `${nm} does not pass the course`]];
      if (R.bool(0.6)) { const [A, B, Cc, nA, nB, nC] = R.pick(PLOTS);
        if (R.bool(0.65)) return E.choice(R, `Assume: “If ${A}, then ${B}” and “If ${B}, then ${Cc}”. Also, ${nC}. What follows?`, cap(nA) + '.', [cap(A) + '.', cap(B) + '.', 'Nothing can be concluded about the first hypothesis.'], `Chain: if ${A}, then ${Cc}. Its contrapositive says: if ${nC}, then ${nA}.`);
        return E.choice(R, `Assume: “If ${A}, then ${B}” and “If ${B}, then ${Cc}”. Also, ${nA}. What follows?`, 'Nothing can be concluded about the final conclusion.', [cap(nC) + '.', cap(Cc) + '.', cap(nB) + '.'], `A false hypothesis tells you nothing: it is still possible that ${Cc} for some other reason.`); }
      const c = R.pick([2, 3]), b = c * R.pick([2, 5]), a = b * R.pick([2, 3]); let n; do n = R.int(20, 199); while (n % c === 0);
      return E.choice(R, `Assume: “If a whole number is divisible by ${a}, then it is divisible by ${b}” and “If a whole number is divisible by ${b}, then it is divisible by ${c}”. The number ${n} is not divisible by ${c}. Which conclusion follows from these statements?`, `${n} is not divisible by ${a}.`, [`${n} is divisible by ${b}.`, `${n} is divisible by ${a}.`, `Nothing can be concluded about ${a}.`], `Chain: divisible by ${a} → divisible by ${c}. The contrapositive gives: not divisible by ${c} → not divisible by ${a}.`); } },
    f: { t: 'a sorites with hidden contrapositives', g: R => { const [A, B, Cc, D] = R.sample(NONSENSE, 4), neg = R.bool(0.4);
      const link = (x, y, last) => {
        if (last && neg) return R.pick([[`No ${x} are ${y}.`, ''], [`Every ${sg(x)} is a non-${sg(y)}.`, ''], [`Nothing that is a ${sg(y)} is a ${sg(x)}.`, `“Nothing that is a ${sg(y)} is a ${sg(x)}” means no ${sg(x)} is a ${sg(y)}.`]]);
        return R.pick([[`All ${x} are ${y}.`, ''], [`Only ${y} are ${x}.`, `“Only ${y} are ${x}” means every ${sg(x)} is a ${sg(y)}.`], [`Anything that is not a ${sg(y)} is not a ${sg(x)}.`, `“Anything that is not a ${sg(y)} is not a ${sg(x)}” is the contrapositive of “every ${sg(x)} is a ${sg(y)}”.`], [`If something is a ${sg(x)}, then it is a ${sg(y)}.`, '']]); };
      const Ls = [link(A, B), link(B, Cc), link(Cc, D, true)], prem = R.shuffle(Ls.map(l => l[0]));
      const right = neg ? `No ${A} are ${D}.` : `All ${A} are ${D}.`;
      const wrong = neg ? [`All ${A} are ${D}.`, `All ${D} are ${A}.`, `No ${B} are ${A}.`] : [`All ${D} are ${A}.`, `No ${A} are ${D}.`, `All ${B} are ${A}.`];
      const notes = Ls.map(l => l[1]).filter(Boolean).join(' ');
      return E.choice(R, `Accept these as true: ${prem.join(' ')} Which conclusion follows?`, right, wrong, `${notes ? notes + ' ' : ''}The chain is ${sg(A)} → ${sg(B)} → ${sg(Cc)} → ${neg ? 'not a ' + sg(D) : sg(D)}, so: ${right}`); } },
  });

  /* ---------- proof helpers ---------- */
  const SEG = (a, b) => `<math><mover accent="true"><mrow><mi>${a}</mi><mi>${b}</mi></mrow><mo>¯</mo></mover></math>`;
  const RS = { G: 'Given', ADD: 'Addition Property of Equality', SUB: 'Subtraction Property of Equality', MUL: 'Multiplication Property of Equality', DIV: 'Division Property of Equality', DIST: 'Distributive Property', SIMP: 'Simplify (combine like terms)', SUBST: 'Substitution Property of Equality', TRANS: 'Transitive Property of Equality', SYM: 'Symmetric Property of Equality', REFL: 'Reflexive Property of Equality',
    MID: 'Definition of midpoint', SAP: 'Segment Addition Postulate', AAP: 'Angle Addition Postulate', LPP: 'Linear Pair Postulate', COMP: 'Definition of complementary angles', SUPP: 'Definition of supplementary angles', CONG: 'Definition of congruent angles', RIGHT: 'Definition of right angle', VERT: 'Vertical Angles Theorem', BIS: 'Definition of angle bisector', CSEG: 'Definition of congruent segments' };
  const NEAR = {
    [RS.G]: [RS.MID, RS.SAP, RS.REFL, RS.CONG], [RS.ADD]: [RS.SUB, RS.SUBST, RS.MUL, RS.DIST], [RS.SUB]: [RS.ADD, RS.DIV, RS.SUBST, RS.DIST], [RS.MUL]: [RS.DIV, RS.ADD, RS.DIST, RS.SUBST], [RS.DIV]: [RS.MUL, RS.SUB, RS.DIST, RS.SIMP],
    [RS.DIST]: [RS.SUBST, RS.SIMP, RS.MUL, RS.ADD], [RS.SIMP]: [RS.DIST, RS.ADD, RS.SUBST, RS.MUL], [RS.SUBST]: [RS.REFL, RS.ADD, RS.SYM, RS.SAP], [RS.TRANS]: [RS.REFL, RS.SYM, RS.ADD, RS.CONG],
    [RS.MID]: [RS.BIS, RS.SAP, RS.CONG, RS.G], [RS.SAP]: [RS.AAP, RS.MID, RS.SUBST, RS.ADD], [RS.AAP]: [RS.SAP, RS.BIS, RS.LPP, RS.SUBST], [RS.LPP]: [RS.VERT, RS.COMP, RS.AAP, RS.RIGHT],
    [RS.COMP]: [RS.SUPP, RS.RIGHT, RS.CONG, RS.LPP], [RS.CONG]: [RS.CSEG, RS.VERT, RS.RIGHT, RS.SUBST], [RS.RIGHT]: [RS.CONG, RS.COMP, RS.SUPP, RS.VERT] };
  const SYNO = { [RS.SUBST]: [RS.TRANS], [RS.TRANS]: [RS.SUBST] };
  const reasonD = (R, r) => R.sample((NEAR[r] || [RS.SUBST, RS.ADD, RS.G]).filter(x => x !== r && !(SYNO[r] || []).includes(x)), 3);
  const EQ = s => M(s);
  const pl = (a, b) => E.poly([a, b]);
  // plain text of a statement (for SVG boxes)
  const plain = h => String(h).replace(/<math><mover[^>]*><mrow><mi>(\w)<\/mi><mi>(\w)<\/mi><\/mrow><mo>¯<\/mo><\/mover><\/math>/g, (m, a, b) => `${a}̅${b}̅`).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/([^ ])=([^ ])/g, '$1 = $2').replace(/([0-9x)])([+−])([0-9x(])/g, '$1 $2 $3');
  // a proof: {given:[..], prove, thm, L:[[stmt, reason, deps]], fig}
  const angFig = (R, a, b, c) => { const t1 = R.int(10, 50), t2 = t1 + R.int(55, 125), d = th => [Math.cos(th * Math.PI / 180) * 3, Math.sin(th * Math.PI / 180) * 3];
    return V.geo({ pts: { O: [0, 0], P: d(t1), S: d(t1 + 180), Q: d(t2), T: d(t2 + 180) }, segs: [['P', 'S'], ['Q', 'T']], angles: [['P', 'O', 'Q', String(a), { r: 24 }], ['Q', 'O', 'S', String(c), { r: 30 }], ['S', 'O', 'T', String(b), { r: 24 }]], hide: ['O', 'P', 'S', 'Q', 'T'], w: 250, label: 'two intersecting lines with numbered angles' }); };
  const PB = [
    R => { const [A, Mx, B] = R.sample(LETTERS, 3);
      return { given: [`${Mx} is the midpoint of ${SEG(A, B)}`], prove: `${A}${Mx} = ½${A}${B}`, L: [[`${Mx} is the midpoint of ${SEG(A, B)}`, RS.G, []], [`${A}${Mx} = ${Mx}${B}`, RS.MID, [0]], [`${A}${Mx} + ${Mx}${B} = ${A}${B}`, RS.SAP, [0]], [`${A}${Mx} + ${A}${Mx} = ${A}${B}`, RS.SUBST, [1, 2]], [`2(${A}${Mx}) = ${A}${B}`, RS.SIMP, [3]], [`${A}${Mx} = ½${A}${B}`, RS.DIV, [4]]] }; },
    R => { const [a, b, c] = R.shuffle([1, 2, 3]);
      return { given: [`∠${a} and ∠${c} form a linear pair`, `∠${b} and ∠${c} form a linear pair`], prove: `∠${a} ≅ ∠${b}`, fig: angFig(R, a, b, c), L: [[`∠${a} and ∠${c} form a linear pair`, RS.G, []], [`∠${b} and ∠${c} form a linear pair`, RS.G, []], [`m∠${a} + m∠${c} = 180°`, RS.LPP, [0]], [`m∠${b} + m∠${c} = 180°`, RS.LPP, [1]], [`m∠${a} + m∠${c} = m∠${b} + m∠${c}`, RS.SUBST, [2, 3]], [`m∠${a} = m∠${b}`, RS.SUB, [4]], [`∠${a} ≅ ∠${b}`, RS.CONG, [5]]] }; },
    R => { const [A, P, Qp, Ee, B] = R.sample(LETTERS, 5), t0 = R.int(0, 359), s1 = R.int(25, 40), s2 = R.int(20, 35), d = th => [Math.cos(th * Math.PI / 180) * 3, Math.sin(th * Math.PI / 180) * 3];
      const fig = V.geo({ pts: { [B]: [0, 0], [A]: d(t0), [P]: d(t0 + s1), [Qp]: d(t0 + s1 + s2), [Ee]: d(t0 + 2 * s1 + s2) }, segs: [[B, A], [B, P], [B, Qp], [B, Ee]], angles: [[A, B, P, '1', { r: 48 }], [P, B, Qp, '2', { r: 64 }], [Qp, B, Ee, '3', { r: 48 }]], w: 260, label: 'four rays from one point with angles 1, 2 and 3' });
      return { given: ['m∠1 = m∠3'], prove: `m∠${A}${B}${Qp} = m∠${P}${B}${Ee}`, fig, L: [['m∠1 = m∠3', RS.G, []], ['m∠1 + m∠2 = m∠3 + m∠2', RS.ADD, [0]], [`m∠1 + m∠2 = m∠${A}${B}${Qp}`, RS.AAP, []], [`m∠3 + m∠2 = m∠${P}${B}${Ee}`, RS.AAP, []], [`m∠${A}${B}${Qp} = m∠${P}${B}${Ee}`, RS.SUBST, [1, 2, 3]]] }; },
    R => { const [A, B, Cc, D] = R.sample(LETTERS, 4).sort(), u = R.pick([1.6, 2, 2.4]), v = R.pick([2.2, 3, 3.6]), th = R.int(-30, 30) * Math.PI / 180, P = t => [t * Math.cos(th), t * Math.sin(th)];
      const fig = V.geo({ pts: { [A]: P(0), [B]: P(u), [Cc]: P(u + v), [D]: P(2 * u + v) }, segs: [[A, B, { ticks: 1 }], [B, Cc], [Cc, D, { ticks: 1 }]], w: 280, label: 'four points on a line' });
      return { given: [`${A}${B} = ${Cc}${D}`], prove: `${A}${Cc} = ${B}${D}`, pre: `Points ${A}, ${B}, ${Cc} and ${D} lie on a line in that order. `, fig, L: [[`${A}${B} = ${Cc}${D}`, RS.G, []], [`${A}${B} + ${B}${Cc} = ${B}${Cc} + ${Cc}${D}`, RS.ADD, [0]], [`${A}${B} + ${B}${Cc} = ${A}${Cc}`, RS.SAP, []], [`${B}${Cc} + ${Cc}${D} = ${B}${D}`, RS.SAP, []], [`${A}${Cc} = ${B}${D}`, RS.SUBST, [1, 2, 3]]] }; },
    R => { const [a, b, c] = R.shuffle([1, 2, 3]);
      return { given: [`∠${a} and ∠${b} are complementary`, `∠${a} ≅ ∠${c}`], prove: `∠${c} and ∠${b} are complementary`, L: [[`∠${a} and ∠${b} are complementary`, RS.G, []], [`∠${a} ≅ ∠${c}`, RS.G, []], [`m∠${a} + m∠${b} = 90°`, RS.COMP, [0]], [`m∠${a} = m∠${c}`, RS.CONG, [1]], [`m∠${c} + m∠${b} = 90°`, RS.SUBST, [2, 3]], [`∠${c} and ∠${b} are complementary`, RS.COMP, [4]]] }; },
    R => { const [A, B] = R.sample(LETTERS, 2).sort();
      return { given: [`∠${A} and ∠${B} are right angles`], prove: `∠${A} ≅ ∠${B}`, L: [[`∠${A} and ∠${B} are right angles`, RS.G, []], [`m∠${A} = 90°`, RS.RIGHT, [0]], [`m∠${B} = 90°`, RS.RIGHT, [0]], [`m∠${A} = m∠${B}`, RS.TRANS, [1, 2]], [`∠${A} ≅ ∠${B}`, RS.CONG, [3]]] }; },
    R => { const [A, Mx, B] = R.sample(LETTERS, 3); let pp, rr, k, qq, ss; do { rr = R.int(1, 5); pp = rr + R.int(2, 4); k = R.int(1, 9); qq = R.pick([-7, -5, -4, -3, -2, -1, 1, 2, 3, 4, 6, 8]); ss = (pp - rr) * k + qq; } while (ss === 0 || pp * k + qq <= 0);
      const ex = (a, b) => pl(a, b);
      return { given: [`${Mx} is the midpoint of ${SEG(A, B)}`, `${EQ(A + Mx + '=' + ex(pp, qq))} and ${EQ(Mx + B + '=' + ex(rr, ss))}`], prove: EQ('x=' + k), L: [[`${Mx} is the midpoint of ${SEG(A, B)}`, RS.G, []], [`${EQ(A + Mx + '=' + ex(pp, qq))} and ${EQ(Mx + B + '=' + ex(rr, ss))}`, RS.G, []], [`${A}${Mx} = ${Mx}${B}`, RS.MID, [0]], [EQ(ex(pp, qq) + '=' + ex(rr, ss)), RS.SUBST, [1, 2]], [EQ(ex(pp - rr, qq) + '=' + ss), RS.SUB, [3]], [EQ(ex(pp - rr, 0) + '=' + (ss - qq)), qq > 0 ? RS.SUB : RS.ADD, [4]], [EQ('x=' + k), RS.DIV, [5]]] }; },
    R => { const [A, B, Cc] = R.sample(LETTERS, 3); let u, v, w, z, k; do { u = R.int(1, 4); w = R.int(1, 4); v = R.int(-3, 8); z = R.int(-3, 8); k = R.int(2, 9); } while (v + z === 0 || u + w < 2 || u * k + v <= 0 || w * k + z <= 0 || !v || !z);
      const T = (u + w) * k + v + z, ab = pl(u, v), bc = pl(w, z);
      return { given: [`${B} is between ${A} and ${Cc}`, `${EQ(A + B + '=' + ab)}, ${EQ(B + Cc + '=' + bc)} and ${EQ(A + Cc + '=' + T)}`], prove: EQ('x=' + k), L: [[`${B} is between ${A} and ${Cc}`, RS.G, []], [`${EQ(A + B + '=' + ab)}, ${EQ(B + Cc + '=' + bc)} and ${EQ(A + Cc + '=' + T)}`, RS.G, []], [`${A}${B} + ${B}${Cc} = ${A}${Cc}`, RS.SAP, [0]], [EQ(`${ab}+${bc}=${T}`.replace('+-', '-')), RS.SUBST, [1, 2]], [EQ(pl(u + w, v + z) + '=' + T), RS.SIMP, [3]], [EQ(pl(u + w, 0) + '=' + (T - v - z)), v + z > 0 ? RS.SUB : RS.ADD, [4]], [EQ('x=' + k), RS.DIV, [5]]] }; },
  ];
  const SINGLE = [0, 1, 4, 5, 6, 7];      // proofs whose last step uses exactly one line
  const gv = pf => pf.given.join(', and ');
  const twoCol = (L, hide) => tbl(['', 'Statement', 'Reason'], L.map((l, i) => [String(i + 1), hide && hide[0] === i && hide[1] === 0 ? '<b>?</b>' : l[0], hide && hide[0] === i && hide[1] === 1 ? '<b>?</b>' : l[1]]));
  // flow proof as an SVG
  const flowSVG = (L, hide, label) => { const n = L.length, lev = []; L.forEach((l, i) => lev[i] = l[2].length ? 1 + Math.max(...l[2].map(d => lev[d])) : 0);
    for (let i = n - 1; i >= 0; i--) if (!L[i][2].length && L[i][1] !== RS.G) { const kids = L.map((l, j) => j).filter(j => L[j][2].includes(i)); if (kids.length) lev[i] = Math.min(...kids.map(j => lev[j])) - 1; }
    const rows = []; lev.forEach((v, i) => (rows[v] = rows[v] || []).push(i));
    const txt = i => hide && hide[0] === i && hide[1] === 0 ? '?' : plain(L[i][0]), rsn = i => hide && hide[0] === i && hide[1] === 1 ? '?' : L[i][1];
    const bw = i => Math.max(110, Math.max(txt(i).length * 7.9, rsn(i).length * 6) + 22), BH = 44, GX = 18, GY = 34;
    const rowW = rows.map(r => r.reduce((s, i) => s + bw(i), 0) + GX * (r.length - 1)), W = Math.max(...rowW) + 20, H = rows.length * (BH + GY) - GY + 20;
    const pos = []; rows.forEach((r, k) => { let x = (W - rowW[k]) / 2; r.forEach(i => { pos[i] = [x, 10 + k * (BH + GY), bw(i)]; x += bw(i) + GX; }); });
    let b = `<defs><marker id="fh" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${C.ink}"/></marker></defs>`;
    L.forEach((l, i) => { const ds = l[2].slice().sort((a, c) => pos[a][0] - pos[c][0]); ds.forEach((d, k) => { const [x1, y1, w1] = pos[d], [x2, y2, w2] = pos[i], ex = x2 + w2 / 2 + (k - (ds.length - 1) / 2) * 16;
      b += `<line x1="${(x1 + w1 / 2).toFixed(1)}" y1="${y1 + BH}" x2="${ex.toFixed(1)}" y2="${y2 - 2}" stroke="${C.ink}" stroke-width="1.4" marker-end="url(#fh)"/>`; }); });
    L.forEach((l, i) => { const [x, y, w] = pos[i], hid = hide && hide[0] === i;
      b += `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${BH}" rx="6" fill="${hid ? C.amber + '33' : C.paper}" stroke="${C.ink}" stroke-width="1.4"/>` + V.text((x + w / 2).toFixed(1), y + 15, txt(i), { size: 12.5, weight: 700 }) + V.text((x + w / 2).toFixed(1), y + 31, rsn(i), { size: 10.5, fill: C.muted }); });
    return V.svg(Math.round(W), Math.round(H), b, label || 'flow proof'); };
  const theR = r => r === RS.SIMP ? 'Combining like terms' : /^Definition/.test(r) ? 'The d' + r.slice(1) : 'The ' + r;
  const rPhrase = r => r === RS.SIMP ? 'combining like terms' : 'by the ' + (/^Definition/.test(r) ? r[0].toLowerCase() + r.slice(1) : r);
  const sentence = (l, i, last) => l[1] === RS.G ? `We are given that ${l[0]}.` : `${last ? 'Therefore, ' : ''}${last ? rPhrase(l[1]) : cap(rPhrase(l[1]))}, ${l[0]}.`;

  /* V.1.09 Properties of equality */
  S('V.1.09', 'Properties of equality', {
    a: { t: 'reflexive, symmetric, transitive', g: R => { const k = R.int(0, 2), [A, B, Cc, D, E1, F] = R.sample(LETTERS, 6), t = R.int(0, 2), n = R.int(2, 40);
      const st = [[`${A}${B} = ${A}${B}`, `m∠${A}${B}${Cc} = m∠${A}${B}${Cc}`, M(`x+${n}=x+${n}`)],
        [`If ${A}${B} = ${Cc}${D}, then ${Cc}${D} = ${A}${B}.`, `If m∠${A} = m∠${B}, then m∠${B} = m∠${A}.`, `If ${M(n + '=x')}, then ${M('x=' + n)}.`],
        [`If ${A}${B} = ${Cc}${D} and ${Cc}${D} = ${E1}${F}, then ${A}${B} = ${E1}${F}.`, `If m∠${A} = m∠${B} and m∠${B} = m∠${Cc}, then m∠${A} = m∠${Cc}.`, `If ${M('a=b')} and ${M('b=c')}, then ${M('a=c')}.`]][k][t];
      return E.choice(R, `Which property of equality does this show? ${st}`, ['Reflexive Property of Equality', 'Symmetric Property of Equality', 'Transitive Property of Equality'][k], ['Reflexive Property of Equality', 'Symmetric Property of Equality', 'Transitive Property of Equality', 'Addition Property of Equality'].filter((x, i) => i !== k), ['Reflexive: anything equals itself.', 'Symmetric: the two sides of an equation can swap.', 'Transitive: if a = b and b = c, then a = c.'][k]); } },
    b: { t: 'addition and multiplication properties', g: R => { const k = R.int(0, 3), a = R.int(2, 12), b = R.int(1, 15), abs = R.bool(0.25);
      const PR = [RS.ADD, RS.SUB, RS.MUL, RS.DIV];
      const st = abs ? [`If ${M('a=b')}, then ${M(`a+${a}=b+${a}`)}.`, `If ${M('a=b')}, then ${M(`a-${a}=b-${a}`)}.`, `If ${M('a=b')}, then ${M(`${a}a=${a}b`)}.`, `If ${M('a=b')}, then ${M(`a/${a}=b/${a}`)}.`][k]
        : [`If ${M(`x-${a}=${b}`)}, then ${M(`x=${a + b}`)}.`, `If ${M(`x+${a}=${b + a}`)}, then ${M(`x=${b}`)}.`, `If ${M(`x/${a}=${b}`)}, then ${M(`x=${a * b}`)}.`, `If ${M(`${a}x=${a * b}`)}, then ${M(`x=${b}`)}.`][k];
      return E.choice(R, `Which property justifies this step? ${st}`, PR[k], PR.filter((x, i) => i !== k), abs ? ['The same number is added to both sides.', 'The same number is subtracted from both sides.', 'Both sides are multiplied by the same number.', 'Both sides are divided by the same nonzero number.'][k] : [`${a} was added to both sides.`, `${a} was subtracted from both sides.`, `Both sides were multiplied by ${a}.`, `Both sides were divided by ${a}.`][k]); } },
    c: { t: 'substitution', g: R => { const k = R.int(0, 4), [A, B, Cc] = R.sample(LETTERS, 3);
      if (k <= 2) { const x = R.int(20, 85), n = R.int(3, 19), a = R.int(2, 6), b = R.int(1, 9), c = R.int(1, 7);
        const st = [`m∠1 + m∠2 = 180° and m∠2 = ${x}°, so m∠1 + ${x}° = 180°.`, `${A}${B} + ${B}${Cc} = ${A}${Cc} and ${B}${Cc} = ${n}, so ${A}${B} + ${n} = ${A}${Cc}.`, `${M(`y=${a}x+${b}`)} and ${M('x=' + c)}, so ${M(`y=${a}(${c})+${b}`)}.`][k];
        return E.choice(R, `Which property justifies this step? ${st}`, RS.SUBST, [RS.TRANS, RS.SYM, RS.ADD], 'A quantity was replaced by something equal to it inside another equation: substitution.'); }
      const a = R.int(2, 6), pv = R.int(1, 9), v = R.int(1, 12), T = a * pv + v, lt = R.pick(['p', 'm', 'a', 'k']);
      if (k === 3) return E.num(`Given ${M(`${a}${lt}+q=${T}`)} and ${M('q=' + v)}, substitute and solve for ${lt}.`, [{ label: lt + ' =', ans: pv }], `Substitute q = ${v}: ${a}${lt} + ${v} = ${T}, so ${a}${lt} = ${T - v} and ${lt} = ${pv}.`);
      const s = R.int(2, 5), w = R.int(1, 9);
      return E.num(`${A}${B} = ${Cc}${A} and ${A}${B} + ${Cc}${A} = ${2 * s * w}. Substitute to find ${A}${B}.`, [{ label: `${A}${B} =`, ans: s * w }], `Replace ${Cc}${A} with ${A}${B}: 2(${A}${B}) = ${2 * s * w}, so ${A}${B} = ${s * w}.`); } },
    d: { t: 'congruence versions', g: R => { const [A, B, Cc, D, E1, F] = R.sample(LETTERS, 6);
      if (R.bool(0.6)) { const k = R.int(0, 2), cong = R.bool(0.7), seg = R.bool();
        const X = seg ? [SEG(A, B), SEG(Cc, D), SEG(E1, F)] : [`∠${A}`, `∠${B}`, `∠${Cc}`], Xe = seg ? [`${A}${B}`, `${Cc}${D}`, `${E1}${F}`] : [`m∠${A}`, `m∠${B}`, `m∠${Cc}`];
        const Z = cong ? X : Xe, rel = cong ? '≅' : '=';
        const st = [`${Z[0]} ${rel} ${Z[0]}`, `If ${Z[0]} ${rel} ${Z[1]}, then ${Z[1]} ${rel} ${Z[0]}.`, `If ${Z[0]} ${rel} ${Z[1]} and ${Z[1]} ${rel} ${Z[2]}, then ${Z[0]} ${rel} ${Z[2]}.`][k];
        const kinds = ['Reflexive', 'Symmetric', 'Transitive'], of = cong ? 'Congruence' : 'Equality', other = cong ? 'Equality' : 'Congruence';
        return E.choice(R, `Which property does this show? ${st}`, `${kinds[k]} Property of ${of}`, [`${kinds[k]} Property of ${other}`, ...kinds.filter((x, i) => i !== k).map(x => `${x} Property of ${of}`)], `${kinds[k]}, and it uses ${cong ? '≅ between figures, so it is the congruence version' : '= between numbers (lengths or measures), so it is the equality version'}.`); }
      const good = [`${SEG(A, B)} ≅ ${SEG(Cc, D)}`, `${A}${B} = ${Cc}${D}`, `m∠${A} = m∠${B}`, `∠${A} ≅ ∠${B}`], bad = [`${SEG(A, B)} = ${SEG(Cc, D)}`, `${A}${B} ≅ ${Cc}${D}`, `m∠${A} ≅ m∠${B}`, `∠${A} = m∠${B}`];
      return E.choice(R, 'Which statement is written correctly?', R.pick(good), R.sample(bad, 3), 'Lengths and angle measures are numbers, so they are equal (=). Segments and angles are figures, so they are congruent (≅).'); } },
  });

  /* V.1.10 Algebraic proofs */
  const sgn = n => n > 0 ? '+' + n : String(n);
  const ALG = [
    R => { let a, b, k; do { a = R.pick([2, 3, 4, 5, 6, 7, 8, -2, -3, -4]); b = R.int(-15, 15); k = R.int(-8, 12); } while (!b);
      const c = a * k + b; return [[pl(a, b) + '=' + c, RS.G], [pl(a, 0) + '=' + (c - b), b > 0 ? RS.SUB : RS.ADD], ['x=' + k, RS.DIV]]; },
    R => { let a, b, k; do { a = R.int(2, 6); b = R.int(-9, 9); k = R.int(-6, 10); } while (!b);
      const c = a * (k + b); return [[`${a}(${pl(1, b)})=${c}`, RS.G], [pl(a, a * b) + '=' + c, RS.DIST], [pl(a, 0) + '=' + (c - a * b), a * b > 0 ? RS.SUB : RS.ADD], ['x=' + k, RS.DIV]]; },
    R => { let a, b, m; do { a = R.int(2, 6); b = R.int(-9, 9); m = R.int(-6, 9); } while (!b);
      const c = m + b; return [[`x/${a}${sgn(b)}=${c}`, RS.G], [`x/${a}=${c - b}`, b > 0 ? RS.SUB : RS.ADD], ['x=' + a * m, RS.MUL]]; },
    R => { let a, d, b, k; do { d = R.int(1, 5); a = d + R.int(2, 5); b = R.int(-12, 12); k = R.int(-6, 9); } while (!b);
      const e = (a - d) * k + b; return [[pl(a, b) + '=' + pl(d, e), RS.G], [pl(a - d, b) + '=' + e, RS.SUB], [pl(a - d, 0) + '=' + (e - b), b > 0 ? RS.SUB : RS.ADD], ['x=' + k, RS.DIV]]; },
    R => { const a = R.int(2, 5), b = R.int(1, 6), c = R.int(1, 4), k = R.int(-4, 9), e = (a + c) * k - a * b;
      return [[`${a}(x-${b})+${c === 1 ? '' : c}x=${e}`, RS.G], [`${a}x-${a * b}+${c === 1 ? '' : c}x=${e}`, RS.DIST], [`${a + c}x-${a * b}=${e}`, RS.SIMP], [`${a + c}x=${e + a * b}`, RS.ADD], ['x=' + k, RS.DIV]]; },
  ];
  // a proof with one broken step: [lines, broken index, why]
  const brokenAlg = R => { const kind = R.int(0, 2);
    if (kind === 0) { let a, b, k; do { a = R.int(2, 6); b = R.int(1, 9) * R.pick([1, -1]); k = R.int(-5, 9); } while (!b);
      const c = a * (k + b), j = R.int(1, 3), K = j === 1 ? b : a * b, R2 = j === 2 ? c + K : c - K;
      const L = [[`${a}(${pl(1, b)})=${c}`, RS.G], [pl(a, K) + '=' + c, RS.DIST], [pl(a, 0) + '=' + R2, K > 0 ? RS.SUB : RS.ADD], ['x=' + E.fracStr(R2, a), j === 3 ? RS.MUL : RS.DIV]];
      return [L, j, [``, `Step 2 distributes badly: ${a}(${E.pt(pl(1, b))}) = ${E.pt(pl(a, a * b))}, not ${E.pt(pl(a, K))}. The later steps follow correctly from the mistake.`, `Step 3 moves ${Math.abs(K)} the wrong way: ${K > 0 ? 'subtracting' : 'adding'} ${Math.abs(K)} gives ${c - K}, not ${R2}.`, `Step 4's reason is wrong: going from ${E.pt(pl(a, 0))} = ${R2} to x = ${E.pt(E.fracStr(R2, a))} divides both sides by ${a}, so it is the Division Property.`][j]]; }
    if (kind === 1) { const a = R.int(2, 5), b = R.int(1, 6), c = R.int(1, 4), k = R.int(-3, 9), e = (a + c) * k - a * b, j = R.int(1, 4);
      const K = j === 1 ? b : a * b, S3 = j === 2 ? a * c : a + c, R4 = j === 3 ? e - K : e + K;
      const L = [[`${a}(x-${b})+${c === 1 ? '' : c}x=${e}`, RS.G], [`${a}x-${K}+${c === 1 ? '' : c}x=${e}`, RS.DIST], [`${S3}x-${K}=${e}`, RS.SIMP], [`${S3}x=${R4}`, RS.ADD], ['x=' + E.fracStr(R4, S3), j === 4 ? RS.SUB : RS.DIV]];
      if (S3 === a + c && j === 2) return brokenAlg(R);
      return [L, j, ['', `Step 2 distributes badly: ${a}(x − ${b}) = ${a}x − ${a * b}, not ${a}x − ${b}.`, `Step 3 combines like terms wrongly: ${a}x + ${c}x = ${a + c}x, not ${S3}x.`, `Step 4 moves ${K} the wrong way: adding ${K} to both sides gives ${e + K}, not ${R4}.`, `Step 5's reason is wrong: it divides both sides by ${S3}, so it is the Division Property.`][j]]; }
    let a, d, b, k; do { d = R.int(1, 4); a = d + R.int(2, 5); b = R.int(-12, 12); k = R.int(-5, 9); } while (!b);
    const e = (a - d) * k + b, j = R.int(1, 2), R3 = j === 2 ? e + b : e - b;
    const L = [[pl(a, b) + '=' + pl(d, e), RS.G], [pl(a - d, b) + '=' + e, j === 1 ? RS.ADD : RS.SUB], [pl(a - d, 0) + '=' + R3, b > 0 ? RS.SUB : RS.ADD], ['x=' + E.fracStr(R3, a - d), RS.DIV]];
    return [L, j, ['', `Step 2's reason is wrong: ${d === 1 ? 'x was' : d + 'x was'} subtracted from both sides, so it is the Subtraction Property.`, `Step 3 moves ${Math.abs(b)} the wrong way: ${b > 0 ? 'subtracting' : 'adding'} ${Math.abs(b)} gives ${e - b}, not ${R3}.`, ''][j]]; };
  const algTable = (L, hide) => twoCol(L.map(l => [M(l[0]), l[1]]), hide);
  S('V.1.10', 'Algebraic proofs', {
    a: { t: 'justify each step of solving', g: R => { const L = R.pick(ALG)(R), j = R.int(1, L.length - 1);
      return E.choice(R, `Each line follows from the one before. Which property justifies line ${j + 1}?` + tbl(['', 'Statement'], L.map((l, i) => [String(i + 1), M(l[0])])), L[j][1], reasonD(R, L[j][1]), `From ${E.pt(L[j - 1][0])} to ${E.pt(L[j][0])}: ${L[j][1]}.`); } },
    b: { t: 'statement and reason pairs', g: R => { const L = R.pick(ALG)(R), j = R.bool(0.15) ? 0 : R.int(1, L.length - 1);
      return E.choice(R, `Which reason belongs in the box marked ?` + algTable(L, [j, 1]), L[j][1], j === 0 ? [RS.SUBST, RS.REFL, RS.DIST] : reasonD(R, L[j][1]), j === 0 ? 'The first line is what you start with, so its reason is “Given”. Every line needs a reason, the first one too.' : `Line ${j + 1} comes from line ${j}: ${L[j][1]}.`); } },
    c: { t: 'distributive property', g: R => {
      if (R.bool(0.65)) { const [L, j, why] = brokenAlg(R);
        return E.choiceFixed('Exactly one step of this proof is wrong. Which one?' + algTable(L), L.slice(1).map((l, i) => `Step ${i + 2}`), j - 1, why); }
      const a = R.int(2, 9), b = R.int(-9, 9) || 5, s = R.bool();
      const lhs = s ? `${a}(x${sgn(b)})` : `-${a}(x${sgn(b)})`, rhs = s ? pl(a, a * b) : pl(-a, -a * b), bad1 = s ? pl(a, b) : pl(-a, a * b), bad2 = s ? pl(a, -a * b) : pl(-a, -b);
      return E.choice(R, `Using the distributive property, ${M(lhs)} equals…`, M(rhs), [M(bad1), M(bad2), M(pl(a, a + b))].filter(x => x !== M(rhs)), `Multiply every term inside the brackets by ${s ? a : -a}: ${E.pt(rhs)}.`); } },
    d: { t: 'write a full one', g: R => { const L = R.pick(ALG.slice(1))(R), x = L[L.length - 1][0];
      if (R.bool(0.6)) return orderQ(R, `Put the lines of this proof in order. Prove: if ${M(L[0][0])}, then ${M(x)}.`, L.map(l => line(M(l[0]), l[1])), L.map((l, i) => i ? [i - 1] : []), `Each line comes from the one before it: ${L.map(l => E.pt(l[0])).join(' → ')}.`);
      const j = R.int(1, L.length - 2), tru = L[j][0], [lh, rh] = tru.split('='), rv = +rh;
      const wr = [...new Set([`${lh}=${rv + R.pick([1, 2, 3])}`, `${lh}=${rv - R.pick([1, 2, 3])}`, `${lh}=${-rv}`, `${lh}=${rv + 2 * R.int(2, 4)}`])].filter(w => w !== tru && !/=-?0$/.test(w) || w === `${lh}=0`).slice(0, 3);
      return E.choice(R, `Which statement belongs in the box marked ?` + algTable(L, [j, 0]), M(tru), wr.map(M), `${theR(L[j][1])} turns line ${j}, ${E.pt(L[j - 1][0])}, into ${E.pt(tru)}.`); } },
  });

  /* V.1.11 Two-column proofs */
  S('V.1.11', 'Two-column proofs', {
    a: { t: 'given and prove', g: R => { const pf = R.pick(PB)(R), askG = R.bool(), mids = pf.L.slice(pf.given.length, -1).map(l => l[0]);
      const thm = `${pf.pre || ''}If ${gv(pf)}, then ${pf.prove}.`, right = askG ? gv(pf) : pf.prove;
      return E.choice(R, `Theorem: ${thm} In a two-column proof of it, what ${askG ? 'is the Given' : 'do you have to Prove'}?`, right, [askG ? pf.prove : gv(pf), ...R.sample(mids, 2)], `The hypothesis (after “if”) is the Given: ${gv(pf)}. The conclusion (after “then”) is what you Prove: ${pf.prove}.`, pf.fig ? { visual: pf.fig } : {}); } },
    b: { t: 'plan backwards', g: R => { const pf = PB[R.pick(SINGLE)](R), L = pf.L, n = L.length, dep = L[n - 1][2][0];
      const wrong = R.sample(L.filter((l, i) => i !== dep && i !== n - 1).map(l => l[0]), 3);
      return E.choice(R, `${pf.pre || ''}Given: ${gv(pf)}. Prove: ${pf.prove}. The last line will be ${Q(plain(L[n - 1][0]))} with the reason “${L[n - 1][1]}”. Working backwards, which statement do you need just before it?`, L[dep][0], wrong, `${theR(L[n - 1][1])} turns ${Q(plain(L[dep][0]))} into ${Q(plain(L[n - 1][0]))}. So plan to reach that statement.`, pf.fig ? { visual: pf.fig } : {}); } },
    c: { t: 'fill reasons', g: R => { const pf = R.pick(PB)(R), L = pf.L, j = R.bool(0.12) ? 0 : R.int(pf.given.length, L.length - 1), r = L[j][1];
      const ds = j < pf.given.length ? [RS.SUBST, RS.REFL, R.pick([RS.MID, RS.CONG, RS.SAP])] : R.bool(0.3) ? [...reasonD(R, r).slice(0, 2), 'It looks true in the diagram'] : reasonD(R, r);
      return E.choice(R, `${pf.pre || ''}Given: ${gv(pf)}. Prove: ${pf.prove}. Which reason belongs in the box marked ?` + twoCol(L, [j, 1]), r, ds, j < pf.given.length ? 'It is part of the information you start with: Given.' : `Line ${j + 1} follows from ${L[j][2].length ? 'line' + (L[j][2].length > 1 ? 's ' : ' ') + L[j][2].map(d => d + 1).join(' and ') : 'the figure'} by the ${r.replace(/ \(.*\)$/, '')}.`, pf.fig ? { visual: pf.fig } : {}); } },
    d: { t: 'write one from scratch', g: R => { const pf = R.pick(PB)(R), L = pf.L;
      return orderQ(R, `${pf.pre || ''}Given: ${gv(pf)}. Prove: ${pf.prove}. Put the lines of the proof in order.`, L.map(l => line(l[0], l[1])), L.map(l => l[2]), `Every line must come after the lines it uses. One correct order: ${L.map((l, i) => i + 1 + '. ' + plain(l[0])).join('; ')}.`, pf.fig ? { visual: pf.fig } : {}); } },
  });

  /* V.1.12 Paragraph & flow proofs */
  S('V.1.12', 'Paragraph & flow proofs', {
    a: { t: 'read a flow proof', g: R => { const pf = R.pick(PB)(R), L = pf.L, j = R.int(pf.given.length, L.length - 1), stm = R.bool(0.4);
      const vis = flowSVG(L, [j, stm ? 0 : 1]), pre = `${pf.pre || ''}The flow proof shows why ${plain(pf.prove)}. Each arrow points from the statements a step uses.`;
      if (stm) return E.choice(R, `${pre} Which statement belongs in the box marked ?`, L[j][0], R.sample(L.filter((l, i) => i !== j).map(l => l[0]), 3), `The arrows into that box come from ${L[j][2].map(d => Q(plain(L[d][0]))).join(' and ') || 'no earlier box'}, and its reason is “${L[j][1]}”, which gives ${Q(plain(L[j][0]))}.`, { visual: vis });
      return E.choice(R, `${pre} Which reason belongs in the box marked ?`, L[j][1], reasonD(R, L[j][1]), `${Q(plain(L[j][0]))} follows ${L[j][2].length ? 'from ' + L[j][2].map(d => Q(plain(L[d][0]))).join(' and ') + ' ' : ''}by the ${L[j][1].replace(/ \(.*\)$/, '')}.`, { visual: vis }); } },
    b: { t: 'convert two-column to flow', g: R => { const pf = R.pick(PB)(R), L = pf.L, cand = L.map((l, i) => i).filter(i => L[i][2].length), j = R.pick(cand), dep = L[j][2];
      const key = ds => ds.slice().sort().join(','), txt = ds => ds.map(d => L[d][0]).join('  and  '), others = L.map((l, i) => i).filter(i => i < j && !dep.includes(i));
      const pool = []; others.forEach(o => { pool.push([o]); dep.forEach(d => pool.push([d, o].sort())); }); if (dep.length > 1) dep.forEach(d => pool.push([d])); if (j > 0 && !dep.includes(j - 1)) pool.push([j - 1]);
      const wrong = [...new Map(pool.filter(p => key(p) !== key(dep)).map(p => [key(p), p])).values()];
      if (wrong.length < 3) return E.choice(R, `${pf.pre || ''}In a flow proof of this, which statements have arrows pointing into the box ${Q(plain(L[j][0]))}?` + twoCol(L), txt(dep), R.shuffle(L.map((l, i) => [i]).filter(p => key(p) !== key(dep) && p[0] !== j)).slice(0, 3).map(txt), `Line ${j + 1} (${L[j][1]}) uses line${dep.length > 1 ? 's' : ''} ${dep.map(d => d + 1).join(' and ')}, so those boxes point to it.`);
      return E.choice(R, `${pf.pre || ''}In a flow proof of this, which statements have arrows pointing into the box ${Q(plain(L[j][0]))}?` + twoCol(L), txt(dep), R.sample(wrong, 3).map(txt), `Line ${j + 1} (${L[j][1]}) uses line${dep.length > 1 ? 's' : ''} ${dep.map(d => d + 1).join(' and ')}, so those boxes point to it.`); } },
    c: { t: 'write a paragraph proof', g: R => { const pf = R.pick(PB)(R), L = pf.L, n = L.length;
      const sents = L.map((l, i) => sentence(l, i, i === n - 1)).map((s, i) => i && L[i][1] === RS.G ? s.replace('We are given', 'We are also given') : s);
      if (R.bool()) return orderQ(R, `${pf.pre || ''}Given: ${gv(pf)}. Prove: ${pf.prove}. Put the sentences of this paragraph proof in order.`, sents, L.map(l => l[2]), 'A sentence can only use facts stated before it; the proof ends with what you had to prove.', pf.fig ? { visual: pf.fig } : {});
      const j = R.int(pf.given.length, n - 1), r = L[j][1], blank = sents.map((s, i) => i === j ? s.replace(rPhrase(r), '<b>____</b>').replace(cap(rPhrase(r)), '<b>____</b>') : s).join(' ');
      return E.choice(R, `${pf.pre || ''}Fill in the blank in this paragraph proof. ${Q(blank)}`, rPhrase(r), reasonD(R, r).map(rPhrase), `The step ${Q(plain(L[j][0]))} is justified ${rPhrase(r)}.`, pf.fig ? { visual: pf.fig } : {}); } },
    d: { t: 'choose the clearest format', g: R => { const pf = R.pick(PB)(R), L = pf.L, n = L.length, mode = R.int(0, 2);
      if (mode === 0) { const f = R.int(0, 2), vis = f === 1 ? flowSVG(L) : null, body = f === 0 ? twoCol(L) : f === 2 ? Q(L.map((l, i) => sentence(l, i, i === n - 1)).join(' ')) : '';
        return E.choiceFixed(`What kind of proof is this? ${f === 2 ? body : ''}` + (f === 0 ? body : ''), ['a two-column proof', 'a flow proof', 'a paragraph proof'], f, ['Statements in one column and reasons in the other: a two-column proof.', 'Boxes joined by arrows that show which statements lead to each step: a flow proof.', 'The same steps and reasons written as connected sentences: a paragraph proof.'][f], vis ? { visual: vis } : {}); }
      if (mode === 1) { const k = R.int(0, 2);
        return E.choiceFixed(['Which proof format shows most clearly which earlier statements each step uses?', 'Which proof format lists each statement next to its reason in a table?', 'Which proof format tells the argument in connected sentences, like an essay?'][k], ['a two-column proof', 'a flow proof', 'a paragraph proof'], [1, 0, 2][k], ['The arrows of a flow proof show exactly which statements feed each step.', 'A two-column proof pairs every statement with its reason.', 'A paragraph proof writes the steps and reasons as sentences.'][k]); }
      const j = R.int(pf.given.length, n - 1), bad = R.pick(['Clearly, ', 'From the diagram, it looks like ', 'Obviously, ']);
      const sents = L.map((l, i) => i === j ? `${bad}${l[0]}.` : sentence(l, i, i === n - 1)).map((s, i) => i && L[i][1] === RS.G ? s.replace('We are given', 'We are also given') : s);
      const g0 = pf.given.length;
      return E.choiceFixed(`Which sentence of this paragraph proof is missing a valid reason? ${sents.map((s, i) => `(${i + 1}) ${s}`).join(' ')}`, sents.slice(g0).map((s, i) => `Sentence ${i + g0 + 1}`), j - g0, `Sentence ${j + 1} says “${bad.trim().replace(/,$/, '')}” instead of naming a reason. It should say ${rPhrase(L[j][1])}: “it looks true” is never a reason.`, pf.fig ? { visual: pf.fig } : {}); } },
  });

  /* V.1.13 Indirect proof */
  const PRL = { '>': '>', '<': '<', '>=': '≥', '<=': '≤', '=': '=', '!=': '≠' };
  const RELS = ['>', '<', '>=', '<=', '=', '!='], NEGR = { '>': '<=', '<': '>=', '>=': '<', '<=': '>', '=': '!=', '!=': '=' };
  const OPP = [
    ['n is even (for a whole number n)', 'n is odd', ['n is prime', 'n is a multiple of 4', 'n is zero']],
    ['∠A is acute', '∠A is not acute', ['∠A is obtuse', '∠A is a right angle', '∠A is straight']],
    ['lines ℓ and m are parallel', 'lines ℓ and m are not parallel', ['lines ℓ and m are perpendicular', 'lines ℓ and m are the same line', 'lines ℓ and m never meet']],
    ['there are infinitely many primes', 'there are only finitely many primes', ['there are no primes', 'there is exactly one prime', 'every whole number is prime']],
    ['√2 is irrational', '√2 is rational', ['√2 is a whole number', '√2 is negative', '√2 is not a real number']],
    ['△ABC has at most one obtuse angle', '△ABC has at least two obtuse angles', ['△ABC has no obtuse angle', '△ABC has exactly one obtuse angle', '△ABC has exactly two obtuse angles']],
    ['at least one of a and b is even', 'a and b are both odd', ['a and b are both even', 'exactly one of a and b is even', 'at most one of a and b is even']],
    ['△ABC is not equilateral', '△ABC is equilateral', ['△ABC is isosceles', '△ABC is scalene', '△ABC is a right triangle']],
    ['every student passed the test', 'some student did not pass the test', ['no student passed the test', 'every student failed the test', 'some student passed the test']],
    ['both numbers are positive', 'at least one of the numbers is not positive', ['both numbers are negative', 'both numbers are not positive', 'exactly one number is negative']],
    ['the equation has exactly one solution', 'the equation has no solution or more than one solution', ['the equation has no solution', 'the equation has two solutions', 'the equation has infinitely many solutions']],
  ];
  const ROOTLINES = (p, cube) => { const W = p === 2 ? 'even' : `a multiple of ${p}`, r = cube ? `cbrt(${p})` : `sqrt(${p})`, e = cube ? 3 : 2, pw = s => `${s}^${e}`;
    return [`Assume ${M(r)} is rational, so ${M(r + '=a/b')} for whole numbers a and b with no common factor.`,
      `${cube ? 'Cubing' : 'Squaring'} both sides: ${M(`${p}=${pw('a')}/${pw('b')}`)}, so ${M(`${pw('a')}=${p}${pw('b')}`)}.`,
      `So ${M(pw('a'))} is ${W}, which means a is ${W}.`,
      `Write ${M(`a=${p}k`)}. Then ${M(`${p ** e}${pw('k')}=${p}${pw('b')}`)}, so ${M(`${pw('b')}=${p ** (e - 1)}${pw('k')}`)}.`,
      `So ${M(pw('b'))} is ${W}, which means b is ${W}.`,
      `Then a and b have the common factor ${p}, which contradicts “no common factor”.`,
      `Therefore ${M(r)} is irrational.`]; };
  S('V.1.13', 'Indirect proof', {
    a: { t: 'assume the opposite', g: R => {
      if (R.bool(0.5)) { const rel = R.pick(RELS), v = R.pick(['x', 'n', 'y', 't']), a = R.int(-9, 20), st = `${v}${rel}${a}`, neg = `${v}${NEGR[rel]}${a}`;
        const wrong = RELS.filter(r => r !== NEGR[rel] && (rel === '=' || rel === '!=' ? true : !['=', '!='].includes(r))).map(r => `${v}${r}${a}`).filter(x => x !== neg);
        return E.choice(R, `To prove ${M(st)} indirectly, what do you assume first?`, M(neg), R.sample(wrong, 3).map(M), `Assume the exact opposite of ${v} ${PRL[rel]} ${a}, which is ${v} ${PRL[NEGR[rel]]} ${a}. ${rel === '>' || rel === '<' ? 'The opposite of a strict inequality includes the equal case.' : rel === '>=' || rel === '<=' ? 'The opposite of a non-strict inequality is strict.' : ''}`.trim()); }
      const [st, opp, wrong] = R.pick(OPP);
      return E.choice(R, `To prove “${st}” indirectly, what do you assume first?`, opp, wrong, `Assume the exact opposite, which covers every case where the statement fails: ${opp}.`); } },
    b: { t: 'reach a contradiction', g: R => { const k = R.int(0, 4);
      if (k === 0) { const two = R.bool(0.3), x = two ? 90 : R.int(91, 130), y = two ? 90 : R.int(91, 130);
        return E.num(`To prove a triangle cannot have ${two ? 'two right angles' : 'two obtuse angles'}, suppose △ABC has m∠A = ${x}° and m∠B = ${y}°. What would m∠C have to be?`, [{ label: 'm∠C =', ans: 180 - x - y }], `m∠C = 180° − ${x}° − ${y}° = ${180 - x - y}°. An angle of a triangle must be more than 0°, so this is the contradiction.`); }
      if (k === 1) { const [claim, cap0, unit, who] = R.pick([['in any group of N people, two were born in the same month', 12, 'months', 'people'], ['in any group of N people, two were born on the same day of the week', 7, 'days of the week', 'people'], ['if N cards are drawn from a deck, two have the same suit', 4, 'suits', 'cards'], ['if a die is rolled N times, some number comes up twice', 6, 'faces on a die', 'rolls']]), N = cap0 + R.int(1, 6);
        return E.num(`Prove: ${claim.replace('N', N)}. Assume there are no repeats. Then at most how many ${who} could there be?`, [{ ans: cap0 }], `With no repeats, each of the ${cap0} ${unit} is used at most once, so there are at most ${cap0} ${who}. But there are ${N}, a contradiction.`); }
      if (k === 2) { const a = R.pick([3, 5, 7, 9]), b = R.pick([1, 3, 5, 7]);
        return E.choice(R, `Prove: if ${M(`${a}n+${b}`)} is even, then n is odd. Assume n is even, so n = 2k. Then ${M(`${a}n+${b}=${2 * a}k+${b}`)}, which is…`, `odd, contradicting that ${E.pt(`${a}n+${b}`)} is even`, ['even, so the assumption is correct', 'odd, so n must be even after all', `a multiple of ${a}, so n = ${a}`], `${2 * a}k is even and ${b} is odd, so the total is odd. That clashes with the given fact, so n cannot be even.`); }
      if (k === 3) return E.choice(R, 'Prove there is no largest even number. Assume N is the largest even number. Which number gives a contradiction?', 'N + 2', ['N + 1', 'N − 2', 'N/2'], 'N + 2 is even and larger than N, contradicting that N is the largest. (N + 1 is odd, and the others are smaller.)');
      return E.choice(R, 'Prove there is no smallest positive fraction. Assume r is the smallest positive fraction. Which number gives a contradiction?', 'r/2', ['2r', 'r − 1', 'r + 1/2'], 'r/2 is a positive fraction smaller than r, contradicting that r is the smallest.'); } },
    c: { t: 'conclude', g: R => { const k = R.int(0, 2);
      if (k === 0) { const rel = R.pick(['>', '<', '>=', '<=']), v = R.pick(['x', 'n', 'y']), a = R.int(-5, 15), st = `${v}${rel}${a}`, neg = `${v}${NEGR[rel]}${a}`;
        const flip = { '>': '<', '<': '>', '>=': '<=', '<=': '>=' }[rel], strict = { '>': '>=', '<': '<=', '>=': '>', '<=': '<' }[rel];
        return E.choice(R, `To prove ${M(st)}, you assume ${M(neg)} and reach a contradiction. What can you conclude?`, M(st), [M(neg), M(`${v}${strict}${a}`), M(`${v}${flip}${a}`)], `The assumption ${v} ${PRL[NEGR[rel]]} ${a} led to a contradiction, so it is false. Its opposite, ${v} ${PRL[rel]} ${a}, must be true.`); }
      if (k === 1) { const a = R.pick([3, 5, 7, 9]), b = R.pick([1, 3, 5, 7]);
        const L = [`Assume n is even, so ${M('n=2k')} for some whole number k.`, `Then ${M(`${a}n+${b}=${2 * a}k+${b}=2(${a}k+${(b - 1) / 2})+1`.replace('+0)', ')'))}.`, `So ${M(`${a}n+${b}`)} is odd.`, `This contradicts the given fact that ${M(`${a}n+${b}`)} is even.`, 'So the assumption is false, and n is odd.'];
        return orderQ(R, `Prove: if ${M(`${a}n+${b}`)} is even, then n is odd. Put the steps of the indirect proof in order.`, L, L.map((x, i) => i ? [i - 1] : []), 'Assume the opposite, reason to a contradiction, then conclude that the opposite is false.', { fixed: 0 }); }
      const [L, D] = R.pick([
        [['Assume △ABC has two right angles, ∠A and ∠B.', 'Then m∠A + m∠B = 180°.', 'So m∠C = 180° − 180° = 0°.', 'But every angle of a triangle measures more than 0°: a contradiction.', 'So a triangle has at most one right angle.'], [[], [0], [1], [2], [3]]],
        [['Assume N is the largest even number.', 'N + 2 is also even.', 'N + 2 is larger than N.', 'So N + 2 is an even number larger than N, which contradicts N being the largest.', 'So there is no largest even number.'], [[], [0], [0], [1, 2], [3]]],
        [['Assume two different lines ℓ and m meet in two points, P and Q.', 'Then ℓ and m are both lines through P and Q.', 'But through two points there is exactly one line, so ℓ and m are the same line.', 'That contradicts ℓ and m being different lines.', 'So two different lines meet in at most one point.'], [[], [0], [1], [2], [3]]]]);
      return orderQ(R, 'Put the steps of this indirect proof in order.', L, D, 'Assume the opposite, reason to a contradiction, then conclude.', { fixed: 0 }); } },
    d: { t: 'prove √2 is irrational', g: R => { const cube = R.bool(0.2), p = cube ? 2 : R.pick([2, 2, 3, 5, 7]), L = ROOTLINES(p, cube), W = p === 2 ? 'even' : `a multiple of ${p}`, nm = cube ? `∛${p}` : `√${p}`, mode = R.int(0, 2);
      if (mode === 0) return orderQ(R, `Put the steps of the proof that ${nm} is irrational in order.`, L, L.map((x, i) => i ? [i - 1] : []), `Assume ${nm} = a/b in lowest terms, show a and then b is ${W}, and reach a contradiction.`);
      if (mode === 1) { const j = R.pick([1, 2, 3, 5]), pow = cube ? 'cube' : 'square';
        const RQ = { 1: [`${cube ? 'cube' : 'square'} both sides, then multiply both sides by ${cube ? 'b³' : 'b²'}`, ['divide both sides by b', 'take the square root of both sides', `substitute a = ${p}k`]],
          2: [`if a prime divides a ${pow}, it divides the number itself (here ${p} divides ${cube ? 'a³' : 'a²'})`, [`every ${pow} is ${W}`, 'a and b have no common factor', `a = ${p}k by definition`]],
          3: [`substitute a = ${p}k, then divide both sides by ${p}`, [`${cube ? 'cube' : 'square'} both sides again`, 'multiply both sides by k', `divide both sides by ${cube ? 'b³' : 'b²'}`]],
          5: [`both a and b are ${W}, so the fraction a/b could be simplified`, ['a and b are both whole numbers', `${nm} is not a whole number`, 'a is bigger than b']] }[j];
        return E.choice(R, `In this proof that ${nm} is irrational, why is step ${j + 1} true?` + tbl(['', 'Step'], L.map((l, i) => [String(i + 1), l])), RQ[0], RQ[1], `Step ${j + 1}: ${RQ[0]}.`); }
      const j = R.pick([1, 2, 3, 4, 6]), B = L.slice(), pw = cube ? 3 : 2, a2 = cube ? 'a³' : 'a²', b2 = cube ? 'b³' : 'b²';
      if (j === 1) B[1] = `${cube ? 'Cubing' : 'Squaring'} both sides: ${M(`${p}=a/b^${pw}`)}, so ${M(`a^${pw}=${p}b^${pw}`)}.`;
      if (j === 2) B[2] = `So a is ${W}, which means ${M('a^' + pw)} is ${W}.`;
      if (j === 3) B[3] = `Write ${M(`a=${p}k`)}. Then ${M(`${p ** pw}k^${pw}=${p}b^${pw}`)}, so ${M(`b^${pw}=${p ** pw}k^${pw}`)}.`;
      if (j === 4) B[4] = `So b is ${W}, which means ${M('b^' + pw)} is ${W}.`;
      if (j === 6) B[6] = `Therefore ${M(cube ? `cbrt(${p})` : `sqrt(${p})`)} is rational.`;
      const why = { 1: `Squaring a/b gives ${a2}/${b2}, not a/${b2}; the next part happens to be right, but the reasoning in step 2 is wrong.`.replace('Squaring', cube ? 'Cubing' : 'Squaring'), 2: `Step 3 runs backwards: we know ${a2} is ${W}, and must deduce that a is ${W}, not assume it.`, 3: `Dividing ${p ** pw}k${cube ? '³' : '²'} = ${p}${b2} by ${p} gives ${b2} = ${p ** (pw - 1)}k${cube ? '³' : '²'}, not ${p ** pw}k${cube ? '³' : '²'}.`, 4: `Step 5 runs backwards: we know ${b2} is ${W}, and must deduce that b is ${W}, not assume it.`, 6: `The contradiction shows the assumption “${nm} is rational” is false, so ${nm} is irrational.` }[j];
      return E.choiceFixed(`Exactly one step of this proof that ${nm} is irrational is wrong. Which one?` + tbl(['', 'Step'], B.map((l, i) => [String(i + 1), l])), B.slice(1).map((l, i) => `Step ${i + 2}`), j - 1, why); } },
  });

  /* V.1.14 Proof by induction */
  const SUMS = [
    { L: k => `1 + 3 + 5 + … + (2${k} − 1)`, Rk: k => `${k}²`, n1: '1 = 1²', n2: '1 + 3 = 2²', t1: '2k + 1', T1: '2k+1', r1: '(k + 1)²', F1: '(k+1)^2', st: 'k² + (2k + 1) = (k + 1)²' },
    { L: k => `1 + 2 + 3 + … + ${k}`, Rk: k => `${k}(${k} + 1)/2`, n1: '1 = 1·2/2', n2: '1 + 2 = 2·3/2', t1: 'k + 1', T1: 'k+1', r1: '(k + 1)(k + 2)/2', F1: '(k+1)(k+2)/2', st: 'k(k + 1)/2 + (k + 1) = (k + 1)(k + 2)/2' },
    { L: k => `2 + 4 + 6 + … + 2${k}`, Rk: k => `${k}(${k} + 1)`, n1: '2 = 1·2', n2: '2 + 4 = 2·3', t1: '2(k + 1)', T1: '2k+2', r1: '(k + 1)(k + 2)', F1: '(k+1)(k+2)', st: 'k(k + 1) + 2(k + 1) = (k + 1)(k + 2)' },
    { L: k => `1 + 2 + 4 + … + 2^(${k} − 1)`.replace('2^(k − 1)', '2ᵏ⁻¹').replace('2^(n − 1)', '2ⁿ⁻¹'), Rk: k => (k === 'k' ? '2ᵏ' : '2ⁿ') + ' − 1', n1: '1 = 2¹ − 1', n2: '1 + 2 = 2² − 1', t1: '2ᵏ', T1: '2^k', r1: '2ᵏ⁺¹ − 1', F1: '2^(k+1)-1', st: '(2ᵏ − 1) + 2ᵏ = 2·2ᵏ − 1 = 2ᵏ⁺¹ − 1' },
    { L: k => `3 + 7 + 11 + … + (4${k} − 1)`, Rk: k => `${k}(2${k} + 1)`, n1: '3 = 1·3', n2: '3 + 7 = 2·5', t1: '4k + 3', T1: '4k+3', r1: '(k + 1)(2k + 3)', F1: '(k+1)(2k+3)', st: 'k(2k + 1) + (4k + 3) = 2k² + 5k + 3 = (k + 1)(2k + 3)' },
    { L: k => `1 + 4 + 7 + … + (3${k} − 2)`, Rk: k => `${k}(3${k} − 1)/2`, n1: '1 = 1·2/2', n2: '1 + 4 = 2·5/2', t1: '3k + 1', T1: '3k+1', r1: '(k + 1)(3k + 2)/2', F1: '(k+1)(3k+2)/2', st: 'k(3k − 1)/2 + (3k + 1) = (3k² + 5k + 2)/2 = (k + 1)(3k + 2)/2' },
    { L: k => `1² + 2² + 3² + … + ${k}²`, Rk: k => `${k}(${k} + 1)(2${k} + 1)/6`, n1: '1² = 1·2·3/6', n2: '1² + 2² = 2·3·5/6', t1: '(k + 1)²', T1: '(k+1)^2', r1: '(k + 1)(k + 2)(2k + 3)/6', F1: '(k+1)(k+2)(2k+3)/6' },
    { L: k => `1 + 3 + 9 + … + 3^(${k} − 1)`.replace('3^(k − 1)', '3ᵏ⁻¹').replace('3^(n − 1)', '3ⁿ⁻¹'), Rk: k => `(${k === 'k' ? '3ᵏ' : '3ⁿ'} − 1)/2`, n1: '1 = (3¹ − 1)/2', n2: '1 + 3 = (3² − 1)/2', t1: '3ᵏ', T1: '3^k', r1: '(3ᵏ⁺¹ − 1)/2', F1: '(3^(k+1)-1)/2', st: '(3ᵏ − 1)/2 + 3ᵏ = (3·3ᵏ − 1)/2 = (3ᵏ⁺¹ − 1)/2' },
  ];
  const fmla = (s, k) => `${s.L(k)} = ${s.Rk(k)}`;
  const k1L = s => `${s.L('k')} + ${s.t1.includes(' ') ? '(' + s.t1 + ')' : s.t1}`;
  const indLines = (base, hyp, step1, step2, concl, claim) => [`Base case: ${base} ✓`, `Assume ${hyp} for some k ≥ 1.`, step1, step2, concl, `By induction, ${claim} for every n ≥ 1.`];
  const n0Of = f => { let n0 = 1; for (let n = 1; n <= 60; n++) if (!f(n)) n0 = n + 1; return n0; };
  const factl = n => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const INEQ = [['2ⁿ > n²', n => 2 ** n > n * n], ['n! > 2ⁿ', n => factl(n) > 2 ** n], ['n! > 3ⁿ', n => factl(n) > 3 ** n], ['3ⁿ > n³', n => 3 ** n > n ** 3], ['2ⁿ > 3n', n => 2 ** n > 3 * n], ['2ⁿ > 5n', n => 2 ** n > 5 * n], ['2ⁿ > n³', n => 2 ** n > n ** 3], ['2ⁿ > 2n + 1', n => 2 ** n > 2 * n + 1], ['n! > n²', n => factl(n) > n * n], ['3ⁿ > 2ⁿ + 5', n => 3 ** n > 2 ** n + 5], ['n² > 4n + 5', n => n * n > 4 * n + 5], ['2ⁿ > n² + 3', n => 2 ** n > n * n + 3]];
  S('V.1.14', 'Proof by induction', {
    a: { t: 'base case and inductive step', g: R => { const s = R.pick(SUMS), k = R.int(0, 2), claim = `${fmla(s, 'n')} for every n ≥ 1`;
      const hyp = `${fmla(s, 'k')} for some k ≥ 1`, tgt = `${k1L(s)} = ${s.r1}`, all = `${fmla(s, 'n')} for every n ≥ 1`;
      if (k === 0) return E.choice(R, `You want to prove ${claim} by induction. In the inductive step, what do you assume?`, hyp, [tgt, all, s.n2], `Assume the statement for n = k (the inductive hypothesis), then use it to prove it for n = k + 1. Assuming it for every n would assume what you are proving.`);
      if (k === 1) return E.choice(R, `You want to prove ${claim} by induction. In the inductive step, what must you prove?`, tgt, [hyp, s.n1, `${fmla(s, 'k')} for every k ≥ 1`], `Assuming the case n = k, you must show the case n = k + 1: ${tgt}.`);
      return E.choice(R, `You want to prove ${claim} by induction. What is the base case?`, `n = 1: ${s.n1}`, [`n = 2: ${s.n2}`, `n = k: ${fmla(s, 'k')}`, `n = k + 1: ${tgt}`], `The statement starts at n = 1, so the base case checks n = 1: ${s.n1}.`); } },
    b: { t: 'sum formulas', g: R => { const s = R.pick(SUMS), k = R.int(0, 2);
      if (k === 0) return E.num(`To prove ${fmla(s, 'n')} by induction, you go from n = k to n = k + 1. What term do you add to the left side?`, [{ label: 'term =', expr: s.T1 }], `The next term replaces n with k + 1 in the last term: ${s.t1}.`);
      if (k === 1) return E.num(`To prove ${fmla(s, 'n')} by induction, what should the right side equal when n = k + 1? Write it in terms of k.`, [{ label: 'right side =', expr: s.F1 }], `Replace n with k + 1 in ${s.Rk('n')}: ${s.r1}.`);
      const ss = R.pick(SUMS.filter(x => x.st)), Ls = indLines(`when n = 1, ${ss.n1}.`, fmla(ss, 'k'), `Add the next term to both sides: ${k1L(ss)} = ${ss.Rk('k')} + ${ss.t1.includes(' ') ? '(' + ss.t1 + ')' : ss.t1}.`, `Simplify the right side: ${ss.st}.`, 'So the formula holds for n = k + 1.', `${fmla(ss, 'n')}`);
      const deps = [[], [], [1], [2], [3], [0, 4]];
      return orderQ(R, `Put the lines of this proof by induction in order: ${fmla(ss, 'n')} for every n ≥ 1.`, Ls, deps, 'The inductive step builds from the assumption to the case k + 1. The base case can come before or after it, but the final line needs both.', { fixed: 0 }); } },
    c: { t: 'divisibility', g: R => { const k = R.int(0, 3);
      if (k === 0) { const a = R.int(3, 9), d = a - 1;
        return E.num(`To prove that ${d} divides ${a}ⁿ − 1 for every n ≥ 1, the inductive step rewrites ${a}ᵏ⁺¹ − 1 = ${a}(${a}ᵏ − 1) + □. What number goes in the box?`, [{ ans: d }], `${a}(${a}ᵏ − 1) = ${a}ᵏ⁺¹ − ${a}, so add ${d} to get back to ${a}ᵏ⁺¹ − 1. Both parts are multiples of ${d}.`); }
      if (k === 1) { const a = R.int(3, 7), d = a - 1, j = R.int(1, 3), c = d * j - 1;
        return E.num(`To prove that ${d} divides ${a}ⁿ + ${c} for every n ≥ 1, write ${a}ᵏ⁺¹ + ${c} = ${a}(${a}ᵏ + ${c}) − □. What number goes in the box?`, [{ ans: c * (a - 1) }], `${a}(${a}ᵏ + ${c}) = ${a}ᵏ⁺¹ + ${a * c}, which is ${a * c - c} too much. ${a * c - c} = ${c} × ${d} is a multiple of ${d}.`); }
      if (k === 2) return E.num('To prove that 3 divides n³ + 2n, the inductive step writes (k + 1)³ + 2(k + 1) = (k³ + 2k) + 3(□). What expression goes in the box?', [{ expr: 'k^2+k+1' }], '(k + 1)³ + 2(k + 1) = k³ + 3k² + 3k + 1 + 2k + 2 = (k³ + 2k) + 3k² + 3k + 3 = (k³ + 2k) + 3(k² + k + 1).');
      const a = R.int(3, 9), d = a - 1;
      const Ls = indLines(`${a}¹ − 1 = ${d}, which is a multiple of ${d}.`, `${a}ᵏ − 1 is a multiple of ${d}, say ${a}ᵏ − 1 = ${d}m,`, `Rewrite: ${a}ᵏ⁺¹ − 1 = ${a}(${a}ᵏ − 1) + ${d}.`, `Using the assumption, ${a}ᵏ⁺¹ − 1 = ${a}·${d}m + ${d} = ${d}(${a}m + 1), a multiple of ${d}.`, `So the statement holds for n = k + 1.`, `${d} divides ${a}ⁿ − 1`).map(x => x.replace(' for some k ≥ 1.', ' for some k ≥ 1.').replace(',  for', ' for'));
      Ls[1] = `Assume ${a}ᵏ − 1 = ${d}m for some whole number m and some k ≥ 1.`;
      return orderQ(R, `Put the lines of this proof by induction in order: ${d} divides ${a}ⁿ − 1 for every n ≥ 1.`, Ls, [[], [], [], [1, 2], [3], [0, 4]], 'The rewrite is plain algebra and the base case stands alone; the step that uses the assumption needs both the assumption and the rewrite, and the conclusion comes last.', { fixed: 0 }); } },
    d: { t: 'inequalities', g: R => { const k = R.int(0, 2);
      if (k <= 1) { const [txt, f] = R.pick(INEQ), n0 = n0Of(f), bad = [];
        for (let n = 1; n < n0; n++) if (!f(n)) bad.push(n);
        return E.num(`What is the smallest whole number N such that ${txt} for every n ≥ N? (This is the base case an induction proof would need.)`, [{ label: 'N =', ans: n0 }], `Test small n: it fails at n = ${bad.join(', ')} and holds from n = ${n0} on. ${bad.length < n0 - 1 ? 'Holding for some smaller n does not help, because it fails later.' : ''}`.trim()); }
      const a = R.int(2, 5), b = a - 1, B = b === 1 ? 'k' : b + 'k';
      const Ls = [`Base case: n = 1 gives ${a}¹ = ${a} ≥ ${b} + 1. ✓`, `Assume ${a}ᵏ ≥ ${B} + 1 for some k ≥ 1.`, `Then ${a}ᵏ⁺¹ = ${a}·${a}ᵏ ≥ ${a}(${B} + 1).`, `Note that ${a}(${B} + 1) = ${a * b}k + ${a} ≥ ${B} + ${a}, since k ≥ 0.`, `So ${a}ᵏ⁺¹ ≥ ${b === 1 ? '' : b}(k + 1) + 1, the statement for n = k + 1.`, `By induction, ${a}ⁿ ≥ ${b === 1 ? '' : b}n + 1 for every n ≥ 1.`];
      return orderQ(R, `Put the lines of this proof by induction in order: ${a}ⁿ ≥ ${b === 1 ? '' : b}n + 1 for every n ≥ 1.`, Ls, [[], [], [1], [], [2, 3], [0, 4]], 'The inductive step chains two inequalities; the base case and the side inequality stand alone, and the conclusion needs everything.', { fixed: 0 }); } },
    e: { t: 'an induction proof with a trap', g: R => { const v = R.int(0, 4); let L, j, why, claim;
      if (v === 0) { const a = R.int(4, 9), d = a - 1; claim = `${a}ⁿ + 1 is divisible by ${d}`;
        L = [`Base case: n = 1 gives ${a} + 1 = ${a + 1}, which is divisible by ${d}.`, `Assume ${a}ᵏ + 1 is divisible by ${d}.`, `Then ${a}ᵏ⁺¹ + 1 = ${a}(${a}ᵏ + 1) − ${d}.`, `Both ${a}(${a}ᵏ + 1) and ${d} are divisible by ${d}, so ${a}ᵏ⁺¹ + 1 is too.`, `By induction, ${claim} for every n ≥ 1.`]; j = 0; why = `${a + 1} is not divisible by ${d}, so the base case fails. The inductive step is fine, but it has nothing to start from.`; }
      else if (v === 1) { const c = R.pick([0, 2, 4, 6]), ex = `n² + n${c ? ' + ' + c : ''}`, exk = `k² + k${c ? ' + ' + c : ''}`; claim = `${ex} is odd`;
        L = [`Assume ${exk} is odd.`, `Then (k + 1)² + (k + 1)${c ? ' + ' + c : ''} = ${exk} + 2(k + 1).`, `An odd number plus the even number 2(k + 1) is odd.`, `So if the statement holds for n = k, it holds for n = k + 1.`, `By induction, ${claim} for every n ≥ 1.`]; j = 4; why = `There is no base case, and it fails: 1² + 1${c ? ' + ' + c : ''} = ${2 + c} is even. The inductive step alone proves nothing.`; }
      else if (v === 2) { const [thing, prop] = R.pick([['horses', 'color'], ['marbles in a bag', 'color'], ['cars in a lot', 'color'], ['cats', 'breed'], ['cards in a deck', 'suit']]); claim = `all ${thing} have the same ${prop}`;
        L = [`Base case: a group of 1 has only one ${prop}.`, `Assume any group of k ${thing} all have the same ${prop}.`, `Take k + 1 of them. Leave out the first: the other k share one ${prop}.`, `Leave out the last instead: the first k share one ${prop}.`, `The two groups overlap, so all k + 1 share the same ${prop}.`, `By induction, any group of ${thing} shares one ${prop}.`]; j = 4; why = 'When k = 1, the two groups of one have no member in common, so the overlap step fails going from 1 to 2.'; }
      else if (v === 3) { claim = '2ⁿ > n²';
        L = ['Base case: n = 1 gives 2 > 1. ✓', 'Assume 2ᵏ > k².', 'Then 2ᵏ⁺¹ = 2·2ᵏ > 2k².', 'And 2k² ≥ (k + 1)² for every k ≥ 1.', 'So 2ᵏ⁺¹ > (k + 1)².', 'By induction, 2ⁿ > n² for every n ≥ 1.']; j = 3; why = '2k² ≥ (k + 1)² is false for k = 1 and k = 2 (2 < 4 and 8 < 9). In fact 2ⁿ > n² fails for n = 2, 3 and 4.'; }
      else { const c = R.pick([1, 2, 4, 5, 7, 8]); claim = `3 divides n³ + 2n + ${c}`;
        L = [`Base case: n = 1 gives 1 + 2 + ${c} = ${3 + c}, which is divisible by 3.`, `Assume 3 divides k³ + 2k + ${c}.`, `Then (k + 1)³ + 2(k + 1) + ${c} = (k³ + 2k + ${c}) + 3(k² + k + 1).`, 'Both parts are divisible by 3, so the whole is too.', `By induction, ${claim} for every n ≥ 1.`]; j = 0; why = `${3 + c} is not divisible by 3, so the base case is false. The inductive step works, but it starts from nothing.`; }
      return E.choiceFixed(`This “proof” claims ${claim} for every n ≥ 1. Exactly one step is wrong. Which one?` + tbl(['', 'Step'], L.map((l, i) => [String(i + 1), l])), L.map((l, i) => `Step ${i + 1}`), j, why); } },
    f: { t: 'what induction really reaches', g: R => {
      if (R.bool(0.55)) { const RULES = [
          [[1], [k => k + 2], 'P(k) implies P(k + 2)'], [[2], [k => k + 3], 'P(k) implies P(k + 3)'], [[1], [k => 2 * k], 'P(k) implies P(2k)'], [[1, 2], [k => k + 2], 'P(k) implies P(k + 2)'],
          [[1], [k => 2 * k, k => k + 3], 'P(k) implies both P(2k) and P(k + 3)'], [[3], [k => k + 3, k => k + 5], 'P(k) implies both P(k + 3) and P(k + 5)'], [[2], [k => 2 * k, k => k + 5], 'P(k) implies both P(2k) and P(k + 5)'],
          [[1], [k => 3 * k, k => k + 2], 'P(k) implies both P(3k) and P(k + 2)'], [[4], [k => k + 4, k => k + 6], 'P(k) implies both P(k + 4) and P(k + 6)'], [[1], [k => 2 * k + 1], 'P(k) implies P(2k + 1)']];
        const [base, steps, txt] = R.pick(RULES), Mx = R.int(20, 40), got = new Set(base), st = [...base];
        while (st.length) { const k = st.pop(); for (const f of steps) { const m = f(k); if (m <= Mx && !got.has(m)) { got.add(m); st.push(m); } } }
        const list = [...got].filter(x => x <= Mx).sort((a, b) => a - b);
        return E.num(`A statement P(n) has ${base.length > 1 ? 'P(' + base.join(') and P(') + ') true' : 'P(' + base[0] + ') true'}, and for every k, ${txt}. For how many of the numbers n = 1, 2, …, ${Mx} is P(n) guaranteed to be true?`, [{ ans: list.length }], `Start from ${base.join(' and ')} and apply the rule${steps.length > 1 ? 's' : ''} repeatedly: ${list.length > 14 ? list.slice(0, 12).join(', ') + ', …' : list.join(', ')}. That is ${list.length} numbers up to ${Mx}.`); }
      const [a, b] = R.pick([[3, 5], [3, 7], [4, 5], [3, 8], [5, 7], [4, 7], [5, 6], [3, 4], [5, 8], [4, 9]]), fr = a * b - a - b;
      if (R.bool()) return E.num(`Stamps come in ${a}-cent and ${b}-cent values. What is the largest amount that cannot be made exactly?`, [{ ans: fr }], `List the amounts you can make: every amount from ${fr + 1} to ${fr + a} works, and adding ${a}-cent stamps then reaches everything above (strong induction). ${fr} cannot be made, so it is the largest.`);
      return E.num(`Every amount of at least ${fr + 1} cents can be made from ${a}-cent and ${b}-cent stamps. A strong-induction proof uses the step “add one ${a}-cent stamp”. How many base cases does it need?`, [{ ans: a }], `Adding a ${a}-cent stamp gets from n to n + ${a}, so you must check ${a} starting amounts in a row (${fr + 1} to ${fr + a}); every larger amount is then reached.`); } },
  });

  /* V.1.15 Sets & Venn diagrams */
  const setS = a => `{${a.map(x => String(x).replace('-', '−')).join(', ')}}`;
  const vennSVG = (a, both, b, none, la, lb) => V.geo({ pts: { P: [-1.1, 0], Q: [1.1, 0], c1: [-3.4, -2.4], c2: [3.4, -2.4], c3: [3.4, 2.4], c4: [-3.4, 2.4] }, labels: false, w: 300,
    segs: [['c1', 'c2', { width: 1.4 }], ['c2', 'c3', { width: 1.4 }], ['c3', 'c4', { width: 1.4 }], ['c4', 'c1', { width: 1.4 }]], circles: [{ c: 'P', r: 1.9, color: C.blue }, { c: 'Q', r: 1.9, color: C.red }],
    text: [[-1.9, 0, String(a)], [0, 0, String(both)], [1.9, 0, String(b)], [2.8, -2.0, String(none)], [-2.6, 2.0, la], [2.6, 2.0, lb]], label: 'Venn diagram' });
  const CTX = [['French', 'Spanish', 'students take'], ['soccer', 'basketball', 'students play'], ['a dog', 'a cat', 'families have'], ['tea', 'coffee', 'people drink'], ['the art club', 'the chess club', 'students are in'], ['math', 'music', 'students chose']];
  S('V.1.15', 'Sets & Venn diagrams', {
    a: { t: 'set notation and membership', g: R => { const k = R.int(0, 2), A = R.sample([...Array(20).keys()].map(x => x + 1), R.int(4, 7)).sort((x, y) => x - y), nm = R.pick(['A', 'B', 'S', 'T']);
      if (k === 0) { const inn = R.bool(), x = inn ? R.pick(A) : R.pick([...Array(20).keys()].map(y => y + 1).filter(y => !A.includes(y))), sym = R.bool(0.7) ? '∈' : '∉', tru = sym === '∈' ? inn : !inn;
        return E.tf(`${nm} = ${setS(A)}. True or false: ${x} ${sym} ${nm}?`, tru, `${x} ${inn ? 'is' : 'is not'} listed in ${nm}, so “${x} ${sym} ${nm}” is ${tv(tru)}. (∈ means “is an element of”.)`); }
      if (k === 1) { const dup = R.sample(A, R.int(1, 2)), shown = R.shuffle([...A, ...dup]);
        return E.num(`How many elements does ${nm} = ${setS(shown)} have?`, [{ ans: A.length }], `Repeats count once: ${nm} = ${setS(A)}, so it has ${A.length} elements.`); }
      const sub = R.sample(A, 2).sort((x, y) => x - y), out = R.pick([...Array(20).keys()].map(y => y + 1).filter(y => !A.includes(y)));
      return E.choice(R, `${nm} = ${setS(A)}. Which set is a subset of ${nm}?`, setS(sub), [setS([sub[0], out].sort((x, y) => x - y)), setS([out]), setS([...A, out].sort((x, y) => x - y))], `Every element of ${setS(sub)} is in ${nm}. Each other set contains ${out}, which is not in ${nm}.`); } },
    b: { t: 'union, intersection and complement', g: R => { const U = [...Array(12).keys()].map(x => x + 1); let A, B, res, k, lab;
      do { A = R.sample(U, R.int(4, 6)).sort((x, y) => x - y); B = R.sample(U, R.int(4, 6)).sort((x, y) => x - y); k = R.int(0, 4);
        res = [A.filter(x => B.includes(x) || true).concat(B.filter(x => !A.includes(x))), A.filter(x => B.includes(x)), U.filter(x => !A.includes(x)), U.filter(x => !A.includes(x) && !B.includes(x)), A.filter(x => !B.includes(x))][k].sort((x, y) => x - y);
        lab = ['A ∪ B', 'A ∩ B', 'A′', '(A ∪ B)′', 'A ∩ B′'][k]; } while (!res.length || res.length > 8);
      return E.num(`U = {1, 2, …, 12}, A = ${setS(A)} and B = ${setS(B)}. List the elements of ${lab}.`, [{ label: lab + ' =', set: res.map(String) }], `${['∪ (union) collects everything in A or B', '∩ (intersection) keeps what is in both', '′ (complement) is everything in U not in A', 'Everything in U that is in neither A nor B', 'In A but not in B'][k]}: ${setS(res)}.`); } },
    c: { t: 'Venn diagrams with counts', g: R => { const [la, lb, verb] = R.pick(CTX), both = R.int(2, 12), a = R.int(3, 20), b = R.int(3, 20), none = R.int(0, 12), N = a + b + both + none, k = R.int(0, 3);
      if (k === 0) return E.num(`${a + both} ${verb} ${la}, ${b + both} ${verb} ${lb}, and ${both} do both. How many do at least one?`, [{ ans: a + b + both }], `|A ∪ B| = |A| + |B| − |A ∩ B| = ${a + both} + ${b + both} − ${both} = ${a + b + both}. Don't count the ${both} twice.`);
      if (k === 1) return E.num(`Of ${N} people, ${a + both} ${verb.replace(/^(students|people|families) /, '')} ${la}, ${b + both} ${verb.replace(/^(students|people|families) /, '')} ${lb}, and ${both} do both. How many do neither?`.replace(/^Of (\d+) people/, `In a group of $1`), [{ ans: none }], `At least one: ${a + both} + ${b + both} − ${both} = ${a + b + both}. Neither: ${N} − ${a + b + both} = ${none}.`);
      if (k === 2) return E.num(`${a + both} ${verb} ${la} and ${both} of them also ${verb.split(' ').slice(1).join(' ')} ${lb}. How many ${verb.split(' ')[0]} ${verb.split(' ').slice(1).join(' ')} ${la} only?`, [{ ans: a }], `${la} only = ${a + both} − ${both} = ${a}.`);
      const ask = R.pick([[`the number in ${la}`, a + both, `${a} + ${both}`], [`the number in ${lb}`, b + both, `${b} + ${both}`], ['the total', N, `${a} + ${both} + ${b} + ${none}`], [`the number in ${la} or ${lb}`, a + b + both, `${a} + ${both} + ${b}`]]);
      return E.num(`The Venn diagram shows how many ${verb.split(' ')[0]} ${verb.split(' ').slice(1).join(' ')} ${la} and ${lb}. Find ${ask[0]}.`, [{ ans: ask[1] }], `Add the right regions: ${ask[2]} = ${ask[1]}.`, { visual: vennSVG(a, both, b, none, la, lb) }); } },
    d: { t: 'set-builder notation', g: R => { const k = R.int(0, 4);
      if (k <= 3) { let txt, res;
        if (k === 0) { const a = R.int(-5, 3), b = a + R.int(3, 6), lo = R.pick(['<', '<=']), hi = R.pick(['<', '<=']); res = []; for (let x = a - 1; x <= b + 1; x++) if ((lo === '<' ? x > a : x >= a) && (hi === '<' ? x < b : x <= b)) res.push(x); txt = `{x ∈ ℤ | ${M(`${a}${lo}x${hi}${b}`)}}`; }
        else if (k === 1) { const c = R.pick([5, 8, 10, 12, 17, 20, 26]); res = []; for (let x = -6; x <= 6; x++) if (x * x < c) res.push(x); txt = `{x ∈ ℤ | ${M(`x^2<${c}`)}}`; }
        else if (k === 2) { const m = R.int(3, 7), N = m * R.int(3, 6) + R.int(0, m - 1); res = []; for (let x = m; x <= N; x += m) res.push(x); txt = `{n | n is a positive multiple of ${m} and ${M(`n<=${N}`)}}`; }
        else { const a = R.int(2, 4), b = R.int(-3, 3), ks = [0, 1, 2, 3].slice(0, R.int(3, 4)); res = ks.map(x => a * x + b); txt = `{${E.pt(pl(a, b).replace(/x/g, 'k'))} | k ∈ ${setS(ks)}}`; }
        return E.num(`List the elements of ${txt}.`, [{ set: res.map(String) }], `Test each candidate against the rule: ${setS(res)}.${k === 0 ? ' Watch whether each end uses < or ≤.' : ''}`); }
      const a = R.int(1, 5), b = a + R.int(3, 5), list = []; for (let x = a; x <= b; x++) list.push(x);
      const opt = (lo, hi) => `{x ∈ ℤ | ${M(`${lo[0]}${lo[1]}x${hi[0]}${hi[1]}`)}}`;
      return E.choice(R, `Which set-builder notation describes ${setS(list)}?`, opt([a, '<='], ['<=', b]), [opt([a, '<'], ['<=', b]), opt([a, '<='], ['<', b]), opt([a, '<'], ['<', b])], `The set starts at ${a} and ends at ${b}, both included, so both ends use ≤.`); } },
  });

  /* V.1.16 Quantifiers */
  const QS = [['Every square is a rectangle.', 0], ['All prime numbers greater than 2 are odd.', 0], ['Each student has a locker.', 0], ['No triangle has two right angles.', 0], ['Any multiple of 10 ends in 0.', 0], ['Every even number is divisible by 2.', 0], ['All birds have feathers.', 0], ['Nobody in the class was late.', 0], ['For every real number x, x² ≥ 0.', 0], ['Every angle in a rectangle is a right angle.', 0], ['None of the doors was locked.', 0], ['All dogs in the show were trained.', 0],
    ['Some prime number is even.', 1], ['There is a rectangle that is a square.', 1], ['At least one student got 100%.', 1], ['Some triangles are isosceles.', 1], ['There exists a number equal to its own square.', 1], ['Someone in the class plays the violin.', 1], ['A few of the apples are rotten.', 1], ['There is a month with 28 days.', 1], ['For some integer n, n² = 49.', 1], ['At least one of the lights is on.', 1], ['Some rhombus has a right angle.', 1], ['There is an even prime.', 1]];
  const PRED = [[c => `x > ${c}`, c => x => x > c], [c => `x < ${c}`, c => x => x < c], [() => 'x is even', () => x => x % 2 === 0], [() => 'x is prime', () => x => isPrime(x)], [c => `x is a multiple of ${c}`, c => x => x % c === 0], [c => `x² < ${c}`, c => x => x * x < c], [() => 'x is odd', () => x => x % 2 !== 0]];
  const NEGREL = { '>': '≤', '<': '≥', '≥': '<', '≤': '>', '=': '≠', '≠': '=' };
  const PAIR = [[(x, y) => x + y === 5, 'x + y = 5'], [(x, y) => x < y, 'x < y'], [(x, y) => y % x === 0, 'x divides y'], [(x, y) => (x * y) % 2 === 0, 'xy is even'], [(x, y) => Math.abs(x - y) === 1, '|x − y| = 1'], [(x, y) => x + y >= 5, 'x + y ≥ 5'], [(x, y) => x <= y, 'x ≤ y'], [(x, y) => x !== y, 'x ≠ y'], [(x, y) => x * y > 4, 'xy > 4'], [(x, y) => (x + y) % 2 === 0, 'x + y is even']];
  S('V.1.16', 'Quantifiers', {
    a: { t: '"for all" and "there exists"', g: R => {
      if (R.bool(0.6)) { const want = R.int(0, 1), [st] = R.pick(QS.filter(q => q[1] === want));
        return E.choiceFixed(`Is this a “for all” statement or a “there exists” statement? ${Q(st)}`, ['for all (∀)', 'there exists (∃)'], want, want ? '“Some”, “there is” and “at least one” claim that at least one thing exists: ∃.' : '“Every”, “all”, “each”, “any” and “no” make a claim about every member: ∀. (“No A is B” means every A is not B.)'); }
      const c = R.int(1, 9), k = R.int(0, 3);
      const S4 = [[`∀x ∈ ℝ, ${E.pt('x^2')} ≥ 0`, 'Every real number has a square that is at least 0.', ['Some real number has a square that is at least 0.', 'No real number has a negative square root.', 'Every real number is at least 0.']],
        [`∃n ∈ ℤ, n > ${c}`, `There is an integer greater than ${c}.`, [`Every integer is greater than ${c}.`, `No integer is greater than ${c}.`, `There is exactly one integer greater than ${c}.`]],
        [`∀n ∈ ℕ, 2n is even`, 'Twice any natural number is even.', ['Some natural number doubled is even.', 'Every natural number is even.', 'No natural number doubled is odd, except 1.']],
        [`∃x ∈ ℝ, x + ${c} = 0`, `Some real number added to ${c} gives 0.`, [`Every real number added to ${c} gives 0.`, `No real number added to ${c} gives 0.`, `${c} is equal to 0.`]]][k];
      return E.choice(R, `What does ${S4[0]} say?`, S4[1], S4[2], '∀ means “for every”; ∃ means “there exists at least one”.'); } },
    b: { t: 'true or false over a set', g: R => { const want = R.bool();
      for (;;) { const set = R.sample([...Array(20).keys()].map(x => x + 1), R.int(4, 6)).sort((a, b) => a - b), [tx, fn] = R.pick(PRED), c = R.int(2, 15), f = fn(c), all = R.bool(), val = all ? set.every(f) : set.some(f);
        if (val !== want) continue; const wit = all ? set.find(x => !f(x)) : set.find(f);
        return E.tf(`Let S = ${setS(set)}. True or false: ${all ? '∀' : '∃'}x ∈ S, ${tx(c)}.`, want, all ? (want ? `Every element of S satisfies ${tx(c)}.` : `False: x = ${wit} fails ${tx(c)}, and one failure breaks “for all”.`) : (want ? `True: x = ${wit} works, and one example is enough for “there exists”.` : `False: no element of S satisfies ${tx(c)}.`)); } } },
    c: { t: 'negate a quantified statement', g: R => {
      if (R.bool(0.5)) { const rel = R.pick(['>', '<', '≥', '≤', '=']), c = R.int(-5, 12), q = R.pick(['∀', '∃']), nq = q === '∀' ? '∃' : '∀', dom = R.pick(['ℝ', 'ℤ', 'S']);
        return E.choice(R, `Which is the negation of ${q}x ∈ ${dom}, x ${rel} ${c}?`, `${nq}x ∈ ${dom}, x ${NEGREL[rel]} ${c}`, [`${q}x ∈ ${dom}, x ${NEGREL[rel]} ${c}`, `${nq}x ∈ ${dom}, x ${rel} ${c}`, `${q}x ∈ ${dom}, x ≠ ${c}`].filter(x => x !== `${nq}x ∈ ${dom}, x ${NEGREL[rel]} ${c}`), `Switch the quantifier (${q} becomes ${nq}) and negate the condition (${rel} becomes ${NEGREL[rel]}).`); }
      const EN = [['All swans are white.', 'Some swan is not white.', ['No swan is white.', 'All swans are not white.', 'Some swan is white.']],
        ['Every student passed.', 'At least one student did not pass.', ['No student passed.', 'Every student failed.', 'Some student passed.']],
        ['Some prime is even.', 'No prime is even.', ['Some prime is odd.', 'Every prime is even.', 'Some prime is not even.']],
        ['There is a door that is open.', 'Every door is closed.', ['There is a door that is closed.', 'Every door is open.', 'No door is closed.']],
        ['Every triangle has an acute angle.', 'Some triangle has no acute angle.', ['No triangle has an acute angle.', 'Every triangle has no acute angle.', 'Some triangle has an acute angle.']],
        ['Someone in the room speaks French.', 'No one in the room speaks French.', ['Someone in the room does not speak French.', 'Everyone in the room speaks French.', 'Not everyone in the room speaks French.']],
        ['All the cookies are gone.', 'At least one cookie is left.', ['None of the cookies are gone.', 'All the cookies are left.', 'Some cookies are gone.']],
        ['Every number in the list is positive.', 'Some number in the list is zero or negative.', ['Every number in the list is negative.', 'Some number in the list is negative.', 'No number in the list is positive.']]];
      const [st, neg, wrong] = R.pick(EN);
      return E.choice(R, `Which is the negation of this statement? ${Q(st)}`, neg, wrong, `The negation is true exactly when the original is false. ${/^(Some|There|Someone)/.test(st) ? 'To deny “some”, say “none” (for every one, it fails).' : 'To deny “all”, it is enough that one fails.'}`); } },
    d: { t: 'counterexamples for "for all"', g: R => {
      for (;;) { const set = R.sample([...Array(24).keys()].map(x => x + 1), 5).sort((a, b) => a - b), [tx, fn] = R.pick(PRED), c = R.int(2, 12), f = fn(c), bad = set.filter(x => !f(x));
        if (bad.length !== 1) continue;
        return E.choice(R, `The claim “∀x ∈ S, ${tx(c)}” is false for S = ${setS(set)}. Which element is the counterexample?`, String(bad[0]), set.filter(x => f(x)).slice(0, 3).map(String), `${bad[0]} is in S but does not satisfy ${tx(c)}. The other elements do, so they cannot disprove it.`); } } },
    e: { t: 'negate nested quantifiers', g: R => {
      if (R.bool(0.55)) { const [q1, q2] = R.pick([['∀', '∃'], ['∃', '∀'], ['∀', '∀'], ['∃', '∃']]), P = R.pick([['x + y = 0', 'x + y ≠ 0'], ['y > x', 'y ≤ x'], ['xy = 1', 'xy ≠ 1'], ['y² = x', 'y² ≠ x'], ['x < y', 'x ≥ y'], [`x + y = ${R.int(2, 9)}`, null]]);
        const pos = P[0], neg = P[1] || pos.replace('=', '≠'), sw = q => q === '∀' ? '∃' : '∀';
        const right = `${sw(q1)}x ${sw(q2)}y, ${neg}`;
        return E.choice(R, `Which is the negation of ${q1}x ${q2}y, ${pos}?`, right, [`${sw(q1)}x ${q2}y, ${neg}`, `${q1}x ${sw(q2)}y, ${neg}`, `${sw(q1)}x ${sw(q2)}y, ${pos}`].filter(x => x !== right), `Push the “not” inward one quantifier at a time: each ∀ becomes ∃, each ∃ becomes ∀, and the condition is negated: ${right}.`); }
      const EN2 = [['Every student has a friend in the class.', 'Some student has no friend in the class.', ['No student has a friend in the class.', 'Every student has no friend in the class.', 'Some student has a friend who is not in the class.']],
        ['There is a teacher who knows every student.', 'Every teacher fails to know at least one student.', ['No teacher knows any student.', 'There is a teacher who knows no student.', 'Every teacher knows some student.']],
        ['Every lock has a key that opens it.', 'Some lock has no key that opens it.', ['No lock has a key that opens it.', 'Every lock has a key that does not open it.', 'Some key opens no lock.']],
        ['For every number, there is a bigger number.', 'There is a number with no bigger number.', ['For every number, there is a smaller number.', 'No number has a bigger number.', 'There is a number with a bigger number.']],
        ['Someone in the club has read every book on the list.', 'Everyone in the club has missed at least one book on the list.', ['No one in the club has read any book on the list.', 'Someone in the club has missed every book on the list.', 'Everyone in the club has read some book on the list.']],
        ['Every town has a road to every other town.', 'Some town has no road to some other town.', ['No town has a road to any other town.', 'Every town has no road to some other town.', 'Some town has a road to every other town.']]];
      const [st, neg, wrong] = R.pick(EN2);
      return E.choice(R, `Which is the negation of this statement? ${Q(st)}`, neg, wrong, 'Negate one quantifier at a time: “every” becomes “some … not”, and “there is” becomes “every … not”. The negation is true exactly when the original fails.'); } },
    f: { t: 'the order of quantifiers', g: R => { const D = R.pick([[1, 2, 3], [1, 2, 3, 4], [0, 1, 2], [2, 3, 4], [1, 2, 4]]), [P, txt] = R.pick(PAIR);
      const ev = { AA: D.every(x => D.every(y => P(x, y))), AE: D.every(x => D.some(y => P(x, y))), EA: D.some(x => D.every(y => P(x, y))), EE: D.some(x => D.some(y => P(x, y))), YAE: D.every(y => D.some(x => P(x, y))), YEA: D.some(y => D.every(x => P(x, y))) };
      const TX = { AA: `∀x ∀y, ${txt}`, AE: `∀x ∃y, ${txt}`, EA: `∃x ∀y, ${txt}`, EE: `∃x ∃y, ${txt}`, YAE: `∀y ∃x, ${txt}`, YEA: `∃y ∀x, ${txt}` };
      const keys = R.sample(Object.keys(TX), 4), n = keys.filter(k => ev[k]).length;
      return E.num(`Let x and y range over ${setS(D)}. How many of these four statements are true? ${keys.map((k, i) => `(${i + 1}) ${TX[k]}`).join('  ')}`, [{ ans: n }], keys.map((k, i) => `(${i + 1}) ${ev[k] ? 'true' : 'false'}`).join(', ') + `. The order matters: “∀x ∃y” lets y depend on x, but “∃y ∀x” needs one y that works for every x.`); } },
  });
})(typeof window !== 'undefined' ? window : globalThis);
