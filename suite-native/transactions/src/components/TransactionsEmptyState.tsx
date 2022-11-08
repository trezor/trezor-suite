import React from 'react';

import { Box, Button, Card, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const cardStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    borderRadius: utils.borders.radii.large,
}));

export const TransactionsEmptyState = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <Card style={applyStyle(cardStyle)}>
            <Box marginBottom="large">
                {/* TODO add icon from Figma when it's as svg */}
                <Text variant="titleSmall">No transactions...yet.</Text>
                <Text variant="hint" color="gray600">
                    Get started by receiving transactions
                </Text>
            </Box>
            <Button iconName="receive">Receive </Button>
        </Card>
    );
};
