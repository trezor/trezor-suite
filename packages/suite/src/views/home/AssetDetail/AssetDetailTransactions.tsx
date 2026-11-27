import { useCallback, useMemo } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import {
    selectWalletAssetAccountKeys,
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey, selectVisibleDeviceAccountsMap } from '@suite-common/wallet-core';
import { type Account, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';

import { useSelector } from '#src/hooks/suite/useSelector';
import { MultiAccountTransactionList } from '#src/views/wallet/transactions/TransactionList/MultiAccountTransactionList';

type AssetDetailTransactionsProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailTransactions = ({ assetKey }: AssetDetailTransactionsProps) => {
    const { analytics } = useServices(injectDesktopAnalytics);
    const networkSymbol = useSelector(state => selectWalletAssetNetworkSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    // Not only the holders: an account that emptied the token keeps its history of it.
    const accountKeys = useSelector(state =>
        networkSymbol === undefined
            ? undefined
            : selectWalletAssetAccountKeys(state, networkSymbol, contractAddress),
    );
    const accountsByKey = useSelector(selectVisibleDeviceAccountsMap);
    const accounts = useMemo(
        () =>
            (accountKeys ?? []).flatMap((accountKey): Account[] => {
                const account = accountsByKey.get(accountKey);

                return account === undefined ? [] : [account];
            }),
        [accountKeys, accountsByKey],
    );
    const reportTransactionDetailOpen = useCallback(
        (transaction: WalletAccountTransaction) =>
            analytics.report({
                type: events.assetsTransactionDetailEvent.name,
                payload: { networkSymbol: transaction.symbol },
            }),
        [analytics],
    );

    if (networkSymbol === undefined || accounts.length === 0) {
        return null;
    }

    return (
        <MultiAccountTransactionList
            key={[assetKey, ...accounts.map(account => account.key)].join('|')}
            accounts={accounts}
            symbol={networkSymbol}
            contractAddress={contractAddress}
            onTransactionDetailOpen={reportTransactionDetailOpen}
        />
    );
};
