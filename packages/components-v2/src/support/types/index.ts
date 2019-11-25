import { ICONS } from '../../components/Icon/icons';

export type FeedbackType = 'success' | 'info' | 'warning' | 'error';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';

export type ButtonSize = 'small' | 'medium' | 'large';

export type IconType = keyof typeof ICONS;

export type TrezorLogoType = 'horizontal' | 'vertical' | 'symbol';

export type TrezorLogoVariant = 'white' | 'black';
