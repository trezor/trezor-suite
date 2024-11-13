import { ReactNode } from 'react';

import { IconName } from '@suite-native/icons';
import { Color } from '@trezor/theme';

import { Box } from './Box';
import { OrderedListIcon } from './OrderedListIcon';
import { HStack } from './Stack';
import { Text } from './Text';

type Variant = 'default' | 'red';
type IconColors = {
    iconColor: Color;
    iconBorderColor: Color;
    iconBackgroundColor: Color;
};

const iconColorsMap = {
    default: {
        iconColor: 'iconDefault',
        iconBorderColor: 'borderElevation1',
        iconBackgroundColor: 'backgroundTertiaryDefaultOnElevation1',
    },
    red: {
        iconColor: 'iconAlertRed',
        iconBorderColor: 'backgroundAlertRedSubtleOnElevation0',
        iconBackgroundColor: 'backgroundAlertRedSubtleOnElevation1',
    },
} as const satisfies Record<Variant, IconColors>;

type IconListItemProps = {
    children: ReactNode;
    icon: IconName;
    variant?: Variant;
};

export const IconListItem = ({ icon, children, variant = 'default' }: IconListItemProps) => {
    const iconColors = iconColorsMap[variant];

    return (
        <HStack spacing="sp12" alignItems="center">
            <OrderedListIcon iconName={icon} iconSize="medium" {...iconColors} />
            <Box flexShrink={1}>
                <Text variant="hint">{children}</Text>
            </Box>
        </HStack>
    );
};
