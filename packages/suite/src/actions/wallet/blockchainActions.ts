import TrezorConnect from 'trezor-connect';
import { getSelectedNetwork } from '@suite/utils/wallet/reducerUtils';
import { NETWORKS } from '@suite/config/wallet';
import { SETTINGS } from '@suite/config/suite';
import * as accountActions from '@wallet-actions/accountActions';
import * as transactionActions from '@wallet-actions/transactionActions';
import { Dispatch, GetState } from '@suite-types';
import { Account, BlockchainBlock, BlockchainNotification } from '@wallet-types';
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
          type: typeof BLOCKCHAIN.BLOCK;
          payload: BlockchainBlock;
      }
    | {
          type: typeof BLOCKCHAIN.NOTIFICATION;
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
    // If we missed some blocks (in case that wallet was offline) we'll update the account
    // If we are update to date with the last block that means wallet was online
    // and we would got Blockchain notification about new transaction if needed

    // TODO: figure out if we need to fetch account info, then fetch it for all accounts within single call to connect
    networkAccounts.forEach(async account => {
        const missingBlocks = true; // compare txs count? what about ripple?
        // const missingBlocks = account.block !== block.blockHeight - 1;
        if (!missingBlocks) {
            // account was last updated on account.block, current block is +1, we didn't miss single block
            // if there was new tx, blockchain notification would let us know
            // so just update the block for the account

            console.log('updating blockHeight for the acc');
            // dispatch(accountsActions.update(account, {block: block.blockHeight});
        } else {
            // we missed some blocks (wallet was offline). get updated account info from connect

            // TODO: use transactionActions.fetchTransactions (it also updates the account)
            const response = await TrezorConnect.getAccountInfo({
                coin: symbol,
                descriptor: account.descriptor,
                details: 'txs',
                page: 1, // useful for every network except ripple
                pageSize: SETTINGS.TXS_PER_PAGE,
            });

            if (response.success) {
                console.log(response.payload.descriptor);
                console.log(response);
                dispatch(accountActions.update(account, response.payload));

                // TODO: delete already stored txs for the account if txs count don't match?

                // TODO: connect doesn't send the second notification with updated blockTime
                // we need to retrieve the tx info from account info anyway even if we didn't miss any block
                // problem: if there will be too many pending txs (>25tx), accountInfo get us only last 25txs
                // so we don't update the txs that are over the limit
                if (response.payload.history.transactions)
                    dispatch(
                        transactionActions.add(response.payload.history.transactions, account),
                    );
            } else {
                // TODO: inform user about failure?
                console.log('Failed to get account info on new block');
            }
        }
    });
};

export const onNotification = (payload: BlockchainNotification) => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<void> => {
    // ripple gets 2 notification for the same tx (one without blockTime then update with blockTime)
    // eth doesn't get the 2nd notifications, we will add missing info to confirmed txs on blockchain.block
    const { notification } = payload;
    const symbol = payload.coin.shortcut.toLowerCase();
    // notification.descriptor is all lowercase at least in case of eth ropsten
    const account = getState().wallet.accounts.find(
        a =>
            a.symbol === symbol &&
            a.descriptor.toLowerCase() === notification.descriptor.toLowerCase(),
    );
    console.log('NOTIFICATION');
    console.log('payload', payload);
    console.log('account', account);
    if (!account) return;

    // add tx to the reducer
    dispatch(transactionActions.add([notification.tx], account));

    // fetch account info and update the account (new balance, txs count,...)
    const response = await TrezorConnect.getAccountInfo({
        coin: symbol,
        descriptor: account.descriptor,
        details: 'basic',
        pageSize: SETTINGS.TXS_PER_PAGE,
    });

    if (!response.success) return;
    dispatch(accountActions.update(account, response.payload));
};
