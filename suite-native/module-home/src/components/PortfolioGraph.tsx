import React from 'react';

import { Box, Text } from '@suite-native/atoms';

export const PortfolioGraph = () => (
    <Box>
        <Text variant="titleSmall">$3,720</Text>
        <Box flexDirection="row" alignItems="center">
            <Box marginRight="small">
                <Text variant="hint" color="gray600">
                    Today, 15:45
                </Text>
            </Box>
            <Text color="forest" variant="hint">
                1.3%
            </Text>
        </Box>
        <Text>TODO graf</Text>
    </Box>
);
