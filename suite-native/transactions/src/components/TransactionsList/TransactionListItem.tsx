import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { AccountKey, WalletAccountTransaction, TransactionType } from '@suite-common/wallet-types';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    SignValueFormatter,
} from '@suite-native/formatters';
import { SignValue } from '@suite-common/suite-types';
import { Box } from '@suite-native/atoms';
import { AccountsRootState, selectIsTestnetAccount } from '@suite-common/wallet-core';
import { EmptyAmountText } from '@suite-native/formatters/src/components/EmptyAmountText';

import { TransactionListItemContainer } from './TransactionListItemContainer';

type TransactionListItemProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    isFirst?: boolean;
    isLast?: boolean;
};

export const signValueMap = {
    recv: 'positive',
    sent: 'negative',
    self: undefined,
    joint: undefined,
    contract: undefined,
    failed: undefined,
    unknown: undefined,
} as const satisfies Record<TransactionType, SignValue | undefined>;

export const TransactionListItemValues = ({
    accountKey,
    transaction,
}: {
    accountKey: AccountKey;
    transaction: WalletAccountTransaction;
}) => {
    const isTestnetAccount = useSelector((state: AccountsRootState) =>
        selectIsTestnetAccount(state, accountKey),
    );
    return (
        <>
            {isTestnetAccount ? (
                <EmptyAmountText />
            ) : (
                <Box flexDirection="row">
                    <SignValueFormatter value={signValueMap[transaction.type]} />

                    <CryptoToFiatAmountFormatter
                        value={transaction.amount}
                        network={transaction.symbol}
                        customRates={transaction.rates}
                    />
                </Box>
            )}

            <CryptoAmountFormatter
                value={transaction.amount}
                network={transaction.symbol}
                isBalance={false}
            />
        </>
    );
};

export const TransactionListItem = memo(
    ({ transaction, accountKey, isFirst = false, isLast = false }: TransactionListItemProps) => (
        <TransactionListItemContainer
            networkSymbol={transaction.symbol}
            txid={transaction.txid}
            transactionType={transaction.type}
            accountKey={accountKey}
            isFirst={isFirst}
            isLast={isLast}
        >
            <TransactionListItemValues accountKey={accountKey} transaction={transaction} />
        </TransactionListItemContainer>
    ),
);
