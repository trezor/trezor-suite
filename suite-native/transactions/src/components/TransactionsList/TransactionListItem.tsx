import React, { memo } from 'react';

import { AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';

import { TransactionListItemContainer } from './TransactionListItemContainer';

type TransactionListItemProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    isFirst?: boolean;
    isLast?: boolean;
};

export const TransactionListItem = memo(
    ({ transaction, accountKey, isFirst, isLast }: TransactionListItemProps) => (
        <TransactionListItemContainer
            symbol={transaction.symbol}
            txid={transaction.txid}
            transactionType={transaction.type}
            accountKey={accountKey}
            isFirst={isFirst}
            isLast={isLast}
        >
            <CryptoToFiatAmountFormatter
                value={transaction.amount}
                network={transaction.symbol}
                customRates={transaction.rates}
            />
            <CryptoAmountFormatter
                value={transaction.amount}
                network={transaction.symbol}
                isBalance={false}
            />
        </TransactionListItemContainer>
    ),
);
