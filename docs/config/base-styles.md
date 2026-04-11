# Base Styles

This guide covers the `baseStyles` section of `c2b.config.json`. Base styles define root-level typography, colors, spacing, and element defaults that are generated as both SCSS (for Storybook) and theme.json styles (for WordPress).

## Overview

The `baseStyles` section sits at the top level of the config alongside `prefix`, `output`, and `tokens`. It references tokens by key — the generator resolves them to the correct CSS variable format for each output target.

```json
{
  "prefix": "mylib",

  "output": { "...": "..." },

  "tokens": {
    "color": { "...": "..." },
    "fontFamily": { "...": "..." },
    "spacing": { "...": "..." }
  },

  "baseStyles": {
    "body": {
      "fontFamily": "inter",
      "fontSize": "medium",
      "fontWeight": "normal",
      "lineHeight": "normal",
      "color": "black",
      "background": "grey-faint"
    },
    "heading": {
      "fontFamily": "inter",
      "color": "primary"
    },
    "h1": { "fontSize": "5x-large", "fontWeight": "medium" },
    "h2": { "fontSize": "4x-large", "fontWeight": "medium" },
    "h3": { "fontSize": "3x-large", "fontWeight": "medium" },
    "h4": { "fontSize": "2x-large", "fontWeight": "medium" },
    "h5": { "fontSize": "x-large", "fontWeight": "medium" },
    "h6": { "fontSize": "large", "fontWeight": "medium", "fontStyle": "italic" },
    "caption": { "fontSize": "small", "fontStyle": "italic", "fontWeight": "light", "color": "warning" },
    "button": { "color": "white", "background": "primary" },
    "link": { "color": "primary", "hoverColor": "error" },
    "spacing": {
      "blockGap": "medium",
      "padding": {
        "top": "0",
        "right": "large",
        "bottom": "0",
        "left": "large"
      }
    }
  }
}
```

