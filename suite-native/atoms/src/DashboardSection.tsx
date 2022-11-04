import React, { ReactNode } from 'react';

import { VStack } from './VStack';
import { Text } from './Text';
import { Box } from './Box';

type DashboardSectionProps = {
    children: ReactNode;
    title?: string;
};

export const DashboardSection = ({ children, title }: DashboardSectionProps) => (
    <VStack spacing="medium">
        {title && (
            <Text variant="hint" color="gray600">
                {title}
            </Text>
        )}
        <Box>{children}</Box>
    </VStack>
);
