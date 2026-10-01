"""Tiny TeX-subset → MathML converter in the Stone Library's style.
Inline math is written \\( … \\) and display math \\[ … \\]. Supported: numbers, letters, operators,
\\frac \\dfrac \\tfrac, \\sqrt[n]{}, ^ _, \\binom, \\text{}, \\mathrm{}, \\mathbb{}, \\bar \\hat \\vec \\overline,
Greek letters, \\sum \\int \\prod \\lim, trig/log names, \\left/\\right (dropped), common symbols."""
import re, html
GREEK = {k: v for k, v in zip(
    'alpha beta gamma delta epsilon varepsilon zeta eta theta vartheta iota kappa lambda mu nu xi pi rho sigma tau upsilon phi varphi chi psi omega Gamma Delta Theta Lambda Xi Pi Sigma Phi Psi Omega'.split(),
    'α β γ δ ϵ ε ζ η θ ϑ ι κ λ μ ν ξ π ρ σ τ υ ϕ φ χ ψ ω Γ Δ Θ Λ Ξ Π Σ Φ Ψ Ω'.split())}
SYM = {'cdot': '⋅', 'times': '×', 'div': '÷', 'pm': '±', 'mp': '∓', 'le': '≤', 'leq': '≤', 'ge': '≥', 'geq': '≥', 'ne': '≠', 'neq': '≠',
       'approx': '≈', 'to': '→', 'rightarrow': '→', 'Rightarrow': '⇒', 'iff': '⇔', 'Leftrightarrow': '⇔', 'infty': '∞', 'in': '∈', 'notin': '∉',
       'cup': '∪', 'cap': '∩', 'subset': '⊂', 'subseteq': '⊆', 'emptyset': '∅', 'varnothing': '∅', 'forall': '∀', 'exists': '∃', 'neg': '¬',
       'land': '∧', 'lor': '∨', 'mid': '∣', 'ldots': '…', 'dots': '…', 'cdots': '⋯', 'circ': '∘', 'degree': '°', 'angle': '∠', 'perp': '⊥',
       'parallel': '∥', 'triangle': '△', 'sim': '∼', 'cong': '≅', 'equiv': '≡', 'propto': '∝', 'partial': '∂', 'nabla': '∇', 'prime': '′',
       'lbrace': '{', 'rbrace': '}', '{': '{', '}': '}', '|': '‖', 'setminus': '∖', 'quad': ' ', ',': ' ', ';': ' ', '!': '', ' ': ' ', 'colon': ':'}
FUN = set('sin cos tan sec csc cot sinh cosh tanh arcsin arccos arctan arsinh arcosh artanh ln log exp lim max min det Var E P'.split())
BIG = {'sum': '∑', 'int': '∫', 'prod': '∏', 'iint': '∬', 'oint': '∮'}
OPS = set('+−-=<>±×÷⋅,;:()[]|/!′∪∩∈≤≥≠≈→∼≅')

def esc(s): return html.escape(s, quote=False)

