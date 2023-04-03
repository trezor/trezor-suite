import React from 'react';
import { useSelector } from 'react-redux';

import { AccountKey } from '@suite-common/wallet-types';
import { BottomSheet, Box, Button, Card, Text, VStack } from '@suite-native/atoms';
import { TransactionsRootState } from '@suite-common/wallet-core';

import { selectTransactionInputAddresses, selectTransactionOutputAddresses } from '../../selectors';

type TransactionDetailInputsSheetProps = {
    isVisible: boolean;
    txid: string;
    accountKey: AccountKey;
    onClose: () => void;
};

const formatCountString = (count: number) => (count > 1 ? ` ·  ${count}` : null);

export const TransactionDetailAddressesSheet = ({
    isVisible,
    onClose,
    txid,
    accountKey,
}: TransactionDetailInputsSheetProps) => {
    const inputAddresses = useSelector((state: TransactionsRootState) =>
        selectTransactionInputAddresses(state, txid, accountKey),
    );
    const outputAddresses = useSelector((state: TransactionsRootState) =>
        selectTransactionOutputAddresses(state, txid, accountKey),
    );

    const sheetSubtitle = `Transaction #${txid}`;
    const formattedInputsTitle = `From${formatCountString(inputAddresses.length)}`;
    const formattedOutputsTitle = `To${formatCountString(outputAddresses.length)}`;

    return (
        <BottomSheet
            isVisible={isVisible}
            onClose={onClose}
            title="Addresses"
            subtitle={sheetSubtitle}
        >
            {/* TODO: This is not a final solution. */}
            {/* Layout need to be changed according to final design when ready. */}
            <Box marginVertical="medium">
                <Card>
                    <VStack spacing="medium">
                        <Box>
                            <Text variant="highlight">{formattedInputsTitle}</Text>
                            {inputAddresses.map(address => (
                                <Text key={address}>{address}</Text>
                            ))}
                        </Box>
                        <Box>
                            <Text variant="highlight">{formattedOutputsTitle}</Text>
                            {outputAddresses.map(address => (
                                <Text key={address}>{address}</Text>
                            ))}
                        </Box>
                    </VStack>
                </Card>

                <Box marginTop="large" paddingHorizontal="small">
                    <Button size="large" onPress={onClose}>
                        Close
                    </Button>
                </Box>
            </Box>
        </BottomSheet>
    );
};
