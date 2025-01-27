import { ReactNode } from 'react';

import { Box, Text } from '@suite-native/atoms';
import { Color, TypographyStyle } from '@trezor/theme';

type OrderedListItemProps = {
    children: ReactNode;
    order: number;
    variant?: TypographyStyle;
    color?: Color;
};

export const OrderedListItem = ({ children, order, variant, color }: OrderedListItemProps) => (
    <Box flexDirection="row">
        <Text variant={variant} color={color}>
            {order}.
        </Text>
        <Box flexShrink={1} paddingLeft="sp8">
            <Text variant={variant} color={color}>
                {children}
            </Text>
        </Box>
    </Box>
);
