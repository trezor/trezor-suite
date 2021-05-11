import TrezorConnect, {
    FeeLevel,
    BlockchainBlock,
    BlockchainNotification,
    BlockchainError,
    BlockchainEstimateFee,
} from 'trezor-connect';
import * as accountUtils from '@wallet-utils/accountUtils';
import * as accountActions from '@wallet-actions/accountActions';
import { getNetwork } from '@wallet-utils/accountUtils';
import * as notificationActions from '@suite-actions/notificationActions';
import { State as FeeState } from '@wallet-reducers/feesReducer';
import { NETWORKS } from '@wallet-config';
import { Dispatch, GetState } from '@suite-types';
import { Account, Network } from '@wallet-types';
import { BLOCKCHAIN } from './constants';

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
export const setCustomBackend = (symbol?: string) => (_: Dispatch, getState: GetState) => {
    const { blockbookUrls } = getState().wallet.settings;
    // collect unique coins
    const coins = symbol
        ? [symbol]
        : blockbookUrls.reduce((arr, b) => {
              if (arr.indexOf(b.coin) < 0) return arr.concat([b.coin]);
              return arr;
          }, [] as string[]);
    // no custom backends
    if (!coins.length) return;

    const promises = coins.map(coin =>
        TrezorConnect.blockchainSetCustomBackend({
            coin,
            blockchainLink: {
                type: 'blockbook',
                url: blockbookUrls.filter(b => b.coin === coin).map(b => b.url),
            },
        }),
    );
    return Promise.all(promises);
};

export const clearCustomBackend = (symbol: string | string[]) => () => {
    const coins = typeof symbol === 'string' ? [symbol] : [...new Set(symbol)];
    const promises = coins.map(coin =>
        TrezorConnect.blockchainSetCustomBackend({
            coin,
            blockchainLink: {
                type: 'blockbook',
                url: [],
            },
        }),
    );
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
export const subscribe = (symbol: Network['symbol'], fiatRates = false) => async (
    _: Dispatch,
    getState: GetState,
) => {
    // fiat rates should be subscribed only once, after onConnect event
    if (fiatRates) {
        const { success } = await TrezorConnect.blockchainSubscribeFiatRates({ coin: symbol });
        // if first subscription fails, do not run the second one
        if (!success) return;
    }

    // do NOT subscribe if there are no accounts
    // it leads to websocket disconnection
    const { accounts } = getState().wallet;
    if (!accounts.length) return;
    const accountsToSubscribe = accounts.filter(a => a.symbol === symbol);
    if (!accountsToSubscribe.length) return;
    return TrezorConnect.blockchainSubscribe({
        accounts: accountsToSubscribe,
        coin: symbol,
    });
};

// called from WalletMiddleware after ACCOUNT.REMOVE action
export const unsubscribe = (removedAccounts: Account[]) => (_: Dispatch, getState: GetState) => {
    // collect unique symbols
    const symbols = removedAccounts.reduce((arr, account) => {
        if (arr.indexOf(account.symbol) < 0) return arr.concat([account.symbol]);
        return arr;
    }, [] as string[]);

    const { accounts } = getState().wallet;
    const promises = symbols.map(symbol => {
        const accountsToSubscribe = accounts.filter(a => a.symbol === symbol);
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

export const onConnect = (symbol: string) => async (dispatch: Dispatch, getState: GetState) => {
    const network = getNetwork(symbol.toLowerCase());
    if (!network) return;
    const blockchain = getState().wallet.blockchain[network.symbol];
    if (blockchain.reconnection) {
        // reset previous timeout
        clearTimeout(blockchain.reconnection.id);
    }
    await dispatch(subscribe(network.symbol, true));
    await dispatch(updateFeeInfo(network.symbol));
    // update accounts for connected network
    const accounts = getState().wallet.accounts.filter(a => a.symbol === network.symbol);
    if (accounts.length) {
        const promises = accounts.map(a => dispatch(accountActions.fetchAndUpdateAccount(a)));
        await Promise.all(promises);
    }
    dispatch({ type: BLOCKCHAIN.CONNECTED, payload: symbol });
};

export const onBlockMined = (block: BlockchainBlock) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const symbol = block.coin.shortcut.toLowerCase();
    const networkAccounts = getState().wallet.accounts.filter(a => a.symbol === symbol);
    const promises = networkAccounts.map(account =>
        dispatch(accountActions.fetchAndUpdateAccount(account)),
    );
    return Promise.all(promises);
};

export const onNotification = (payload: BlockchainNotification) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { descriptor, tx } = payload.notification;
    const symbol = payload.coin.shortcut.toLowerCase();
    const networkAccounts = getState().wallet.accounts.filter(a => a.symbol === symbol);
    const accounts = accountUtils.findAccountsByDescriptor(descriptor, networkAccounts);
    if (!accounts.length) return;
    const account = accounts[0];

    // ripple worker sends two notifications for the same tx (pending + confirmed/rejected)
    // dispatch only recv notifications
    if (tx.type === 'recv' && !tx.blockHeight) {
        const accountDevice = accountUtils.findAccountDevice(account, getState().devices);
        const token = tx.tokens && tx.tokens.length ? tx.tokens[0] : undefined;
        const formattedAmount = token
            ? `${accountUtils.formatAmount(
                  token.amount,
                  token.decimals,
              )} ${token.symbol.toUpperCase()}`
            : accountUtils.formatNetworkAmount(tx.amount, account.symbol, true);

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
        // tmp workaround for BB not sending multiple notifications, fix in progress
        if (account.networkType === 'bitcoin') {
            networkAccounts.forEach(a => {
                dispatch(accountActions.fetchAndUpdateAccount(a));
            });
        } else {
            dispatch(accountActions.fetchAndUpdateAccount(account));
        }
    }
};

export const onDisconnect = (error: BlockchainError) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const network = getNetwork(error.coin.shortcut.toLowerCase());
    if (!network) return;

    const { blockchain, accounts } = getState().wallet;
    const { reconnection } = blockchain[network.symbol];
    if (reconnection) {
        // reset previous timeout
        clearTimeout(reconnection.id);
    }

    // there is no need to reconnect since there are no accounts for this network
    const a = accounts.filter(a => a.symbol === network.symbol);
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
