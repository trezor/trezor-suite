export const gridAlignItems = ['center', 'start', 'end', 'stretch', 'normal'] as const;
export const gridJustifyContent = ['center', 'start', 'end', 'stretch', 'normal'] as const;

export type GridAlignItems = (typeof gridAlignItems)[number];
export type GridJustifyContent = (typeof gridJustifyContent)[number];
