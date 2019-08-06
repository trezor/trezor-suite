import { COINS, ICONS } from '../../config/variables';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type FeedbackType = 'success' | 'info' | 'warning' | 'error';

export type TrezorModel = 1 | 2;

// TODO: fix these types to use type literals
export type IconType = typeof ICONS[number];

export type CoinType = typeof COINS[number];

export type TrezorLogoType = 'horizontal' | 'vertical' | 'symbol';

export type TrezorLogoVariant = 'white' | 'black';
