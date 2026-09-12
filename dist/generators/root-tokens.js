import { resolveBaseStyleValueForScss, resolveRootPadding } from '../config.js';
/** Each root padding side and the axis it falls back to, in CSS shorthand order. */
const SIDE_AXES = [
    ['top', 'y'],
    ['right', 'x'],
    ['bottom', 'y'],
    ['left', 'x'],
];
/**
 * Root spacing tokens derived from `baseStyles.spacing`: the root padding axes
 * (`padding-x`, `padding-y`), the four sides, and `block-gap`. Keys are relative
 * to the `root` segment, so `padding-x` becomes `--{prefix}--root-padding-x`.
 *
 * tokens.css and tokens.wp.css declare these on :root and tokens.js mirrors
 * them, so components can reuse the page gutter anywhere — including WordPress
 * block themes, which don't load layout.css.
 *
 * A side that isn't set on its own, or matches its axis, aliases the axis token
 * (`var(--{prefix}--root-padding-x)`), so one axis value drives both sides.
 */
export function buildRootTokens(config) {
    const { baseStyles, prefix, tokens } = config;
    const spacing = baseStyles?.spacing;
    if (!spacing)
        return [];
    const result = [];
    if (spacing.padding) {
        const axes = resolveRootPadding(spacing.padding);
        for (const axis of ['x', 'y']) {
            const value = axes[axis];
            if (value === undefined)
                continue;
            result.push({ key: `padding-${axis}`, value: resolveBaseStyleValueForScss(value, 'padding', prefix, tokens) });
        }
        for (const [side, axis] of SIDE_AXES) {
            const own = spacing.padding[side];
            if (own !== undefined && own !== axes[axis]) {
                result.push({ key: `padding-${side}`, value: resolveBaseStyleValueForScss(own, 'padding', prefix, tokens) });
            }
            else if (axes[axis] !== undefined) {
                result.push({ key: `padding-${side}`, value: `var(--${prefix}--root-padding-${axis})` });
            }
        }
    }
    if (spacing.blockGap !== undefined) {
        result.push({ key: 'block-gap', value: resolveBaseStyleValueForScss(spacing.blockGap, 'blockGap', prefix, tokens) });
    }
    return result;
}
/**
 * Append the root spacing tokens to a `:root { }` body under a `Root Spacing`
 * label. `separate` adds a blank line first, for when category groups precede it.
 */
export function appendRootTokens(lines, config, separate) {
    const rootTokens = buildRootTokens(config);
    if (rootTokens.length === 0)
        return;
    if (separate)
        lines.push('');
    lines.push('  /* Root Spacing */');
    for (const { key, value } of rootTokens) {
        lines.push(`  --${config.prefix}--root-${key}: ${value};`);
    }
}
//# sourceMappingURL=root-tokens.js.map