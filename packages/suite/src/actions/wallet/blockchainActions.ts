import TrezorConnect, {
    FeeLevel,
    BlockchainBlock,
    BlockchainNotification,
    BlockchainError,
    BlockchainEstimateFee,
} from 'trezor-connect';
import { arrayDistinct } from '@trezor/utils';
import * as accountActions from '@wallet-actions/accountActions';
import {
    getNetwork,
    isNetworkSymbol,
    findAccountsByDescriptor,
    findAccountsByNetwork,
    findAccountDevice,
    formatAmount,
    formatNetworkAmount,
} from '@wallet-utils/accountUtils';
import * as notificationActions from '@suite-actions/notificationActions';
import { State as FeeState } from '@wallet-reducers/feesReducer';
import { NETWORKS } from '@wallet-config';
import { BLOCKCHAIN } from './constants';
import { getDefaultBackendType } from '@suite-utils/backend';
import type { Dispatch, GetState } from '@suite-types';
import type { Account, Network } from '@wallet-types';

const ACCOUNTS_SYNC_INTERVAL = 60 * 1000;

// Conditionally subscribe to blockchain backend
// called after TrezorConnect.init successfully emits TRANSPORT.START event
// checks if there are discovery processes loaded from LocalStorage
// if so starts subscription to proper networks

export type BlockchainAction =
    | {
          type: typeof BLOCKCHAIN.READY;
      }
    | {
          type: typeof BLOCKCHAIN.CONNECTED;
          payload: Network['symbol'];
      }
    | {
          type: typeof BLOCKCHAIN.RECONNECT_TIMEOUT_START;
          payload: {
              symbol: Network['symbol'];
              id: ReturnType<typeof setTimeout>;
              time: number;
              count: number;
          };
      }
    | {
          type: typeof BLOCKCHAIN.UPDATE_FEE;
          payload: Partial<FeeState>;
      }
    | {
          type: typeof BLOCKCHAIN.SYNCED;
          payload: {
              symbol: Network['symbol'];
              timeout: ReturnType<typeof setTimeout>;
          };
      };

// sort FeeLevels in reversed order (Low > High)
// TODO: consider to use same order in trezor-connect to avoid double sorting
const order: FeeLevel['label'][] = ['low', 'economy', 'normal', 'high'];
const sortLevels = (levels: FeeLevel[]) =>
    levels.sort((levelA, levelB) => order.indexOf(levelA.label) - order.indexOf(levelB.label));

export const preloadFeeInfo = () => async (dispatch: Dispatch) => {
    // Fetch default fee levels
    const networks = NETWORKS.filter(n => !n.isHidden && !n.accountType);
    const promises = networks.map(network =>
        TrezorConnect.blockchainEstimateFee({
            coin: network.symbol,
            request: {
                feeLevels: 'preloaded',
            },
        }),
    );
    const levels = await Promise.all(promises);

    const partial: Partial<FeeState> = {};
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

    dispatch({
        type: BLOCKCHAIN.UPDATE_FEE,
        payload: partial,
    });
};

export const updateFeeInfo = (symbol: string) => async (dispatch: Dispatch, getState: GetState) => {
    const network = getNetwork(symbol.toLowerCase());
    if (!network) return;
    const blockchainInfo = getState().wallet.blockchain[network.symbol];
    const feeInfo = getState().wallet.fees[network.symbol];

    if (feeInfo.blockHeight > 0 && blockchainInfo.blockHeight - feeInfo.blockHeight < 10) return;

    let payload: BlockchainEstimateFee;

    if (network.networkType === 'ethereum') {
        payload = {
            coin: network.symbol,
            request: {
                blocks: [2],
                specific: {
                    from: '0x0000000000000000000000000000000000000000',
                    to: '0x0000000000000000000000000000000000000000',
                },
            },
        };
    } else {
        payload = {
            coin: network.symbol,
            request: {
                feeLevels: 'smart',
            },
        };
    }

    const result = await TrezorConnect.blockchainEstimateFee(payload);

    if (result.success) {
        const { payload } = result;
        const partial: Partial<FeeState> = {};
        partial[network.symbol] = {
            blockHeight: blockchainInfo.blockHeight,
            ...payload,
            levels: sortLevels(payload.levels).map(l => ({
                ...l,
                label: l.label || 'normal',
            })),
        };

        dispatch({
            type: BLOCKCHAIN.UPDATE_FEE,
            payload: partial,
        });
    }
};

// call TrezorConnect.unsubscribe, it doesn't cost anything and should emit BLOCKCHAIN.CONNECT or BLOCKCHAIN.ERROR event
export const reconnect = (coin: Network['symbol']) => (_dispatch: Dispatch) =>
    TrezorConnect.blockchainUnsubscribeFiatRates({ coin });

// called from WalletMiddleware after ADD/REMOVE_BLOCKBOOK_URL action
// or from blockchainActions.init
export const setCustomBackend = (coin?: Network['symbol']) => (_: Dispatch, getState: GetState) => {
    const { backends } = getState().wallet.settings;

    // collect unique coins
    const coins = coin ? [coin] : (Object.keys(backends) as Network['symbol'][]);

    // no custom backends
    if (!coins.length) return;

    const promises = coins.map(coin => {
        const { type, urls } = backends[coin] ?? {
            type: getDefaultBackendType(coin),
            urls: [],
        };
        return TrezorConnect.blockchainSetCustomBackend({
            coin,
            blockchainLink: {
                type,
                url: urls,
            },
        });
    });

    return Promise.all(promises);
};

