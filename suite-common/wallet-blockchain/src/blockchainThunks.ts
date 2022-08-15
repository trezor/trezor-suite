import { networksCompatibility, NetworkSymbol } from '@suite-common/wallet-config';
import { Account, CustomBackend, NetworksFeeInfo } from '@suite-common/wallet-types';
import {
    findAccountDevice,
    findAccountsByDescriptor,
    findAccountsByNetwork,
    formatAmount,
    formatNetworkAmount,
    getAreSatoshisUsed,
    getBackendFromSettings,
    getCustomBackends,
    getNetwork,
    isNetworkSymbol,
    isTrezorConnectBackendType,
} from '@suite-common/wallet-utils';
import TrezorConnect, {
    FeeLevel,
    BlockchainBlock,
    BlockchainNotification,
    BlockchainError,
} from '@trezor/connect';
import { arrayDistinct } from '@trezor/utils';
import { Timeout } from '@trezor/type-utils';
import { createThunk } from '@suite-common/redux-utils';

import {
    selectNetworkBackends,
    blockchainActions,
    selectNetwork,
    selectNetworkSyncTimeout,
    selectNetworks,
} from './blockchainSlice';
import { modulePrefix } from './constants';

const ACCOUNTS_SYNC_INTERVAL = 60 * 1000;

// sort FeeLevels in reversed order (Low > High)
// TODO: consider to use same order in @trezor/connect to avoid double sorting
const order: FeeLevel['label'][] = ['low', 'economy', 'normal', 'high'];
const sortLevels = (levels: FeeLevel[]) =>
    levels.sort((levelA, levelB) => order.indexOf(levelA.label) - order.indexOf(levelB.label));

export const preloadFeeInfoThunk = createThunk(
    `${modulePrefix}/preloadFeeInfoThunk`,
    async (_, { dispatch }) => {
        // Fetch default fee levels
        const networks = networksCompatibility.filter(n => !n.isHidden && !n.accountType);
        const promises = networks.map(network =>
            TrezorConnect.blockchainEstimateFee({
                coin: network.symbol,
                request: {
                    feeLevels: 'preloaded',
                },
            }),
        );
        const levels = await Promise.all(promises);

        const partial: Partial<NetworksFeeInfo> = {};
        networks.forEach((network, index) => {
            const result = levels[index];
            if (result.success) {
                const { payload } = result;
                partial[network.symbol] = {
                    blockHeight: 0,
                    ...payload,
                    levels: sortLevels(payload.levels).map(l => ({
                        ...l,
                        label: l.label || 'normal',
                    })),
                };
            }
        });

        dispatch(blockchainActions.updateFee(partial));
    },
);

export const updateFeeInfoThunk = createThunk(
    `${modulePrefix}/updateFeeInfoThunk`,
    async (symbol: string, { dispatch, getState, extra }) => {
        const {
            selectors: { selectFeeInfo },
        } = extra;

        const network = getNetwork(symbol.toLowerCase());
        if (!network) return;
        const blockchainInfo = selectNetwork(network.symbol)(getState());
        const feeInfo = selectFeeInfo(network.symbol)(getState());

        if (feeInfo.blockHeight > 0 && blockchainInfo.blockHeight - feeInfo.blockHeight < 10)
            return;

        let newFeeInfo;
        if (network.networkType === 'ethereum') {
            // NOTE: ethereum smart fees are not implemented properly in @trezor/connect Issue: https://github.com/trezor/trezor-suite/issues/5340
            // create raw call to @trezor/blockchain-link, receive data and create FeeLevel.normal from it
            const result = await TrezorConnect.blockchainEstimateFee({
                coin: network.symbol,
                request: {
                    blocks: [2],
                    specific: {
                        from: '0x0000000000000000000000000000000000000000',
                        to: '0x0000000000000000000000000000000000000000',
                    },
                },
            });
            if (result.success) {
                newFeeInfo = {
                    ...result.payload,
                    levels: result.payload.levels.map(l => ({
                        ...l,
                        blocks: -1, // NOTE: @trezor/connect returns -1 for ethereum default
                        label: 'normal' as const,
                    })),
                };
            }
        } else {
            const result = await TrezorConnect.blockchainEstimateFee({
                coin: network.symbol,
                request: {
                    feeLevels: 'smart',
                },
            });
            if (result.success) {
                newFeeInfo = {
                    ...result.payload,
                    levels: sortLevels(result.payload.levels),
                };
            }
        }

        if (newFeeInfo) {
            const partial: Partial<NetworksFeeInfo> = {};
            partial[network.symbol] = {
                blockHeight: blockchainInfo.blockHeight,
                ...newFeeInfo,
            };

            dispatch(blockchainActions.updateFee(partial));
        }
    },
);

// call TrezorConnect.unsubscribe, it doesn't cost anything and should emit BLOCKCHAIN.CONNECT or BLOCKCHAIN.ERROR event

