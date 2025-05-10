import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    NetworkSymbol,
    externalBackendTypeNetworks,
    getNetworkOptional,
    isNetworkSymbol,
    isTrezorInfraBasedNetwork,
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
    BlockchainBlock,
    BlockchainError,
    BlockchainNotification,
} from '@trezor/connect';
import type { TimerId } from '@trezor/type-utils';
import { arrayDistinct, arrayToDictionary } from '@trezor/utils';

import { BLOCKCHAIN_MODULE_PREFIX, blockchainActions } from './blockchainActions';
import { selectBlockchainState, selectNetworkBlockchainInfo } from './blockchainReducer';
import { selectAccounts } from '../accounts/accountsReducer';
import { fetchAndUpdateAccountThunk } from '../accounts/accountsThunks';
import { preloadFeeInfoThunk } from '../fees/feesThunks';

export const DEFAULT_ACCOUNT_SYNC_INTERVAL = 60 * 1000; // 1 minute

const CUSTOM_ACCOUNT_SYNC_INTERVALS: Partial<Record<NetworkSymbol, number>> = {
    bsc: DEFAULT_ACCOUNT_SYNC_INTERVAL / 3,
    pol: DEFAULT_ACCOUNT_SYNC_INTERVAL / 3,
    op: DEFAULT_ACCOUNT_SYNC_INTERVAL / 3,
    base: DEFAULT_ACCOUNT_SYNC_INTERVAL / 3,
    arb: DEFAULT_ACCOUNT_SYNC_INTERVAL / 3,
    sol: DEFAULT_ACCOUNT_SYNC_INTERVAL * 5,
    ada: DEFAULT_ACCOUNT_SYNC_INTERVAL * 5,
    xrp: DEFAULT_ACCOUNT_SYNC_INTERVAL * 3,
    xlm: DEFAULT_ACCOUNT_SYNC_INTERVAL * 3,
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

        // continue suite initialization
    },
);

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
        ).filter(a => isTrezorConnectBackendType(a.backendType)); // do not subscribe accounts with unsupported backend type
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
            const accountsToSubscribe = findAccountsByNetwork(symbol, allAccounts).filter(a =>
                isTrezorConnectBackendType(a.backendType),
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

        // non-blockbook + networks using external nodes will not be updated when app window is not active
        const shouldSync = isWindowVisible || isTrezorInfraBasedNetwork(symbol);

        if (shouldSync) {
            // non-blockbook + networks using external nodes will not update periodically if not visible in UI (sidebar)
            const visibleAccounts = findAccountsByNetwork(symbol, accounts).filter(
                account => isTrezorInfraBasedNetwork(symbol) || account.visible,
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
    (block: BlockchainBlock, { dispatch }) => {
        const symbol = block.coin.shortcut.toLowerCase();
        const network = getNetworkOptional(symbol);

        if (!isNetworkSymbol(symbol)) {
            return;
        }

        // Don't sync fast networks because a new block is emitted every few seconds.
        // Accounts are updated via account subscription or also by the timer in syncAccountsWithBlockchainThunk.
        // Solana - new block every ~333ms, EVMs 0.3s-3s
        if (network?.networkType === 'solana' || externalBackendTypeNetworks.includes(symbol)) {
            return;
        }

        return dispatch(syncAccountsWithBlockchainThunk(symbol));
    },
);

export const onBlockchainNotificationThunk = createThunk(
    `${BLOCKCHAIN_MODULE_PREFIX}/onNotificationThunk`,
    (payload: BlockchainNotification, { dispatch, getState, extra }) => {
        const {
            selectors: { selectBitcoinAmountUnit, selectDevices },
        } = extra;
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

        const account = accounts[0];

        // ripple worker sends two notifications for the same tx (pending + confirmed/rejected)
        // dispatch only recv notifications
        if (tx.type === 'recv' && !tx.blockHeight) {
            const accountDevice = findAccountDevice(account, selectDevices(getState()));

            const token = tx.tokens && tx.tokens.length ? tx.tokens[0] : undefined;
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
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    txid: tx.txid,
                }),
            );
        }

        // it's pointless to fetch ripple accounts
        // TODO: investigate more how to keep ripple pending tx until they are confirmed/rejected
        // xrpl.js doesn't send "pending" txs in history
        if (account.networkType !== 'ripple') {
            dispatch(syncAccountsWithBlockchainThunk(symbol));
        }
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
