import { ICONS } from '../../components/assets/Icon/icons';
import { FLAGS } from '../../components/assets/Flag/flags';
import { ReactNode } from 'react';
import { COINS } from '../../components/assets/CoinLogo/coins';
import { THEME } from '../../config/colors';

export type TextAlign = 'left' | 'center' | 'right';

export type InputState = 'success' | 'warning' | 'error'; // TODO: remove success

export type InputSize = 'small' | 'large';

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

// extracts values for common props (eg. NEUE_BG_GREEN: "#00854D" | "#e3ede0")
type CommonThemeProps = {
    [K in keyof LightThemeProps & keyof DarkThemeProps]: LightThemeProps[K] | DarkThemeProps[K];
};

type PropsOnlyInLightTheme = Omit<LightThemeProps, keyof DarkThemeProps>;
type PropsOnlyInDarkTheme = Omit<DarkThemeProps, keyof LightThemeProps>;

// all common theme props and their values are nicely listed, props that are specific to given theme are marked optional
export type SuiteThemeColors = CommonThemeProps &
    Partial<PropsOnlyInDarkTheme> &
    Partial<PropsOnlyInLightTheme>;
