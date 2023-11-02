import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon, IconSize, IconName, CryptoIconName, icons, CryptoIcon } from '@suite-common/icons';
import { Color } from '@trezor/theme';

import { Text } from './Text';
import { HStack } from './Stack';
import { SurfaceElevation } from './types';

export type BadgeVariant = 'neutral' | 'green' | 'red' | 'bold';
export type BadgeSize = 'small' | 'medium';
type BadgeProps = {
    label: string;
    variant?: BadgeVariant;
    size?: BadgeSize;
    icon?: IconName | CryptoIconName;
    iconSize?: IconSize;
    elevation?: SurfaceElevation;
    isDisabled?: boolean;
};

type BadgeStyle = {
    backgroundColorElevation0: Color;
    backgroundColorElevation1: Color;
    activeTextColor: Color;
    activeIconColor: Color;
};

type BadgeStyleProps = {
    backgroundColor: Color;
    isDisabled: boolean;
    size?: BadgeSize;
};

const BadgeStyle = prepareNativeStyle<BadgeStyleProps>(
    (utils, { backgroundColor, isDisabled, size }) => ({
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        backgroundColor: utils.colors[backgroundColor],
        paddingHorizontal: utils.spacings.small - (size === 'medium' ? 0 : 2),
        paddingVertical: utils.spacings.small / 4,
        borderRadius: utils.borders.radii.round,
        extend: [
            {
                condition: isDisabled,
                style: {
                    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation0,
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
    },
    green: {
        backgroundColorElevation0: 'backgroundPrimarySubtleOnElevation0',
        backgroundColorElevation1: 'backgroundPrimarySubtleOnElevation1',
        activeTextColor: 'textPrimaryDefault',
        activeIconColor: 'iconPrimaryDefault',
    },
    red: {
        backgroundColorElevation0: 'backgroundAlertRedSubtleOnElevation0',
        backgroundColorElevation1: 'backgroundAlertRedSubtleOnElevation1',
        activeTextColor: 'textAlertRed',
        activeIconColor: 'iconAlertRed',
    },
    bold: {
        backgroundColorElevation0: 'backgroundNeutralBold',
        backgroundColorElevation1: 'backgroundNeutralBold',
        activeTextColor: 'textOnPrimary',
        activeIconColor: 'iconOnPrimary',
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
}: BadgeProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const {
        backgroundColorElevation0,
        backgroundColorElevation1,
        activeTextColor,
        activeIconColor,
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
            style={applyStyle(BadgeStyle, {
                backgroundColor,
                isDisabled,
                size,
            })}
            spacing={utils.spacings.extraSmall}
        >
            {icon && badgeIcon}
            <Text color={textColor} variant={textVariant} numberOfLines={1} ellipsizeMode="tail">
                {label}
            </Text>
        </HStack>
    );
};
