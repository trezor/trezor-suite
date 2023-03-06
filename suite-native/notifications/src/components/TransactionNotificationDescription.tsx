import React from 'react';

import { Box, Text } from '@suite-native/atoms';
import { AccountAddressFormatter } from '@suite-native/formatters';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';

type TransactionNotificationDescriptionProps = {
    formattedAmount: string;
    prefix: string;
    targetAddress?: string;
};

const addressContainerStyle = prepareNativeStyle(_ => ({
    maxWidth: '35%',
}));

export const TransactionNotificationDescription = ({
    formattedAmount,
    prefix,
    targetAddress,
}: TransactionNotificationDescriptionProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="row">
            <Text color="textSubdued" variant="label">
                {`${formattedAmount} ${prefix} `}
            </Text>
            {targetAddress && (
                <Box style={applyStyle(addressContainerStyle)}>
                    <AccountAddressFormatter
                        value={targetAddress}
                        variant="label"
                        color="textSubdued"
                    />
                </Box>
            )}
        </Box>
    );
};
