import { useState } from 'react';

import { Account, WalletAccountTransaction } from 'src/types/wallet';

import { TransactionList } from './TransactionList';
import { useVisibleTransactions } from './useFetchTransactions';

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

    return (
        <TransactionList
            key={account.key} // NOTE: ensure that transaction list is unmounted when account key changes
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
