import React, { ReactNode } from 'react';

import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TransactionDetailDataRowProps = {
    label: string;
    value: ReactNode;
};

const labelTextStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

const valueTextStyle = prepareNativeStyle(_ => ({
    flex: 2,
}));

export const TransactionDetailDataRow = ({ label, value }: TransactionDetailDataRowProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box flexDirection="row">
            <Text variant="hint" color="gray600" style={applyStyle(labelTextStyle)}>
                {label}
            </Text>
            <Text color="gray800" style={applyStyle(valueTextStyle)}>
                {value}
            </Text>
        </Box>
    );
};
