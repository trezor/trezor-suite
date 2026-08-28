import { type AnalyticsDep } from '@suite-common/analytics';
import { type DeviceRootState, selectDevices } from '@suite-common/device';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type GetIsWindowVisibleDep } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type NetworkSymbol,
    getNetworkOptional,
    isNetworkSymbol,
    isNetworkUsingExternalBackend,
} from '@suite-common/wallet-config';
import type { Account, CustomBackend, GetTradedAccountKeysDep } from '@suite-common/wallet-types';
import {
    findAccountDevice,
    findAccountsByDescriptor,
    findAccountsByNetwork,
    formatNetworkAmount,
    formatTokenAmount,
    getAccountIdentity,
    getAreSatoshisUsed,
    getBackendFromSettings,
    getCustomBackends,
    isTrezorConnectBackendType,
    shouldSubscribeBlocks,
    shouldUseIdentities,
} from '@suite-common/wallet-utils';
import TrezorConnect, {
    type BlockchainBlock,
    type BlockchainError,
    type BlockchainNotification,
} from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import type { TimerId } from '@trezor/type-utils';
import { arrayDistinct, arrayToDictionary } from '@trezor/utils';

import { BLOCKCHAIN_MODULE_PREFIX, blockchainActions } from './blockchainActions';
import {
    type BlockchainRootState,
    selectBlockchainState,
    selectIsCustomBackendConfigured,
    selectNetworkBlockchainInfo,
} from './blockchainReducer';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccounts } from '../accounts/accountsSelectors';
import {
    type FetchAndUpdateAccountThunkState,
    fetchAndUpdateAccountThunk,
    reportWalletBalanceThunk,
} from '../accounts/accountsThunks';
import {
    type GetOrFetchRawFeeInfoThunkState,
    getOrFetchRawFeeInfoThunk,
    preloadFeeInfoThunk,
} from '../fees/feesThunks';
import {
    type WalletSettingsRootState,
    selectBitcoinAmountUnit,
} from '../settings/walletSettingsReducer';

export const DEFAULT_NETWORK_SYNC_INTERVAL = 60 * 1000; // 1 minute

const NETWORK_SYNC_INTERVALS: Partial<Record<NetworkSymbol, number>> = {
    bsc: DEFAULT_NETWORK_SYNC_INTERVAL / 1.5,
    pol: DEFAULT_NETWORK_SYNC_INTERVAL / 1.5,
    op: DEFAULT_NETWORK_SYNC_INTERVAL / 1.5,
    base: DEFAULT_NETWORK_SYNC_INTERVAL / 1.5,
    arb: DEFAULT_NETWORK_SYNC_INTERVAL / 1.5,
    avax: DEFAULT_NETWORK_SYNC_INTERVAL / 1.5,
    trx: DEFAULT_NETWORK_SYNC_INTERVAL / 1.5,
    rhc: DEFAULT_NETWORK_SYNC_INTERVAL / 1.5,
    hype: DEFAULT_NETWORK_SYNC_INTERVAL / 1.5,
    sol: DEFAULT_NETWORK_SYNC_INTERVAL * 5,
};

const getNetworkSyncInterval = (
    symbol: NetworkSymbol,
    defaultInterval: number = DEFAULT_NETWORK_SYNC_INTERVAL,
) => NETWORK_SYNC_INTERVALS[symbol] ?? defaultInterval;

type ReconnectBlockchainThunkParams = {
    symbol: NetworkSymbol;
    identity?: string;
};

// call TrezorConnect.unsubscribe, it doesn't cost anything and should emit BLOCKCHAIN.CONNECT or BLOCKCHAIN.ERROR event
export const reconnectBlockchainThunk = createThunk<unknown, ReconnectBlockchainThunkParams, void>(
    `${BLOCKCHAIN_MODULE_PREFIX}/reconnectBlockchainThunk`,
    payload =>
        TrezorConnect.blockchainUnsubscribeFiatRates({
            coin: asCoinSymbol(payload.symbol),
            identity: payload.identity,
        }),
);

