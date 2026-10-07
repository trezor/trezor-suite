import { useState } from 'react';

import { Translation } from '@suite/intl';
import { hasNetworkPotentialFraudTransactions } from '@suite-common/token-definitions';
import {
    selectIsHideSuspiciousTransactions,
    useDirectRpcHistoryState,
} from '@suite-common/wallet-core';
import { Card, Column, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useAccountTransactionsSource } from 'src/hooks/wallet/chainData/useAccountTransactionsSource';
import { HistoricFiatRatesProvider } from 'src/hooks/wallet/transactions/HistoricFiatRatesContext';
import { type Account, type WalletAccountTransaction } from 'src/types/wallet';

import { TransactionList } from './TransactionList';
import { useVisibleTransactions } from './useFetchTransactions';

type EmptyListMessageProps = {
    id: 'TR_NO_VISIBLE_TRANSACTIONS' | 'TR_NO_RECENT_TRANSACTIONS';
};

const EmptyListMessage = ({ id }: EmptyListMessageProps) => (
    <Card>
        <Column alignItems="center">
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id={id} />
            </Text>
        </Column>
    </Card>
);

export const NoVisibleTransactions = () => <EmptyListMessage id="TR_NO_VISIBLE_TRANSACTIONS" />;

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
    // NOTE: The number of the displayed pages may be different from the number of the pages for all transactions
    const suspiciousTransactionsHidden = useSelector(state =>
        selectIsHideSuspiciousTransactions(state, symbol),
    );
    const fraudTransactionPossible =
        suspiciousTransactionsHidden && hasNetworkPotentialFraudTransactions(symbol);
    const [visiblePages, setVisiblePages] = useState(1);
    const source = useAccountTransactionsSource(account);
    const result = useVisibleTransactions({
        account,
        source,
        numberOfPagesRequested: visiblePages,
        enableFiltering: fraudTransactionPossible,
    });

    // A direct-RPC backend only looked at a recent window, so finding nothing there is not the same
    // as the account having no transactions.
    const directRpcHistoryState = useDirectRpcHistoryState(account.key);
    const isRecentWindowEmpty = directRpcHistoryState === 'recentWindowEmpty';

    return (
        <HistoricFiatRatesProvider rates={source.isQueryOwned ? source.historicRates : null}>
            <TransactionList
                key={account.key} // NOTE: ensure that transaction list is unmounted when account key changes
                areAllTransactionsLoaded={source.areAllLoaded}
                customPageFetching={fraudTransactionPossible}
                customNoTransactions={
                    isRecentWindowEmpty ? (
                        <EmptyListMessage id="TR_NO_RECENT_TRANSACTIONS" />
                    ) : (
                        <NoVisibleTransactions />
                    )
                }
                source={source}
                transactions={result.visibleTransactions}
                symbol={symbol}
                account={account}
                isLoading={result.isFetching || directRpcHistoryState === 'unscanned'}
                customTotalItems={customTotalItems ?? result.visibleTotal}
                isExportable={isExportable}
                onPageRequested={setVisiblePages}
            />
        </HistoricFiatRatesProvider>
    );
};
