// TODO: suite-common imports in non-suite packages should not be allowed
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { iconNames } from '@suite-common/icons/src/iconNames';
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
    /** Guide width including border */
    GUIDE_PANEL_WIDTH: '350px',
    /** Guide width without border */
    GUIDE_PANEL_CONTENT_WIDTH: '349px',
} as const;

export const ICONS = [...iconNames].sort();
