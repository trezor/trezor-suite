import TrezorConnect, { BlockchainBlock, BlockchainNotification } from 'trezor-connect';
import * as accountUtils from '@wallet-utils/accountUtils';
import * as accountActions from '@wallet-actions/accountActions';
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
          type: typeof BLOCKCHAIN.UPDATE_FEE;
          payload: Partial<FeeState>;
      };

export const loadFeeInfo = () => async (dispatch: Dispatch, _getState: GetState) => {
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
                levels: payload.levels.map(l => ({ ...l, value: l.feePerUnit })),
            };
        }
    });

    dispatch({
        type: BLOCKCHAIN.UPDATE_FEE,
        payload: partial,
    });
};

export const updateFeeInfo = (symbol: string) => async (dispatch: Dispatch, getState: GetState) => {
    const symbolLC = symbol.toLowerCase();
    const network = NETWORKS.find(n => n.symbol === symbolLC);
    if (!network) return;

    const blockchainInfo = getState().wallet.blockchain[network.symbol];
    const feeInfo = getState().wallet.fees[network.symbol];
    if (feeInfo.blockHeight > 0 && blockchainInfo.blockHeight - feeInfo.blockHeight < 10) return;

    const result = await TrezorConnect.blockchainEstimateFee({
        coin: network.symbol,
        request: {
            feeLevels: 'smart',
        },
    });
    if (result.success) {
        const { payload } = result;
        const partial: Partial<FeeState> = {};
        partial[network.symbol] = {
            blockHeight: blockchainInfo.blockHeight,
            ...payload,
            levels: payload.levels.map(l => ({ ...l, value: l.feePerUnit })),
        };
        dispatch({
            type: BLOCKCHAIN.UPDATE_FEE,
            payload: partial,
        });
    }
};

export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    await dispatch(loadFeeInfo());

    const { accounts } = getState().wallet;
    if (accounts.length <= 0) {
        // continue suite initialization
        dispatch({
            type: BLOCKCHAIN.READY,
        });
        return;
    }

    const sortedAccounts: { [key: string]: Account[] } = {};
    accounts.forEach(a => {
        if (!sortedAccounts[a.symbol]) {
            sortedAccounts[a.symbol] = [];
        }
        sortedAccounts[a.symbol].push(a);
    });

    const promises = Object.keys(sortedAccounts).map(coin => {
        return TrezorConnect.blockchainSubscribe({
            accounts: sortedAccounts[coin],
            coin,
        });
    });

    await Promise.all(promises);

    // continue suite initialization
    dispatch({
        type: BLOCKCHAIN.READY,
    });
};

export const subscribe = () => async (_dispatch: Dispatch, getState: GetState) => {
    const { accounts } = getState().wallet;
    if (accounts.length <= 0) return;

    const sortedAccounts: { [key: string]: Account[] } = {};
    accounts.forEach(a => {
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

export const reconnect = (symbol: Network['symbol']) => async (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    const { accounts } = getState().wallet;
    return TrezorConnect.blockchainSubscribe({
        accounts: accounts.filter(a => a.symbol === symbol),
        coin: symbol,
    });
};

export const onBlockMined = (block: BlockchainBlock) => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<void> => {
    const symbol = block.coin.shortcut.toLowerCase();
    const networkAccounts = getState().wallet.accounts.filter(a => a.symbol === symbol);
    networkAccounts.forEach(async account => {
        dispatch(accountActions.fetchAndUpdateAccount(account));
    });
};

export const onNotification = (payload: BlockchainNotification) => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<void> => {
    const { notification } = payload;
    const symbol = payload.coin.shortcut.toLowerCase();
    const networkAccounts = getState().wallet.accounts.filter(a => a.symbol === symbol);
    const accounts = accountUtils.findAccountsByDescriptor(
        notification.descriptor,
        networkAccounts,
    );
    if (!accounts.length) return;
    const account = accounts[0];

    // ripple worker sends two notifications for the same tx (pending + confirmed/rejected)
    // dispatch only recv notifications
    if (notification.tx.type === 'recv' && !notification.tx.blockHeight) {
        const enhancedTx = accountUtils.enhanceTransaction(notification.tx, account);
        const accountDevice = accountUtils.findAccountDevice(account, getState().devices);
        dispatch(
            notificationActions.addEvent({
                type: 'tx-received',
                amount: enhancedTx.amount,
                device: accountDevice,
                descriptor: account.descriptor,
                txid: enhancedTx.txid,
            }),
        );
    }

    // it's pointless to fetch ripple accounts
    // TODO: investigate more how to keep ripple pending tx until they are confirmed/rejected
    // ripple-lib doesnt send "pending" txs in history
    if (account.networkType !== 'ripple') {
        dispatch(accountActions.fetchAndUpdateAccount(account));
    }
};
