import { ReactNode } from 'react';

import { Color, TypographyStyle } from '@trezor/theme';

import { Box } from './Box';
import { Text } from './Text';
import { HStack } from './Stack';

type NumberedListItemProps = {
    children: ReactNode;
    variant?: TypographyStyle;
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
