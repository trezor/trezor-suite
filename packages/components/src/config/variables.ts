// TODO: suite-common imports in non-suite packages should not be allowed
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
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
    /** Default guide panel width including border (px) */
    GUIDE_PANEL_DEFAULT_WIDTH: 350,
    /** Minimum guide panel width including border (px) */
    GUIDE_PANEL_MIN_WIDTH: 320,
    /** Maximum guide panel width including border (px) */
    GUIDE_PANEL_MAX_WIDTH: 450,
} as const;

export const ICONS = Object.keys(icons).sort();
