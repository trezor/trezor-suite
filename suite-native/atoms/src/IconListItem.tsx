import { type ReactNode } from 'react';
import { type FlexAlignType } from 'react-native';

import { type IconName, type IconSize } from '@suite-native/icons';
import { type Color, type NativeSpacing, type NativeTypographyStyle } from '@trezor/theme';

import { Box } from './Box';
import { OrderedListIcon } from './OrderedListIcon';
import { HStack } from './Stack';
import { Text } from './Text';

export const ICON_LIST_ITEM_VARIANTS = [
    'neutral',
    'info',
    'critical',
    'warning',
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
    neutral: {
        iconColor: 'contentPrimary',
        iconBorderColor: 'elementBorderNeutralSofter',
        iconBackgroundColor: 'elementFillNeutralSofter',
    },
    info: {
        iconColor: 'contentInfo',
        iconBorderColor: 'elementBorderInfoSofter',
        iconBackgroundColor: 'elementFillInfoSofter',
    },
    critical: {
        iconColor: 'contentCritical',
        iconBorderColor: 'elementBorderCriticalSofter',
        iconBackgroundColor: 'elementFillCriticalSofter',
    },
    warning: {
        iconColor: 'contentWarning',
        iconBorderColor: 'elementBorderWarningSofter',
        iconBackgroundColor: 'elementFillWarningSofter',
    },
    primary: {
        iconColor: 'contentPrimaryInverse',
        // `elementFillFieldSelected` has no matching border token, so this variant is borderless.
        iconBorderColor: 'transparent',
        iconBackgroundColor: 'elementFillFieldSelected',
    },
    brand: {
        iconColor: 'contentBrand',
        iconBorderColor: 'elementBorderBrandSofter',
        iconBackgroundColor: 'elementFillBrandSofter',
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
    variant = 'neutral',
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
