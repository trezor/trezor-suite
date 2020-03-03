import { ICONS } from '../../components/Icon/icons';
import { COINS } from '../../components/logos/CoinLogo/coins';

export type TextAlign = 'left' | 'center' | 'right';

export type FeedbackState = 'success' | 'info' | 'warning' | 'error';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';

export type ButtonSize = 'small' | 'large';

export type InputState = 'success' | 'warning' | 'error';

export type InputVariant = 'small' | 'large';

export type InputDisplay = 'block' | 'default' | 'short';

export interface InputButton {
    icon?: IconType;
    text?: string;
    iconSize?: number;
    iconColor?: string;
    iconColorHover?: string;
    isDisabled?: boolean;
    onClick: () => void;
}

export type IconType = keyof typeof ICONS;

export type CoinType = keyof typeof COINS;

export type ParagraphSize = 'normal' | 'small' | 'tiny';

export type TrezorLogoType = 'horizontal' | 'vertical' | 'symbol';

export type TrezorLogoVariant = 'white' | 'black';
