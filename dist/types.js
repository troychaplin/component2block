/**
 * Single source of truth for elements that get per-element styling. Adding a
 * new element is a one-entry change here; validation and every generator loop
 * over this registry rather than maintaining their own lists.
 */
export const ELEMENT_REGISTRY = [
    { key: 'heading', cssSelector: ':where(h1, h2, h3, h4, h5, h6)', themeJsonKey: 'heading' },
    { key: 'h1', cssSelector: ':where(h1)', themeJsonKey: 'h1', isHeading: true },
    { key: 'h2', cssSelector: ':where(h2)', themeJsonKey: 'h2', isHeading: true },
    { key: 'h3', cssSelector: ':where(h3)', themeJsonKey: 'h3', isHeading: true },
    { key: 'h4', cssSelector: ':where(h4)', themeJsonKey: 'h4', isHeading: true },
    { key: 'h5', cssSelector: ':where(h5)', themeJsonKey: 'h5', isHeading: true },
    { key: 'h6', cssSelector: ':where(h6)', themeJsonKey: 'h6', isHeading: true },
    { key: 'caption', cssSelector: ':where(figcaption)', themeJsonKey: 'caption' },
    { key: 'button', cssSelector: ':where(button)', themeJsonKey: 'button' },
    { key: 'link', cssSelector: ':where(a)', themeJsonKey: 'link', hoverCssSelector: ':where(a:hover)' },
];
/** Heading levels in output order — derived from the registry */
export const HEADING_KEYS = ELEMENT_REGISTRY.filter(e => e.isHeading).map(e => e.key);
/**
 * Typography properties on BaseStyleElementDef, in canonical output order.
 * Used by both the CSS generator (font-family/font-size/...) and the theme.json
 * generator (typography.fontFamily/fontSize/...) so the two outputs can't drift.
 */
export const TYPOGRAPHY_PROPERTIES = [
    'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'lineHeight',
];
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
    mediaQuery: {
        cssSegment: 'media-query',
        label: 'Media Queries',
        order: 12,
        scssOnly: true,
    },
};
/** All valid category names, derived from the registry */
export const VALID_CATEGORIES = Object.keys(CATEGORY_REGISTRY);
/** Categories sorted by their output order */
export const CATEGORY_ORDER = [...VALID_CATEGORIES].sort((a, b) => CATEGORY_REGISTRY[a].order - CATEGORY_REGISTRY[b].order);
/** Default viewport anchors used when `fluid` is not set in config. */
export const DEFAULT_FLUID = {
    minViewport: '320px',
    maxViewport: '1600px',
};
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