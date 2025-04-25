import { ReactNode } from 'react';

import { Box, Text } from '@suite-native/atoms';

export type BuyCardTitleProps = {
    children: ReactNode;
};

export const BuyCardTitle = ({ children }: BuyCardTitleProps) => (
    <Box paddingHorizontal="sp8">
        <Text variant="body" color="textDefault">
            {children}
        </Text>
    </Box>
);
