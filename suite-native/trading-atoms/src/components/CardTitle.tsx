import { type ReactNode } from 'react';

import { Box, Text } from '@suite-native/atoms';

export type CardTitleProps = {
    children: ReactNode;
};

export const CardTitle = ({ children }: CardTitleProps) => (
    <Box paddingHorizontal="sp8" flex={1}>
        <Text variant="body-sm" color="contentPrimary" numberOfLines={1}>
            {children}
        </Text>
    </Box>
);
