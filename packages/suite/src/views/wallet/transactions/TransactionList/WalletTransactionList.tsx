import { useState } from 'react';

import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { hasNetworkPotentialFraudTransactions } from '@suite-common/token-definitions';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
import {
    selectAreAllTransactionsLoaded,
    selectIsHideSuspiciousTransactions,
} from '@suite-common/wallet-core';
import { Card, Column, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { type Account, type WalletAccountTransaction } from 'src/types/wallet';

import { TransactionList } from './TransactionList';
import { useVisibleTransactions } from './useFetchTransactions';

export const NoVisibleTransactions = () => (
    <Card>
        <Column alignItems="center">
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_NO_VISIBLE_TRANSACTIONS" />
            </Text>
        </Column>
    </Card>
);

interface TransactionListProps {
    symbol: WalletAccountTransaction['symbol'];
    account: Account;
    customTotalItems?: number;
    isExportable?: boolean;
}

export const WalletTransactionList = ({
    account,
    symbol,
    customTotalItems,
    isExportable = true,
}: TransactionListProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    // NOTE: The number of the displayed pages may be different from the number of the pages for all transactions
    const suspiciousTransactionsHidden = useSelector(state =>
        selectIsHideSuspiciousTransactions(state, symbol),
    );
    const fraudTransactionPossible =
        suspiciousTransactionsHidden &&
        hasNetworkPotentialFraudTransactions(networkConfigDeps, symbol);
    const [visiblePages, setVisiblePages] = useState(1);
    const areAllTransactionsLoaded = useSelector(state =>
        Boolean(selectAreAllTransactionsLoaded(state, account.key)),
    );
    const result = useVisibleTransactions({
        account,
        numberOfPagesRequested: visiblePages,
        enableFiltering: fraudTransactionPossible,
    });

    return (
        <TransactionList
            key={account.key} // NOTE: ensure that transaction list is unmounted when account key changes
            areAllTransactionsLoaded={areAllTransactionsLoaded}
            customPageFetching={fraudTransactionPossible}
            customNoTransactions={<NoVisibleTransactions />}
            allTransactions={result.allTransactions}
            transactions={result.visibleTransactions}
            symbol={symbol}
            account={account}
            isLoading={result.isFetching}
            customTotalItems={customTotalItems ?? result.visibleTotal}
            isExportable={isExportable}
            onPageRequested={setVisiblePages}
        />
    );
};
