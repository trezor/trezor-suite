/* @flow */

// This is the entry to the worker, doing account discovery + analysis

import type {AccountInfo, TransactionInfo} from '../../index';
import * as channel from './channel';
import {loadBlockRange} from './blocks';
import type {BlockRange, AccountNewInfo} from '../types';

import {GetChainTransactions, findDeleted} from './get-chain-transactions';
import {integrateNewTxs} from './integrate-new-txs';

// Default starting info being used, when there is null
const defaultInfo: AccountInfo = {
    utxos: [],
    transactions: [],
    usedAddresses: [],
    unusedAddresses: [],
    changeIndex: 0,
    balance: 0,
    sentAddresses: {},
    lastBlock: {height: 0, hash: 'abcd'},
    transactionHashes: {},
    changeAddresses: [],
    allowChange: false,
};

let recvInfo: ?AccountInfo;

// init on worker start
channel.initPromise.then(accountInfo => {
    recvInfo = accountInfo;
});

channel.startDiscoveryPromise.then(() => {
    const initialState = recvInfo == null ? defaultInfo : recvInfo;

    // first load blocks, then count last used indexes,
    // then start asking for new transactions,
    // then integrate new transactions into old transactions
    loadBlockRange(initialState).then(range => {
        // when starting from 0, take as if there is no info
        const oldState = range.first.height === 0 ? defaultInfo : initialState;

        const lastUsedMain = oldState.usedAddresses.length - 1;
        const lastUsedChange = oldState.changeIndex - 1;

        const unconfirmedTxids = oldState.transactions.filter(t => t.height == null).map(t => t.hash);

        const mainAddresses = oldState.usedAddresses.map(a => a.address).concat(oldState.unusedAddresses);
        const changeAddresses = oldState.changeAddresses;
    
        // get all the new info, then...
        return discoverAccount(range, [lastUsedMain, lastUsedChange], oldState.transactions, mainAddresses, changeAddresses)
            .then((newInfo: AccountNewInfo): Promise<AccountInfo> => {
                // then find out deleted info
                const deletedP: Promise<Array<string>> = findDeleted(unconfirmedTxids, channel.doesTransactionExist);
                const resP: Promise<AccountInfo> = deletedP.then(deleted => {
                    // ... then integrate
                    return integrateNewTxs(newInfo, oldState, range.last, deleted);
                });
                return resP;
            });
    }).then(
        // either success or failure
        // (other side will shut down the worker then)
        (result: AccountInfo) => channel.returnSuccess(result),
        error => channel.returnError(error)
    );
});

function discoverAccount(
    range: BlockRange,
    lastUsedAddresses: [number, number],
    transactions: Array<TransactionInfo>,
    mainAddresses: Array<string>,
    changeAddresses: Array<string>
): Promise<AccountNewInfo> {
    return Promise.all([
        new GetChainTransactions(0, range, lastUsedAddresses[0], channel.chunkTransactions, transactions, mainAddresses).discover(),
        new GetChainTransactions(1, range, lastUsedAddresses[1], channel.chunkTransactions, [], changeAddresses).discover(),
    ]).then(([main, change]) => ({main, change}));
}

