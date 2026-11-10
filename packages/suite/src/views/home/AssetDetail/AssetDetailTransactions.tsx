import { useCallback } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import {
    selectWalletAssetAccounts,
    selectWalletAssetContractAddress,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';

import { useSelector } from '#src/hooks/suite';
import { type WalletAccountTransaction } from '#src/types/wallet';
import { MultiAccountTransactionList } from '#src/views/wallet/transactions/TransactionList/MultiAccountTransactionList';

type AssetDetailTransactionsProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailTransactions = ({ assetKey }: AssetDetailTransactionsProps) => {
    const { analytics } = useServices(injectDesktopAnalytics);
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const accounts = useSelector(state => selectWalletAssetAccounts(state, assetKey));
    const reportTransactionDetailOpen = useCallback(
        (transaction: WalletAccountTransaction) =>
            analytics.report({
                type: events.assetsTransactionDetailEvent.name,
                payload: { networkSymbol: transaction.symbol },
            }),
        [analytics],
    );

    if (symbol === undefined || accounts.length === 0) {
        return null;
    }

    return (
        <MultiAccountTransactionList
            key={[assetKey, ...accounts.map(account => account.key)].join('|')}
            accounts={accounts}
            symbol={symbol}
            contractAddress={contractAddress}
            onTransactionDetailOpen={reportTransactionDetailOpen}
        />
    );
};
