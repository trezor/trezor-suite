import { icons } from '@suite-common/icons/src/icons';
import { breakpoints } from '@trezor/theme';

/**
 * @deprecated This key is deprecated. Please use `useLayoutSize` hook or breakpoints from `@trezor/theme`.
 */
export const SCREEN_SIZE = {
    UNAVAILABLE: `${breakpoints.unavailable}px`,
    SM: `${breakpoints.mobile}px`,
    MD: `${breakpoints.tablet}px`,
    LG: `${breakpoints.laptop}px`,
    XL: `${breakpoints.desktop}px`,
} as const;

const HELPER_SCREEN_SIZE = {
    SM: `${breakpoints.mobile - 1}px`,
    MD: `${breakpoints.tablet - 1}px`,
    LG: `${breakpoints.laptop - 1}px`,
    XL: `${breakpoints.desktop - 1}px`,
};

/**
 * @deprecated This key is deprecated. Please use `useLayoutSize` hook or breakpoints from `@trezor/theme`.
 */
export const SCREEN_QUERY = {
    MOBILE: `@media (max-width: ${HELPER_SCREEN_SIZE.SM})`,
    ABOVE_MOBILE: `@media (min-width: ${SCREEN_SIZE.SM})`,
    BELOW_TABLET: `@media (max-width: ${HELPER_SCREEN_SIZE.MD})`,
    ABOVE_TABLET: `@media (min-width: ${SCREEN_SIZE.MD})`,
    BELOW_LAPTOP: `@media (max-width: ${HELPER_SCREEN_SIZE.LG})`,
    ABOVE_LAPTOP: `@media (min-width: ${SCREEN_SIZE.LG})`,
    BELOW_DESKTOP: `@media (max-width: ${HELPER_SCREEN_SIZE.XL})`,
    ABOVE_DESKTOP: `@media (min-width: ${SCREEN_SIZE.XL})`,
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
