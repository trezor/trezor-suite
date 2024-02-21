import { ReactNode } from 'react';

import { Color, TypographyStyle } from '@trezor/theme';

import { Box } from './Box';
import { Text } from './Text';

const INDENTED_BULLET_POINT_SYMBOL = ' \u2022 ';

type BulletListItemProps = {
    children: ReactNode;
    variant?: TypographyStyle;
    color?: Color;
};

export const BulletListItem = ({ children, variant, color }: BulletListItemProps) => (
    <Box flexDirection="row">
        <Text variant={variant} color={color}>
            {INDENTED_BULLET_POINT_SYMBOL}
        </Text>
        <Box flexShrink={1}>
            <Text variant={variant} color={color}>
                {children}
            </Text>
        </Box>
    </Box>
);
