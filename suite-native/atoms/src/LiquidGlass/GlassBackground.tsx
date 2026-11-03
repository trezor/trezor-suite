import type { GlassBackgroundProps } from './GlassBackground.types';

// Liquid Glass is iOS-only, other platforms render the parent's solid background instead.
export const GlassBackground = (_props: GlassBackgroundProps) => null;
