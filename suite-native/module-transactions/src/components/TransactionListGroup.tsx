import React, { ReactNode } from 'react';

import { Box, Card, Text, VStack } from '@suite-native/atoms';
import { parseDateKey } from '@suite-common/wallet-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TransactionListGroupProps = {
    children: ReactNode;
    dateKey: string;
};

const dateTextStyle = prepareNativeStyle(_ => ({
    marginBottom: 12,
}));

const cardStyle = prepareNativeStyle(_ => ({
    padding: 0,
}));

export const TransactionListGroup = ({ children, dateKey }: TransactionListGroupProps) => {
    const { applyStyle } = useNativeStyles();
    const parsedDate = parseDateKey(dateKey).toLocaleDateString();

    return (
        <Box marginBottom="medium">
            <Text color="gray600" variant="hint" style={applyStyle(dateTextStyle)}>
                {parsedDate}
            </Text>
            <Card style={applyStyle(cardStyle)}>
                <VStack spacing="small">{children}</VStack>
            </Card>
        </Box>
    );
};
