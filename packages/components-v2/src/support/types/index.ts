import { ICONS } from '../../components/Icon/icons';

export type FeedbackType = 'success' | 'info' | 'warning' | 'error';

export type ButtonVariant = 'primary' | 'secondary';

export type ButtonSize = 'small' | 'medium' | 'large';

export type IconType = keyof typeof ICONS;

export type ParagraphSize = 'normal' | 'small' | 'tiny';

export type TrezorLogoType = 'horizontal' | 'vertical' | 'symbol';

export type TrezorLogoVariant = 'white' | 'black';
