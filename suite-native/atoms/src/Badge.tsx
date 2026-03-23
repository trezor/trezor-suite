import { type ReactNode } from 'react';

import { type NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import { CryptoIcon, Icon, type IconName, type IconSize, icons } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { type Color } from '@trezor/theme';
import { isNotNullOrUndefined } from '@trezor/utils';

import { type BoxProps } from './Box';
import { HStack } from './Stack';
import { Text } from './Text';
import { type SurfaceElevation } from './types';

export const BADGE_VARIANTS = [
    'neutral',
    'green',
    'greenSubtle',
    'yellow',
    'red',
    'blue',
    'bold',
] as const;
export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

export const BADGE_SIZES = ['small', 'medium'] as const;
export type BadgeSize = (typeof BADGE_SIZES)[number];

type IconType = IconName | NetworkSymbol;
export type BadgeProps = {
    label: ReactNode;
    variant?: BadgeVariant;
    size?: BadgeSize;
    icon?: IconType;
    iconSize?: IconSize;
    elevation?: SurfaceElevation;
    isDisabled?: boolean;
} & BoxProps;

type BadgeStyle = {
    backgroundColorElevation0: Color;
    backgroundColorElevation1: Color;
    activeTextColor: Color;
    activeIconColor: Color;
    borderColor?: Color;
};

type BadgeStyleProps = {
    backgroundColor: Color;
    isDisabled: boolean;
    size?: BadgeSize;
    borderColor?: Color;
};

const badgeStyle = prepareNativeStyle<BadgeStyleProps>(
    (utils, { backgroundColor, isDisabled, size, borderColor }) => ({
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: utils.colors[backgroundColor],
        paddingHorizontal: utils.spacings.sp8 - (size === 'medium' ? 0 : 2),
        paddingVertical: utils.spacings.sp2,
        borderRadius: utils.borders.radii.round,
        extend: [
            {
                condition: isDisabled,
                style: {
                    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation0,
                },
            },
            {
                condition: isNotNullOrUndefined(borderColor),
                style: {
                    borderColor: utils.colors[borderColor!],
                    borderWidth: utils.borders.widths.small,
                },
            },
        ],
    }),
);

const badgeVariantToStylePropsMap = {
    neutral: {
        backgroundColorElevation0: 'backgroundNeutralSubtleOnElevation0',
        backgroundColorElevation1: 'backgroundNeutralSubtleOnElevation1',
        activeTextColor: 'textSubdued',
        activeIconColor: 'iconSubdued',
        borderColor: undefined,
    },
    green: {
        backgroundColorElevation0: 'backgroundPrimaryDefault',
        backgroundColorElevation1: 'backgroundPrimaryDefault',
        activeTextColor: 'textOnPrimary',
        activeIconColor: 'iconOnPrimary',
        borderColor: undefined,
    },
    greenSubtle: {
        backgroundColorElevation0: 'backgroundPrimarySubtleOnElevation0',
        backgroundColorElevation1: 'backgroundPrimarySubtleOnElevation1',
        activeTextColor: 'textPrimaryDefault',
        activeIconColor: 'iconPrimaryDefault',
        borderColor: undefined,
    },
    yellow: {
        backgroundColorElevation0: 'backgroundAlertYellowSubtleOnElevation0',
        backgroundColorElevation1: 'backgroundAlertYellowSubtleOnElevation1',
        activeTextColor: 'textAlertYellow',
        activeIconColor: 'iconAlertYellow',
        borderColor: 'backgroundAlertYellowSubtleOnElevationNegative',
    },
    red: {
        backgroundColorElevation0: 'backgroundAlertRedSubtleOnElevation0',
        backgroundColorElevation1: 'backgroundAlertRedSubtleOnElevation1',
        activeTextColor: 'textAlertRed',
        activeIconColor: 'iconAlertRed',
        borderColor: undefined,
    },
    blue: {
        backgroundColorElevation0: 'backgroundAlertBlueSubtleOnElevation0',
        backgroundColorElevation1: 'backgroundAlertBlueSubtleOnElevation1',
        activeTextColor: 'textAlertBlue',
        activeIconColor: 'iconAlertBlue',
        borderColor: undefined,
    },
    bold: {
        backgroundColorElevation0: 'backgroundNeutralBold',
        backgroundColorElevation1: 'backgroundNeutralBold',
        activeTextColor: 'textOnPrimary',
        activeIconColor: 'iconOnPrimary',
        borderColor: undefined,
    },
} as const satisfies Record<BadgeVariant, BadgeStyle>;

export const Badge = ({
    label,
    icon,
    iconSize,
    size = 'medium',
    variant = 'neutral',
    elevation = '0',
    isDisabled = false,
    style,
    ...boxProps
}: BadgeProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const {
        backgroundColorElevation0,
        backgroundColorElevation1,
        activeTextColor,
        activeIconColor,
        borderColor,
    } = badgeVariantToStylePropsMap[variant];

    const textVariant = size === 'medium' ? 'body-sm' : 'body-xs';
    const textColor = isDisabled ? 'textDisabled' : activeTextColor;
    const iconColor = isDisabled ? 'iconDisabled' : activeIconColor;
    const backgroundColor =
        elevation === '0' ? backgroundColorElevation0 : backgroundColorElevation1;

    const getCryptoIcon = (iconInput: IconType) =>
        isNetworkSymbol(iconInput) ? (
            <CryptoIcon symbol={iconInput} size={size === 'small' ? 'extraSmall' : 'small'} />
        ) : null;

    const getBadgeIcon = (iconInput: IconType) =>
        iconInput in icons ? (
            <Icon name={icon as IconName} color={iconColor} size={iconSize ?? 'small'} />
        ) : (
            getCryptoIcon(iconInput)
        );

    return (
        <HStack
            style={[
                applyStyle(badgeStyle, {
                    backgroundColor,
                    isDisabled,
                    size,
                    borderColor,
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
