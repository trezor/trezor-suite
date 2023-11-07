import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { A } from '@mobily/ts-belt';

import { AccountKey } from '@suite-common/wallet-types';
import { BottomSheet, Box, Button, Card, Text, Toggle, VStack } from '@suite-native/atoms';
import { TransactionsRootState } from '@suite-common/wallet-core';
import { useCopyToClipboard } from '@suite-native/helpers';
import { Icon } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { selectTransactionAddresses } from '../../selectors';
import { ChangeAddressesHeader } from './ChangeAddressesHeader';
import { AddressesType, VinVoutAddress } from '../../types';

type TransactionDetailAddressesSheetProps = {
    isVisible: boolean;
    txid: string;
    accountKey: AccountKey;
    onClose: () => void;
};

const addressStyle = prepareNativeStyle(_ => ({ maxWidth: '90%' }));

const copyContainerStyle = prepareNativeStyle(utils => ({
    flex: 1,
    paddingTop: utils.spacings.xs,
    marginHorizontal: utils.spacings.s,
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
                <Icon name="copy" color="iconPrimaryDefault" size="m" />
            </TouchableOpacity>
        </Box>
    );
};

const AddressesListCard = ({ addresses }: { addresses: VinVoutAddress[] }) => (
    <Card>
        <VStack spacing="m">
            {addresses.map(({ address }) => (
                <AddressRow key={address} address={address} />
            ))}
        </VStack>
    </Card>
);

export const TransactionDetailAddressesSheet = ({
    isVisible,
    onClose,
    txid,
    accountKey,
}: TransactionDetailAddressesSheetProps) => {
    const [displayedAddressesType, setDisplayedAddressesType] = useState<AddressesType>('inputs');

    const inputAddresses = useSelector((state: TransactionsRootState) =>
        selectTransactionAddresses(state, txid, accountKey, 'inputs'),
    );
    const outputAddresses = useSelector((state: TransactionsRootState) =>
        selectTransactionAddresses(state, txid, accountKey, 'outputs'),
    );

    const displayedAddresses =
        displayedAddressesType === 'inputs' ? inputAddresses : outputAddresses;

    const { targetAddresses, changeAddresses } = useMemo(
        () => ({
            targetAddresses: displayedAddresses.filter(({ isChangeAddress }) => !isChangeAddress),
            changeAddresses: displayedAddresses.filter(({ isChangeAddress }) => isChangeAddress),
        }),
        [displayedAddresses],
    );

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
                <Box marginVertical="m">
                    <VStack spacing="m">
                        <AddressesListCard addresses={targetAddresses} />

                        {A.isNotEmpty(changeAddresses) && (
                            <>
                                <ChangeAddressesHeader addressesCount={changeAddresses.length} />
                                <AddressesListCard addresses={changeAddresses} />
                            </>
                        )}
                    </VStack>
                    <Box marginTop="large" paddingHorizontal="s">
                        <Button size="large" onPress={onClose}>
                            Close
                        </Button>
                    </Box>
                </Box>
            </Box>
        </BottomSheet>
    );
};
