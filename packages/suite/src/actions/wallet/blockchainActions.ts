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
        return TrezorConnect.blockchainSubscribe({
            accounts: sortedAccounts[coin],
            coin,
        });
    });

    return Promise.all(promises);
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
    const network = accountUtils.getSelectedNetwork(NETWORKS, symbol);
    if (!network) return;

    // TODO: update the fee (should use TrezorConnect.blockchainEstimateFee?),
    // cache the fee (store timestamp, once every 5 min?),
    // check if new fees are different

    // dispatch({
    //     type: BLOCKCHAIN.UPDATE_FEE,
    //     shortcut: symbol,
    //     feeLevels: block.coin.defaultFees,
    // });

    const networkAccounts = getState().wallet.accounts.filter(a => a.symbol === symbol);
    if (networkAccounts.length === 0) return;

    networkAccounts.forEach(async account => {
        dispatch(accountActions.fetchAndUpdateAccount(account, true));
    });
};

export const onNotification = (payload: BlockchainNotification) => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<void> => {
    // ripple gets 2 notification for the same tx (one without blockTime then update with blockTime)
    // btc/eth/... don't get the 2nd notification, we will add missing info to confirmed txs on blockchain.block
    // if (payload.notification.tx.blockTime) {
    //     // not pending
    //     console.log('skipping not pending tx');
    //     return;
    // }
    const { notification } = payload;
    const symbol = payload.coin.shortcut.toLowerCase();
    const accounts = accountUtils.findAccountsByDescriptor(
        notification.descriptor,
        getState().wallet.accounts,
    );
    if (!accounts.length) return;
    const account = accounts[0];

    const enhancedTx = accountUtils.enhanceTransaction(notification.tx, account);
    const accountDevice = accountUtils.findAccountDevice(account, getState().devices);

    // dispatch only recv notifications
    if (accountDevice && enhancedTx.type === 'recv') {
        dispatch(
            notificationActions.addToast({
                type: 'tx-received',
                amount: enhancedTx.amount,
                device: accountDevice,
                descriptor: account.descriptor,
                txid: enhancedTx.txid,
            }),
        );
    }

    // fetch account info and update the account (txs count,...)
    // TODO: RIPPLE: it causes an issue. Because we already added tx to the reducer,
    // count of all account txs is greater than one returned in accountInfo.
    // We also have outdated balance/sequence. All of that trigger removing all txs belonging to the acc in onBlockMined,
    // (if block come before 2nd notification)

    // TODO: BITCOIN: Notification returns blockTime 0, getAccountInfo has valid timestamp. should we update tx?

    // dispatch(accountActions.fetchAndUpdateAccount(account));

    // TODO:
    // update all accounts just to be sure?
    // 1: case where 'sent' blockchain notification doesn't arrive is partially handled by updating the account right after successful tx send
    // there still might be an issue if, after sending the tx, blockbook returns stale data (?, needs more testing)

    const networkAccounts = getState().wallet.accounts.filter(a => a.symbol === symbol);
    networkAccounts.forEach(async account => {
        dispatch(accountActions.fetchAndUpdateAccount(account));
    });
};
