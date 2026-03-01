# Markup Patterns

Reference examples for layout markup that works in both Storybook and WordPress. These patterns use the same CSS classes WordPress generates for its block layout system, so the markup is portable across both platforms.

## Layout Classes

| Class | Applied to | Role |
|-------|-----------|------|
| `alignfull` | Section | Breaks out of parent padding for full-width backgrounds |
| `has-global-padding` | Section | Applies root left/right padding so children never touch the viewport edge |
| `is-layout-constrained` | Section | Adds block gap (vertical spacing) between direct children |
| `max-w-content` | Child | Constrains to `contentSize` (e.g. 768px) — readable prose width |
| `max-w-wide` | Child | Constrains to `wideSize` (e.g. 1280px) — wider layouts |
| `max-w-full` | Child | No max-width constraint, fills the padded area |

## Page Structure

`<main>` is the page wrapper. It doesn't use layout classes. Sections inside it own the padding and backgrounds, while each direct child of a Section declares its own width.

```html
<main>

  <section class="mylib-section alignfull has-global-padding is-layout-constrained">
    <!-- children here -->
  </section>

  <section class="mylib-section alignfull has-global-padding is-layout-constrained">
    <!-- children here -->
  </section>

</main>
```

## Content Width Section

The most common pattern. All children constrained to `contentSize` for readable prose.

```html
<section class="mylib-section alignfull has-global-padding is-layout-constrained">
  <h2 class="max-w-content">Our Story</h2>
  <p class="max-w-content">First paragraph of readable prose at contentSize width.</p>
  <p class="max-w-content">Second paragraph. Block gap provides vertical spacing above.</p>
</section>
```

- Section goes edge-to-edge (background color fills the viewport)
- Root padding keeps children off the viewport edges
- Block gap spaces out each direct child vertically
- Each child is centered at `contentSize`

## Wide Width Section

Children constrained to `wideSize` for wider layouts like card grids.

```html
<section class="mylib-section alignfull has-global-padding is-layout-constrained">
  <h2 class="max-w-content">Our Team</h2>
  <div class="max-w-wide card-grid">
    <div class="card">...</div>
    <div class="card">...</div>
    <div class="card">...</div>
  </div>
</section>
```

- The heading stays at `contentSize` for readability
- The card grid expands to `wideSize` for more room
- Both are direct children of the same Section, spaced by block gap

## Full Width Section

Children fill the padded area with no max-width constraint.

```html
<section class="mylib-section alignfull has-global-padding is-layout-constrained">
  <img class="max-w-full" src="hero.jpg" alt="Hero" />
  <h2 class="max-w-content">Hero headline below the image</h2>
</section>
```

- The image stretches to the root padding edges
- The heading below it is constrained to `contentSize`
- Block gap spaces the heading below the image

## Mixed Widths in One Section

Different children can use different widths within the same Section. This is one of the strengths of the pattern — width is a per-child decision, not a per-section decision.

```html
<section class="mylib-section mylib-section--dark alignfull has-global-padding is-layout-constrained">
  <h2 class="max-w-content">Featured Work</h2>
  <p class="max-w-content">A short intro paragraph at readable width.</p>
  <div class="max-w-wide card-grid">
    <div class="card">...</div>
    <div class="card">...</div>
    <div class="card">...</div>
  </div>
  <a class="max-w-content" href="/work">View all projects</a>
</section>
```

- Heading, paragraph, and link are at `contentSize`
- Card grid is at `wideSize`
- All share the same Section background and root padding
- Block gap provides consistent vertical rhythm throughout

## Full Page Example

Sections stacked in a page, each with its own background and mixed child widths.

```html
<main>

  <section class="mylib-section mylib-section--hero alignfull has-global-padding is-layout-constrained">
    <h1 class="max-w-content">Page Title</h1>
    <p class="max-w-content">Introductory text at readable width.</p>
  </section>

  <section class="mylib-section alignfull has-global-padding is-layout-constrained">
    <h2 class="max-w-content">About Us</h2>
    <p class="max-w-content">Prose content constrained for readability.</p>
    <p class="max-w-content">Another paragraph, same width.</p>
  </section>

  <section class="mylib-section mylib-section--dark alignfull has-global-padding is-layout-constrained">
    <h2 class="max-w-content">Our Team</h2>
    <div class="max-w-wide card-grid">
      <div class="card">...</div>
      <div class="card">...</div>
      <div class="card">...</div>
    </div>
  </section>

  <section class="mylib-section alignfull has-global-padding is-layout-constrained">
    <img class="max-w-full" src="banner.jpg" alt="Banner" />
    <h2 class="max-w-content">Final Section</h2>
    <p class="max-w-content">Closing content at readable width.</p>
  </section>

</main>
```

## How Block Gap Works

The `is-layout-constrained` class triggers the block gap rule:

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
| `alignfull` | Block set to "Full Width" alignment |
| `has-global-padding` | Container block with root padding enabled |
| `is-layout-constrained` | Group block with constrained layout |
| `max-w-content` child | Block at default alignment (`contentSize`) |
| `max-w-wide` child | Block set to "Wide" alignment (`wideSize`) |
| `max-w-full` child | Block set to "Full" alignment within a padded container |
