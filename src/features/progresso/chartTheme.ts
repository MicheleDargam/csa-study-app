/**
 * Chart tokens mirror this app's existing dark design system (index.css)
 * rather than a generic reference palette — color here follows identity that
 * already exists in the product (the indigo accent, each matéria's own
 * chosen color), so charts stay consistent with every other screen.
 */
export const CHART_ACCENT = '#6366f1'; // matches --color-accent
export const CHART_GRID = 'rgba(255, 255, 255, 0.08)'; // matches --color-border
export const CHART_AXIS_TEXT = '#64748b'; // matches --color-text-muted
export const CHART_TOOLTIP_BG = '#111827'; // matches --color-bg-secondary

// Fixed status scale (reserved meaning, never reused for series identity) —
// used only where a value genuinely means good/needs-attention, like the
// per-tema accuracy threshold.
export const STATUS_GOOD = '#0ca30c';
export const STATUS_WARNING = '#fab219';
