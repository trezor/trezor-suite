import { COINS as CoinsObject } from '../components/CoinLogo/coins';
import { IconsLegacy as IconsObject } from '../components/Icon/iconsLegacy';
import { CoinType } from '../components/CoinLogo/CoinLogo';
import { IconType } from '../components/Icon/IconLegacy';

export const SCREEN_SIZE = {
    UNAVAILABLE: '260px',
    SM: '576px', // phones
    MD: '768px', // tablets
    LG: '992px', // laptops/desktops
    XL: '1200px', // extra Large laptops/desktops
} as const;

// Temporary solution to enable the simultaneous use of above and below breakpoints, ideally SCREEN SIZE should be just numbers IMO
const HELPER_SCREEN_SIZE = {
    SM: '575px', // phones
    MD: '767px', // tablets
    LG: '991px', // laptops/desktops
    XL: '1199px', // extra Large laptops/desktops
};

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

export const COINS = Object.keys(CoinsObject).sort() as CoinType[];
export const ICONS = Object.keys(IconsObject).sort() as IconType[];
