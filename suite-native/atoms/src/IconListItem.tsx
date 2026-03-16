import { type ReactNode } from 'react';
import { type FlexAlignType } from 'react-native';

import { type IconName, type IconSize } from '@suite-native/icons';
import { type Color, type NativeSpacing, type NativeTypographyStyle } from '@trezor/theme';

import { Box } from './Box';
import { OrderedListIcon } from './OrderedListIcon';
import { HStack } from './Stack';
import { Text } from './Text';

export const ICON_LIST_ITEM_VARIANTS = ['default', 'blue', 'red', 'yellow', 'primary'] as const;

export type IconListItemVariant = (typeof ICON_LIST_ITEM_VARIANTS)[number];

type IconColors = {
    iconColor: Color;
    iconBorderColor: Color;
    iconBackgroundColor: Color;
};

const iconColorsMap = {
    default: {
        iconColor: 'iconDefault',
        iconBorderColor: 'borderElevation0',
        iconBackgroundColor: 'backgroundTertiaryDefaultOnElevation1',
    },
    blue: {
        iconColor: 'iconAlertBlue',
        iconBorderColor: 'backgroundAlertBlueSubtleOnElevation0',
        iconBackgroundColor: 'backgroundAlertBlueSubtleOnElevation1',
    },
    red: {
        iconColor: 'iconAlertRed',
        iconBorderColor: 'backgroundAlertRedSubtleOnElevation0',
        iconBackgroundColor: 'backgroundAlertRedSubtleOnElevation1',
    },
    yellow: {
        iconColor: 'iconAlertYellow',
        iconBorderColor: 'backgroundAlertYellowSubtleOnElevation0',
        iconBackgroundColor: 'backgroundAlertYellowSubtleOnElevation1',
    },
    primary: {
        iconColor: 'iconDefaultInverted',
        iconBorderColor: 'backgroundPrimaryDefault',
        iconBackgroundColor: 'backgroundPrimaryDefault',
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
