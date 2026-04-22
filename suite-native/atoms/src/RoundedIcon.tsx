import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { CryptoIcon, Icon, type IconName, type IconSize, icons } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { Box, type BoxProps } from './Box';

export const ROUNDED_ICON_INTENTS = ['neutral', 'brand', 'warning', 'critical', 'info'] as const;
export type RoundedIconIntent = (typeof ROUNDED_ICON_INTENTS)[number];

export const ROUNDED_ICON_SIZES = [20, 24, 32, 40, 48] as const;
export type RoundedIconSize = (typeof ROUNDED_ICON_SIZES)[number];

export type RoundedIconProps = {
    name?: IconName;
    symbol?: NetworkSymbol;
    contractAddress?: TokenAddress;
    intent?: RoundedIconIntent;
    size?: RoundedIconSize;
} & BoxProps;

type RoundedIconStyle = {
    backgroundColor: Color;
    iconColor: Color;
};

const roundedIconIntentToStylePropsMap = {
    neutral: {
        backgroundColor: 'elementFillNeutralSoft',
        iconColor: 'contentSecondary',
    },
    brand: {
        backgroundColor: 'elementFillBrandSoft',
        iconColor: 'contentBrand',
    },
    warning: {
        backgroundColor: 'elementFillWarningSoft',
        iconColor: 'contentWarning',
    },
    critical: {
        backgroundColor: 'elementFillCriticalSoft',
        iconColor: 'contentCritical',
    },
    info: {
        backgroundColor: 'elementFillInfoSoft',
        iconColor: 'contentInfo',
    },
} as const satisfies Record<RoundedIconIntent, RoundedIconStyle>;

const roundedIconSizeToIconSizeMap: Record<RoundedIconSize, IconSize> = {
    20: 'small',
    24: 'small',
    32: 'medium',
    40: 'mediumLarge',
    48: 'large',
};

const iconContainerStyle = prepareNativeStyle<{ backgroundColor: Color; size: RoundedIconSize }>(
    (utils, { backgroundColor, size }) => ({
        justifyContent: 'center',
        alignItems: 'center',
        width: size,
        height: size,
        backgroundColor: utils.colors[backgroundColor],
        borderRadius: utils.borders.radii.round,
    }),
);

export const RoundedIcon = ({
    name,
    symbol,
    contractAddress,
    intent = 'neutral',
    size = 48,
    style,
    ...boxProps
}: RoundedIconProps) => {
    const { applyStyle } = useNativeStyles();
    const { backgroundColor, iconColor } = roundedIconIntentToStylePropsMap[intent];
    const iconSize = roundedIconSizeToIconSizeMap[size];

    return (
        <Box
            style={[applyStyle(iconContainerStyle, { backgroundColor, size }), style]}
            {...boxProps}
        >
            {name && name in icons ? (
                <Icon name={name as IconName} color={iconColor} size={iconSize} />
            ) : (
                symbol && <CryptoIcon symbol={symbol} contractAddress={contractAddress} />
            )}
        </Box>
    );
};
