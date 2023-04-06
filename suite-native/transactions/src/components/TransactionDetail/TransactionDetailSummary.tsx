import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Card, VStack, ErrorMessage } from '@suite-native/atoms';
import { AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import { TransactionsRootState } from '@suite-common/wallet-core';

import { selectTransactionInputAddresses, selectTransactionOutputAddresses } from '../../selectors';
import { TransactionDetailAddressesSection } from './TransactionDetailAddressesSection';
import { TransactionDetailAddressesSheet } from './TransactionDetailAddressesSheet';
import { TransactionDetailStatusSection } from './TransactionDetailStatusSection';

type TransactionDetailSummaryProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
};

const cardContentStyle = prepareNativeStyle(_ => ({
    overflow: 'hidden',
}));

export const TransactionDetailSummary = ({
    transaction,
    accountKey,
}: TransactionDetailSummaryProps) => {
    const { applyStyle } = useNativeStyles();
    const [isAddressesSheetVisible, setIsAddressesSheetVisible] = useState(false);

    const inputAddresses = useSelector((state: TransactionsRootState) =>
        selectTransactionInputAddresses(state, transaction.txid, accountKey),
    );
    const outputAddresses = useSelector((state: TransactionsRootState) =>
        selectTransactionOutputAddresses(state, transaction.txid, accountKey),
    );

    if (A.isEmpty(inputAddresses) || A.isEmpty(outputAddresses))
        return <ErrorMessage errorMessage="Target and Origin of transaction is unknown." />;

    const toggleAddressesSheet = () => setIsAddressesSheetVisible(prev => !prev);

    return (
        <Card>
            <VStack style={applyStyle(cardContentStyle)}>
                <TransactionDetailAddressesSection
                    addressesType="inputs"
                    addresses={inputAddresses}
                    onShowMore={toggleAddressesSheet}
                    cryptoIcon={transaction.symbol}
                />

                <TransactionDetailStatusSection txid={transaction.txid} accountKey={accountKey} />
                <TransactionDetailAddressesSection
                    addressesType="outputs"
                    addresses={outputAddresses}
                    onShowMore={toggleAddressesSheet}
                />
            </VStack>
            <TransactionDetailAddressesSheet
                isVisible={isAddressesSheetVisible}
                txid={transaction.txid}
                accountKey={accountKey}
                onClose={toggleAddressesSheet}
            />
        </Card>
    );
};
