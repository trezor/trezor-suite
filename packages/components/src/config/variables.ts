import { icons } from '@suite-common/icons/src/icons';
import { aboveBreakpoint, belowBreakpoint, breakpoints } from '@trezor/theme';

/**
 * @deprecated This key is deprecated. Please use `useLayoutSize` hook or breakpoints from `@trezor/theme`.
 */
export const SCREEN_SIZE = {
    SM: `${breakpoints.mobile}px`,
    MD: `${breakpoints.tablet}px`,
    LG: `${breakpoints.laptop}px`,
    XL: `${breakpoints.desktop}px`,
} as const;

/**
 * @deprecated This key is deprecated. Please use `useLayoutSize` hook or breakpoints from `@trezor/theme`.
 */
export const SCREEN_QUERY = {
    MOBILE: `@media ${belowBreakpoint(breakpoints.mobile)}`,
    ABOVE_MOBILE: `@media ${aboveBreakpoint(breakpoints.mobile)}`,
    BELOW_TABLET: `@media ${belowBreakpoint(breakpoints.tablet)}`,
    ABOVE_TABLET: `@media ${aboveBreakpoint(breakpoints.tablet)}`,
    BELOW_LAPTOP: `@media ${belowBreakpoint(breakpoints.laptop)}`,
    ABOVE_LAPTOP: `@media ${aboveBreakpoint(breakpoints.laptop)}`,
    BELOW_DESKTOP: `@media ${belowBreakpoint(breakpoints.desktop)}`,
    ABOVE_DESKTOP: `@media ${aboveBreakpoint(breakpoints.desktop)}`,
} as const;

export const LAYOUT_SIZE = {
    MENU_SECONDARY_WIDTH: '300px',
    /** Guide width including border */
    GUIDE_PANEL_WIDTH: '350px',
    /** Guide width without border */
    GUIDE_PANEL_CONTENT_WIDTH: '349px',
} as const;

/**
 * @deprecated This key is deprecated. Please use e.g. `typography.hint` or different typographic style.
 */
export const FONT_SIZE = {
    BIG: '18px',
    NORMAL: '16px',
    SMALL: '14px',
    TINY: '12px',
    H1: '36px',
    H2: '24px',
    H3: '20px',
} as const;

/**
 * @deprecated This key is deprecated. Please use e.g. `typography.hint` or different typographic style.
 */
export const FONT_WEIGHT = {
    LIGHT: 300,
    REGULAR: 400,
    MEDIUM: 500,
    DEMI_BOLD: 600,
    BOLD: 700,
} as const;

export const ICONS = Object.keys(icons).sort();