const setBackendsToConnect = (backends: CustomBackend[]) =>
    Promise.all(
        backends.map(({ symbol, type, urls }) =>
            TrezorConnect.blockchainSetCustomBackend({
                coin: asCoinSymbol(symbol),
                blockchainLink: {
                    type,
                    url: urls,
                },
            }),
        ),
    );

type SetCustomBackendThunkState = BlockchainRootState;

export const setCustomBackendThunk = createThunk<
    unknown,
    NetworkSymbol,
    { state: SetCustomBackendThunkState }
>(`${BLOCKCHAIN_MODULE_PREFIX}/setCustomBackendThunk`, async (symbol, { dispatch, getState }) => {
    const blockchain = selectBlockchainState(getState());
    const backends = [getBackendFromSettings(symbol, blockchain[symbol].backends)];
    const result = await setBackendsToConnect(backends);

    await dispatch(reconnectBlockchainThunk({ symbol }));

    return result;
});

export type InitBlockchainThunkState = AccountsRootState &
    BlockchainRootState &
    WalletSettingsRootState;
export type InitBlockchainThunkDeps = WithServices<AnalyticsDep>;

export const initBlockchainThunk = createThunk<
    void,
    void,
    { state: InitBlockchainThunkState; extra: InitBlockchainThunkDeps }
>(`${BLOCKCHAIN_MODULE_PREFIX}/initBlockchainThunk`, async (_, { dispatch, getState }) => {
    await dispatch(preloadFeeInfoThunk());

    // Load custom blockbook backend
    const blockchain = selectBlockchainState(getState());
    const backends = getCustomBackends(blockchain);
    await setBackendsToConnect(backends);

    const accounts = selectAccounts(getState());
    if (accounts.length <= 0) {
        // continue suite initialization
        return;
    }

    const symbols: NetworkSymbol[] = [];
    accounts.forEach(a => {
        if (!symbols.includes(a.symbol)) {
            symbols.push(a.symbol);
        }
    });

    const promises = symbols.map(symbol => dispatch(reconnectBlockchainThunk({ symbol })));
    await Promise.all(promises);

    dispatch(reportWalletBalanceThunk());

    // continue suite initialization
});

const isAccountSubscribable = (account: Account) =>
    !account.failed && isTrezorConnectBackendType(account.backendType);

export type SubscribeBlockchainThunkState = AccountsRootState;
type SubscribeBlockchainThunkParams = {
    symbol: NetworkSymbol;
    fiatRates?: boolean;
    onConnect?: boolean;
};

// called from WalletMiddleware after ACCOUNT.ADD/UPDATE action
// or after BLOCKCHAIN.CONNECT event (blockchainActions.onConnect)
export const subscribeBlockchainThunk = createThunk<
    unknown,
    SubscribeBlockchainThunkParams,
    { state: SubscribeBlockchainThunkState }
>(
    `${BLOCKCHAIN_MODULE_PREFIX}/subscribeBlockchainThunk`,
    async ({ symbol, onConnect }, { getState }) => {
        const useIdentities = shouldUseIdentities(symbol);
        // Don't subscribe to blocks for Solana, this is too intensive
        const blocks = shouldSubscribeBlocks(symbol);

        if (onConnect && useIdentities) {
            await TrezorConnect.blockchainSubscribe({ coin: asCoinSymbol(symbol), blocks });
        }

        // do NOT subscribe if there are no accounts
        // it leads to websocket disconnection
        const accountsToSubscribe = findAccountsByNetwork(
            symbol,
            selectAccounts(getState()),
        ).filter(isAccountSubscribable); // do not subscribe accounts with unsupported backend type
        if (!accountsToSubscribe.length) return;

        const paramsArray = useIdentities
            ? Object.entries(arrayToDictionary(accountsToSubscribe, getAccountIdentity, true)).map(
                  ([identity, accounts]) => ({
                      accounts,
                      coin: asCoinSymbol(symbol),
                      identity,
                      blocks: false,
                  }),
              )
            : [{ accounts: accountsToSubscribe, coin: asCoinSymbol(symbol), blocks }];

        return Promise.all(paramsArray.map(params => TrezorConnect.blockchainSubscribe(params)));
    },
);

