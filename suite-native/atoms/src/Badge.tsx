import { type ReactNode } from 'react';

import { type NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import { CryptoIcon, Icon, type IconName, type IconSize, icons } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { type BoxProps } from './Box';
import { HStack } from './Stack';
import { Text } from './Text';

export const BADGE_INTENTS = [
    'neutral',
    'brand',
    'brandBold',
    'warning',
    'critical',
    'info',
    'bold',
] as const;
export type BadgeIntent = (typeof BADGE_INTENTS)[number];

export const BADGE_SIZES = ['small', 'medium'] as const;
export type BadgeSize = (typeof BADGE_SIZES)[number];

type IconType = IconName | NetworkSymbol;
export type BadgeProps = {
    label: ReactNode;
    intent?: BadgeIntent;
    size?: BadgeSize;
    icon?: IconType;
} & BoxProps;

type BadgeStyle = {
    backgroundColor: Color;
    textColor: Color;
};

type BadgeStyleProps = {
    backgroundColor: Color;
    size?: BadgeSize;
};

const badgeStyle = prepareNativeStyle<BadgeStyleProps>((utils, { backgroundColor, size }) => ({
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: utils.colors[backgroundColor],
    paddingHorizontal: size === 'medium' ? utils.spacings.sp8 : utils.spacings.sp6,
    paddingVertical: utils.spacings.sp2,
    borderRadius: utils.borders.radii.round,
}));

const badgeIntentToStylePropsMap = {
    neutral: {
        backgroundColor: 'legacyBackgroundNeutralSubtleOnElevation0',
        textColor: 'contentSecondary',
    },
    brand: {
        backgroundColor: 'legacyBackgroundPrimarySubtleOnElevation0',
        textColor: 'contentBrand',
    },
    brandBold: {
        backgroundColor: 'legacyBackgroundPrimaryDefault',
        textColor: 'contentPrimaryInverse',
    },
    warning: {
        backgroundColor: 'legacyBackgroundAlertYellowSubtleOnElevation0',
        textColor: 'contentWarning',
    },
    critical: {
        backgroundColor: 'legacyBackgroundAlertRedSubtleOnElevation0',
        textColor: 'contentCritical',
    },
    info: {
        backgroundColor: 'legacyBackgroundAlertBlueSubtleOnElevation0',
        textColor: 'contentInfo',
    },
    bold: {
        backgroundColor: 'legacyBackgroundNeutralBold',
        textColor: 'contentPrimaryInverse',
    },
} as const satisfies Record<BadgeIntent, BadgeStyle>;

export const Badge = ({
    label,
    icon,
    size = 'medium',
    intent = 'neutral',
    style,
    ...boxProps
}: BadgeProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { backgroundColor, textColor } = badgeIntentToStylePropsMap[intent];

    const textVariant = size === 'medium' ? 'body-sm' : 'body-xs';
    const iconSize: IconSize = size === 'small' ? 'medium' : 'mediumLarge';

    const getCryptoIcon = (iconInput: IconType) =>
        isNetworkSymbol(iconInput) ? (
            <CryptoIcon symbol={iconInput} size={size === 'small' ? 'extraSmall' : 'small'} />
        ) : null;

    const getBadgeIcon = (iconInput: IconType) =>
        iconInput in icons ? (
            <Icon name={icon as IconName} color={textColor} size={iconSize} />
        ) : (
            getCryptoIcon(iconInput)
        );

    return (
        <HStack
            style={[
                applyStyle(badgeStyle, {
                    backgroundColor,
                    size,
                }),
                style,
            ]}
            spacing={utils.spacings.sp4}
            {...boxProps}
        >
            {icon && getBadgeIcon(icon)}
            <Text color={textColor} variant={textVariant} numberOfLines={1} ellipsizeMode="tail">
                {label}
            </Text>
        </HStack>
    );
};
