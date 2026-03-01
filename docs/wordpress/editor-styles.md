# Editor Styles

How to make component library styles work correctly inside the WordPress block editor.

## How the Block Editor Loads Styles

The block editor uses an iframe. Styles must be explicitly loaded inside it — stylesheets on the parent page do not reach block content in the editor.

## Tokens in the Editor

`integrate.php` handles token loading automatically. It enqueues the token CSS on both `wp_enqueue_scripts` (frontend) and `enqueue_block_editor_assets` (editor iframe). No additional setup needed.

## Component CSS in the Editor

Add `editorStyle` to your block.json alongside `style`:

```json
{
    "style": ["mylib-card"],
    "editorStyle": ["mylib-card"]
}
```

Using the same handle for both means the component renders identically in both contexts.

## Editor-Specific Overrides

If components need adjustments inside the editor (different max-width, pointer events, or spacing for editor chrome):

```css
/* editor.css */
.editor-styles-wrapper .mylib-card {
    max-width: 100%;
}
```

Register and associate the editor override stylesheet:

```php
wp_register_style(
    'mylib-card-editor',
    $plugin_uri . 'assets/css/editor/card-editor.css',
    [ 'mylib-card' ],
    '0.0.1'
);
```

```json
{
    "style": ["mylib-card"],
    "editorStyle": ["mylib-card", "mylib-card-editor"]
}
```

The editor override loads after the component CSS (via the dependency) and only in the editor context.

## Troubleshooting

### Styles not appearing in the editor

1. Check `editorStyle` in block.json — without it, the editor iframe won't load the CSS
2. Verify `integrate.php` is loaded — it enqueues tokens on `enqueue_block_editor_assets`
3. Inspect the editor iframe's `<head>` to see which stylesheets are loaded
4. Verify the style handle is registered — `editorStyle` references the same handle from `wp_register_style`

### Components look different in editor vs frontend

1. Check for editor wrapper specificity — `.editor-styles-wrapper` parent can affect styles
2. Check for missing editor overrides — some components need adjustments for editor context
3. Inspect the editor iframe — compare computed styles between editor and frontend