type UnsubscribeBlockchainThunkState = AccountsRootState;

// called from WalletMiddleware after ACCOUNT.REMOVE action
export const unsubscribeBlockchainThunk = createThunk<
    unknown,
    Account[],
    { state: UnsubscribeBlockchainThunkState }
>(`${BLOCKCHAIN_MODULE_PREFIX}/unsubscribeBlockchainThunk`, (removedAccounts, { getState }) => {
    // collect unique symbols
    const symbols = removedAccounts.map(({ symbol }) => symbol).filter(arrayDistinct);
    const allAccounts = selectAccounts(getState());
    const paramsArray = symbols.flatMap<{
        symbol: NetworkSymbol;
        identity?: string;
        blocks?: boolean;
        accounts: Account[];
    }>(symbol => {
        const accountsToSubscribe = findAccountsByNetwork(symbol, allAccounts).filter(
            isAccountSubscribable,
        ); // do not unsubscribe accounts with unsupported backend type

        if (shouldUseIdentities(symbol)) {
            const accountIdentities = arrayToDictionary(
                accountsToSubscribe,
                getAccountIdentity,
                true,
            );

            const transformedRemovedAccounts = removedAccounts
                .filter(acc => acc.symbol === symbol)
                .map(getAccountIdentity)
                .filter(arrayDistinct)
                .map(identity => ({
                    symbol,
                    identity,
                    blocks: false,
                    accounts: accountIdentities[identity] ?? [],
                }));

            return [...transformedRemovedAccounts, { symbol, blocks: true, accounts: [] }];
        } else {
            return [{ symbol, accounts: accountsToSubscribe, blocks: true }];
        }
    });

    return Promise.all(
        paramsArray.map(({ accounts, symbol, identity, blocks }) => {
            const params = {
                coin: asCoinSymbol(symbol),
                identity,
                blocks,
            };

            return accounts.length
                ? // there are some accounts left, update subscription
                  TrezorConnect.blockchainSubscribe({ ...params, accounts })
                : // there are no accounts left for this coin, disconnect backend
                  TrezorConnect.blockchainDisconnect(params);
        }),
    );
});

const tryClearTimeout = (timeout?: TimerId) => {
    if (timeout) clearTimeout(timeout);
};

export type SyncAccountsWithBlockchainThunkDeps = WithServices<
    AnalyticsDep & GetIsWindowVisibleDep & GetTradedAccountKeysDep
>;
export type SyncAccountsWithBlockchainThunkState = BlockchainRootState &
    FetchAndUpdateAccountThunkState;

export const syncAccountsWithBlockchainThunk = createThunk<
    void,
    NetworkSymbol,
    {
        state: SyncAccountsWithBlockchainThunkState;
        extra: SyncAccountsWithBlockchainThunkDeps;
    }
>(
    `${BLOCKCHAIN_MODULE_PREFIX}/syncAccountsThunk`,
    async (symbol, { getState, dispatch, extra }) => {
        const accounts = selectAccounts(getState());
        const blockchain = selectBlockchainState(getState());
        const {
            services: { getIsWindowVisible },
        } = extra;
        const isWindowVisible = getIsWindowVisible();

        // First clear, to cancel last planned sync
        tryClearTimeout(blockchain[symbol].syncTimeout);

        // Sync only when the app window is active
        const shouldSync = isWindowVisible;

        if (shouldSync) {
            const visibleAccounts = findAccountsByNetwork(symbol, accounts).filter(
                account => account.visible,
            );

            await Promise.all(
                visibleAccounts.map(account =>
                    dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key })),
                ),
            );
        }

        const blockchainInfo = selectNetworkBlockchainInfo(getState(), symbol);
        // Second clear, just to be sure that no other sync was planned while executing this one
        tryClearTimeout(blockchainInfo.syncTimeout);

        const timeout = setTimeout(
            () => dispatch(syncAccountsWithBlockchainThunk(symbol)),
            getNetworkSyncInterval(symbol),
        );

        dispatch(blockchainActions.synced({ symbol, timeout }));
    },
);

