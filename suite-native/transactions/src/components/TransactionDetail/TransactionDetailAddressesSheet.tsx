import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { AccountKey } from '@suite-common/wallet-types';
import {
    BottomSheet,
    Box,
    Button,
    Card,
    IconButton,
    Text,
    Toggle,
    VStack,
} from '@suite-native/atoms';
import { TransactionsRootState } from '@suite-common/wallet-core';
import { useCopyToClipboard } from '@suite-native/helpers';

import { selectTransactionAddresses, selectTransactionOutputAddresses } from '../../selectors';

type TransactionDetailInputsSheetProps = {
    isVisible: boolean;
    txid: string;
    accountKey: AccountKey;
    onClose: () => void;
};

type ToggleAddressessValue = 'inputs' | 'outputs';

const formatCountString = (count: number) => (count > 1 ? ` ·  ${count}` : null);

const AddressRow = ({ address }: { address: string }) => {
    const copyToClipboard = useCopyToClipboard();

    const handleCopy = () => copyToClipboard(address, 'Address copied to clipboard');

    return (
        <Box key={address} flexDirection="row" justifyContent="space-between">
            <Box style={{ maxWidth: '80%' }}>
                <Text variant="hint">{address}</Text>
                <Text variant="hint" color="textSubdued">
                    0.0032453 BTC
                </Text>
            </Box>
            <IconButton iconName="copy" colorScheme="primary" onPress={handleCopy} />
        </Box>
    );
};

export const TransactionDetailAddressesSheet = ({
    isVisible,
    onClose,
    txid,
    accountKey,
}: TransactionDetailInputsSheetProps) => {
    const [activeTab, setActiveTab] = useState<ToggleAddressessValue>('inputs');
    const inputAddresses = useSelector((state: TransactionsRootState) =>
        selectTransactionAddresses(state, txid, accountKey, 'inputs'),
    );
    const outputAddresses = useSelector((state: TransactionsRootState) =>
        selectTransactionAddresses(state, txid, accountKey, 'outputs'),
    );

    const addressesArray = activeTab === 'inputs' ? inputAddresses : outputAddresses;

    return (
        <BottomSheet
            isVisible={isVisible}
            onClose={onClose}
            title="Addresses"
            subtitle={`Transaction #${txid}`}
        >
            <Box>
                <Toggle
                    isToggled={activeTab === 'outputs'}
                    onToggle={() => setActiveTab(activeTab === 'inputs' ? 'outputs' : 'inputs')}
                    leftLabel={`From${formatCountString(inputAddresses.length)}`}
                    rightLabel={`To${formatCountString(outputAddresses.length)}`}
                />
                <Box marginVertical="medium">
                    <Card>
                        <VStack spacing="medium">
                            {addressesArray.map(address => (
                                <AddressRow key={address} address={address} />
                            ))}
                        </VStack>
                    </Card>
                    <Box marginTop="large" paddingHorizontal="small">
                        <Button size="large" onPress={onClose}>
                            Close
                        </Button>
                    </Box>
                </Box>
            </Box>
        </BottomSheet>
    );
};
