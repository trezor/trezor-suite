import TrezorConnect from 'trezor-connect';
import { Dispatch, GetState } from '@suite-types';
import { Account } from '@wallet-types';
import { BLOCKCHAIN } from './constants';

// Conditionally subscribe to blockchain backend
// called after TrezorConnect.init successfully emits TRANSPORT.START event
// checks if there are discovery processes loaded from LocalStorage
// if so starts subscription to proper networks

export interface BlockchainActions {
    type: typeof BLOCKCHAIN.READY;
}

export const init = () => async (dispatch: Dispatch, getState: GetState) => {
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