export const reconnectThunk = createThunk(
    `${modulePrefix}/reconnectThunk`,
    (networkSymbol: NetworkSymbol) =>
        TrezorConnect.blockchainUnsubscribeFiatRates({ coin: networkSymbol }),
);

const setBackendsToConnect = (backends: CustomBackend[]) =>
    Promise.all(
        backends.map(({ coin, type, urls }) =>
            TrezorConnect.blockchainSetCustomBackend({
                coin,
                blockchainLink: {
                    type,
                    url: urls,
                },
            }),
        ),
    );

export const setCustomBackendThunk = createThunk(
    `${modulePrefix}/setCustomBackendThunk`,
    (networkSymbol: NetworkSymbol, { getState }) => {
        const backends = [
            getBackendFromSettings(networkSymbol, selectNetworkBackends(networkSymbol)(getState())),
        ];
        return setBackendsToConnect(backends);
    },
);

export const initThunk = createThunk(
    `${modulePrefix}/initThunk`,
    async (_, { dispatch, getState, extra }) => {
        const {
            selectors: { selectAccounts },
        } = extra;
        await dispatch(preloadFeeInfoThunk());

        // Load custom blockbook backend
        const blockchain = selectNetworks(getState());
        const backends = getCustomBackends(blockchain);
        await setBackendsToConnect(backends);

        const accounts = selectAccounts(getState());
        if (accounts.length <= 0) {
            // continue suite initialization
            return;
        }

        const coins: NetworkSymbol[] = [];
        accounts.forEach(a => {
            if (!coins.includes(a.symbol)) {
                coins.push(a.symbol);
            }
        });

        const promises = coins.map(coin => dispatch(reconnectThunk(coin)));
        await Promise.all(promises);

        // continue suite initialization
    },
);

// called from WalletMiddleware after ACCOUNT.ADD/UPDATE action
// or after BLOCKCHAIN.CONNECT event (blockchainActions.onConnect)
export const subscribeThunk = createThunk(
    `${modulePrefix}/subscribeThunk`,
    async (
        { symbol, fiatRates = false }: { symbol: NetworkSymbol; fiatRates: boolean },
        { getState, extra },
    ) => {
        const {
            selectors: { selectAccounts },
        } = extra;

        const network = getNetwork(symbol);
        // fiat rates should be subscribed only once, after onConnect event
        if (fiatRates && network?.networkType !== 'cardano') {
            // Note:
            // Because Blockfrost worker for cardano doesn't provide fiat rates,
            // calling blockchainSubscribeFiatRates will return res.success set to false.
            // That will cause skipping account subscription (because of return statement) which is called few lines below.
            // That is not expected as the original idea was to catch problem with subscribing and prevent
            // another call when we already know that something is not working (it used to cause spawning multiple websocket connections).

            // Skipping account subscription has a problem (besides that you actually don't subscribe to all addresses),
            // due to lack of subscriptions for the network, blockchain-link will close the connection
            // after 50s thinking it is not needed anymore. https://github.com/trezor/trezor-suite/blob/6253be3f9f657a9a14f21941c76ae1db36e2193c/packages/blockchain-link/src/workers/blockfrost/websocket.ts#L104
            // However if you do full discovery then everything seems to be normal. It is because
            // subscribe func will be called, without fiatRates param, every time new account is added (from walletMiddleware), but if you have the device remembered
            // subscribe function is called only once, after bl connects to a backend, with param fiatRates set to true,
            // thus it will not subscribe the accounts addresses.
            const { success } = await TrezorConnect.blockchainSubscribeFiatRates({ coin: symbol });
            // if first subscription fails, do not run the second one
            if (!success) return;
        }

        // do NOT subscribe if there are no accounts
        // it leads to websocket disconnection
        const accountsToSubscribe = findAccountsByNetwork(
            symbol,
            selectAccounts(getState()),
        ).filter(a => isTrezorConnectBackendType(a.backendType)); // do not subscribe accounts with unsupported backend type
        if (!accountsToSubscribe.length) return;
        return TrezorConnect.blockchainSubscribe({
            accounts: accountsToSubscribe,
            coin: symbol,
        });
    },
);

// called from WalletMiddleware after ACCOUNT.REMOVE action
export const unsubscribeThunk = createThunk(
    `${modulePrefix}/unsubscribeThunk`,
    (removedAccounts: Account[], { getState, extra }) => {
        const {
            selectors: { selectAccounts },
        } = extra;
        // collect unique symbols
        const symbols = removedAccounts.map(({ symbol }) => symbol).filter(arrayDistinct);

        const accounts = selectAccounts(getState());
        const promises = symbols.map(symbol => {
            const accountsToSubscribe = findAccountsByNetwork(symbol, accounts).filter(a =>
                isTrezorConnectBackendType(a.backendType),
            ); // do not unsubscribe accounts with unsupported backend type
            if (accountsToSubscribe.length) {
                // there are some accounts left, update subscription
                return TrezorConnect.blockchainSubscribe({
                    accounts: accountsToSubscribe,
                    coin: symbol,
                });
            }
            // there are no accounts left for this coin, disconnect backend
            return TrezorConnect.blockchainDisconnect({ coin: symbol });
        });

        return Promise.all(promises as Promise<any>[]);
    },
);

