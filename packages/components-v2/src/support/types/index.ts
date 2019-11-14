import { COINS, ICONS } from '../../config/variables';

export type FeedbackType = 'success' | 'warning' | 'error';

export type ButtonVariant = 'primary' | 'secondary';

export type ButtonSize = 'small' | 'medium' | 'large';

export type IconType = typeof ICONS[number];

export type CoinType = typeof COINS[number];

export type TrezorLogoType = 'horizontal' | 'vertical' | 'symbol';

export type TrezorLogoVariant = 'white' | 'black';
