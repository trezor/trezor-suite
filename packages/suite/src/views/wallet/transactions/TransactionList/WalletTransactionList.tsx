import { useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { hasNetworkPotentialFraudTransactions } from '@suite-common/token-definitions';
import { selectIsHideSuspiciousTransactions } from '@suite-common/wallet-core';
import { Card, Column, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useAccountEvmNonceInfo } from 'src/hooks/wallet/chainData/useAccountEvmNonceInfo';
import { useAccountTransactionsSource } from 'src/hooks/wallet/chainData/useAccountTransactionsSource';
import { EvmNonceInfoProvider } from 'src/hooks/wallet/transactions/EvmNonceInfoContext';
import { HistoricFiatRatesProvider } from 'src/hooks/wallet/transactions/HistoricFiatRatesContext';
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

    // Read once for every transaction below, against the history they come from.
    const evmNonce = useAccountEvmNonceInfo(
        account.networkType === 'ethereum' ? account : undefined,
        { transactions: source.transactions, withStoreFallback: false },
    );
    const { isQueryOwned: isNonceQueryOwned, nonceInfo } = evmNonce;
    const providedNonceInfo = useMemo(
        () => (isNonceQueryOwned ? { nonceInfo } : null),
        [isNonceQueryOwned, nonceInfo],
    );

    return (
        <HistoricFiatRatesProvider rates={source.isQueryOwned ? source.historicRates : null}>
            <EvmNonceInfoProvider value={providedNonceInfo}>
                <TransactionList
                    key={account.key} // NOTE: ensure that transaction list is unmounted when account key changes
                    areAllTransactionsLoaded={source.areAllLoaded}
                    customPageFetching={fraudTransactionPossible}
                    customNoTransactions={<NoVisibleTransactions />}
                    source={source}
                    transactions={result.visibleTransactions}
                    symbol={symbol}
                    account={account}
                    isLoading={result.isFetching}
                    customTotalItems={customTotalItems ?? result.visibleTotal}
                    isExportable={isExportable}
                    onPageRequested={setVisiblePages}
                />
            </EvmNonceInfoProvider>
        </HistoricFiatRatesProvider>
    );
};
