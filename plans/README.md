# Gutenberg Block Generation — Approaches

Planning document for a new c2b capability: generating custom Gutenberg block scaffolding (`block.json`, edit implementation, PHP-rendered dynamic frontend) from dedicated story-like definition files, where args-style props with defaults become block attributes.

This is an exploration of potential approaches with tradeoffs and tentative recommendations. Each decision area (A–F) can be dived into deeper before any code is written.

---

## 1. Overview

### Goal

Extend c2b so a component library author can write a small, typed "block definition" file next to a component (similar in spirit to a Storybook story with args), and have c2b generate:

- `block.json` with standard settings + attributes derived from the definition
- an `edit` implementation that imports the real component from the published `@cuweb/rds2` package
- a frontend — preferably a **dynamic block with a PHP render** — plus style wiring and plugin registration

### Constraints

- **c2b is zero-runtime-dependency** (Node built-ins only). The shipped CLI is compiled JS with no TypeScript parser, no AST tooling, no CSF tools. How the CLI *reads* a block definition file is the central technical tension (Decision Area B).
- Generators are pure `(config) => string` functions orchestrated by `generate()` in `src/index.ts` with a `write(path, content)` closure — multi-file-per-block output fits the existing pipeline naturally.
- Config validation ignores unknown top-level keys, so a new `blocks` section in `c2b.config.json` is non-breaking.
- The existing Storybook preset (`src/preset.ts`) only injects CSS file paths via `previewAnnotations` — it provides no access to story files and no precedent for indexing them.

### Existing assets (don't reinvent these)

- **RDS2's hand-written WordPress docs are the acceptance spec.** `docs/consumers/wordpress/blocks-static.md` and `blocks-dynamic.md` (in the rds2 repo) document exactly the output this feature should generate — apiVersion 3 `block.json`, `edit.tsx` using `useBlockProps`/`InspectorControls` and importing `@cuweb/rds2` components, and the house-recommended **hybrid save + render.php** pattern for dynamic blocks.
- c2b's own `docs/wordpress/blocks.md` is a roadmap stub for this feature: `c2b-tokens` style-handle dependency, static vs dynamic blocks, per-block CSS loading, "PHP render templates that match component markup".
- `integrate.php` (generated today) registers the `c2b-tokens` style handle — the shared contract that lets per-component CSS (which only depends on `--rds--*` custom properties) work standalone.
- `@cuweb/rds2` has per-component subpath exports, including compiled styles: `@cuweb/rds2/CallOut`, `@cuweb/rds2/CallOut.css`, `@cuweb/rds2/CallOut.scss`.

### Conventions in play

| Thing | Convention |
|---|---|
| Block namespace | `cuweb/` (e.g. `cuweb/alert`) |
| DOM classes | `cu-*` BEM (e.g. `cu-alert__icon`) |
| Token prefix | `rds` (`--rds--*` CSS vars) |

Note the block/class prefix (`cu`) and token prefix (`rds`) differ — the generator should treat both as config, not hardcode either.

### Component complexity tiers (used throughout)

| Tier | Example | Traits | Scope |
|---|---|---|---|
| 1 | Alert | Flat BEM markup, scalar/enum props, internal enum→icon SVG | **MVP target** |
| 2 | CallOut | Nests other RDS components, `children` → InnerBlocks, class-map enums | Phase 3 |
| 3 | Card | Compound (14 subcomponents), hooks, no flat args | Out of scope v1 |

One fact that shapes several decisions: **even tier-1 Alert renders an `<Icon>` (SVG from `@cuweb/rds-icons`) selected by an enum prop.** The "how does PHP get the SVG" problem exists at every tier — which is exactly what the hybrid-save pattern in RDS2's docs solves.

---

## 2. Decision Area A — Block definition format

> **Decided direction:** story-like definition files read only by the generator (not loaded by Storybook). Alternatives kept below for the record.

### A1 — Dedicated `<Name>.block.ts` with a typed `defineBlock<Props>()` helper ✅ recommended

```ts
import { defineBlock } from 'component2block/blocks';
import type { AlertProps } from '@cuweb/rds2/Alert'; // type-only, erased at runtime

export default defineBlock<AlertProps>({
	name: 'cuweb/alert',
	title: 'Alert',
	category: 'design',
	frontend: 'hybrid', // 'static' | 'dynamic' | 'hybrid' (see Area D)
	attributes: {
		title: { type: 'string', default: 'Alert title', control: 'text', richText: true },
		type: {
			type: 'enum',
			options: ['success', 'error', 'warning', 'info'],
			default: 'info',
			control: 'inline-radio',
		},
		content: { type: 'string', default: '', control: 'textarea' },
	},
});
```

