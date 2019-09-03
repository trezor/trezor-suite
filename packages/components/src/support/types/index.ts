import { COINS, ICONS } from '../../config/variables';

export type FeedbackType = 'success' | 'info' | 'warning' | 'error';

export type IconType = typeof ICONS[number];

export type CoinType = typeof COINS[number];

export type TrezorLogoType = 'horizontal' | 'vertical' | 'symbol';

export type TrezorLogoVariant = 'white' | 'black';
