import { ICONS } from '../../components/Icon/icons';
import { FLAGS } from '../../components/Flag/flags';
import { ReactNode } from 'react';
import { COINS } from '../../components/logos/CoinLogo/coins';
import { THEME } from '../../config/colors';

export type TextAlign = 'left' | 'center' | 'right';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';

export type ButtonSize = 'small' | 'large';

export type InputState = 'success' | 'warning' | 'error';

export type InputVariant = 'small' | 'medium' | 'large';

export interface InputButton {
    icon?: IconType;
    text?: ReactNode;
    iconSize?: number;
    iconColor?: string;
    iconColorHover?: string;
    isDisabled?: boolean;
    onClick: () => void;
}

export type IconType = keyof typeof ICONS;

export type CoinType = keyof typeof COINS;

export type FlagType = keyof typeof FLAGS;

export type ParagraphSize = 'normal' | 'small' | 'tiny';

export type TrezorLogoType =
    | 'horizontal'
    | 'vertical'
    | 'symbol'
    | 'suite'
    | 'suite_square'
    | 'suite_compact';

export type TrezorLogoVariant = 'white' | 'black';

type LightThemeProps = typeof THEME.light;
type DarkThemeProps = typeof THEME.dark;

// extracts values for common props (eg. NEUE_BG_GREEN: "#39a814" | "#5ea447")
type CommonThemeProps = {
    [K in keyof LightThemeProps & keyof DarkThemeProps]: LightThemeProps[K] | DarkThemeProps[K];
};

type PropsOnlyInLightTheme = Omit<LightThemeProps, keyof DarkThemeProps>;
type PropsOnlyInDarkTheme = Omit<DarkThemeProps, keyof LightThemeProps>;

// all common theme props and their values are nicely listed, props that are specific to given theme are marked optional
export type SuiteThemeColors = CommonThemeProps &
    Partial<PropsOnlyInDarkTheme> &
    Partial<PropsOnlyInLightTheme>;
