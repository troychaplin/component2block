# WordPress Blocks

This guide will cover how to register component library components as WordPress blocks — including block.json setup, edit/save components, PHP render templates, and per-block CSS loading.

> This section is under development and will be expanded as the block registration tooling is built out.

## What's Coming

- Block plugin setup and structure
- Registering component CSS with `wp_register_style` and the `c2b-tokens` dependency
- Associating styles with blocks via `block.json` `style` and `editorStyle` fields
- Static blocks (JS rendered) vs dynamic blocks (PHP rendered)
- Edit components using React library components in the editor
- PHP render templates that match component markup
- Editor-specific style overrides
- Per-block CSS loading (only loads CSS for blocks present on the page)

## Key Concepts

### Token Dependency

Component CSS depends on the token stylesheet. When registering component styles, always declare `c2b-tokens` as a dependency:

```php
wp_register_style(
    'mylib-card',
    $plugin_uri . 'assets/css/Card.css',
    [ 'c2b-tokens' ],
    '0.0.1'
);
```

The `c2b-tokens` handle is registered by `integrate.php` (see [WordPress Integration](./wordpress-integration.md)).

### Per-Block Loading

Associate component CSS with blocks via `block.json`:

```json
{
    "style": ["mylib-card"],
    "editorStyle": ["mylib-card"]
}
```

WordPress only enqueues CSS for blocks present on the page. A page with 5 different component blocks loads only those 5 component stylesheets plus the shared token CSS.

### Editor Iframe

The block editor uses an iframe. Styles must be loaded inside it via `editorStyle` — stylesheets on the parent page don't reach the editor content. See [Editor Styles](./advanced/editor-styles.md) for details.
