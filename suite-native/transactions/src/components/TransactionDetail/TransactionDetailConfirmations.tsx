import React from 'react';

import { Box, Card, Text } from '@suite-native/atoms';

type TransactionDetailConfirmationsProps = {
    confirmations: number;
};

export const TransactionDetailConfirmations = ({
    confirmations,
}: TransactionDetailConfirmationsProps) => (
    <Box>
        <Box marginBottom="medium">
            <Text color="gray800">Status</Text>
        </Box>
        <Card>
            <Box flexDirection="row" justifyContent="space-between">
                <Text>Status</Text>
                <Text color="forest">{confirmations > 0 ? 'Confirmed' : 'Pending'}</Text>
            </Box>
            <Box flexDirection="row" justifyContent="space-between">
                <Text>Confirmations</Text>
                <Text color="forest">{confirmations}</Text>
            </Box>
        </Card>
    </Box>
);
