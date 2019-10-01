import TrezorConnect, {
    AccountInfo,
    BlockchainBlock,
    BlockchainNotification,
    BLOCKCHAIN as CONNECT_BLOCKCHAIN,
} from 'trezor-connect';
import {
    getSelectedNetwork,
    getAccountDevice,
    getAccountTransactions,
} from '@suite/utils/wallet/reducerUtils';
import { NETWORKS } from '@suite/config/wallet';
import { SETTINGS } from '@suite/config/suite';
import * as suiteActions from '@suite-actions/suiteActions';
import * as accountActions from '@wallet-actions/accountActions';
import * as transactionActions from '@wallet-actions/transactionActions';
import * as notificationActions from '@suite-actions/notificationActions';
import { enhanceTransaction } from '@suite/reducers/wallet/transactionReducer';
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
          type: typeof CONNECT_BLOCKCHAIN.BLOCK;
          payload: BlockchainBlock;
      }
    | {
          type: typeof CONNECT_BLOCKCHAIN.NOTIFICATION;
          payload: BlockchainNotification;
      }
    | {
          type: typeof BLOCKCHAIN.UPDATE_FEE;
      };

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

const isAccountOutdated = (account: Account, accountInfo: AccountInfo) => (
    _dispatch: Dispatch,
    getState: GetState,
) => {
    // changed transaction count (total + confirmed)
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
    const lastPayloadTx = accountInfo.history.transactions
        ? accountInfo.history.transactions[0]
        : undefined;
    const lastReducerTx = getAccountTransactions(
        getState().wallet.transactions.transactions,
        account,
    )[0];
    // .filter(t => !!t.blockTime)
    // [0]; // exclude pending txs
    const changedLastTx = (lastPayloadTx || {}).txid !== (lastReducerTx || {}).txid;

    if (changedTxCount || changedLastTx || changedRippleSpecific) {
        console.log(changedTxCount, changedLastTx, changedRippleSpecific);
        console.log('isAccountOutdated');
        console.log('account', account);
        console.log('accountINfo', accountInfo);
        console.log('changedTxCount', changedTxCount);
        console.log('changedRippleSpecific', changedRippleSpecific);
        console.log('changedLastTx', changedLastTx);
        console.log('lastReducerTx', lastReducerTx);
        console.log('lastPayloadTx', lastPayloadTx);
    }

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
        console.log('acc:', account.symbol, account.index);
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
            // console.log('account', account);
            console.log('outdated', outdated);
            console.log('unconfirmedTxs', unconfirmedTxs);
            if (outdated) {
                // delete already stored txs for the account
                dispatch(transactionActions.remove(account));
            }

            if (outdated || unconfirmedTxs) {
                console.log('on block acc update triggered');
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
            a.symbol === symbol &&
            a.descriptor.toLowerCase() === notification.descriptor.toLowerCase(), // TODO: lowercase only in case of eth
    );
    if (!account) return;

    // add tx to the reducer
    dispatch(transactionActions.add([notification.tx], account));

    const enhancedTx = enhanceTransaction(notification.tx, account);
    const accountDevice = getAccountDevice(getState().devices, account);
    console.log('blockTime', enhancedTx.blockTime);
    console.log('blockHeight', enhancedTx.blockHeight);
    if (!accountDevice) return;
    if (accountDevice) {
        // dispatch the notification about the transaction
        dispatch(
            notificationActions.add({
                id: enhancedTx.txid,
                variant: 'info',
                title: `Transaction ${enhancedTx.type}`,
                cancelable: true,
                message: `txid: ${enhancedTx.txid} account: ${enhancedTx.descriptor}  device: ${accountDevice.label}  amount: ${enhancedTx.amount}`,
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
    } else {
        console.warn('device not found');
    }

    // fetch account info and update the account (new balance, txs count,...)
    // TODO: RIPPLE: it seems that balance, txs count is not changed till txs is confirmed
    // (maybe even some time AFTER it is confirmed?), so the account update below is useless
    // more so it causes an issue, because we already added tx to the reducer, count of all account txs is greater than one returned in accountInfo
    // we also have outdated balance/sequence
    // all of that trigger removing all txs belonging to the acc in onBlockMined
    const response = await TrezorConnect.getAccountInfo({
        coin: symbol,
        descriptor: account.descriptor,
        details: 'txs',
        pageSize: SETTINGS.TXS_PER_PAGE,
    });

    if (!response.success) return;
    console.log('accInfo after notification', response.payload);
    // TODO: BITCOIN: Notification returns blockTime 0, getAccountInfo has valid timestamp. should we update tx?
    dispatch(accountActions.update(account, response.payload));
};
