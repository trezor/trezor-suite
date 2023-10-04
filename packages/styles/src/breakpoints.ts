import { BreakpointMediaQueries } from './types';

export const breakpointThresholds = {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
} as const;

export const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;

export const breakpointMediaQueries = Object.keys(
    breakpointThresholds,
).reduce<BreakpointMediaQueries>(
    (mediaQueries, breakpoint) => ({
        ...mediaQueries,
        [breakpoint]: `@media (min-width: ${breakpointThresholds[breakpoint]}px)`,
        [`below_${breakpoint}`]: `@media (max-width: ${breakpointThresholds[breakpoint] - 1}px)`,
    }),
    {} as BreakpointMediaQueries,
);
