import React, { ReactNode } from 'react';

import { Box, Text, VStack } from '@suite-native/atoms';

type DashboardSectionProps = {
    children: ReactNode;
    title: string;
};

export const DashboardSection = ({ children, title }: DashboardSectionProps) => (
    <VStack spacing="medium">
        <Text variant="hint" color="gray600">
            {title}
        </Text>
        <Box>{children}</Box>
    </VStack>
);
