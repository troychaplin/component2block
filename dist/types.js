/**
 * Central registry mapping token category names to their output behavior.
 * Adding a new category here is all that's needed to support it across all generators.
 */
/**
 * Maps user-facing config category names to internal flat category names.
 * Categories not in this map use their key as-is (e.g. "fontSize" → "fontSize").
 */
export const INPUT_CATEGORY_MAP = {
    color: 'colorPalette',
    gradient: 'colorGradient',
};
export const CATEGORY_REGISTRY = {
    colorPalette: {
        cssSegment: 'color',
        label: 'Colors',
        order: 0,
        themeJson: { path: 'color.palette', valueKey: 'color' },
        wpPreset: '--wp--preset--color',
    },
    colorGradient: {
        cssSegment: 'gradient',
        label: 'Gradients',
        order: 1,
        themeJson: { path: 'color.gradients', valueKey: 'gradient' },
        wpPreset: '--wp--preset--gradient',
    },
    spacing: {
        cssSegment: 'spacing',
        label: 'Spacing',
        order: 2,
        themeJson: { path: 'spacing.spacingSizes', valueKey: 'size' },
        wpPreset: '--wp--preset--spacing',
    },
    fontFamily: {
        cssSegment: 'font-family',
        label: 'Font Families',
        order: 3,
        themeJson: { path: 'typography.fontFamilies', valueKey: 'fontFamily' },
        wpPreset: '--wp--preset--font-family',
    },
    fontSize: {
        cssSegment: 'font-size',
        label: 'Font Sizes',
        order: 4,
        themeJson: { path: 'typography.fontSizes', valueKey: 'size' },
        wpPreset: '--wp--preset--font-size',
    },
    shadow: {
        cssSegment: 'shadow',
        label: 'Shadows',
        order: 5,
        themeJson: { path: 'shadow.presets', valueKey: 'shadow' },
        wpPreset: '--wp--preset--shadow',
        custom: 'shadow',
    },
    fontWeight: {
        cssSegment: 'font-weight',
        label: 'Font Weights',
        order: 6,
        custom: 'fontWeight',
    },
    lineHeight: {
        cssSegment: 'line-height',
        label: 'Line Heights',
        order: 7,
        custom: 'lineHeight',
    },
    radius: {
        cssSegment: 'radius',
        label: 'Border Radius',
        order: 8,
        custom: 'radius',
    },
    transition: {
        cssSegment: 'transition',
        label: 'Transitions',
        order: 9,
        custom: 'transition',
    },
    zIndex: {
        cssSegment: 'z',
        label: 'Z-Index',
        order: 10,
        exclude: true,
    },
    layout: {
        cssSegment: 'layout',
        label: 'Layout',
        order: 11,
        directMap: true,
        themeJson: { path: 'layout', valueKey: 'direct' },
    },
};
/** All valid category names, derived from the registry */
export const VALID_CATEGORIES = Object.keys(CATEGORY_REGISTRY);
/** Categories sorted by their output order */
export const CATEGORY_ORDER = [...VALID_CATEGORIES].sort((a, b) => CATEGORY_REGISTRY[a].order - CATEGORY_REGISTRY[b].order);
/**
 * Convert a kebab-case key to camelCase.
 * e.g. "content-size" → "contentSize"
 */
export function kebabToCamel(str) {
    return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
/**
 * Convert a kebab-case key to Title Case.
 * e.g. "primary-hover" → "Primary Hover"
 */
export function kebabToTitle(str) {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
/**
 * Convert a camelCase key to kebab-case.
 * e.g. "fontFamily" → "font-family"
 */
export function camelToKebab(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}
//# sourceMappingURL=types.js.map