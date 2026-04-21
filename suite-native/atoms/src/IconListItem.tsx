import { type ReactNode } from 'react';
import { type FlexAlignType } from 'react-native';

import { type IconName, type IconSize } from '@suite-native/icons';
import { type Color, type NativeSpacing, type NativeTypographyStyle } from '@trezor/theme';

import { Box } from './Box';
import { OrderedListIcon } from './OrderedListIcon';
import { HStack } from './Stack';
import { Text } from './Text';

export const ICON_LIST_ITEM_VARIANTS = [
    'default',
    'blue',
    'red',
    'yellow',
    'primary',
    'brand',
] as const;

export type IconListItemVariant = (typeof ICON_LIST_ITEM_VARIANTS)[number];

type IconColors = {
    iconColor: Color;
    iconBorderColor: Color;
    iconBackgroundColor: Color;
};

const iconColorsMap = {
    default: {
        iconColor: 'contentPrimary',
        iconBorderColor: 'borderNeutral',
        iconBackgroundColor: 'legacyBackgroundTertiaryDefaultOnElevation1',
    },
    blue: {
        iconColor: 'contentInfo',
        iconBorderColor: 'legacyBackgroundAlertBlueSubtleOnElevation0',
        iconBackgroundColor: 'legacyBackgroundAlertBlueSubtleOnElevation1',
    },
    red: {
        iconColor: 'contentCritical',
        iconBorderColor: 'legacyBackgroundAlertRedSubtleOnElevation0',
        iconBackgroundColor: 'legacyBackgroundAlertRedSubtleOnElevation1',
    },
    yellow: {
        iconColor: 'contentWarning',
        iconBorderColor: 'legacyBackgroundAlertYellowSubtleOnElevation0',
        iconBackgroundColor: 'legacyBackgroundAlertYellowSubtleOnElevation1',
    },
    primary: {
        iconColor: 'contentPrimaryInverse',
        iconBorderColor: 'legacyBackgroundPrimaryDefault',
        iconBackgroundColor: 'legacyBackgroundPrimaryDefault',
    },
    brand: {
        iconColor: 'legacyBackgroundPrimaryDefault',
        iconBorderColor: 'legacyBackgroundPrimarySubtleOnElevationNegative',
        iconBackgroundColor: 'legacyBackgroundPrimarySubtleOnElevation0',
    },
} as const satisfies Record<IconListItemVariant, IconColors>;
export type IconListItemProps = {
    children: ReactNode;
    icon: IconName;
    iconSize?: IconSize;
    variant?: IconListItemVariant;
    verticalAlign?: FlexAlignType;
    spacing?: NativeSpacing | number;
};

export type IconListTextItemProps = IconListItemProps & {
    textVariant?: NativeTypographyStyle;
    textColor?: Color;
};

export const IconListItem = ({
    icon,
    children,
    iconSize = 'medium',
    variant = 'default',
    verticalAlign = 'center',
    spacing = 'sp12',
}: IconListItemProps) => {
    const iconColors = iconColorsMap[variant];

    return (
        <HStack spacing={spacing} alignItems={verticalAlign}>
            <OrderedListIcon iconName={icon} iconSize={iconSize} {...iconColors} />
            <Box flexShrink={1}>{children}</Box>
        </HStack>
    );
};

export const IconListTextItem = ({
    children,
    textVariant = 'body-sm',
    textColor,
    ...rest
}: IconListTextItemProps) => (
    <IconListItem {...rest}>
        <Text variant={textVariant} color={textColor}>
            {children}
        </Text>
    </IconListItem>
);
