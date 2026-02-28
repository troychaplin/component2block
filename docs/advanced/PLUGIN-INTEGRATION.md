# Plugin Integration

This guide covers how to integrate a component library built with `component2block` into a WordPress block plugin. The plugin is responsible for registering blocks and their component CSS, importing React components for the editor, and rendering blocks on the frontend.

## Prerequisites

- WordPress 6.0+
- Node.js 20+ (for building blocks with `@wordpress/scripts`)
- A block plugin
- A published component library built with `component2block`
- The theme must already be set up with `integrate.php` and `tokens.wp.css` (see [Theme Integration](./THEME-INTEGRATION.md))

## Setup

### Step 1: Install the library

```bash
npm install your-component-library
```

### Step 2: Copy component CSS into the plugin

```bash
# Copy individual component stylesheets
mkdir -p assets/css
cp node_modules/your-component-library/dist/css/Card.css assets/css/
cp node_modules/your-component-library/dist/css/Button.css assets/css/
# Copy any other component CSS files your blocks use
```

### Step 3: Register component styles

In your plugin's main PHP file:

```php
/**
 * Register component library styles for blocks.
 * Each style is associated with a block via block.json.
 * WordPress only enqueues them when the block appears on the page.
 */
function prefix_register_block_styles() {
    $plugin_uri = plugin_dir_url( __FILE__ );

    wp_register_style(
        'prefix-card',
        $plugin_uri . 'assets/css/Card.css',
        [ 'c2b-tokens' ],
        '0.0.1'
    );

    wp_register_style(
        'prefix-button',
        $plugin_uri . 'assets/css/Button.css',
        [ 'c2b-tokens' ],
        '0.0.1'
    );
}
add_action( 'init', 'prefix_register_block_styles' );
```

> **Note:** The dependency on `c2b-tokens` ensures the token stylesheet loads before any component CSS. This handle is registered by `integrate.php` (see [Theme Integration](./THEME-INTEGRATION.md)).

### Step 4: Associate styles with blocks via block.json

```json
{
    "$schema": "https://schemas.wp.org/trunk/block.json",
    "apiVersion": 3,
    "name": "your-plugin/card",
    "title": "Card",
    "category": "design",
    "style": ["prefix-card"],
    "editorStyle": ["prefix-card"]
}
```

The `style` array references the handle registered with `wp_register_style`. WordPress enqueues it automatically when the block appears on a page.

#### Alternative: Register via PHP

For blocks registered in PHP rather than `block.json`:

```php
register_block_type('your-plugin/card', [
    'render_callback'      => 'render_card_block',
    'style_handles'        => ['prefix-card'],
    'editor_style_handles' => ['prefix-card'],
]);
```

#### Alternative: Manual enqueue in render callback

```php
function render_card_block($attributes) {
    wp_enqueue_style('prefix-card');

    return sprintf(
        '<article class="prefix-card">...</article>',
        // ...
    );
}
```

## What the Plugin Provides

| Concern | Plugin responsibility |
|---------|---------------------|
| Component CSS | Copy and register per-component stylesheets |
| Block JS | Import React components from the library for the editor |
| Block registration | `block.json` with `style` and `editorStyle` handles |
| Rendering | Edit component (React) and save/render.php (markup) |

## CSS Loading Summary

| File | Loaded by | When |
|------|-----------|------|
| `integrate.php` | Theme | Always (functions.php require_once) |
| `tokens.wp.css` or `tokens.css` | integrate.php | Always (auto-detected, global enqueue as `c2b-tokens`) |
| `Card.css` | Plugin | Only when Card block is on the page |
| `Button.css` | Plugin | Only when Button block is on the page |
| `styles.css` | Neither | Use individual files instead |

## Static Blocks (JS Rendered)

Static blocks store their HTML in the database. The React component renders in both the editor and the saved output.

### Block Registration (JS)

```tsx
// src/blocks/card/index.ts
import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import save from './save';
import metadata from './block.json';

registerBlockType(metadata.name, {
    edit: Edit,
    save,
});
```

### block.json

```json
{
    "$schema": "https://schemas.wp.org/trunk/block.json",
    "apiVersion": 3,
    "name": "your-plugin/card",
    "title": "Card",
    "category": "design",
    "attributes": {
        "title": {
            "type": "string",
            "default": ""
        },
        "content": {
            "type": "string",
            "default": ""
        },
        "variant": {
            "type": "string",
            "default": "default",
            "enum": ["default", "featured"]
        }
    },
    "supports": {
        "html": false
    },
    "style": ["prefix-card"],
    "editorStyle": ["prefix-card"]
}
```

