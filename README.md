# Mathera v0.5 (beta)

A living math curriculum — practice app for **Eras I–V** (Count through Proof), with curriculum docs and harnesses for further development.

**Live app (GitHub Pages):** https://julianlee314-hue.github.io/mathera/

Open that URL for the self-contained beta. The same build also lives at [`app/mathera.html`](app/mathera.html) (repo root `index.html` is a Pages entry point).

## Eras

| Era | Focus | In the beta app |
|-----|--------|-----------------|
| **I** | Count | Yes |
| **II** | Operate | Yes |
| **III** | Measure | Yes |
| **IV** | Space | Yes |
| **V** | Proof | Yes |
| **VI–VII** | (roadmap) | Skills/docs only — see `docs/` |

## Repo layout

| Path | Contents |
|------|----------|
| `app/` | Beta app sources + built `mathera.html` |
| `lab/` | Eras I–III question engine + harness |
| `up/` | Eras IV–V answer engine + harness |
| `rev/` | Skill lists, Stone Library |
| `guide/` | Curriculum guide source + PDF |
| `docs/` | Status, plan, history network / concept PDFs, artefact lineages |
| `qa/` | Audit and review reports |
| `index.html` | Pages homepage (v0.5 app) |

## Rebuild / test (dev)

```bash
cd app && node build.js            # rebuilds app/mathera.html
cd lab && node harness.js          # Eras I–III (filter with ONLY=…)
cd up  && node harness4.js 300 V.3.
cd up  && node test-core.js
```

## Docs worth opening

- [`guide/Mathera-Curriculum-Guide.pdf`](guide/Mathera-Curriculum-Guide.pdf) — parent-facing curriculum guide  
- [`docs/status.md`](docs/status.md) — current beta status  
- [`docs/Mathera_artefact_lineages.md`](docs/Mathera_artefact_lineages.md) — artefact lineages cabinet  
- History / concepts PDFs under [`docs/`](docs/)

---

Mathera · October 2026 · v0.5 beta
