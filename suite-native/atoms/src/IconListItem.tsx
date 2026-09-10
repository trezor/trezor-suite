import { type ReactNode } from 'react';
import { type FlexAlignType } from 'react-native';

import { type IconName } from '@suite-native/icons';
import { type Color, type NativeSpacing, type NativeTypographyStyle } from '@trezor/theme';

import { Box } from './Box';
import { IconSquare, type IconSquareSize } from './Icon/IconSquare';
import { HStack } from './Stack';
import { Text } from './Text';

export const ICON_LIST_ITEM_VARIANTS = ['neutral', 'info', 'critical', 'warning', 'brand'] as const;

export type IconListItemVariant = (typeof ICON_LIST_ITEM_VARIANTS)[number];

export type IconListItemProps = {
    children: ReactNode;
    icon: IconName;
    iconSize?: IconSquareSize;
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
    iconSize,
    variant = 'neutral',
    verticalAlign = 'center',
    spacing = 'sp12',
}: IconListItemProps) => (
    <HStack spacing={spacing} alignItems={verticalAlign}>
        <IconSquare iconName={icon} intent={variant} size={iconSize} />
        <Box flexShrink={1}>{children}</Box>
    </HStack>
);

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
