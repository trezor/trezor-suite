import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { AccountKey } from '@suite-common/wallet-types';
import { BottomSheet, Box, Button, Card, Text, Toggle, VStack } from '@suite-native/atoms';
import { TransactionsRootState } from '@suite-common/wallet-core';
import { useCopyToClipboard } from '@suite-native/helpers';
import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { selectTransactionAddresses, AddressesType } from '../../selectors';

type TransactionDetailInputsSheetProps = {
    isVisible: boolean;
    txid: string;
    accountKey: AccountKey;
    onClose: () => void;
};

const addressStyle = prepareNativeStyle(_ => ({ maxWidth: '90%' }));

const copyContainerStyle = prepareNativeStyle(utils => ({
    flex: 1,
    paddingTop: utils.spacings.small / 2,
    marginHorizontal: utils.spacings.small,
}));

export const formatAddressLabel = (addressType: AddressesType, count: number) => {
    const labelPrefix = addressType === 'inputs' ? 'From' : 'To';
    if (count > 1) {
        return `${labelPrefix} · ${count}`;
    }

    return labelPrefix;
};

const AddressRow = ({ address }: { address: string }) => {
    const { applyStyle } = useNativeStyles();
    const copyToClipboard = useCopyToClipboard();

    const handleCopy = () => copyToClipboard(address, 'Address copied to clipboard');

    return (
        <Box flex={1} flexDirection="row" justifyContent="space-between" alignItems="flex-start">
            <Box style={applyStyle(addressStyle)}>
                <Text variant="hint">{address}</Text>
            </Box>

            <TouchableOpacity style={applyStyle(copyContainerStyle)} onPress={handleCopy}>
                <Icon name="copy" color="iconPrimaryDefault" size="medium" />
            </TouchableOpacity>
        </Box>
    );
};

export const TransactionDetailAddressesSheet = ({
    isVisible,
    onClose,
    txid,
    accountKey,
}: TransactionDetailInputsSheetProps) => {
    const [displayedAddressesType, setDisplayedAddressesType] = useState<AddressesType>('inputs');

    const inputAddresses = useSelector((state: TransactionsRootState) =>
        selectTransactionAddresses(state, txid, accountKey, 'inputs'),
    );
    const outputAddresses = useSelector((state: TransactionsRootState) =>
        selectTransactionAddresses(state, txid, accountKey, 'outputs'),
    );

    const displayedAddresses =
        displayedAddressesType === 'inputs' ? inputAddresses : outputAddresses;

    const toggleAddresses = () => {
        setDisplayedAddressesType(displayedAddressesType === 'inputs' ? 'outputs' : 'inputs');
    };

    return (
        <BottomSheet
            isVisible={isVisible}
            onClose={onClose}
            title="Addresses"
            subtitle={`Transaction #${txid}`}
        >
            <Box>
                <Toggle
                    isToggled={displayedAddressesType === 'outputs'}
                    onToggle={toggleAddresses}
                    leftLabel={formatAddressLabel('inputs', inputAddresses.length)}
                    rightLabel={formatAddressLabel('outputs', outputAddresses.length)}
                />
                <Box marginVertical="medium">
                    <Card>
                        <VStack spacing="medium">
                            {displayedAddresses.map(address => (
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