const tryClearTimeout = (timeout?: Timeout) => {
    if (timeout) clearTimeout(timeout);
};

export const syncAccountsThunk = createThunk(
    `${modulePrefix}/syncAccountsThunk`,
    async (networkSymbol: NetworkSymbol, { dispatch, getState, extra }) => {
        const {
            thunks: { fetchAndUpdateAccount },
            selectors: { selectAccounts },
        } = extra;
        // First clear, to cancel last planned sync
        tryClearTimeout(selectNetworkSyncTimeout(networkSymbol)(getState()));

        await Promise.all(
            findAccountsByNetwork(networkSymbol, selectAccounts(getState())).map(a =>
                dispatch(fetchAndUpdateAccount(a)),
            ),
        );

        // Second clear, just to be sure that no other sync was planned while executing this one
        tryClearTimeout(selectNetworkSyncTimeout(networkSymbol)(getState()));
        const timeout = setTimeout(
            () => dispatch(syncAccountsThunk(networkSymbol)),
            ACCOUNTS_SYNC_INTERVAL,
        );

        dispatch(blockchainActions.synced({ symbol: networkSymbol, timeout }));
    },
);

export const onConnectThunk = createThunk(
    `${modulePrefix}/onConnectThunk`,
    async (networkSymbol: NetworkSymbol, { dispatch, getState }) => {
        const network = getNetwork(networkSymbol.toLowerCase());
        if (!network) return;
        const blockchain = selectNetwork(networkSymbol)(getState());
        // reset previous timeout
        tryClearTimeout(blockchain.reconnection?.id);
        await dispatch(subscribeThunk({ symbol: networkSymbol, fiatRates: true }));
        await dispatch(updateFeeInfoThunk(network.symbol));
        // update accounts for connected network
        await dispatch(syncAccountsThunk(network.symbol));

        dispatch(blockchainActions.connected);
    },
);

export const onBlockMinedThunk = createThunk(
    `${modulePrefix}/onBlockMinedThunk`,
    (block: BlockchainBlock, { dispatch }) => {
        const symbol = block.coin.shortcut.toLowerCase();
        if (isNetworkSymbol(symbol)) {
            return dispatch(syncAccountsThunk(symbol));
        }
    },
);

export const onDisconnectThunk = createThunk(
    `${modulePrefix}/onDisconnectThunk`,
    (error: BlockchainError, { dispatch, getState, extra }) => {
        const {
            selectors: { selectAccounts },
        } = extra;

        const network = getNetwork(error.coin.shortcut.toLowerCase());
        if (!network) return;

        const accounts = selectAccounts(getState());
        const { reconnection, syncTimeout } = selectNetwork(network.symbol)(getState());
        // reset previous timeout
        tryClearTimeout(reconnection?.id);
        tryClearTimeout(syncTimeout);

        // there is no need to reconnect since there are no accounts for this network
        const a = findAccountsByNetwork(network.symbol, accounts);
        if (!a.length) return;

        const count = reconnection ? reconnection.count : 0;
        const timeout = Math.min(2500 * count, 20000);
        const time = new Date().getTime() + timeout;

        const id = setTimeout(() => dispatch(reconnectThunk(network.symbol)), timeout);

        blockchainActions.reconnectTimeoutStart({
            symbol: network.symbol,
            id,
            time,
            count: count + 1,
        });

        dispatch(
            blockchainActions.reconnectTimeoutStart({
                symbol: network.symbol,
                id,
                time,
                count: count + 1,
            }),
        );
    },
);

export const onNotificationThunk = createThunk(
    `${modulePrefix}/onNotificationThunk`,
    (payload: BlockchainNotification, { dispatch, extra, getState }) => {
        const {
            selectors: { selectAccounts, selectDevices, selectBitcoinAmountUnit },
            actions: { notificationsAddEvent },
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
            const areSatoshisUsed = getAreSatoshisUsed(selectBitcoinAmountUnit(getState()));

            const formattedAmount = token
                ? `${formatAmount(token.amount, token.decimals)} ${token.symbol.toUpperCase()}`
                : formatNetworkAmount(tx.amount, account.symbol, true, areSatoshisUsed);

            dispatch(
                notificationsAddEvent({
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
        // ripple-lib doesn't send "pending" txs in history
        if (account.networkType !== 'ripple') {
            dispatch(syncAccountsThunk(symbol));
        }
    },
);
