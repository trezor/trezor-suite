import TrezorConnect, {
    AccountInfo,
    BlockchainBlock,
    BlockchainNotification,
} from 'trezor-connect';
import {
    getSelectedNetwork,
    enhanceTransaction,
    getAccountDevice,
} from '@wallet-utils/accountUtils';
import * as suiteActions from '@suite-actions/suiteActions';
import * as accountActions from '@wallet-actions/accountActions';
import * as transactionActions from '@wallet-actions/transactionActions';
import * as notificationActions from '@suite-actions/notificationActions';
import { State as FeeState } from '@wallet-reducers/feesReducer';
import { SETTINGS } from '@suite-config';
import { NETWORKS } from '@wallet-config';
import { Dispatch, GetState } from '@suite-types';
import { Account } from '@wallet-types';
import { BLOCKCHAIN } from './constants';
import { goto } from '../suite/routerActions';

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

const isAccountOutdated = (account: Account, accountInfo: AccountInfo) => (
    _dispatch: Dispatch,
    _getState: GetState,
) => {
    // changed transaction count (total + unconfirmed)
    const changedTxCount =
        accountInfo.history.total + (accountInfo.history.unconfirmed || 0) !==
        account.history.total + (account.history.unconfirmed || 0);

    // different sequence or balance
    const changedRippleSpecific =
        account.networkType === 'ripple'
            ? accountInfo.misc!.sequence !== account.misc.sequence ||
              accountInfo.balance !== account.balance
            : false;

    // last tx doesn't match
    // const lastPayloadTx = accountInfo.history.transactions
    //     ? accountInfo.history.transactions[0]
    //     : undefined;
    // const lastReducerTx = getAccountTransactions(
    //     getState().wallet.transactions.transactions,
    //     account,
    // )[0];
    // // .filter(t => !!t.blockTime)
    // // [0]; // exclude pending txs

    // let changedLastTx = false;
    // if ((!lastReducerTx && lastPayloadTx) || (lastReducerTx && !lastPayloadTx)) {
    //     changedLastTx = true;
    // } else if (lastReducerTx && lastPayloadTx && lastReducerTx.txid !== lastPayloadTx.txid) {
    //     changedLastTx = true;
    // }

    // if (changedTxCount || changedLastTx || changedRippleSpecific) {
    //     console.log(changedTxCount, changedLastTx, changedRippleSpecific);
    //     console.log('isAccountOutdated');
    //     console.log('account', account);
    //     console.log('accountINfo', accountInfo);
    //     console.log('changedTxCount', changedTxCount);
    //     console.log('changedRippleSpecific', changedRippleSpecific);
    //     console.log('changedLastTx', changedLastTx);
    //     console.log('lastReducerTx', lastReducerTx);
    //     console.log('lastPayloadTx', lastPayloadTx);
    // }

    // ripple doesn't provide total txs count, rely on balance/sequence
    if (account.networkType === 'ripple') {
        return changedRippleSpecific;
    }
    return changedTxCount;
};

export const onBlockMined = (block: BlockchainBlock) => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<void> => {
    const symbol = block.coin.shortcut.toLowerCase();
    const network = getSelectedNetwork(NETWORKS, symbol);
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
        const response = await TrezorConnect.getAccountInfo({
            coin: symbol,
            descriptor: account.descriptor,
            details: 'txs',
            page: 1, // useful for every network except ripple
            pageSize:
                (account.history.unconfirmed || 0) > SETTINGS.TXS_PER_PAGE
                    ? account.history.unconfirmed
                    : SETTINGS.TXS_PER_PAGE, // we need to fetch at least the number of unconfirmed txs
        });

        if (response.success) {
            const outdated = dispatch(isAccountOutdated(account, response.payload));
            const unconfirmedTxs = account.history.unconfirmed; // not working for ripple, 0 for all ripple accounts?
            if (outdated) {
                // delete already stored txs for the account
                dispatch(transactionActions.remove(account));
            }

            if (outdated || unconfirmedTxs) {
                // runs also in case of up-to-date account with pending txs
                // update the account (balance, txs count, etc)
                dispatch(accountActions.update(account, response.payload));
                // add new txs/update existing ones if necessary
                dispatch(
                    transactionActions.add(response.payload.history.transactions || [], account, 1),
                );
            }
        } else {
            // TODO: inform user about failure?
            console.warn('Failed to get account info on new block');
        }
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
    const account = getState().wallet.accounts.find(
        a =>
            a.symbol === symbol && a.networkType === 'ethereum'
                ? a.descriptor.toLowerCase() === notification.descriptor.toLowerCase()
                : a.descriptor === notification.descriptor, // blockbook returns lowercase eth address
    );
    if (!account) return;

    // add tx to the reducer
    dispatch(transactionActions.add([notification.tx], account));

    const enhancedTx = enhanceTransaction(notification.tx, account);
    const accountDevice = getAccountDevice(getState().devices, account);

    // don't dispatch sent and self notifications
    if (accountDevice && enhancedTx.type !== 'sent' && enhancedTx.type !== 'self') {
        dispatch(
            notificationActions.add({
                id: enhancedTx.txid,
                variant: 'info',
                title: `Transaction ${enhancedTx.type}`,
                cancelable: true,
                message: `txid: ${enhancedTx.txid}`,
                actions: [
                    {
                        label: 'See the transaction detail',
                        callback: () => {
                            dispatch(suiteActions.selectDevice(accountDevice));
                            dispatch(
                                goto('wallet-account-transactions', {
                                    symbol: account.symbol,
                                    accountIndex: account.index,
                                    accountType: account.accountType,
                                }),
                            );
                        },
                    },
                ],
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
