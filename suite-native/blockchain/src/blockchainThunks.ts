import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import {
    blockchainActions,
    fetchAndUpdateAccountThunk,
    selectDeviceAccountByDescriptorAndNetworkSymbol,
    selectDeviceAccountsByNetworkSymbol,
    selectAccountsSymbols,
    subscribeBlockchainThunk,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { getNetwork } from '@suite-common/wallet-utils';
import { BlockchainNotification } from '@trezor/connect';

const actionsPrefix = '@native/blockchain';

const accountLastFetchTime: Record<AccountKey, number> = {};
const ACCOUNT_LAST_FETCH_TIME_LIMIT_MS = 1000 * 10;

const shouldRefetchAccount = ({
    accountKey,
    refetchLimitMs = ACCOUNT_LAST_FETCH_TIME_LIMIT_MS,
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
        const accounts = selectDeviceAccountsByNetworkSymbol(getState(), symbol);
        const accountForRefetch = accounts.filter(({ key }) =>
            shouldRefetchAccount({ accountKey: key }),
        );

        const accountPromises = accountForRefetch.map(a =>
            dispatch(fetchAndUpdateAccountThunk({ accountKey: a.key })),
        );
        accountForRefetch.forEach(a => {
            accountLastFetchTime[a.key] = Date.now();
        });

        await Promise.all(accountPromises);

        dispatch(blockchainActions.synced({ symbol }));
    },
);

export const syncAllAccountsWithBlockchainThunk = createThunk(
    `${actionsPrefix}/syncAllAccountsThunk`,
    async (_, { getState, dispatch }) => {
        const accountsSymbols = selectAccountsSymbols(getState());

        const accountPromises = accountsSymbols.map(symbol =>
            dispatch(syncAccountsWithBlockchainThunk({ symbol })),
        );

        await Promise.all(accountPromises);
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

        const account = selectDeviceAccountByDescriptorAndNetworkSymbol(
            getState(),
            descriptor,
            symbol,
        );

        if (!account) return;
        if (!shouldRefetchAccount({ accountKey: account.key })) return;

        // Sometimes we randomly get notifications for all transactions in account at once, which would trigger lot of fetches.
        // We are throttling per account, we don't want to fetch account too often to save resources.
        dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
        accountLastFetchTime[account.key] = Date.now();
    },
);
