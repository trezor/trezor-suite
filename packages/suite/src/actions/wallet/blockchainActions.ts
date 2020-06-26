import TrezorConnect, {
    BlockchainBlock,
    BlockchainNotification,
    BlockchainError,
    BlockchainEstimateFee,
} from 'trezor-connect';
import * as accountUtils from '@wallet-utils/accountUtils';
import * as sendActions from '@wallet-actions/send/sendFormActions';
import * as accountActions from '@wallet-actions/accountActions';
import * as fiatRatesActions from '@wallet-actions/fiatRatesActions';
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

export type BlockchainActions =
    | {
          type: typeof BLOCKCHAIN.READY;
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

export const preloadFeeInfo = () => async (dispatch: Dispatch) => {
    // Fetch default fee levels
    const networks = NETWORKS.filter(n => !n.isHidden && !n.accountType);
    const promises = networks.map(network => {
        return TrezorConnect.blockchainEstimateFee({
            coin: network.symbol,
            request: {
                feeLevels: 'preloaded',
            },
        });
    });
    const levels = await Promise.all(promises);

    const partial: Partial<FeeState> = {};
    networks.forEach((network, index) => {
        const result = levels[index];
        if (result.success) {
            const { payload } = result;
            partial[network.symbol] = {
                blockHeight: 0,
                ...payload,
                levels: payload.levels.map(l => ({
                    ...l,
                    value: l.feePerUnit,
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
            levels: payload.levels.map(l => ({
                ...l,
                label: l.label || 'normal',
                value: l.feePerUnit,
            })),
        };

        dispatch({
            type: BLOCKCHAIN.UPDATE_FEE,
            payload: partial,
        });

        dispatch(sendActions.updateFeeOrNotify());
    }
};

// call TrezorConnect.unsubscribe, it doesn't cost anything and should emit BLOCKCHAIN.CONNECT or BLOCKCHAIN.ERROR event
export const reconnect = (coin: Network['symbol']) => async (_dispatch: Dispatch) => {
    return TrezorConnect.blockchainUnsubscribeFiatRates({ coin });
};

export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    await dispatch(preloadFeeInfo());

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

export const subscribe = (symbol?: Network['symbol']) => async (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    const { accounts } = getState().wallet;
    if (accounts.length <= 0) return;

    const sortedAccounts: { [key: string]: Account[] } = {};
    const accountsToSubscribe = symbol ? accounts.filter(a => a.symbol === symbol) : accounts;
    accountsToSubscribe.forEach(a => {
        if (!sortedAccounts[a.symbol]) {
            sortedAccounts[a.symbol] = [];
        }
        sortedAccounts[a.symbol].push(a);
    });

    const promises = Object.keys(sortedAccounts).map(coin => {
        return [
            TrezorConnect.blockchainSubscribe({
                accounts: sortedAccounts[coin],
                coin,
            }),
            TrezorConnect.blockchainSubscribeFiatRates({
                coin,
            }),
        ];
    });

    return Promise.all(promises.flat());
};

export const onConnect = (symbol: string) => async (dispatch: Dispatch, getState: GetState) => {
    const network = getNetwork(symbol.toLowerCase());
    if (!network) return;
    const blockchain = getState().wallet.blockchain[network.symbol];
    if (blockchain.reconnection) {
        // reset previous timeout
        clearTimeout(blockchain.reconnection.id);
    }
    await dispatch(subscribe(network.symbol));
    await dispatch(updateFeeInfo(network.symbol));
    dispatch(fiatRatesActions.initRates());
};

export const onBlockMined = (block: BlockchainBlock) => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<void> => {
    const symbol = block.coin.shortcut.toLowerCase();
    const networkAccounts = getState().wallet.accounts.filter(a => a.symbol === symbol);
    networkAccounts.forEach(account => {
        dispatch(accountActions.fetchAndUpdateAccount(account));
    });
};

export const onNotification = (payload: BlockchainNotification) => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<void> => {
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

        console.warn('RECV', tx, token, formattedAmount);
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
        dispatch(accountActions.fetchAndUpdateAccount(account));
        // tmp workaround for BB not sending multiple notifications, fix in progress
        if (account.networkType === 'bitcoin') {
            networkAccounts.forEach(account => {
                dispatch(accountActions.fetchAndUpdateAccount(account));
            });
        } else {
            dispatch(accountActions.fetchAndUpdateAccount(account));
        }
    }
};

export const setReconnectionTimeout = (error: BlockchainError) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const network = getNetwork(error.coin.shortcut.toLowerCase());
    if (!network) return;

    const blockchain = getState().wallet.blockchain[network.symbol];
    if (blockchain.reconnection) {
        // reset previous timeout
        clearTimeout(blockchain.reconnection.id);
    }

    // there is no need to reconnect since there are no accounts for this network
    const accounts = getState().wallet.accounts.filter(a => a.symbol === network.symbol);
    if (!accounts.length) {
        return;
    }

    const count = blockchain.reconnection ? blockchain.reconnection.count : 0;
    const timeout = Math.min(2500 * count, 20000);

    const id = setTimeout(async () => {
        await dispatch(reconnect(network.symbol));
    }, timeout);

    dispatch({
        type: BLOCKCHAIN.RECONNECT_TIMEOUT_START,
        payload: {
            symbol: network.symbol,
            id,
            time: new Date().getTime() + timeout,
            count: count + 1,
        },
    });
};
