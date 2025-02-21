import { useState } from 'react';

import { hasNetworkPotentialFraudTransactions } from '@suite-common/token-definitions';
import { Card, Column, Text } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { Account, WalletAccountTransaction } from 'src/types/wallet';

import { TransactionList } from './TransactionList';
import { useVisibleTransactions } from './useFetchTransactions';

export const NoVisibleTransactions = () => (
    <Card>
        <Column alignItems="center">
            <Text typographyStyle="hint" variant="tertiary">
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
    const [visiblePages, setVisiblePages] = useState(1);
    const result = useVisibleTransactions({
        account,
        numberOfPagesRequested: visiblePages,
    });

    if (!result.isLoading && result.visibleTransactions.length === 0) {
        return <NoVisibleTransactions />;
    }

    const fraudTransactionPossible = hasNetworkPotentialFraudTransactions(symbol);

    return (
        <TransactionList
            key={account.key} // NOTE: ensure that transaction list is unmounted when account key changes
            customPageFetching={fraudTransactionPossible}
            customNoTransactions={<NoVisibleTransactions />}
            isPagingLimited={fraudTransactionPossible}
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
