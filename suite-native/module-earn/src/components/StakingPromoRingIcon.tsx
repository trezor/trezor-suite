import { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { Box } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { type NetworkColor } from '@trezor/network-module-suite-common-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { hexToRgba } from '@trezor/utils';

type StakingPromoRingIconProps = { networkColor?: NetworkColor } & (
    | { iconName: IconName; children?: never }
    | { iconName?: never; children: ReactNode }
);

const iconInnerContainerStyle = prepareNativeStyle(
    (utils, { hasGradient }: { hasGradient: boolean }) => ({
        backgroundColor: utils.colors.elementFillBrandSoft,
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
        backgroundColor: utils.colors.elementFillBrandSofter,
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

export const StakingPromoRingIcon = ({
    iconName,
    children,
    networkColor,
}: StakingPromoRingIconProps) => {
    const { applyStyle } = useNativeStyles();

    const gradientColors = networkColor
        ? ([hexToRgba(networkColor, 0.1), 'transparent'] as const)
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
                {iconName ? <Icon size={40} name={iconName} color="contentBrand" /> : children}
            </Box>
        </Box>
    );
};
