import { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { coinsColors } from '@trezor/theme';
import { hexToRgba } from '@trezor/utils';

type StakingPromoRingIconProps = { symbol?: NetworkSymbol } & (
    | { iconName: IconName; children?: never }
    | { iconName?: never; children: ReactNode }
);

const iconInnerContainerStyle = prepareNativeStyle(
    (utils, { hasGradient }: { hasGradient: boolean }) => ({
        backgroundColor: utils.colors.legacyBackgroundPrimarySubtleOnElevation1,
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: utils.borders.radii.round,
        overflow: 'hidden',
        extend: [
            {
                condition: hasGradient,
                style: { backgroundColor: 'transparent' },
            },
        ],
    }),
);

const iconOuterContainerStyle = prepareNativeStyle(
    (utils, { hasGradient }: { hasGradient: boolean }) => ({
        backgroundColor: utils.colors.legacyBackgroundPrimarySubtleOnElevationNegative,
        width: 104,
        height: 104,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: utils.borders.radii.round,
        marginBottom: utils.spacings.sp20,
        overflow: 'hidden',
        extend: [
            {
                condition: hasGradient,
                style: { backgroundColor: 'transparent' },
            },
        ],
    }),
);

export const StakingPromoRingIcon = ({ iconName, children, symbol }: StakingPromoRingIconProps) => {
    const { applyStyle } = useNativeStyles();

    const coinColor = symbol ? coinsColors[symbol] : undefined;
    const gradientColors = coinColor
        ? ([hexToRgba(coinColor, 0.1), 'transparent'] as const)
        : undefined;
    const hasGradient = gradientColors !== undefined;

    return (
        <Box style={applyStyle(iconOuterContainerStyle, { hasGradient })}>
            {hasGradient && (
                <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
            )}
            <Box style={applyStyle(iconInnerContainerStyle, { hasGradient })}>
                {hasGradient && (
                    <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
                )}
                {iconName ? (
                    <Icon size={40} name={iconName} color="legacyBackgroundPrimaryDefault" />
                ) : (
                    children
                )}
            </Box>
        </Box>
    );
};