class P:
    def __init__(s, t): s.t, s.i = t, 0
    def peek(s): return s.t[s.i] if s.i < len(s.t) else ''
    def group(s):
        s.ws()
        if s.peek() == '{':
            s.i += 1; start = s.i; depth = 1
            while depth:
                c = s.t[s.i]
                if c == '\\': s.i += 2; continue
                depth += (c == '{') - (c == '}'); s.i += 1
            return s.t[start:s.i - 1]
        # single token
        if s.peek() == '\\':
            m = re.match(r'\\([A-Za-z]+|.)', s.t[s.i:]); s.i += len(m.group(0)); return m.group(0)
        c = s.peek(); s.i += 1; return c
    def ws(s):
        while s.peek() == ' ': s.i += 1
    def row(s, stop=None):
        out = []
        while s.i < len(s.t):
            c = s.peek()
            if stop and c == stop: break
            node = s.atom()
            if node is None: continue
            AF = '<mo>&#x2061;</mo>'; fn = node.endswith(AF) and node.startswith('<mi>')
            if fn: node = node[:-len(AF)]
            # scripts
            while True:
                s.ws()
                if s.peek() in ('^', '_'):
                    sup = sub = None
                    for _ in range(2):
                        s.ws()
                        if s.peek() == '^': s.i += 1; sup = '<mrow>' + conv(s.group()) + '</mrow>'
                        elif s.peek() == '_': s.i += 1; sub = '<mrow>' + conv(s.group()) + '</mrow>'
                    big = node.startswith('<mo largeop')
                    if sup is not None and sub is not None: node = f'<msubsup>{node}{sub}{sup}</msubsup>'
                    elif sup is not None: node = f'<msup>{node}{sup}</msup>'
                    else: node = f'<msub>{node}{sub}</msub>'
                    if big: pass
                elif s.peek() == "'":
                    s.i += 1; node = f'<msup>{node}<mo>′</mo></msup>'
                else: break
            if fn:
                if out and not out[-1].startswith('<mo'): node = '<mspace width="0.1667em"/>' + node
                s.ws(); nxt = s.peek()
                node += AF + ('' if nxt in ('(', '', '^', '_') or s.t[s.i:s.i+6] == '\\left(' else '<mspace width="0.1667em"/>')
            out.append(node)
        return ''.join(out)
    def atom(s):
        c = s.peek()
        if c == ' ': s.i += 1; return None
        if c == '{': return '<mrow>' + conv(s.group()) + '</mrow>'
        if c.isdigit() or (c == '.' and s.t[s.i + 1:s.i + 2].isdigit()):
            m = re.match(r'\d+(?:\.\d+)?|\.\d+', s.t[s.i:]); s.i += len(m.group(0)); return f'<mn>{m.group(0)}</mn>'
        if c == '\\':
            m = re.match(r'\\([A-Za-z]+|.)', s.t[s.i:]); s.i += len(m.group(0)); name = m.group(1)
            if name in ('frac', 'dfrac', 'tfrac'): a = conv(s.group()); b = conv(s.group()); return f'<mfrac><mrow>{a}</mrow><mrow>{b}</mrow></mfrac>'
            if name == 'binom': a = conv(s.group()); b = conv(s.group()); return f'<mrow><mo>(</mo><mfrac linethickness="0"><mrow>{a}</mrow><mrow>{b}</mrow></mfrac><mo>)</mo></mrow>'
            if name == 'sqrt':
                s.ws()
                if s.peek() == '[':
                    j = s.t.index(']', s.i); n = s.t[s.i + 1:j]; s.i = j + 1; a = conv(s.group()); return f'<mroot><mrow>{a}</mrow><mrow>{conv(n)}</mrow></mroot>'
                return f'<msqrt><mrow>{conv(s.group())}</mrow></msqrt>'
            if name in ('text', 'mathrm', 'textrm', 'operatorname'):
                g = s.group(); return f'<mtext>{esc(g)}</mtext>' if name.startswith('text') else f'<mi mathvariant="normal">{esc(g)}</mi>'
            if name == 'mathbb': g = s.group(); return '<mi>' + {'R': 'ℝ', 'N': 'ℕ', 'Z': 'ℤ', 'Q': 'ℚ', 'C': 'ℂ'}.get(g, g) + '</mi>'
            if name in ('bar', 'overline', 'hat', 'vec', 'tilde'):
                acc = {'bar': '‾', 'overline': '‾', 'hat': '^', 'vec': '→', 'tilde': '~'}[name]
                return f'<mover accent="true"><mrow>{conv(s.group())}</mrow><mo>{acc}</mo></mover>'
            if name in ('left', 'right', 'big', 'Big', 'displaystyle'):
                s.ws()
                if s.peek() == '.': s.i += 1
                return None
            if name in GREEK: return f'<mi>{GREEK[name]}</mi>'
            if name in BIG: return f'<mo largeop="true">{BIG[name]}</mo>'
            if name in FUN: return f'<mi>{name}</mi><mo>&#x2061;</mo>'
            if name in SYM:
                v = SYM[name]
                if v.strip() == '': return f'<mspace width="0.5em"/>' if name == 'quad' else None
                return f'<mo>{esc(v)}</mo>' if v not in ('∞', '∅', '∂', '∇') else f'<mi>{v}</mi>'
            raise ValueError('unknown command \\' + name)
        if c.isalpha():
            m = re.match(r'[A-Za-z]+', s.t[s.i:]); w = m.group(0)
            if w in FUN - {'E', 'P'}: s.i += len(w); return f'<mi>{w}</mi><mo>&#x2061;</mo>'
            s.i += 1; return f'<mi>{c}</mi>'
        s.i += 1
        if c == '-': c = '−'
        if c == '*': c = '⋅'
        if c in '()[]': return f'<mo lspace="0em" rspace="0em" stretchy="false">{c}</mo>'
        if c in OPS or not c.isalnum(): return f'<mo>{esc(c)}</mo>' if c.strip() else None
        return f'<mi>{esc(c)}</mi>'

def conv(t): return P(t).row()

def tex(t, display=False):
    body = conv(t.strip())
    attr = ' display="block"' if display else ''
    m = f'<math{attr}><mrow>{body}</mrow></math>'
    return f'<span class="dm">{m}</span>' if display else m

def render(s):
    s = re.sub(r'\\\[(.+?)\\\]', lambda m: tex(m.group(1), True), s, flags=re.S)
    return re.sub(r'\\\((.+?)\\\)', lambda m: tex(m.group(1)), s, flags=re.S)

if __name__ == '__main__':
    import sys, xml.dom.minidom
    for t in [r'\(\binom{n}{k} = \frac{n!}{k!(n-k)!}\)', r'\[P(A \mid B) = \frac{P(A \cap B)}{P(B)}\]', r'\(\sigma = \sqrt{\frac{\sum (x - \bar{x})^2}{n}}\)',
              r'\(\cosh^2 x - \sinh^2 x = 1\)', r'\(x_{n+1} = g(x_n)\)', r'\(\sqrt[3]{8} = 2\), \(F \le \mu R\)', r'\(\int_0^1 x^2\,dx = \tfrac13\)', r'\(|z - 3i| = 2\)', r"\(y'' + y = 0\)"]:
        r = render(t); print(r[:300]); xml.dom.minidom.parseString('<r>' + r.replace('&#x2061;', '&#8289;') + '</r>')
    print('ok')