Every string in `baseStyles` is classified at config load time as either a **token reference** (matches a key in the property's expected category), a **raw CSS value** (numeric, hex, function, multi-value, quoted, or a known CSS keyword for the property), or **invalid** (typo or dangling reference — throws a clear error before any files are written). See [Strict Validation](#strict-validation) below for details.

---

## Elements

### body

Sets the root-level typography and color for the page. Maps to `styles.typography` and `styles.color` in theme.json.

```json
{
  "body": {
    "fontFamily": "inter",
    "fontSize": "medium",
    "fontWeight": "normal",
    "lineHeight": "normal",
    "color": "black",
    "background": "grey-faint"
  }
}
```

**SCSS output:**

```scss
body {
  font-family: var(--mylib--font-family-inter);
  font-size: var(--mylib--font-size-medium);
  font-weight: var(--mylib--font-weight-normal);
  line-height: var(--mylib--line-height-normal);
  color: var(--mylib--color-black);
  background-color: var(--mylib--color-grey-faint);
}
```

**theme.json output:**

```json
{
  "styles": {
    "typography": {
      "fontFamily": "var(--wp--preset--font-family--inter)",
      "fontSize": "var(--wp--preset--font-size--medium)",
      "fontWeight": "400",
      "lineHeight": "1.6"
    },
    "color": {
      "text": "var(--wp--preset--color--black)",
      "background": "var(--wp--preset--color--grey-faint)"
    }
  }
}
```

> **Note:** `fontWeight` and `lineHeight` belong to custom-only categories that don't produce `--wp--preset--*` variables. In theme.json `styles`, the generator emits the token's **underlying value** (e.g. `"400"`, `"1.6"`) so WordPress receives valid CSS. In SCSS, the same token resolves to a `var(--mylib--font-weight-normal)` reference.

### heading

Applies shared styles to all heading levels (h1–h6). In SCSS, this generates a `:where(h1, h2, h3, h4, h5, h6)` rule. In theme.json, it maps to `styles.elements.heading`.

```json
{
  "heading": {
    "fontFamily": "inter",
    "color": "primary"
  }
}
```

**SCSS output:**

```scss
:where(h1, h2, h3, h4, h5, h6) {
  font-family: var(--mylib--font-family-inter);
  color: var(--mylib--color-primary);
}
```

### h1–h6

Individual heading levels override or extend the shared `heading` styles. Each generates a `:where(hN)` rule in SCSS and an `styles.elements.hN` entry in theme.json.

You can reference size tokens (recommended — so headings participate in your fluid type scale) or use raw values:

```json
{
  "h1": { "fontSize": "5x-large", "fontWeight": "medium" },
  "h2": { "fontSize": "4x-large", "fontWeight": "medium" },
  "h6": { "fontSize": "large", "fontWeight": "medium", "fontStyle": "italic" }
}
```

**SCSS output:**

```scss
:where(h1) {
  font-size: var(--mylib--font-size-5x-large);
  font-style: normal;
  font-weight: var(--mylib--font-weight-medium);
}

:where(h6) {
  font-size: var(--mylib--font-size-large);
  font-style: italic;
  font-weight: var(--mylib--font-weight-medium);
}
```

> **Note:** Individual headings (h1–h6) automatically default to `fontStyle: normal` when no `fontStyle` is specified. This prevents headings from inheriting an italic style from the shared `heading` element or the browser's defaults. To make a heading italic, set `"fontStyle": "italic"` explicitly (as shown with h6 above).
>
> The `fontStyle: "normal"` default correctly emits a bare CSS keyword in the generated SCSS. Strict per-property resolution means it cannot accidentally cross-resolve to a `fontWeight.normal` token even when one exists.

**Tip — keep heading sizes out of the Gutenberg size picker.** If your heading sizes are meant for typography base styles only and shouldn't appear in the block editor's font-size dropdown, mark them `cssOnly: true` in `tokens.fontSize`. They still get emitted as CSS variables and can still be referenced from `baseStyles`, but they won't clutter the picker with "display" sizes content authors don't need.

### caption

Styles `<figcaption>` elements. Generates a `:where(figcaption)` rule in SCSS and `styles.elements.caption` in theme.json.

```json
{
  "caption": {
    "fontSize": "small",
    "fontStyle": "italic",
    "fontWeight": "light",
    "color": "warning"
  }
}
```

**SCSS output:**

```scss
:where(figcaption) {
  font-size: var(--mylib--font-size-small);
  font-style: italic;
  font-weight: var(--mylib--font-weight-light);
  color: var(--mylib--color-warning);
}
```

### button

Styles `<button>` elements. Generates a `:where(button)` rule in SCSS and `styles.elements.button` in theme.json.

```json
{
  "button": {
    "color": "white",
    "background": "primary"
  }
}
```

**SCSS output:**

```scss
:where(button) {
  color: var(--mylib--color-white);
  background-color: var(--mylib--color-primary);
}
```

### link

Styles `<a>` elements. The `hoverColor` property generates a separate `:where(a:hover)` rule in SCSS and a `:hover` pseudo-class in theme.json.

```json
{
  "link": {
    "color": "primary",
    "hoverColor": "error"
  }
}
```

**SCSS output:**

```scss
:where(a) {
  color: var(--mylib--color-primary);
}

:where(a:hover) {
  color: var(--mylib--color-error);
}
```

**theme.json output:**

```json
{
  "styles": {
    "elements": {
      "link": {
        "color": { "text": "var(--wp--preset--color--primary)" },
        ":hover": {
          "color": { "text": "var(--wp--preset--color--error)" }
        }
      }
    }
  }
}
```

> **Note:** `hoverColor` is exclusive to the `link` element. It's the only element that supports a hover pseudo-class.

---

## Spacing

The `spacing` key within `baseStyles` controls root-level block gap and page padding. It's separate from the `spacing` token category — tokens define the scale, while `baseStyles.spacing` applies those tokens to the page layout.

```json
{
  "baseStyles": {
    "spacing": {
      "blockGap": "medium",
      "padding": {
        "top": "0",
        "right": "large",
        "bottom": "0",
        "left": "large"
      }
    }
  }
}
```

### blockGap

Controls the default vertical spacing between WordPress blocks. Generates a CSS custom property and layout utility rules:

**SCSS output:**

```scss
body {
  --mylib--root-block-gap: var(--mylib--spacing-medium);
}

:where(.is-layout-constrained) > * + * {
  margin-block-start: var(--mylib--root-block-gap);
}

:where(.is-layout-flex) {
  gap: var(--mylib--root-block-gap);
}

:where(.is-layout-grid) {
  gap: var(--mylib--root-block-gap);
}
```

The layout utility rules mirror WordPress's block gap behavior:

- **`.is-layout-constrained`** — Flow layout: applies `margin-block-start` between consecutive children
- **`.is-layout-flex`** — Flex layout: applies `gap` on the container
- **`.is-layout-grid`** — Grid layout: applies `gap` on the container

**theme.json output:**

```json
{
  "styles": {
    "spacing": {
      "blockGap": "var(--wp--preset--spacing--50)"
    }
  }
}
```

### padding

Controls root-level page padding. Only defined sides are output. Generates root padding CSS custom properties and WordPress-compatible global padding utility classes:

**SCSS output:**

```scss
body {
  --mylib--root-padding-top: 0;
  --mylib--root-padding-right: var(--mylib--spacing-large);
  --mylib--root-padding-bottom: 0;
  --mylib--root-padding-left: var(--mylib--spacing-large);
}

.has-global-padding {
  padding-right: var(--mylib--root-padding-right);
  padding-left: var(--mylib--root-padding-left);
}

.has-global-padding > .alignfull {
  max-width: none;
  margin-right: calc(var(--mylib--root-padding-right) * -1);
  margin-left: calc(var(--mylib--root-padding-left) * -1);
}

.has-global-padding > .alignfull > .has-global-padding {
  padding-right: var(--mylib--root-padding-right);
  padding-left: var(--mylib--root-padding-left);
}
```

The `.has-global-padding` and `.alignfull` rules mirror WordPress's root padding-aware alignment system. Full-width blocks break out of the content padding, while nested content within them retains it.

**theme.json output:**

```json
{
  "styles": {
    "spacing": {
      "padding": {
        "top": "0",
        "right": "var(--wp--preset--spacing--60)",
        "bottom": "0",
        "left": "var(--wp--preset--spacing--60)"
      }
    }
  }
}
```

See [Spacing](./spacing.md) for the full spacing token configuration reference.

---

## Element Properties

All elements support the following properties. Values are classified strictly per property: they either resolve to a token in the property's expected category, pass through as a raw CSS value, or fail validation.

### Typography Properties

| Property | Expected token category | CSS keyword fallbacks |
|----------|------------------------|----------------------|
| `fontFamily` | `fontFamily` | `serif`, `sans-serif`, `monospace`, `cursive`, `fantasy`, `system-ui`, `ui-serif`, `ui-sans-serif`, `ui-monospace`, `inherit`, `initial`, `unset` |
| `fontSize` | `fontSize` | — (use tokens or raw values) |
| `fontWeight` | `fontWeight` | `normal`, `bold`, `lighter`, `bolder`, `inherit`, `initial`, `unset` |
| `lineHeight` | `lineHeight` | `normal`, `inherit`, `initial`, `unset` |
| `fontStyle` | — (no category) | `normal`, `italic`, `oblique`, `inherit`, `initial`, `unset` |

### Color Properties

| Property | Expected token category | CSS keyword fallbacks |
|----------|------------------------|----------------------|
| `color` | `color` | `inherit`, `transparent`, `currentColor`, `initial`, `unset` |
| `background` | `color` | `inherit`, `transparent`, `currentColor`, `initial`, `unset` |
| `hoverColor` | `color` (link only) | `inherit`, `transparent`, `currentColor`, `initial`, `unset` |

### Spacing Properties

| Property | Expected token category | CSS keyword fallbacks |
|----------|------------------------|----------------------|
| `spacing.padding.{top,right,bottom,left}` | `spacing` | — |
| `spacing.blockGap` | `spacing` | — |

### Value Resolution

Each string in `baseStyles` goes through one classification step, in this order:

1. **Token lookup in the property's category.** If the value is a key in the expected category (e.g. `fontSize: "medium"` and `tokens.fontSize.medium` exists), it resolves to a CSS variable. Lookup is strict — there is no cross-category fallback, so `fontSize: "large"` will not match a `spacing.large` token.
2. **Raw CSS detection.** If the value starts with a digit/dot/minus, starts with `#`, contains a function call (`(`), contains whitespace or a comma, or is quoted, it passes through as-is.
3. **CSS keyword whitelist.** If the value matches a known CSS keyword for the property (see the tables above), it passes through as-is. A token with the same key always wins over the keyword.
4. **Invalid.** Anything else is a typo or a stale token reference. See [Strict Validation](#strict-validation).

Examples assuming `tokens.fontFamily.inter`, `tokens.fontSize.medium`, `tokens.color.primary`, `tokens.fontWeight.medium`, and `tokens.lineHeight.normal` all exist:

| Config value | For property | Classification | SCSS output | theme.json output |
|--------------|--------------|---------------|-------------|-------------------|
| `"inter"` | `fontFamily` | token | `var(--mylib--font-family-inter)` | `var(--wp--preset--font-family--inter)` |
| `"medium"` | `fontSize` | token | `var(--mylib--font-size-medium)` | `var(--wp--preset--font-size--medium)` |
| `"primary"` | `color` | token | `var(--mylib--color-primary)` | `var(--wp--preset--color--primary)` |
| `"medium"` | `fontWeight` | token (custom-only category) | `var(--mylib--font-weight-medium)` | underlying value (e.g. `"500"`) |
| `"normal"` | `lineHeight` | token (custom-only category) | `var(--mylib--line-height-normal)` | underlying value (e.g. `"1.6"`) |
| `"italic"` | `fontStyle` | raw (CSS keyword) | `italic` | `"italic"` |
| `"normal"` | `fontStyle` | raw (CSS keyword) | `normal` | `"normal"` |
| `"sans-serif"` | `fontFamily` | raw (CSS keyword) | `sans-serif` | `"sans-serif"` |
| `"4.5rem"` | `fontSize` | raw (numeric) | `4.5rem` | `"4.5rem"` |
| `"500"` | `fontWeight` | raw (numeric) | `500` | `"500"` |
| `"1.6"` | `lineHeight` | raw (numeric) | `1.6` | `"1.6"` |
| `"#191919"` | `color` | raw (hex) | `#191919` | `"#191919"` |
| `"var(--accent)"` | `color` | raw (function) | `var(--accent)` | `"var(--accent)"` |

> **Why custom-only tokens resolve to their underlying value in theme.json:** categories like `fontWeight`, `lineHeight`, and `radius` do not have `--wp--preset--*` mappings. Emitting a semantic slug like `"medium"` into theme.json `styles` would give WordPress invalid CSS (`font-weight: medium`). The generator looks up the token and emits its raw value instead (e.g. `"500"`), so WordPress receives valid CSS while SCSS consumers still get a themeable variable reference.
>
> **Why `cssOnly` tokens resolve to their underlying value in theme.json:** `cssOnly` preset tokens are excluded from `settings.*.*` in theme.json, which means the corresponding `--wp--preset--*` variable will not exist in WordPress. The generator falls back to the raw value so the resulting CSS still works. SCSS output is unaffected — it still emits `var(--prefix--{segment}-{key})` because `tokens.css` defines that variable.

---

## Strict Validation

`baseStyles` values are validated at config load time, before any files are written. Every string is classified using the rules above. Any value that doesn't fall into **token**, **raw**, or **CSS keyword** throws an error with full context:

```
Config error: baseStyles.body.color = "text-black" is not a valid token or CSS keyword for "color".
  Expected a token key from tokens.color (available: primary, primary-dark, black, grey-dark, grey, grey-light, grey-faint, white).
  Or use one of these CSS keywords: inherit, transparent, currentColor, initial, unset.
  Or provide a raw CSS value (numeric, hex, rgb(), var(), calc(), multi-value, or quoted string).
```

Common cases strict validation catches:

- **Stale references.** You remove `tokens.color.text-black` but forget to update `baseStyles.body.color`. Previously the value would pass through as a literal (`color: text-black`) and silently break the page. Strict validation fails the build instead.
- **Cross-category typos.** You type `fontSize: "large"` intending a font size token, but `fontSize.large` doesn't exist and `spacing.large` does. Lenient resolution would pick the spacing token (wrong segment, wrong value). Strict per-property lookup refuses to cross-resolve and reports the miss.
- **Unknown CSS keywords.** You type `color: "blak"` instead of `"black"` or `"inherit"`. It's not a token, not raw-looking, not a whitelisted keyword — so it errors.

Valid configurations continue to work unchanged. The validation is additive: it only rejects values that were previously producing silently wrong output.

---

## Element Availability

Not all properties are meaningful on every element, but the generator doesn't restrict combinations. Here's a guide to typical usage:

| Element | Typography | Color | Background | Hover |
|---------|------------|-------|------------|-------|
| `body` | Yes | Yes | Yes | — |
| `heading` | Yes | Yes | Yes | — |
| `h1`–`h6` | Yes | Yes | Yes | — |
| `caption` | Yes | Yes | Yes | — |
| `button` | Yes | Yes | Yes | — |
| `link` | Yes | Yes | Yes | `hoverColor` |

---

## CSS Selectors

The SCSS generator uses `:where()` selectors for all elements except `body`. This keeps specificity at zero, making it easy to override base styles in component CSS without needing extra specificity.

| Element | SCSS Selector |
|---------|---------------|
| `body` | `body { }` |
| `heading` | `:where(h1, h2, h3, h4, h5, h6) { }` |
| `h1`–`h6` | `:where(h1) { }` ... `:where(h6) { }` |
| `caption` | `:where(figcaption) { }` |
| `button` | `:where(button) { }` |
| `link` | `:where(a) { }` and `:where(a:hover) { }` |

### Why `:where()` Matters

`:where()` gives selectors zero specificity. This means component BEM classes always win without ordering tricks:

| Selector | Specificity |
|----------|-------------|
| `:where(h2)` | `0,0,0` |
| `.mylib-card__title` | `0,1,0` |

A heading inside a Card component gets the Card's styles, not the base typography. A bare heading outside any component gets the base styles.

---

## Generated Files

### base-styles.scss

All base styles are written to `base-styles.scss` in the `output.tokensPath` directory. This file is auto-generated and should not be edited manually.

### Two-Layer Content Approach

Content styles are split into two files:

**Generated** — `base-styles.scss` contains config-driven element typography. Regenerated every time you run the generator.

**Authored** — `content.scss` is a file you own. It imports the generated file and adds behavioral rules that don't belong in a config:

```scss
// content.scss — you own this file
@use 'base-styles';

:where(p, ul, ol, blockquote, pre, figure, table) {
  margin-block: 0 1em;
}

:where(ul) {
  list-style: disc;
  padding-inline-start: 1.5em;
}

:where(ol) {
  list-style: decimal;
  padding-inline-start: 1.5em;
}
```

The generator only writes `base-styles.scss`. Your `content.scss` is never touched.

The Storybook preset auto-injects `content.scss` when it exists. See [Storybook Preset](../guides/storybook-preset.md) for details.

### theme.json

Base styles map to `styles.typography`, `styles.color`, `styles.spacing`, and `styles.elements` in theme.json. WordPress applies these as global styles in the Site Editor.

---

## Usage in Storybook

### Global Padding and Alignfull

Apply `.has-global-padding` to content containers and `.alignfull` to children that should break out:

```tsx
<div className="has-global-padding">
  <h1>Page Title</h1>
  <p>Content with root padding.</p>
  <div className="alignfull">
    <img src="hero.jpg" alt="Full-width hero" />
  </div>
  <p>Back to padded content.</p>
</div>
```

### Layout Classes

Layout components apply WordPress layout classes so spacing works in both Storybook and WordPress:

```tsx
<section className="mylib-section is-layout-constrained">
  {children}
</section>

<div className="mylib-grid is-layout-grid">
  {children}
</div>
```

Block gap is a container-level concern — individual components (Card, Button, etc.) don't use it.

---

## Components Stay Self-Contained

Components never rely on base styles. Every component owns its own typography:

```scss
.mylib-card {
  &__title {
    font-size: var(--mylib--font-size-x-large);
    font-weight: 700;
    line-height: 1.5;
  }

  &__content {
    font-size: var(--mylib--font-size-medium);
    line-height: 1.5;
  }
}
```

A Card works identically whether it's inside prose content or not. Base styles are for bare elements in content areas — components don't need them.

---

## Full Example

Here's a complete `baseStyles` section with all supported elements, assuming matching tokens exist for every reference:

```json
{
  "baseStyles": {
    "body": {
      "fontFamily": "inter",
      "fontSize": "medium",
      "fontWeight": "normal",
      "lineHeight": "normal",
      "color": "black",
      "background": "grey-faint"
    },
    "heading": {
      "fontFamily": "inter",
      "color": "primary"
    },
    "h1": { "fontSize": "5x-large", "fontWeight": "medium" },
    "h2": { "fontSize": "4x-large", "fontWeight": "medium" },
    "h3": { "fontSize": "3x-large", "fontWeight": "medium" },
    "h4": { "fontSize": "2x-large", "fontWeight": "medium" },
    "h5": { "fontSize": "x-large", "fontWeight": "medium" },
    "h6": { "fontSize": "large", "fontWeight": "medium", "fontStyle": "italic" },
    "caption": {
      "fontSize": "small",
      "fontStyle": "italic",
      "fontWeight": "light",
      "color": "warning"
    },
    "button": {
      "color": "white",
      "background": "primary"
    },
    "link": {
      "color": "primary",
      "hoverColor": "error"
    },
    "spacing": {
      "blockGap": "medium",
      "padding": {
        "top": "0",
        "right": "large",
        "bottom": "0",
        "left": "large"
      }
    }
  }
}
```

This config requires the following tokens to exist (typical for a full design system):

- `tokens.color`: `primary`, `black`, `grey-faint`, `white`, `warning`, `error`
- `tokens.fontFamily`: `inter`
- `tokens.fontSize`: `small`, `medium`, `large`, `x-large`, `2x-large`, `3x-large`, `4x-large`, `5x-large` (the larger sizes are typically `cssOnly: true` so they stay out of the Gutenberg size picker)
- `tokens.fontWeight`: `light`, `normal`, `medium`
- `tokens.lineHeight`: `normal`
- `tokens.spacing`: `medium`, `large`

If any of these are missing, `c2b generate` will fail with a clear error pointing at the first offending reference.