### Edit Component

The edit component uses the React component from the library for the editor experience:

```tsx
// src/blocks/card/edit.tsx
import { useBlockProps, RichText } from '@wordpress/block-editor';
import { Card } from 'your-component-library';

interface EditProps {
    attributes: {
        title: string;
        content: string;
        variant: 'default' | 'featured';
    };
    setAttributes: (attrs: Partial<EditProps['attributes']>) => void;
}

export default function Edit({ attributes, setAttributes }: EditProps) {
    const blockProps = useBlockProps();

    return (
        <div {...blockProps}>
            <Card variant={attributes.variant}>
                <RichText
                    tagName="h3"
                    className="prefix-card__title"
                    value={attributes.title}
                    onChange={(title) => setAttributes({ title })}
                    placeholder="Card title..."
                />
                <RichText
                    tagName="div"
                    className="prefix-card__content"
                    value={attributes.content}
                    onChange={(content) => setAttributes({ content })}
                    placeholder="Card content..."
                />
            </Card>
        </div>
    );
}
```

### Save Component

The save component outputs the HTML that gets stored in the database:

```tsx
// src/blocks/card/save.tsx
import { useBlockProps, RichText } from '@wordpress/block-editor';

interface SaveProps {
    attributes: {
        title: string;
        content: string;
        variant: 'default' | 'featured';
    };
}

export default function save({ attributes }: SaveProps) {
    const blockProps = useBlockProps.save();
    const { title, content, variant } = attributes;

    const cardClasses = [
        'prefix-card',
        variant !== 'default' && `prefix-card--${variant}`,
    ].filter(Boolean).join(' ');

    return (
        <div {...blockProps}>
            <article className={cardClasses}>
                <header className="prefix-card__header">
                    <RichText.Content
                        tagName="h3"
                        className="prefix-card__title"
                        value={title}
                    />
                </header>
                <div className="prefix-card__content">
                    <RichText.Content tagName="div" value={content} />
                </div>
            </article>
        </div>
    );
}
```

### Important Note on Static Blocks

The save component outputs raw HTML with CSS class names — it does **not** import the React component. WordPress stores the HTML in the database and re-renders it without JavaScript on the frontend. The component library provides:

1. The CSS that styles those class names
2. The React component for the editor experience
3. Documentation of the expected markup structure

If you change the HTML structure in a component update, existing saved blocks will show a validation error in the editor.

## Dynamic Blocks (PHP Rendered)

Dynamic blocks store only their attributes. PHP renders the HTML on each page load. This is the more flexible approach and avoids block validation issues on updates.

### Block Registration

```json
{
    "$schema": "https://schemas.wp.org/trunk/block.json",
    "apiVersion": 3,
    "name": "your-plugin/card",
    "title": "Card",
    "category": "design",
    "attributes": {
        "title": {
            "type": "string",
            "default": ""
        },
        "content": {
            "type": "string",
            "default": ""
        },
        "variant": {
            "type": "string",
            "default": "default",
            "enum": ["default", "featured"]
        }
    },
    "supports": {
        "html": false
    },
    "style": ["prefix-card"],
    "editorStyle": ["prefix-card"],
    "render": "file:./render.php"
}
```

### Edit Component

Same as the static block — use the React component for the editor:

```tsx
// src/blocks/card/edit.tsx
import { useBlockProps, RichText } from '@wordpress/block-editor';
import { Card } from 'your-component-library';

export default function Edit({ attributes, setAttributes }) {
    const blockProps = useBlockProps();

    return (
        <div {...blockProps}>
            <Card variant={attributes.variant}>
                <RichText
                    tagName="h3"
                    className="prefix-card__title"
                    value={attributes.title}
                    onChange={(title) => setAttributes({ title })}
                    placeholder="Card title..."
                />
                <RichText
                    tagName="div"
                    className="prefix-card__content"
                    value={attributes.content}
                    onChange={(content) => setAttributes({ content })}
                    placeholder="Card content..."
                />
            </Card>
        </div>
    );
}
```

### Save Component

Dynamic blocks return `null` from save:

```tsx
// src/blocks/card/save.tsx
export default function save() {
    return null;
}
```

### PHP Render Template

