# Editor Styles

This guide covers how to make component library styles work correctly inside the WordPress block editor.

## How the Block Editor Loads Styles

The block editor uses an iframe. Styles must be explicitly loaded inside it — stylesheets on the parent page do not automatically reach block content in the editor.

## Tokens in the Editor

The theme's `enqueue_block_editor_assets` hook loads `tokens.wp.css` into the editor iframe. This ensures CSS variables are available for all component blocks in the editor.

From the theme's `functions.php`:

```php
function prefix_enqueue_tokens() {
    wp_enqueue_style(
        'prefix-tokens',
        get_template_directory_uri() . '/assets/css/tokens.wp.css',
        [],
        '0.0.1'
    );
}
add_action( 'wp_enqueue_scripts', 'prefix_enqueue_tokens' );
add_action( 'enqueue_block_editor_assets', 'prefix_enqueue_tokens' );
```

The dual `add_action` calls ensure tokens load on both the frontend and inside the editor iframe.

## Component CSS in the Editor

Add `editorStyle` to your block.json alongside `style`:

```json
{
    "style": ["prefix-card"],
    "editorStyle": ["prefix-card"]
}
```

This tells WordPress to load the component CSS in both the editor iframe and the frontend. Using the same handle for both means the component renders identically in both contexts.

## Editor-Specific Overrides

If components need adjustments inside the editor (e.g., different max-width, pointer events, or spacing to accommodate editor chrome):

```css
/* editor.css — enqueue via editorStyle */
.editor-styles-wrapper .prefix-card {
    max-width: 100%;
}
```

Register and associate the editor override stylesheet:

```php
wp_register_style(
    'prefix-card-editor',
    $plugin_uri . 'assets/css/editor/card-editor.css',
    [ 'prefix-card' ],
    '0.0.1'
);
```

```json
{
    "style": ["prefix-card"],
    "editorStyle": ["prefix-card", "prefix-card-editor"]
}
```

The editor override loads after the component CSS (via the dependency) and only in the editor context.

## Troubleshooting

### Styles not appearing in the editor

1. **Check `editorStyle` in block.json** — without it, the editor iframe won't load the CSS
2. **Check that tokens are enqueued via `enqueue_block_editor_assets`** — this is the theme's responsibility
3. **Check for iframe isolation** — inspect the editor iframe's `<head>` to see which stylesheets are loaded
4. **Verify the style handle is registered** — `editorStyle` references the same handle from `wp_register_style`

### Components look different in editor vs frontend

1. **Check for editor wrapper specificity** — the `.editor-styles-wrapper` parent can affect styles
2. **Check for missing editor overrides** — some components need adjustments for the editor context
3. **Inspect the editor iframe** — compare computed styles between editor and frontend
