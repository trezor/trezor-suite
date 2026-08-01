import { selectDevices } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type NetworkSymbol,
    getNetworkOptional,
    isNetworkSymbol,
    isNetworkUsingExternalBackend,
} from '@suite-common/wallet-config';
import type { Account, CustomBackend } from '@suite-common/wallet-types';
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
import type { TimerId } from '@trezor/type-utils';
import { arrayDistinct, arrayToDictionary } from '@trezor/utils';

import { BLOCKCHAIN_MODULE_PREFIX, blockchainActions } from './blockchainActions';
import {
    selectBlockchainState,
    selectIsCustomBackendConfigured,
    selectNetworkBlockchainInfo,
} from './blockchainReducer';
import { selectAccounts } from '../accounts/accountsSelectors';
import { fetchAndUpdateAccountThunk, reportWalletBalanceThunk } from '../accounts/accountsThunks';
import { preloadFeeInfoThunk } from '../fees/feesThunks';
import { selectBitcoinAmountUnit } from '../settings/walletSettingsReducer';

export const DEFAULT_ACCOUNT_SYNC_INTERVAL = 60 * 1000; // 1 minute

const CUSTOM_ACCOUNT_SYNC_INTERVALS: Partial<Record<NetworkSymbol, number>> = {
    bsc: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    pol: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    op: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    base: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    arb: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    avax: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    trx: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    rhc: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    hype: DEFAULT_ACCOUNT_SYNC_INTERVAL / 1.5,
    sol: DEFAULT_ACCOUNT_SYNC_INTERVAL * 5,
};

const getAccountSyncInterval = (symbol: NetworkSymbol) =>
    CUSTOM_ACCOUNT_SYNC_INTERVALS[symbol] || DEFAULT_ACCOUNT_SYNC_INTERVAL;

// call TrezorConnect.unsubscribe, it doesn't cost anything and should emit BLOCKCHAIN.CONNECT or BLOCKCHAIN.ERROR event
export const reconnectBlockchainThunk = createThunk(
    `${BLOCKCHAIN_MODULE_PREFIX}/reconnectBlockchainThunk`,
    (payload: { symbol: NetworkSymbol; identity?: string }) =>
        TrezorConnect.blockchainUnsubscribeFiatRates({
            coin: payload.symbol,
            identity: payload.identity,
        }),
);

const setBackendsToConnect = (backends: CustomBackend[]) =>
    Promise.all(
        backends.map(({ symbol, type, urls }) =>
            TrezorConnect.blockchainSetCustomBackend({
                coin: symbol,
                blockchainLink: {
                    type,
                    url: urls,
                },
            }),
        ),
    );

export const setCustomBackendThunk = createThunk(
    `${BLOCKCHAIN_MODULE_PREFIX}/setCustomBackendThunk`,
    (symbol: NetworkSymbol, { getState }) => {
        const blockchain = selectBlockchainState(getState());
        const backends = [getBackendFromSettings(symbol, blockchain[symbol].backends)];

        return setBackendsToConnect(backends);
    },
);

export const initBlockchainThunk = createThunk(
    `${BLOCKCHAIN_MODULE_PREFIX}/initBlockchainThunk`,
    async (_, { dispatch, getState }) => {
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
    },
);

const isAccountSubscribable = (account: Account) =>
    !account.failed && isTrezorConnectBackendType(account.backendType);

// called from WalletMiddleware after ACCOUNT.ADD/UPDATE action
// or after BLOCKCHAIN.CONNECT event (blockchainActions.onConnect)
export const subscribeBlockchainThunk = createThunk(
    `${BLOCKCHAIN_MODULE_PREFIX}/subscribeBlockchainThunk`,
    async (
        { symbol, onConnect }: { symbol: NetworkSymbol; fiatRates?: boolean; onConnect?: boolean },
        { getState },
    ) => {
        const useIdentities = shouldUseIdentities(symbol);
        // Don't subscribe to blocks for Solana, this is too intensive
        const blocks = shouldSubscribeBlocks(symbol);

        if (onConnect && useIdentities) {
            await TrezorConnect.blockchainSubscribe({ coin: symbol, blocks });
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
                      coin: symbol,
                      identity,
                      blocks: false,
                  }),
              )
            : [{ accounts: accountsToSubscribe, coin: symbol, blocks }];

        return Promise.all(paramsArray.map(params => TrezorConnect.blockchainSubscribe(params)));
    },
);

// called from WalletMiddleware after ACCOUNT.REMOVE action
export const unsubscribeBlockchainThunk = createThunk(
    `${BLOCKCHAIN_MODULE_PREFIX}/unsubscribeBlockchainThunk`,
    (removedAccounts: Account[], { getState }) => {
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
                    coin: symbol,
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
    },
);

const tryClearTimeout = (timeout?: TimerId) => {
    if (timeout) clearTimeout(timeout);
};

export const syncAccountsWithBlockchainThunk = createThunk(
    `${BLOCKCHAIN_MODULE_PREFIX}/syncAccountsThunk`,
    async (symbol: NetworkSymbol, { getState, dispatch, extra }) => {
        const accounts = selectAccounts(getState());
        const blockchain = selectBlockchainState(getState());
        const {
            selectors: { selectIsWindowVisible },
        } = extra;
        const isWindowVisible = selectIsWindowVisible(getState());

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
            getAccountSyncInterval(symbol),
        );

        dispatch(blockchainActions.synced({ symbol, timeout }));
    },
);

export const onBlockchainConnectThunk = createThunk(
    `${BLOCKCHAIN_MODULE_PREFIX}/onBlockchainConnectThunk`,
    async (symbol: string, { dispatch }) => {
        const network = getNetworkOptional(symbol.toLowerCase());
        if (!network) return;

        await dispatch(
            subscribeBlockchainThunk({ symbol: network.symbol, fiatRates: true, onConnect: true }),
        );
        // update accounts for connected network
        await dispatch(syncAccountsWithBlockchainThunk(network.symbol));
        dispatch(blockchainActions.connected(network.symbol));
    },
);

export const onBlockMinedThunk = createThunk(
    `${BLOCKCHAIN_MODULE_PREFIX}/onBlockMinedThunk`,
    (block: BlockchainBlock, { dispatch, getState }) => {
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
    },
);

export const onBlockchainNotificationThunk = createThunk(
    `${BLOCKCHAIN_MODULE_PREFIX}/onNotificationThunk`,
    (payload: BlockchainNotification, { dispatch, getState, extra }) => {
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
            const areSatoshisUsed = getAreSatoshisUsed(
                selectBitcoinAmountUnit(getState()),
                account,
            );

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
        const { selectIsWindowVisible } = extra.selectors;
        if (!selectIsWindowVisible(getState())) return;

        accounts.forEach(matchedAccount =>
            dispatch(fetchAndUpdateAccountThunk({ accountKey: matchedAccount.key })),
        );
    },
);

export const onBlockchainDisconnectThunk = createThunk(
    `${BLOCKCHAIN_MODULE_PREFIX}/onBlockchainDisconnectThunk`,
    (error: BlockchainError, { getState }) => {
        const network = getNetworkOptional(error.coin.shortcut.toLowerCase());
        if (!network) return;

        const blockchain = selectBlockchainState(getState());
        const { syncTimeout } = blockchain[network.symbol];
        // reset previous timeout
        tryClearTimeout(syncTimeout);
    },
);
