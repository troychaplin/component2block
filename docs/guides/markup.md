# Markup Patterns

Reference examples for layout markup that works in both Storybook and WordPress. These patterns use the same CSS classes WordPress generates for its block layout system, so the markup is portable across both platforms.

## Layout Classes

### Section Classes

| Class | Role |
|-------|------|
| `alignfull` | Breaks out of parent padding for full-width backgrounds |
| `has-global-padding` | Applies root left/right padding so children never touch the viewport edge |
| `is-layout-constrained` | Constrains children to `contentSize` by default + adds block gap between them |

### Child Alignment Classes

Children inside `is-layout-constrained` are automatically constrained to `contentSize` and centered. You only add a class to override the default:

| Class | Role |
|-------|------|
| *(none)* | Default — constrained to `contentSize` (e.g. 768px) |
| `alignwide` | Overrides to `wideSize` (e.g. 1280px) |
| `alignfull` | Breaks out of the Section's padding entirely |

## Page Structure

`<main>` is the page wrapper. It doesn't use layout classes. Sections inside it own the padding and backgrounds, and their children are automatically constrained.

```html
<main>

  <section class="mylib-section alignfull has-global-padding is-layout-constrained">
    <!-- children automatically constrained to contentSize -->
  </section>

  <section class="mylib-section alignfull has-global-padding is-layout-constrained">
    <!-- children automatically constrained to contentSize -->
  </section>

</main>
```

## Content Width Section

The most common pattern. All children are automatically constrained to `contentSize` for readable prose. No classes needed on the children.

```html
<section class="mylib-section alignfull has-global-padding is-layout-constrained">
  <h2>Our Story</h2>
  <p>First paragraph of readable prose at contentSize width.</p>
  <p>Second paragraph. Block gap provides vertical spacing above.</p>
</section>
```

- Section goes edge-to-edge (background color fills the viewport)
- Root padding keeps children off the viewport edges
- Block gap spaces out each direct child vertically
- Each child is automatically centered at `contentSize`

## Wide Content Within a Section

Add `alignwide` to children that need more room. Everything else stays at the default `contentSize`.

```html
<section class="mylib-section alignfull has-global-padding is-layout-constrained">
  <h2>Our Team</h2>
  <div class="alignwide card-grid">
    <div class="card">...</div>
    <div class="card">...</div>
    <div class="card">...</div>
  </div>
</section>
```

- The heading stays at `contentSize` for readability (no class needed)
- The card grid expands to `wideSize` via `alignwide`
- Both are direct children of the same Section, spaced by block gap

## Full Width Content Within a Section

Add `alignfull` to children that should break out of the Section's padding entirely.

```html
<section class="mylib-section alignfull has-global-padding is-layout-constrained">
  <img class="alignfull" src="hero.jpg" alt="Hero" />
  <h2>Hero headline below the image</h2>
</section>
```

- The image breaks past the root padding to the viewport edges
- The heading below it is automatically constrained to `contentSize`
- Block gap spaces the heading below the image

## Mixed Widths in One Section

Different children can use different alignments within the same Section. Width is a per-child decision, not a per-section decision.

```html
<section class="mylib-section mylib-section--dark alignfull has-global-padding is-layout-constrained">
  <h2>Featured Work</h2>
  <p>A short intro paragraph at readable width.</p>
  <div class="alignwide card-grid">
    <div class="card">...</div>
    <div class="card">...</div>
    <div class="card">...</div>
  </div>
  <a href="/work">View all projects</a>
</section>
```

- Heading, paragraph, and link are at `contentSize` (no class needed)
- Card grid is at `wideSize` via `alignwide`
- All share the same Section background and root padding
- Block gap provides consistent vertical rhythm throughout

## Full Page Example

Sections stacked in a page, each with its own background and mixed child widths.

```html
<main>

  <section class="mylib-section mylib-section--hero alignfull has-global-padding is-layout-constrained">
    <h1>Page Title</h1>
    <p>Introductory text at readable width.</p>
  </section>

  <section class="mylib-section alignfull has-global-padding is-layout-constrained">
    <h2>About Us</h2>
    <p>Prose content constrained for readability.</p>
    <p>Another paragraph, same width.</p>
  </section>

  <section class="mylib-section mylib-section--dark alignfull has-global-padding is-layout-constrained">
    <h2>Our Team</h2>
    <div class="alignwide card-grid">
      <div class="card">...</div>
      <div class="card">...</div>
      <div class="card">...</div>
    </div>
  </section>

  <section class="mylib-section alignfull has-global-padding is-layout-constrained">
    <img class="alignfull" src="banner.jpg" alt="Banner" />
    <h2>Final Section</h2>
    <p>Closing content at readable width.</p>
  </section>

</main>
```

## How Layout Constraints Work

The `is-layout-constrained` class constrains all direct children to `contentSize` by default. The `alignwide` class overrides to `wideSize`. These rules mirror WordPress exactly:

```scss
.is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)) {
  max-width: var(--prefix--layout-content-size);
  margin-left: auto !important;
  margin-right: auto !important;
}

.is-layout-constrained > .alignwide {
  max-width: var(--prefix--layout-wide-size);
  margin-left: auto !important;
  margin-right: auto !important;
}
```

The constraint values come from the `layout` tokens in your config:

```json
{
  "tokens": {
    "layout": {
      "contentSize": "768px",
      "wideSize": "1280px"
    }
  }
}
```

## How Block Gap Works

The `is-layout-constrained` class also triggers the block gap rule:

```scss
:where(.is-layout-constrained) > * + * {
  margin-block-start: var(--prefix--root-block-gap);
}
```

This is an adjacent sibling selector — every direct child after the first gets vertical spacing. The first child gets no top margin.

The block gap value comes from `baseStyles.spacing.blockGap` in your config:

```json
{
  "baseStyles": {
    "spacing": {
      "blockGap": "medium"
    }
  }
}
```

## How Root Padding Works

The `has-global-padding` class applies the root padding values:

```scss
.has-global-padding {
  padding-right: var(--prefix--root-padding-right);
  padding-left: var(--prefix--root-padding-left);
}
```

The `alignfull` class on the Section uses negative margins to break out of a parent's padding, and when the Section also has `has-global-padding`, it re-applies padding for its own children:

```scss
.has-global-padding > .alignfull {
  max-width: none;
  margin-right: calc(var(--prefix--root-padding-right) * -1);
  margin-left: calc(var(--prefix--root-padding-left) * -1);
}

.has-global-padding > .alignfull > .has-global-padding {
  padding-right: var(--prefix--root-padding-right);
  padding-left: var(--prefix--root-padding-left);
}
```

The padding values come from `baseStyles.spacing.padding` in your config:

```json
{
  "baseStyles": {
    "spacing": {
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

## WordPress Equivalence

These patterns use the same classes WordPress applies to its block markup:

| This markup | WordPress equivalent |
|-------------|---------------------|
| `alignfull` on Section | Block set to "Full Width" alignment |
| `has-global-padding` on Section | Container block with root padding enabled |
| `is-layout-constrained` on Section | Group block with constrained layout |
| No class on child | Block at default alignment (`contentSize`) |
| `alignwide` on child | Block set to "Wide" alignment (`wideSize`) |
| `alignfull` on child | Block set to "Full Width" alignment within a padded container |