type OnBlockchainConnectThunkState = SyncAccountsWithBlockchainThunkState &
    GetOrFetchRawFeeInfoThunkState;
type OnBlockchainConnectThunkDeps = WithServices<
    AnalyticsDep & GetIsWindowVisibleDep & GetTradedAccountKeysDep
>;

export const onBlockchainConnectThunk = createThunk<
    void,
    string,
    {
        state: OnBlockchainConnectThunkState;
        extra: OnBlockchainConnectThunkDeps;
    }
>(`${BLOCKCHAIN_MODULE_PREFIX}/onBlockchainConnectThunk`, async (symbol, { dispatch }) => {
    const network = getNetworkOptional(symbol.toLowerCase());
    if (!network) return;

    await dispatch(getOrFetchRawFeeInfoThunk({ networkSymbol: network.symbol }));

    await dispatch(
        subscribeBlockchainThunk({ symbol: network.symbol, fiatRates: true, onConnect: true }),
    );
    // update accounts for connected network
    await dispatch(syncAccountsWithBlockchainThunk(network.symbol));
    dispatch(blockchainActions.connected(network.symbol));
});

type OnBlockMinedThunkState = SyncAccountsWithBlockchainThunkState;
type OnBlockMinedThunkDeps = WithServices<
    AnalyticsDep & GetIsWindowVisibleDep & GetTradedAccountKeysDep
>;

export const onBlockMinedThunk = createThunk<
    unknown,
    BlockchainBlock,
    {
        state: OnBlockMinedThunkState;
        extra: OnBlockMinedThunkDeps;
    }
>(`${BLOCKCHAIN_MODULE_PREFIX}/onBlockMinedThunk`, (block, { dispatch, getState }) => {
    const symbol = block.coin.shortcut.toLowerCase();

    if (!isNetworkSymbol(symbol)) {
        return;
    }

    // Don't sync fast networks running on our metered external backend because a new block is
    // emitted every few seconds (Solana ~333ms, EVMs 0.3s-3s); the periodic timer in
    // syncAccountsWithBlockchainThunk and account subscriptions keep them updated instead.
    // A custom backend is the user's own infrastructure, so the metered concern no longer applies.
    if (
        isNetworkUsingExternalBackend(symbol) &&
        !selectIsCustomBackendConfigured(getState(), symbol)
    ) {
        return;
    }

    return dispatch(syncAccountsWithBlockchainThunk(symbol));
});

type OnBlockchainNotificationThunkState = DeviceRootState &
    SyncAccountsWithBlockchainThunkState &
    WalletSettingsRootState;
type OnBlockchainNotificationThunkDeps = WithServices<
    AnalyticsDep & GetIsWindowVisibleDep & GetTradedAccountKeysDep
>;

export const onBlockchainNotificationThunk = createThunk<
    void,
    BlockchainNotification,
    {
        state: OnBlockchainNotificationThunkState;
        extra: OnBlockchainNotificationThunkDeps;
    }
