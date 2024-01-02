import { IconType, CoinType } from '../support/types';
import { COINS as CoinsObject } from '../components/assets/CoinLogo/coins';
import { ICONS as IconsObject } from '../components/assets/Icon/icons';

export const SCREEN_SIZE = {
    UNAVAILABLE: '260px',
    SM: '576px', // phones
    MD: '768px', // tablets
    LG: '992px', // laptops/desktops
    XL: '1200px', // extra Large laptops/desktops
} as const;

// Temporary solution to enable the simultaious use of above and below breakpoints, ideally SCREEN SIZE should be just numbers IMO
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
    BELOW_DESKTOP: `@media (min-width: ${HELPER_SCREEN_SIZE.XL})`,
    ABOVE_DESKTOP: `@media (min-width: ${SCREEN_SIZE.XL})`,
} as const;

export const MEDIA_QUERY = {
    TOUCH: '@media (hover: none)',
    HOVER: '@media (hover: hover)',
    DARK_THEME: '@media (prefers-color-scheme: dark)',
} as const;

export const LAYOUT_SIZE = {
    MENU_SECONDARY_WIDTH: '300px',
    /** Guide width including border */
    GUIDE_PANEL_WIDTH: '350px',
    /** Guide width without border */
    GUIDE_PANEL_CONTENT_WIDTH: '349px',
} as const;

export const Z_INDEX = {
    TOOLTIP: 60, // above all content to be always fully visible when toggled
    GUIDE: 50, // above MODAL to stay accessible when modal is open
    GUIDE_BUTTON: 49, // below GUIDE to get covered by the guide when it is opening
    MODAL: 40, // above other suite content to disable interating with it
    NAVIGATION_BAR: 30,
    DISCOVERY_PROGRESS: 29, // below NAVIGATION_BAR to stay below notifications
    EXPANDABLE_NAVIGATION_HEADER: 21, // above EXPANDABLE_NAVIGATION to cover its box-shadow
    EXPANDABLE_NAVIGATION: 20, // above PAGE_HEADER to spread over it
    PAGE_HEADER: 11, // above STICKY_BAR to hide it when the page is on top
    STICKY_BAR: 10, // above page content to scroll over it
    SECONDARY_STICKY_BAR: 9, // below STICKY_BAR so that it can hide beneath it when no longer needed
    ONBOARDING_FOREGROUND: 2, // for handling multiple layers on the onboarding page
    BASE: 1, // above static content to be fully visible
} as const;

export const FONT_SIZE = {
    BIG: '18px',
    NORMAL: '16px',
    SMALL: '14px',
    TINY: '12px',
    H1: '36px',
    H2: '24px',
    H3: '20px',
} as const;

export const NEUE_FONT_SIZE = {
    NANO: '10px',
    TINY: '12px',
    SMALL: '14px',
    NORMAL: '16px',
    H1: '24px',
    H2: '20px',
} as const;

export const FONT_WEIGHT = {
    LIGHT: 300,
    REGULAR: 400,
    MEDIUM: 500,
    DEMI_BOLD: 600,
    BOLD: 700,
} as const;

export const FONT_FAMILY = {
    TTHOVES: 'TT Hoves',
} as const;

export const COINS = Object.keys(CoinsObject).sort() as CoinType[];
export const ICONS = Object.keys(IconsObject).sort() as IconType[];
