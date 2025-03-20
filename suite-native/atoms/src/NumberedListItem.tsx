import { ReactNode } from 'react';

import { Color, NativeTypographyStyle } from '@trezor/theme';

import { Box } from './Box';
import { HStack } from './Stack';
import { Text } from './Text';

type NumberedListItemProps = {
    children: ReactNode;
    variant?: NativeTypographyStyle;
    color?: Color;
    number: number;
};

const numberStyle = {
    minWidth: 16,
};

export const NumberedListItem = ({ children, variant, color, number }: NumberedListItemProps) => (
    <HStack>
        <Box style={numberStyle}>
            <Text variant={variant} color={color}>
                {number}.
            </Text>
        </Box>
        <Box flexShrink={1}>
            <Text variant={variant} color={color}>
                {children}
            </Text>
        </Box>
    </HStack>
);
