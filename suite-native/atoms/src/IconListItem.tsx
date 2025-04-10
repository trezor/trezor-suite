import { ReactNode } from 'react';
import { FlexAlignType } from 'react-native';

import { IconName, IconSize } from '@suite-native/icons';
import { Color, NativeSpacing, NativeTypographyStyle } from '@trezor/theme';

import { Box } from './Box';
import { OrderedListIcon } from './OrderedListIcon';
import { HStack } from './Stack';
import { Text } from './Text';

type Variant = 'default' | 'red' | 'yellow' | 'primary';
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
} as const satisfies Record<Variant, IconColors>;

type IconListItemProps = {
    children: ReactNode;
    icon: IconName;
    iconSize?: IconSize;
    variant?: Variant;
    verticalAlign?: FlexAlignType;
    spacing?: NativeSpacing | number;
};

type IconListTextItemProps = IconListItemProps & {
    textVariant?: NativeTypographyStyle;
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
    textVariant = 'hint',
    ...rest
}: IconListTextItemProps) => (
    <IconListItem {...rest}>
        <Text variant={textVariant}>{children}</Text>
    </IconListItem>
);
