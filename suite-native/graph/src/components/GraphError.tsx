import React from 'react';

import { Box, Text, VStack } from '@suite-native/atoms';
import { useNativeStyles } from '@trezor/styles';

import { graphWrapperStyle } from './Graph';

type GraphErrorProps = {
    error: string;
    onTryAgain: () => void;
};

export const GraphError = ({ error, onTryAgain }: GraphErrorProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box style={applyStyle(graphWrapperStyle)}>
            <VStack spacing="small" alignItems="center">
                <Text variant="label" color="gray600" align="center">
                    There are some troubles with loading graph points: {error}
                </Text>
                <Text variant="body" color="green" align="center" onPress={onTryAgain}>
                    Try again
                </Text>
            </VStack>
        </Box>
    );
};
