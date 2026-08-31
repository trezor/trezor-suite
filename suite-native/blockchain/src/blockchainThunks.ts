import { createThunk } from '@suite-common/redux-utils';
import {
    type NetworkSymbol,
    getNetworkOptional,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import {
    type FetchAndUpdateAccountThunkDeps,
    type FetchAndUpdateAccountThunkState,
    type SubscribeBlockchainThunkState,
    blockchainActions,
    fetchAndUpdateAccountThunk,
    selectAccountsSymbols,
    selectDeviceAccountByDescriptorAndNetworkSymbol,
    selectDeviceAccountsByNetworkSymbol,
    subscribeBlockchainThunk,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { type BlockchainNotification } from '@trezor/connect';

const BLOCKCHAIN_MODULE_PREFIX = '@suite-native/blockchain';

const accountLastFetchTime: Record<AccountKey, number> = {};
const ACCOUNT_LAST_FETCH_TIME_LIMIT_MS = 1000 * 10;

// FIXME: This seem duplicit of `suite-common/wallet-core/src/accounts/accountsRefreshTimeReducer.ts`:
// 1. Make sure it's possible to unify or otherwise document the reason why not.
// 2. Also, `accountLastFetchTime` isn't ever cleared (e.g. when wallet is ejected).
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

type SyncAccountsWithBlockchainThunkParams = { symbol: NetworkSymbol };

export type SyncAccountsWithBlockchainThunkState = FetchAndUpdateAccountThunkState;

export type SyncAccountsWithBlockchainThunkDeps = FetchAndUpdateAccountThunkDeps;

export const syncAccountsWithBlockchainThunk = createThunk<
    void,
    SyncAccountsWithBlockchainThunkParams,
    {
        state: SyncAccountsWithBlockchainThunkState;
        extra: SyncAccountsWithBlockchainThunkDeps;
    }
>(`${BLOCKCHAIN_MODULE_PREFIX}/syncAccountsThunk`, async ({ symbol }, { getState, dispatch }) => {
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
});

export type SyncAllAccountsWithBlockchainThunkState = SyncAccountsWithBlockchainThunkState;

export type SyncAllAccountsWithBlockchainThunkDeps = SyncAccountsWithBlockchainThunkDeps;

export const syncAllAccountsWithBlockchainThunk = createThunk<
    void,
    void,
    {
        state: SyncAllAccountsWithBlockchainThunkState;
        extra: SyncAllAccountsWithBlockchainThunkDeps;
    }
>(`${BLOCKCHAIN_MODULE_PREFIX}/syncAllAccountsThunk`, async (_, { getState, dispatch }) => {
    const accountsSymbols = selectAccountsSymbols(getState());

    const accountPromises = accountsSymbols.map(symbol =>
        dispatch(syncAccountsWithBlockchainThunk({ symbol })),
    );

    await Promise.all(accountPromises);
});

type OnBlockchainConnectThunkParams = { symbol: string };

export type OnBlockchainConnectThunkState = SubscribeBlockchainThunkState &
    SyncAccountsWithBlockchainThunkState;

export type OnBlockchainConnectThunkDeps = SyncAccountsWithBlockchainThunkDeps;

export const onBlockchainConnectThunk = createThunk<
    void,
    OnBlockchainConnectThunkParams,
    { state: OnBlockchainConnectThunkState; extra: OnBlockchainConnectThunkDeps }
>(`${BLOCKCHAIN_MODULE_PREFIX}/onBlockchainConnectThunk`, async ({ symbol }, { dispatch }) => {
    const network = getNetworkOptional(symbol.toLowerCase());
    if (!network) return;

    await dispatch(
        subscribeBlockchainThunk({ symbol: network.symbol, fiatRates: true, onConnect: true }),
    );

    // update accounts for connected network
    await dispatch(syncAccountsWithBlockchainThunk({ symbol: network.symbol }));
    dispatch(blockchainActions.connected(network.symbol));
});

export type OnBlockchainNotificationThunkState = FetchAndUpdateAccountThunkState;

export type OnBlockchainNotificationThunkDeps = FetchAndUpdateAccountThunkDeps;

export const onBlockchainNotificationThunk = createThunk<
    void,
    BlockchainNotification,
    {
        state: OnBlockchainNotificationThunkState;
        extra: OnBlockchainNotificationThunkDeps;
    }
>(`${BLOCKCHAIN_MODULE_PREFIX}/onNotificationThunk`, (payload, { dispatch, getState }) => {
    const { descriptor, tx } = payload.notification;
    const symbol = payload.coin.shortcut.toLowerCase();
    if (!isNetworkSymbol(symbol)) {
        return;
    }

    const account = selectDeviceAccountByDescriptorAndNetworkSymbol(getState(), descriptor, symbol);

    if (!account) return;

    // Skip throttle for pending txs so broadcast shows immediately. Throttle still applies to confirmed.
    const isPendingNotification = !tx?.blockHeight;
    if (!isPendingNotification && !shouldRefetchAccount({ accountKey: account.key })) return;

    // Sometimes we randomly get notifications for all transactions in account at once, which would trigger lot of fetches.
    // We are throttling per account, we don't want to fetch account too often to save resources.
    dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
    accountLastFetchTime[account.key] = Date.now();
});
