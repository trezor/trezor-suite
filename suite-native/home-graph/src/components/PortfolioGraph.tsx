import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';

import { Graph } from './Graph';

const arrowStyle = prepareNativeStyle(() => ({
    marginRight: 4,
}));

export const PortfolioGraph = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box>
            <Text variant="titleLarge">$3,720</Text>
            <Box flexDirection="row" alignItems="center">
                <Box marginRight="small">
                    <Text variant="hint" color="gray600">
                        Today, 15:45
                    </Text>
                </Box>
                <Box style={applyStyle(arrowStyle)}>
                    <Icon name="arrowUp" color="forest" size="extraSmall" />
                </Box>
                <Text color="forest" variant="hint">
                    1.3%
                </Text>
            </Box>
            <Graph />
        </Box>
    );
};
