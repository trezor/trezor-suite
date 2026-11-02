import { useMemo } from 'react';

import { type Account, type WalletAccountTransaction } from 'src/types/wallet';

import { MultiAccountTransactionList } from './MultiAccountTransactionList';

type SingleAccountTransactionListProps = {
    symbol: WalletAccountTransaction['symbol'];
    account: Account;
    isExportable?: boolean;
};

export const SingleAccountTransactionList = ({
    account,
    symbol,
    isExportable = true,
}: SingleAccountTransactionListProps) => {
    const accounts = useMemo(() => [account], [account]);

    return (
        <MultiAccountTransactionList
            key={account.key}
            accounts={accounts}
            symbol={symbol}
            isAccountShown={false}
            isBumpFeeAllowed
            isExportable={isExportable}
            knownTotal={account.history.total}
            data-testid="@wallet/accounts/transaction-list"
        />
    );
};
