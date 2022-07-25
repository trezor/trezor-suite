import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { Graph } from '@suite-native/graph';

const ARROW_SIZE = 10;
const arrowStyle = prepareNativeStyle<{ direction: 'up' | 'down' }>((utils, { direction }) => ({
    marginRight: utils.spacings.small,
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE / 2,
    borderLeftColor: 'transparent',
    borderRightWidth: ARROW_SIZE / 2,
    borderRightColor: 'transparent',
    extend: [
        {
            condition: direction === 'down',
            style: {
                borderTopWidth: ARROW_SIZE,
                borderTopColor: utils.colors.red,
            },
        },
        {
            condition: direction === 'up',
            style: {
                borderBottomWidth: ARROW_SIZE,
                borderBottomColor: utils.colors.green,
            },
        },
    ],
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
                <Box style={applyStyle(arrowStyle, { direction: 'down' })} />
                <Text color="forest" variant="hint">
                    1.3%
                </Text>
            </Box>
            <Graph />
        </Box>
    );
};
