import { ReactNode } from 'react';

import { G } from '@mobily/ts-belt';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    Icon,
    IconSize,
    IconName,
    CryptoIconName,
    icons,
    CryptoIcon,
} from '@suite-common/icons-deprecated';
import { Color } from '@trezor/theme';

import { Text } from './Text';
import { HStack } from './Stack';
import { SurfaceElevation } from './types';
import { BoxProps } from './Box';

export type BadgeVariant = 'neutral' | 'green' | 'greenSubtle' | 'yellow' | 'red' | 'bold';
export type BadgeSize = 'small' | 'medium';
type BadgeProps = {
    label: ReactNode;
    variant?: BadgeVariant;
    size?: BadgeSize;
    icon?: IconName | CryptoIconName;
    iconSize?: IconSize;
    elevation?: SurfaceElevation;
    isDisabled?: boolean;
    style?: BoxProps['style'];
};

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
        paddingVertical: utils.spacings.sp8 / 4,
        borderRadius: utils.borders.radii.round,
        extend: [
            {
                condition: isDisabled,
                style: {
                    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation0,
                },
            },
            {
                condition: G.isNotNullable(borderColor),
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
}: BadgeProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const {
        backgroundColorElevation0,
        backgroundColorElevation1,
        activeTextColor,
        activeIconColor,
        borderColor,
    } = badgeVariantToStylePropsMap[variant];

    const textVariant = size === 'medium' ? 'hint' : 'label';
    const textColor = isDisabled ? 'textDisabled' : activeTextColor;
    const iconColor = isDisabled ? 'iconDisabled' : activeIconColor;
    const backgroundColor =
        elevation === '0' ? backgroundColorElevation0 : backgroundColorElevation1;

    const badgeIcon =
        icon && icon in icons ? (
            <Icon name={icon as IconName} color={iconColor} size={iconSize ?? 'small'} />
        ) : (
            <CryptoIcon
                symbol={icon as CryptoIconName}
                size={size === 'small' ? 'extraSmall' : 'small'}
            />
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
        >
            {icon && badgeIcon}
            <Text color={textColor} variant={textVariant} numberOfLines={1} ellipsizeMode="tail">
                {label}
            </Text>
        </HStack>
    );
};