>(`${BLOCKCHAIN_MODULE_PREFIX}/onNotificationThunk`, (payload, { dispatch, getState, extra }) => {
    const { descriptor, tx } = payload.notification;
    const symbol = payload.coin.shortcut.toLowerCase();
    if (!isNetworkSymbol(symbol)) {
        return;
    }

    const networkAccounts = findAccountsByNetwork(symbol, selectAccounts(getState()));
    const accounts = findAccountsByDescriptor(descriptor, networkAccounts);
    if (!accounts.length) {
        return;
    }

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const account: (typeof accounts)[number] = accounts[0];

    // ripple worker sends two notifications for the same tx (pending + confirmed/rejected)
    // dispatch only recv notifications
    if (tx.type === 'recv' && !tx.blockHeight) {
        const accountDevice = findAccountDevice(account, selectDevices(getState()));

        const token = tx.tokens?.[0];
        const areSatoshisUsed = getAreSatoshisUsed(selectBitcoinAmountUnit(getState()), account);

        const formattedAmount = token
            ? formatTokenAmount(token)
            : formatNetworkAmount(tx.amount, account.symbol, true, areSatoshisUsed);

        dispatch(
            notificationsActions.addEvent({
                type: 'tx-received',
                formattedAmount,
                device: accountDevice,
                token,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: tx.txid,
                style: { maxWidth: 'auto' },
            }),
        );
    }

    // it's pointless to fetch ripple accounts
    // TODO: investigate more how to keep ripple pending tx until they are confirmed/rejected
    // xrpl.js doesn't send "pending" txs in history
    if (account.networkType === 'ripple') return;

    // Refetch only descriptor-matched accounts instead of every account on this symbol.
    // The previous symbol-wide sync caused N getAccountInfo calls per notification for users
    // with N accounts on the same network, hammering blockbook at ~10k connections.
    // Periodic background sync still runs on its own timer chain (seeded by
    // onBlockchainConnectThunk), so unrelated accounts stay up to date.
    //
    // While the window is hidden, the refetch is skipped and the notification is thereby
    // dropped for good (it is a one-shot push event, nothing queues or replays it) — the
    // suite walletMiddleware compensates by refetching accounts with pending transactions
    // when the window becomes visible again.
    const { getIsWindowVisible } = extra.services;
    if (!getIsWindowVisible()) return;

    accounts.forEach(matchedAccount =>
        dispatch(fetchAndUpdateAccountThunk({ accountKey: matchedAccount.key })),
    );
});

type OnBlockchainDisconnectThunkState = SyncAccountsWithBlockchainThunkState;
type OnBlockchainDisconnectThunkDeps = WithServices<
    AnalyticsDep & GetIsWindowVisibleDep & GetTradedAccountKeysDep
>;

export const onBlockchainDisconnectThunk = createThunk<
    void,
    BlockchainError,
    {
        state: OnBlockchainDisconnectThunkState;
        extra: OnBlockchainDisconnectThunkDeps;
    }
>(`${BLOCKCHAIN_MODULE_PREFIX}/onBlockchainDisconnectThunk`, (error, { dispatch, getState }) => {
    const network = getNetworkOptional(error.coin.shortcut.toLowerCase());
    if (!network) return;

    const { symbol } = network;
    const blockchain = selectBlockchainState(getState())[symbol];
    const hasAccounts = findAccountsByNetwork(symbol, selectAccounts(getState())).length > 0;

    /**
     * Without accounts there is nothing to sync, so stop the chain (coin disabled, last account removed).
     * BLOCKCHAIN.CONNECT re-seeds it when the network is used again.
     */
    if (!hasAccounts) {
        if (blockchain.syncTimeout) {
            tryClearTimeout(blockchain.syncTimeout);
            dispatch(blockchainActions.synced({ symbol, timeout: undefined }));
        }

        return;
    }

    /**
     * While accounts exist, an error must never kill the sync chain.
     * - EVM networks keep one websocket per wallet identity plus a default one,
     *   and each of them posts a coin-level BLOCKCHAIN.ERROR when it drops — including terminal disconnects
     *   that are never followed by a CONNECT that would re-seed the chain
     * - An armed timer re-arms itself in syncAccountsWithBlockchainThunk,
     *   and its account fetches fail harmlessly while the backend is down
     *   and drive the lazy reconnection once it is back — so keep it,
     *   and arm a new one only when none is left
     *   (also guards against repeated errors from a failing reconnection loop endlessly deferring the next sync).
     */
    if (!blockchain.syncTimeout) {
        const timeout = setTimeout(
            () => dispatch(syncAccountsWithBlockchainThunk(symbol)),
            getNetworkSyncInterval(symbol),
        );
        dispatch(blockchainActions.synced({ symbol, timeout }));
    }
});
