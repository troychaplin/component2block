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
      "fontWeight": "400",
      "lineHeight": "1.6",
      "color": "text-black",
      "background": "off-white"
    },
    "heading": {
      "fontFamily": "inter",
      "color": "primary"
    },
    "h1": { "fontSize": "4.5rem", "fontWeight": "500" },
    "h2": { "fontSize": "3rem", "fontWeight": "500" },
    "h3": { "fontSize": "2.5rem", "fontWeight": "500" },
    "h4": { "fontSize": "2rem", "fontWeight": "500" },
    "h5": { "fontSize": "1.5rem", "fontWeight": "500" },
    "h6": { "fontSize": "1.45rem", "fontWeight": "500", "fontStyle": "italic" },
    "caption": { "fontSize": "small", "fontStyle": "italic", "fontWeight": "300", "color": "warning" },
    "button": { "color": "off-white", "background": "primary" },
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

---

## Elements

### body

Sets the root-level typography and color for the page. Maps to `styles.typography` and `styles.color` in theme.json.

```json
{
  "body": {
    "fontFamily": "inter",
    "fontSize": "medium",
    "fontWeight": "400",
    "lineHeight": "1.6",
    "color": "text-black",
    "background": "off-white"
  }
}
```

**SCSS output:**

```scss
body {
  font-family: var(--mylib--font-family-inter);
  font-size: var(--mylib--font-size-medium);
  font-weight: 400;
  line-height: 1.6;
  color: var(--mylib--color-text-black);
  background-color: var(--mylib--color-off-white);
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
      "text": "var(--wp--preset--color--text-black)",
      "background": "var(--wp--preset--color--off-white)"
    }
  }
}
```

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

```json
{
  "h1": { "fontSize": "4.5rem", "fontWeight": "500" },
  "h2": { "fontSize": "3rem", "fontWeight": "500" },
  "h6": { "fontSize": "1.45rem", "fontWeight": "500", "fontStyle": "italic" }
}
```

**SCSS output:**

```scss
:where(h1) {
  font-size: 4.5rem;
  font-style: normal;
  font-weight: 500;
}

:where(h6) {
  font-size: 1.45rem;
  font-style: italic;
  font-weight: 500;
}
```

> **Note:** Individual headings (h1–h6) automatically default to `fontStyle: normal` when no `fontStyle` is specified. This prevents headings from inheriting an italic style from the shared `heading` element or the browser's defaults. To make a heading italic, set `"fontStyle": "italic"` explicitly (as shown with h6 above).

### caption

Styles `<figcaption>` elements. Generates a `:where(figcaption)` rule in SCSS and `styles.elements.caption` in theme.json.

```json
{
  "caption": {
    "fontSize": "small",
    "fontStyle": "italic",
    "fontWeight": "300",
    "color": "warning"
  }
}
```

**SCSS output:**

```scss
:where(figcaption) {
  font-size: var(--mylib--font-size-small);
  font-style: italic;
  font-weight: 300;
  color: var(--mylib--color-warning);
}
```

### button

Styles `<button>` elements. Generates a `:where(button)` rule in SCSS and `styles.elements.button` in theme.json.

```json
{
  "button": {
    "color": "off-white",
    "background": "primary"
  }
}
```

**SCSS output:**

```scss
:where(button) {
  color: var(--mylib--color-off-white);
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

All elements support the following properties. Values can be token keys (resolved to CSS variables) or raw CSS values (passed through as-is).

### Typography Properties

| Property | Description | Token resolution |
|----------|-------------|-----------------|
| `fontFamily` | Font family | Resolves key from `fontFamily` tokens |
| `fontSize` | Font size | Resolves key from `fontSize` tokens |
| `fontWeight` | Font weight | Passes through as raw value |
| `lineHeight` | Line height | Passes through as raw value |
| `fontStyle` | Font style (`normal`, `italic`) | Passes through as raw value |

### Color Properties

| Property | Description | Token resolution |
|----------|-------------|-----------------|
| `color` | Text color | Resolves key from `color` tokens |
| `background` | Background color | Resolves key from `color` tokens |
| `hoverColor` | Hover text color (link only) | Resolves key from `color` tokens |

### Token Key vs Raw Value

When a property value matches a token key, it resolves to a CSS variable. Otherwise, it passes through as a raw CSS value:

| Config value | Type | SCSS output | theme.json output |
|--------------|------|-------------|-------------------|
| `"inter"` | Token key | `var(--mylib--font-family-inter)` | `var(--wp--preset--font-family--inter)` |
| `"medium"` | Token key | `var(--mylib--font-size-medium)` | `var(--wp--preset--font-size--medium)` |
| `"primary"` | Token key | `var(--mylib--color-primary)` | `var(--wp--preset--color--primary)` |
| `"4.5rem"` | Raw value | `4.5rem` | `4.5rem` |
| `"500"` | Raw value | `500` | `500` |
| `"1.6"` | Raw value | `1.6` | `1.6` |

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

### _content-generated.scss

All base styles are written to `_content-generated.scss` in the `output.tokensPath` directory. This file is auto-generated and should not be edited manually.

### Two-Layer Content Approach

Content styles are split into two files:

**Generated** — `_content-generated.scss` contains config-driven element typography. Regenerated every time you run the generator.

**Authored** — `content.scss` is a file you own. It imports the generated partial and adds behavioral rules that don't belong in a config:

```scss
// content.scss — you own this file
@use 'content-generated';

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

The generator only writes `_content-generated.scss`. Your `content.scss` is never touched.

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

Here's a complete `baseStyles` section with all supported elements:

```json
{
  "baseStyles": {
    "body": {
      "fontFamily": "inter",
      "fontSize": "medium",
      "fontWeight": "400",
      "lineHeight": "1.6",
      "color": "text-black",
      "background": "off-white"
    },
    "heading": {
      "fontFamily": "inter",
      "color": "primary"
    },
    "h1": { "fontSize": "4.5rem", "fontWeight": "500" },
    "h2": { "fontSize": "3rem", "fontWeight": "500" },
    "h3": { "fontSize": "2.5rem", "fontWeight": "500" },
    "h4": { "fontSize": "2rem", "fontWeight": "500" },
    "h5": { "fontSize": "1.5rem", "fontWeight": "500" },
    "h6": { "fontSize": "1.45rem", "fontWeight": "500", "fontStyle": "italic" },
    "caption": {
      "fontSize": "small",
      "fontStyle": "italic",
      "fontWeight": "300",
      "color": "warning"
    },
    "button": {
      "color": "off-white",
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