`defineBlock` is an identity function shipped by c2b — types plus a no-op, zero-dep safe. The generic parameter gives **typed autocomplete and compile errors against the real component props**: a default or enum option that doesn't match the prop's union type fails `tsc` in the consuming project. This directly catches the drift class already observed in RDS2 (CallOut's story lists 3 `maxWidth` options while the TS union has 4).

- **Pros:** typed DX against real props; block-specific metadata (title, category, icon, supports, frontend strategy) has a natural home; decoupled from Storybook internals; a constrained shape keeps extraction simple; stories stay the demo layer, block defs the WP layer.
- **Cons:** some duplication with stories (defaults may exist in both); one more file type per component.

**Convention:** colocate as `src/components/<Name>/<Name>.block.ts` in the consuming library, discovered via a configurable glob in the new `blocks` config section.

**Constraint that unlocks Area B:** block defs must be *serializable literals only* — single default export, literal values, imports limited to `defineBlock` (runtime) and `import type` (erased). Mechanically enforceable with TypeScript's `erasableSyntaxOnly` flag plus a small validator in c2b.

### A2 — Reuse real `*.stories.tsx` with a `parameters.block` annotation (documented, not pursued)

- **Pros:** no new files; args already exist; single source visible in Storybook.
- **Cons:** story files are the hardest artifacts to consume (they import React components, CSS, JSX decorators like `<Main><Section>`); story args are *demo* values, not necessarily good block defaults; hand-authored `argTypes` already diverge from TS types; ambiguity over which named story is canonical; compound components have no flat args at all; pollutes library stories with WP concerns.

### A3 — Plain JSON/JSON5 sidecar (`<Name>.block.json`) (documented, not pursued)

- **Pros:** `JSON.parse` — trivially zero-dep; a JSON Schema gives partial editor validation.
- **Cons:** loses type checking against component props (the single biggest DX win); enum options and defaults duplicated by hand with nothing to catch drift; comments/JSON5 would need a parser dependency anyway.

---

## 3. Decision Area B — Extraction mechanism (the zero-dep tension)

How does the compiled-JS c2b CLI read a `.block.ts` file at generation time?

### B1 — Native `import()` via Node type stripping ✅ recommended

Node ≥ 23.6 strips erasable TypeScript syntax by default (experimental from 22.6 behind a flag). Because A1's format is constrained to erasable syntax with type-only component imports, a `c2b blocks` command can simply:

```js
const def = (await import(pathToFileURL(absPath('Alert.block.ts')).href)).default;
```

Genuine evaluation, zero dependencies. The module graph is just c2b's own shipped `defineBlock` — no React, no CSS ever loads because component references are `import type` only.

- **Pros:** zero-dep convention preserved; real values, not parsed approximations; `erasableSyntaxOnly` in the consumer's tsconfig mechanically enforces the constraint.
- **Cons:** raises the Node floor *for the `blocks` command only* (fine for a dev tool in 2026; `c2b generate` keeps its current floor); needs a clear error message when someone uses non-erasable syntax (enums, namespaces) or a value import of the component.

### B2 — TS loader as optional dependency (jiti / tsx / esbuild) — the fallback

Lazily loaded only by `c2b blocks` (token generation stays zero-dep). Handles computed values and shared option arrays if the "literals only" constraint ever loosens.

- **Pros:** works on older Node; more forgiving of what block defs can contain.
- **Cons:** breaks the zero-dependency line (even as optional); loader version churn; heavy accidental imports still need guarding.

### B3 — Borrow the consumer's `typescript` for AST parsing (documented, not pursued for v1)

`typescript` is guaranteed present in the consuming project; c2b could resolve it from the consumer's `node_modules` and statically parse the constrained literal object. Could theoretically infer attribute types from the component's `.d.ts` — but props extend `React.HTMLAttributes` and the noise surface is huge. Explicitly out of scope for v1 even if this route is ever taken.

### B4 — Storybook addon/indexer (documented, not pursued)

Run extraction inside Storybook where CSF tools already exist. Only coherent with A2; couples generation to a running Storybook toolchain; awkward in CI; c2b is CLI-first.

### B5 — Hand-rolled regex/tokenizer parsing (rejected)

Fragile against strings containing braces, comments, trailing commas — a permanent maintenance tax for no upside over B1.

**Attribute type info source:** explicit in the block def. The generic is for *checking*, not inference. All `.d.ts`/react-docgen inference is deferred indefinitely.

---

## 4. Decision Area C — Generation lifecycle

Which files are regenerated every run vs scaffolded once and human-owned?

### C1 — Always regenerate everything (the tokens.css model)

Breaks the moment a human customizes `edit.tsx` or `render.php` — and they will (InspectorControls layout, render markup). Rejected as a blanket policy.

### C2 — Scaffold once, human-owned thereafter

Simple, but attribute changes in the block def stop flowing into `block.json`, defeating the purpose.

### C3 — Hybrid ✅ recommended

| File | Lifecycle | Rationale |
|---|---|---|
| `block.json` | Always regenerated | Fully derivable from the block def |
| `index.ts` (registerBlockType wiring), attribute TS types | Always regenerated | Mechanical |
| Plugin bootstrap / registration PHP | Always regenerated | Loop over the generated blocks dir |
| `edit.tsx`, `save.tsx` | Scaffolded once (skip if exists; `--force` to overwrite) | Humans refine controls/layout |
| `render.php` | Scaffolded once | Humans own markup parity |
| `style.scss` / `editor.scss` stubs | Scaffolded once | Usually just `@use '@cuweb/rds2/<Name>.scss'` |

Marker headers distinguish the two classes (`// GENERATED by c2b — do not edit` vs `// Scaffolded by c2b — yours to edit`). Later: a `c2b blocks --check` drift mode that warns when block-def attributes changed since a scaffolded file was generated (content hash in a small manifest, e.g. `.c2b-blocks.json`).

**Side effect:** this motivates a real `{{token}}` template-substitution helper. `templates/integrate.php.tpl` is currently consumed with a single ad-hoc `String.replace` in `src/generators/integrate-php.ts`; block templates (`block.json.tpl`, `edit.tsx.tpl`, `render.php.tpl`, …) deserve a proper — still tiny, still zero-dep — placeholder system.

**Possible evolution (not v1):** a split-file pattern where c2b always regenerates `edit.generated.tsx` (default controls + preview) and the scaffolded `edit.tsx` re-exports it until the human replaces the composition. Keeps regeneration useful longer, at the cost of indirection.

---

## 5. Decision Area D — PHP frontend strategies (the key unknown)

Framing: **React cannot run at PHP request time.** Every strategy below is really answering one question — *who maintains markup parity between the React component and the PHP output, and how much of that can be mechanically derived?* And the icon problem is universal: even Alert embeds an enum-selected SVG.

### D1 — Static `save()` (baseline)

Full markup serialized into `post_content`; no PHP at all. Documented in RDS2's `blocks-static.md`.

- **Pros:** simplest; markup parity checked visually in the editor; zero server work.
- **Cons:** no server data ever; any change to save output requires block deprecations or existing content invalidates.
- **Verdict:** keep as a per-block opt-in (`frontend: 'static'`), not the default.

### D2 — Scaffolded `render.php` twin (pure dynamic, `save` returns `null`)

The generator emits a `render.php` containing: attribute extraction with `?? default` fallbacks mirroring `block.json`, correct escaping per attribute type (`esc_html` / `esc_attr` / `wp_kses_post` for rich text), `get_block_wrapper_attributes(['class' => 'cu-alert cu-alert--' . $type])` with the component's BEM root, a PHP enum→modifier-class map mirroring `propClasses.ts`, and `TODO` markers where inner markup goes. A human fills in and maintains the markup.

- **Pros:** fully dynamic; nothing stale in `post_content`; server data trivially available; simplest mental model ("the PHP file *is* the frontend").
- **Cons:** markup drift between React and PHP is a standing human obligation; icons need a PHP-side answer (an `rds_icon()` disk-lookup helper, or fall back to D3).

### D3 — Hybrid `save()` + `render.php` ✅ recommended default

The pattern RDS2's own `blocks-dynamic.md` recommends. `save()` serializes *only the hard-to-replicate parts* — icon SVGs, and for container blocks `<InnerBlocks.Content />` — into `post_content`. `render.php` receives that as `$content` and wraps it with dynamic markup:

```tsx
// save.tsx — three lines; the SVG gets baked into post_content
export default function Save({ attributes }) {
	return <Icon name={attributes.iconName} size={24} />;
}
```

```php
// render.php — $content is whatever save() returned
$icon_svg = $content;
$heading  = esc_html( $attributes['heading'] ?? '' );
$wrapper  = get_block_wrapper_attributes( [ 'class' => 'cu-latest-posts' ] );
```

- **Pros:** solves icons with zero PHP icon infrastructure; PHP does only composition; pairs perfectly with InnerBlocks (inner content arrives in `$content`); **it is already the house style** — generated code matches the docs the team already wrote.
- **Cons:** stale-SVG-on-icon-update requires re-saving posts (documented gotcha with mitigations in `blocks-dynamic.md`); a small deprecation surface remains on the tiny `save()`; two artifacts to reason about.

### D4 — Build-time SSR-derived PHP templates (the ambitious option, later phase)

Pipeline: at generation time *inside the consuming project* (where React exists), render the component with `ReactDOMServer.renderToStaticMarkup` using sentinel values (`%%TITLE%%`), then transform the HTML into PHP — sentinels become `<?php echo esc_html( $attributes['title'] ); ?>`; enum props are rendered once per option to emit a PHP class/markup map (Alert's four `type` variants would bake the correct icon SVG per variant, neatly solving icons); optional booleans render both states and diff to locate conditional segments.

- **Where it shines:** tier-1 flat presentational components. Markup parity holds *by construction* — regenerate after a component update and the PHP is correct again. Alert is close to ideal.
- **Where it honestly breaks:** `children`/ReactNode props (sentinels can't represent trees), loops/lists, conditionals beyond simple presence (diff heuristics get hairy fast), context/hooks, nested RDS components with their own props. Escaping decisions still need per-attribute metadata.
- **Placement:** must run consumer-side (React required) — a `c2b blocks --ssr-templates` step or a script the plugin package owns. It never threatens c2b core's zero-dep rule.
- **Verdict:** not the foundation. A Phase-4 enhancement that *auto-fills the D2/D3 `render.php` body* for tier-1 components — always emitting into the human-editable scaffold (with `--check` drift detection), never an always-regenerated file.

### D5 — Shared templates: Twig/Timber, Mustache (documented, not pursued)

Author markup once in Twig; PHP renders via Timber (RDS2 already has `timber-twig.md` docs); the editor renders via `ServerSideRender` or a JS Twig runtime.

- **Pros:** genuinely one template for both runtimes; Timber is mature.
- **Cons:** the components are *already written in React* — Twig becomes a second source of truth anyway, the same drift problem wearing a different hat; Timber becomes a hard site dependency; editor preview fidelity suffers; Mustache's logic-less-ness fights class-map props. Only compelling if the org standardizes on Timber themes.

### D6 — Minimal server markup + vanilla-JS / Interactivity API enhancement (orthogonal)

RDS2 already ships vanilla builds (`vite.config.vanilla.ts`: videoCard, cuMotion). For behavior-heavy components (sliders, dialogs, tabs): render simple markup in PHP, enhance client-side — the WordPress Interactivity API (`viewScriptModule`, `data-wp-*` directives) is the WP-native version.

- **Verdict:** orthogonal to markup generation and irrelevant to tier-1. Becomes relevant exactly when tier-2/3 interactive components enter scope. Reserve `frontend: 'interactive'` in the block-def schema now; design later.

### D7 — PHP component-library twin (`rds2-php` helpers) (documented, later consolidation)

A package of render helpers (`rds_alert( array $args ): string`); every `render.php` becomes a one-line delegation.

- **Pros:** markup parity concentrated in ONE PHP location shared by all blocks *and* non-block PHP consumers (classic themes, Timber sites); D4's SSR output could target these helpers instead of per-block files.
- **Cons:** a new package to version and release in lockstep with rds2; drift risk doesn't disappear, it centralizes.
- **Verdict:** a natural consolidation once block count grows past ~10; premature for v1.

### Also worth knowing: `ServerSideRender` in `edit`

The editor can preview via `render.php` itself (`<ServerSideRender block="cuweb/alert" />`), eliminating editor/frontend markup duplication entirely — at the cost of editor UX (round-trips, no inline editing, no RichText). A legitimate lazy path for rarely-edited blocks; not the default.

### Strategy by tier

| Tier | Default strategy |
|---|---|
| Alert (flat + icon) | **D3 hybrid** (save = icon only) — or D2 if a PHP icon helper is adopted |
| CallOut (children, nested components) | **D3** with `save()` emitting `<InnerBlocks.Content />`; render.php wraps `$content` |
| Card (compound) | Out of scope v1; likely hand-written D2 or D1 |

**Recommendation:** D3 as the default generated pattern, D2 as the degenerate case when nothing needs serializing, a per-block `frontend` field selecting the strategy, and D4 explored later as an auto-fill for tier-1 render bodies.

---

## 6. Decision Area E — Output layout, build, styles, registration

### Where generated block files land — two candidate homes (undecided, both viable)

**E-a: Workspace package inside the RDS2 repo** (e.g. `packages/wp-blocks/`)

- **Pros:** colocated with components and block defs; version sync is `workspace:*`; one repo to develop in; c2b is already a devDep run via `npm run c2b` inside RDS2, so a `blocks` config section pointing output here is a small step.
- **Cons:** introduces a second toolchain (`@wordpress/scripts`/webpack) into a Vite library repo; note `pnpm-workspace.yaml` currently holds only settings — a `packages:` field would need to be introduced; the plugin still needs its own build/zip artifact for distribution.

**E-b: Separate plugin repo** (e.g. `rds2-blocks`)

- **Pros:** a WP plugin is the natural distribution unit and matches the `my-plugin/` scaffold already shown in RDS2's docs; clean toolchain separation; consumers install a plugin, not a package.
- **Cons:** cross-repo version sync on every rds2 release; block defs either live far from components or get duplicated; two repos to keep in step during development.

**Not a candidate for source files:** c2b's `outputDir` (`dist/wordpress/blocks/`). Scaffolded `edit.tsx`/`render.php` are *source with a human lifecycle*, not build output — only fully-derived artifacts (theme.json, integrate.php) belong in `dist/`.

### Block build

`@wordpress/scripts` (`wp-scripts build`) in the plugin package, standard `src/<block>/block.json` discovery. React and all `@wordpress/*` packages are externalized automatically (DEWP). `@cuweb/rds2` is unknown to DEWP and therefore **bundles into each block's `edit.js` — which is correct**: the editor needs the real components; the dynamic frontend ships no JS at all. Accept per-block duplication of shared rds2 code for v1; note webpack shared-chunk config as a later optimization.

### Styles — two viable wirings

1. **File-based ✅ recommended:** scaffolded `style.scss` does `@use '@cuweb/rds2/<Name>.scss'` (the `./*.scss` subpath export exists); `wp-scripts` compiles it; `block.json` gets `"style": "file:./style.css"`. The tokens dependency is satisfied because `integrate.php` already enqueues `c2b-tokens` sitewide. Per-block loading works out of the box — WP only enqueues styles for blocks present on the page.
2. **Handle-based (alternative):** register `rds2-<name>` handles in PHP with `[ 'c2b-tokens' ]` as dependency (the exact pattern sketched in c2b's `docs/wordpress/blocks.md`) and put handle names in `block.json` `style`. Stricter dependency ordering, more PHP plumbing. Document for sites that don't load tokens globally.

### Registration

Generate a plugin bootstrap (`rds2-blocks.php` + `inc/register-blocks.php`) that registers everything under `build/*/block.json` — `wp_register_block_types_from_metadata_collection()` on WP 6.8+, fallback `register_block_type()` loop otherwise.

**Do not overload `integrate.php`.** It is theme-level token/theme.json integration; blocks belong to the plugin. `integrate.php`'s `c2b-tokens` handle remains the shared contract between the two.

---

## 7. Decision Area F — Attribute mapping rules

| Prop shape | block.json attribute | Default control | Notes |
|---|---|---|---|
| `string` | `{ "type": "string" }` | `TextControl` / `TextareaControl`; in-canvas `RichText` when flagged `richText` | RichText values need `wp_kses_post()` on the PHP side, not `esc_html()` |
| `number` | `{ "type": "number" }` | `RangeControl` (def supplies min/max) or `NumberControl` | |
| `boolean` | `{ "type": "boolean" }` | `ToggleControl` | |
| union literal | `{ "type": "string" }` + `enum` | `SelectControl` / inline radio | Options declared in the block def, typed as `Props['x'][]` via the generic — invalid options are compile errors (missing options are not; an exhaustiveness helper is a later nicety) |
| `children` / `ReactNode` | per-def choice | `content: 'richtext'` (single formatted text) vs `content: 'innerblocks'` (with `allowedBlocks`/`template` in the def) vs omitted | InnerBlocks pairs with the D3 `$content` flow |
| callbacks (`onClick`, `on*`) | **excluded automatically** | — | Never serializable |
| `className`, `id`, `style`, DOM-inherited | **excluded** | — | WP supplies via `supports` (`customClassName`, `anchor`) + `get_block_wrapper_attributes()` |
| URLs / media (`href`, `src`) | `{ "type": "string" }` | `URLInput` / `MediaUpload` as control metadata | v2 concern |

- **Defaults:** declared once in the block def → emitted into `block.json`. WP applies `block.json` defaults before the render callback runs, but generated `render.php` still uses defensive `?? default` fallbacks (matching RDS2's doc style).
- **`supports` mapping:** CallOut's `maxWidth: 'aligncontent' | 'alignwide' | 'alignfull'` mirrors WP align vocabulary. Two options: (a) keep it as a plain enum attribute driving the component's own `cu-` class map — exact markup parity with React (**recommended v1**); (b) map to `supports: { align: ['wide', 'full'] }` and drop the attribute, letting WP emit `alignwide` classes — more native WP UX but diverges from component markup. The block-def schema should allow an explicit `supports` passthrough either way.
- Enum→icon maps (Alert `type` → icon name) stay inside the component; blocks never see them except under D4, where variant enumeration bakes them in.

---

## 8. Recommended stack at a glance

| Area | Recommendation |
|---|---|
| A — Definition format | `<Name>.block.ts` + `defineBlock<Props>()`, serializable-literals constraint, colocated with components |
| B — Extraction | Native `import()` via Node type stripping (`c2b blocks` subcommand); optional jiti fallback; attribute types explicit |
| C — Lifecycle | Hybrid: `block.json`/wiring/registration always regenerated; `edit.tsx`/`save.tsx`/`render.php`/scss scaffolded once with `--force` and `--check` |
| D — Frontend | Hybrid save + render.php (D3) as default; per-block `frontend` field; SSR-derived templates (D4) as later enhancement |
| E — Output & build | Home undecided (RDS2 workspace package vs separate plugin repo); `wp-scripts` build; file-based styles via `@use '@cuweb/rds2/<Name>.scss'`; generated plugin bootstrap with metadata-collection registration |
| F — Attributes | Explicit typed attribute defs; children→InnerBlocks/RichText per def; auto-exclude callbacks/DOM props; enum attrs over `supports.align` in v1 |

---

## 9. Phased roadmap (MVP = Alert through the full pipeline)

**Phase 0 — Hand-written spike (no generator code).**
Build the Alert block by hand in a scratch plugin, following `blocks-dynamic.md` exactly; run it in wp-env or WordPress Playground. This is deliberately the learn-the-PHP-side phase, and it validates D3, style wiring, and registration before any templates exist. The finished spike becomes the golden fixture the generator must reproduce.

**Phase 1 — Block def + extraction.**
`defineBlock` types in c2b; `blocks` section in `c2b.config.json` (glob, outDir, namespace); `c2b blocks` command with native-TS import; emit and schema-validate `block.json` only. Vitest fixtures compare output against the Phase-0 golden files.

**Phase 2 — Full scaffold.**
`{{token}}` template system; emit edit/save/render/scss scaffolds + plugin bootstrap; wire the chosen output home and `wp-scripts` build; Alert end-to-end in a real WordPress.

**Phase 3 — Tier 2 + lifecycle hardening.**
CallOut with InnerBlocks/RichText; `--force`, `--check` drift detection, manifest hashing. A second block proves the templates generalize.

**Phase 4 — Explorations.**
D4 SSR-derived render bodies for tier-1; `supports.align` mapping; Interactivity API strategy for behavioral components; evaluate the `rds2-php` helper package once block count justifies it.

---

## 10. Open questions for the next deep-dives

1. **Node version floor** for `c2b blocks` (native type stripping) vs shipping the jiti fallback from day one.
2. **One plugin containing all blocks vs per-block plugins** — per-block favors selective site installs; one plugin is far simpler (leaning one plugin).
3. **Deprecation policy** when a scaffolded `save()` changes — even tiny hybrid saves serialize markup.
4. **Editor preview fidelity** — stories wrap in `<Main><Section>` decorators; should generated `edit.tsx` replicate any wrapper, and does the editor iframe need `editorStyle` beyond the component CSS?
5. **Sass resolution** of `@use '@cuweb/rds2/Alert.scss'` under `wp-scripts` (node_modules loadPaths / package-exports support in its sass-loader config) — verify during Phase 0.
6. **i18n** — should generated `block.json` titles/descriptions flow through `textdomain` + `__()` scaffolding from the start?
7. **Instant testing** — should c2b also emit a Playground blueprint / wp-env config so a generated block can be smoke-tested in one command?
8. **Icon staleness policy** — re-save posts vs a PHP disk-lookup helper; an org-level decision since it affects every hybrid block.
