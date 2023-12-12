import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import {
    blockchainActions,
    fetchAndUpdateAccountThunk,
    selectAccountByDescriptorAndNetworkSymbol,
    selectAccountsByNetworkSymbol,
    subscribeBlockchainThunk,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { getNetwork } from '@suite-common/wallet-utils';
import { BlockchainNotification } from '@trezor/connect';

const actionsPrefix = '@native/blockchain';

const accountLastFetchTime: Record<AccountKey, number> = {};
const accountLastFetchTimeLimitMs = 1000 * 10; // 5 seconds

const shouldRefetchAccount = ({
    accountKey,
    refetchLimitMs = accountLastFetchTimeLimitMs,
}: {
    accountKey: AccountKey;
    refetchLimitMs?: number;
}) => {
    const lastFetchTime = accountLastFetchTime[accountKey];
    if (!lastFetchTime) return true;
    return Date.now() - lastFetchTime > refetchLimitMs;
};

export const syncAccountsWithBlockchainThunk = createThunk(
    `${actionsPrefix}/syncAccountsThunk`,
    async ({ symbol }: { symbol: NetworkSymbol }, { getState, dispatch }) => {
        const accounts = selectAccountsByNetworkSymbol(getState(), symbol);
        const accountForRefetch = accounts.filter(({ key }) =>
            shouldRefetchAccount({ accountKey: key }),
        );

        const accountPromises = accountForRefetch.map(a => dispatch(fetchAndUpdateAccountThunk(a)));
        accountForRefetch.forEach(a => {
            accountLastFetchTime[a.key] = Date.now();
        });

        await Promise.all(accountPromises);

        dispatch(blockchainActions.synced({ symbol }));
    },
);

export const onBlockchainConnectThunk = createThunk(
    `${actionsPrefix}/onBlockchainConnectThunk`,
    async ({ symbol }: { symbol: string }, { dispatch }) => {
        const network = getNetwork(symbol.toLowerCase());
        if (!network) return;

        await dispatch(subscribeBlockchainThunk({ symbol: network.symbol, fiatRates: true }));

        // update accounts for connected network
        await dispatch(syncAccountsWithBlockchainThunk({ symbol: network.symbol }));
        dispatch(blockchainActions.connected(network.symbol));
    },
);

export const onBlockchainNotificationThunk = createThunk(
    `${actionsPrefix}/onNotificationThunk`,
    (payload: BlockchainNotification, { dispatch, getState }) => {
        const { descriptor } = payload.notification;
        const symbol = payload.coin.shortcut.toLowerCase();
        if (!isNetworkSymbol(symbol)) {
            return;
        }

        const account = selectAccountByDescriptorAndNetworkSymbol(getState(), descriptor, symbol);

        if (!account) return;

        // In fetchAndUpdateAccountThunk we are throttling per account, we don't want to fetch account too often
        // and sometimes we randomly get notifications for all transactions in account at once, which would trigger lot of fetches
        dispatch(fetchAndUpdateAccountThunk(account));
    },
);
