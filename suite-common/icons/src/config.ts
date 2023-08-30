import { TokenAddress } from 'suite-common/wallet-types/src';

import { Color } from '@trezor/theme';

import { IconName, FlagIconName, CryptoIconName } from './icons';

export interface IconProps {
    name: IconName;
    size?: IconSize | number;
    color?: Color;
}

export const iconSizes = {
    extraSmall: 8,
    small: 12,
    medium: 16,
    mediumLarge: 20,
    large: 24,
    extraLarge: 32,
} as const;

export type IconSize = keyof typeof iconSizes;

export const getIconSize = (size: IconSize | number) =>
    typeof size === 'string' ? iconSizes[size] : size;

export interface FlagIconProps {
    name: FlagIconName;
    size?: FlagIconSize;
}

export const flagIconSizes = {
    extraSmall: 16,
    small: 24,
    medium: 30,
} as const;

type FlagIconSize = keyof typeof flagIconSizes;

export type CoinSymbol = CryptoIconName | TokenAddress;

export interface CryptoIconProps {
    symbol: CoinSymbol;
    size?: CryptoIconSize;
}

export const cryptoIconSizes = {
    extraSmall: 16,
    small: 24,
    large: 42,
} as const;

export type CryptoIconSize = keyof typeof cryptoIconSizes;