export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    await dispatch(preloadFeeInfo());

    // Load custom blockbook backend
    await dispatch(setCustomBackend());

    const { accounts } = getState().wallet;
    if (accounts.length <= 0) {
        // continue suite initialization
        dispatch({
            type: BLOCKCHAIN.READY,
        });
        return;
    }

    const coins: Network['symbol'][] = [];
    accounts.forEach(a => {
        if (!coins.includes(a.symbol)) {
            coins.push(a.symbol);
        }
    });

    const promises = coins.map(coin => dispatch(reconnect(coin)));
    await Promise.all(promises);

    // continue suite initialization
    dispatch({
        type: BLOCKCHAIN.READY,
    });
};

// called from WalletMiddleware after ACCOUNT.ADD/UPDATE action
// or after BLOCKCHAIN.CONNECT event (blockchainActions.onConnect)
export const subscribe =
    (symbol: Network['symbol'], fiatRates = false) =>
    async (_: Dispatch, getState: GetState) => {
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
        const accountsToSubscribe = findAccountsByNetwork(symbol, getState().wallet.accounts);
        if (!accountsToSubscribe.length) return;
        return TrezorConnect.blockchainSubscribe({
            accounts: accountsToSubscribe,
            coin: symbol,
        });
    };

// called from WalletMiddleware after ACCOUNT.REMOVE action
export const unsubscribe = (removedAccounts: Account[]) => (_: Dispatch, getState: GetState) => {
    // collect unique symbols
    const symbols = removedAccounts.map(({ symbol }) => symbol).filter(arrayDistinct);

    const { accounts } = getState().wallet;
    const promises = symbols.map(symbol => {
        const accountsToSubscribe = findAccountsByNetwork(symbol, accounts);
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
};

const tryClearTimeout = (timeout?: ReturnType<typeof setTimeout>) => {
    if (timeout) clearTimeout(timeout);
};

export const syncAccounts =
    (symbol: Network['symbol']) => async (dispatch: Dispatch, getState: GetState) => {
        const { accounts, blockchain } = getState().wallet;
        // First clear, to cancel last planned sync
        tryClearTimeout(blockchain[symbol].syncTimeout);

        await Promise.all(
            findAccountsByNetwork(symbol, accounts).map(a =>
                dispatch(accountActions.fetchAndUpdateAccount(a)),
            ),
        );

        // Second clear, just to be sure that no other sync was planned while executing this one
        tryClearTimeout(getState().wallet.blockchain[symbol].syncTimeout);
        const timeout = setTimeout(() => dispatch(syncAccounts(symbol)), ACCOUNTS_SYNC_INTERVAL);

        dispatch({
            type: BLOCKCHAIN.SYNCED,
            payload: {
                symbol,
                timeout,
            },
        });
    };

export const onConnect = (symbol: string) => async (dispatch: Dispatch, getState: GetState) => {
    const network = getNetwork(symbol.toLowerCase());
    if (!network) return;
    const blockchain = getState().wallet.blockchain[network.symbol];
    // reset previous timeout
    tryClearTimeout(blockchain.reconnection?.id);
    await dispatch(subscribe(network.symbol, true));
    await dispatch(updateFeeInfo(network.symbol));
    // update accounts for connected network
    await dispatch(syncAccounts(network.symbol));
    dispatch({ type: BLOCKCHAIN.CONNECTED, payload: symbol });
};

export const onBlockMined = (block: BlockchainBlock) => (dispatch: Dispatch) => {
    const symbol = block.coin.shortcut.toLowerCase();
    if (isNetworkSymbol(symbol)) {
        return dispatch(syncAccounts(symbol));
    }
};

export const onNotification =
    (payload: BlockchainNotification) => (dispatch: Dispatch, getState: GetState) => {
        const { descriptor, tx } = payload.notification;
        const symbol = payload.coin.shortcut.toLowerCase();
        if (!isNetworkSymbol(symbol)) {
            return;
        }

        const networkAccounts = findAccountsByNetwork(symbol, getState().wallet.accounts);
        const accounts = findAccountsByDescriptor(descriptor, networkAccounts);
        if (!accounts.length) {
            return;
        }

        const account = accounts[0];

        // ripple worker sends two notifications for the same tx (pending + confirmed/rejected)
        // dispatch only recv notifications
        if (tx.type === 'recv' && !tx.blockHeight) {
            const accountDevice = findAccountDevice(account, getState().devices);
            const token = tx.tokens && tx.tokens.length ? tx.tokens[0] : undefined;
            const formattedAmount = token
                ? `${formatAmount(token.amount, token.decimals)} ${token.symbol.toUpperCase()}`
                : formatNetworkAmount(tx.amount, account.symbol, true);

            dispatch(
                notificationActions.addEvent({
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
            dispatch(syncAccounts(symbol));
        }
    };

export const onDisconnect =
    (error: BlockchainError) => (dispatch: Dispatch, getState: GetState) => {
        const network = getNetwork(error.coin.shortcut.toLowerCase());
        if (!network) return;

        const { blockchain, accounts } = getState().wallet;
        const { reconnection, syncTimeout } = blockchain[network.symbol];
        // reset previous timeout
        tryClearTimeout(reconnection?.id);
        tryClearTimeout(syncTimeout);

        // there is no need to reconnect since there are no accounts for this network
        const a = findAccountsByNetwork(network.symbol, accounts);
        if (!a.length) return;

        const count = reconnection ? reconnection.count : 0;
        const timeout = Math.min(2500 * count, 20000);
        const time = new Date().getTime() + timeout;

        const id = setTimeout(() => dispatch(reconnect(network.symbol)), timeout);

        dispatch({
            type: BLOCKCHAIN.RECONNECT_TIMEOUT_START,
            payload: {
                symbol: network.symbol,
                id,
                time,
                count: count + 1,
            },
        });
    };