```php
<?php
/**
 * Card block server-side render template.
 *
 * Markup matches the component library's Card component.
 * Refer to Storybook docs for the full CSS class reference.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content.
 * @var WP_Block $block      Block instance.
 *
 * CSS Classes Used:
 * - .prefix-card            Base card container
 * - .prefix-card__header    Card header section
 * - .prefix-card__title     Card title (h3)
 * - .prefix-card__content   Card body content
 * - .prefix-card--featured  Featured variant modifier
 */

$variant = $attributes['variant'] ?? 'default';
$title   = $attributes['title'] ?? '';
$content = $attributes['content'] ?? '';

$card_classes = 'prefix-card';
if ( 'default' !== $variant ) {
    $card_classes .= ' prefix-card--' . esc_attr( $variant );
}

$wrapper_attributes = get_block_wrapper_attributes();
?>

<div <?php echo $wrapper_attributes; ?>>
    <article class="<?php echo esc_attr( $card_classes ); ?>">
        <header class="prefix-card__header">
            <h3 class="prefix-card__title"><?php echo esc_html( $title ); ?></h3>
        </header>
        <div class="prefix-card__content">
            <?php echo wp_kses_post( $content ); ?>
        </div>
    </article>
</div>
```

### When to Use Dynamic vs Static

| Consideration | Static Block | Dynamic Block |
|--------------|-------------|---------------|
| Frontend render | From saved HTML | From PHP on each request |
| Component markup changes | Causes block validation errors | No issues, just update PHP |
| Performance | Slightly faster (pre-rendered) | Runs PHP on each page load |
| Content freshness | Stored at save time | Always current |
| Best for | Simple, stable components | Components that may evolve |

**Recommendation:** Use dynamic blocks for most components. The flexibility to update markup without breaking existing content is worth the minor performance trade-off.

## Component Reference

### Card

**React Component:**

```tsx
import { Card } from 'your-component-library';

<Card title="My Title" variant="featured" className="extra-class">
    <p>Card content</p>
</Card>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Card heading text |
| `children` | `ReactNode` | required | Card body content |
| `variant` | `'default' \| 'featured'` | `'default'` | Visual style |
| `className` | `string` | `''` | Additional CSS classes |

**PHP Markup:**

```html
<article class="prefix-card prefix-card--featured">
    <header class="prefix-card__header">
        <h3 class="prefix-card__title">My Title</h3>
    </header>
    <div class="prefix-card__content">
        <p>Card content</p>
    </div>
</article>
```

**CSS Files:** `tokens.wp.css` + `Card.css`

---

### Button

**React Component:**

```tsx
import { Button } from 'your-component-library';

<Button variant="primary" size="md" onClick={handleClick}>
    Click me
</Button>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Button label |
| `variant` | `'primary' \| 'secondary' \| 'outline'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disabled state |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML type attribute |
| `onClick` | `() => void` | — | Click handler |
| `className` | `string` | `''` | Additional CSS classes |

**PHP Markup:**

```html
<button class="prefix-button prefix-button--primary prefix-button--md">
    Click me
</button>
```

**CSS Files:** `tokens.wp.css` + `Button.css`

## Troubleshooting

### Styles not appearing on frontend

1. **Check the style handle is registered.** Verify `wp_register_style` is called on `init`
2. **Check the dependency chain.** Component CSS must depend on `c2b-tokens`
3. **Verify block.json `style` field** matches the registered handle name exactly
4. **Check file paths.** Use browser dev tools Network tab to see if CSS returns 404

### Styles not appearing in block editor

1. **Add `editorStyle` to block.json** — the editor iframe needs styles explicitly loaded
2. **Ensure integrate.php is loaded** — it enqueues tokens on both `wp_enqueue_scripts` and `enqueue_block_editor_assets`
3. **Check for iframe isolation** — styles in the parent page don't reach the editor iframe

### Block validation errors (static blocks only)

If a saved static block shows "This block contains unexpected content":

1. The HTML structure in the save component doesn't match what's stored in the database
2. This happens when you update the component markup after content has been saved
3. **Fix:** Use the block recovery option in the editor, or switch to dynamic blocks

### Multiple blocks loading duplicate tokens

This is expected and fine. `wp_enqueue_style` is idempotent — if `c2b-tokens` is already enqueued, WordPress skips the duplicate. Using style dependencies ensures tokens always load before any component CSS.

### Performance with many block types

With this per-block loading approach:

- Only CSS for blocks present on the page gets enqueued
- `tokens.wp.css` loads once globally (~4KB)
- Each component CSS is typically 1-2KB
- A page with 5 different component blocks loads ~14KB of CSS total
- A page with 0 component blocks loads only the tokens (~4KB)

This scales well even with 70+ block types registered, since only the blocks actually used on each page load their CSS.
