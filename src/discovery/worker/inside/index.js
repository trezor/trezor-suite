/* @flow */

// This is the entry to the worker, doing account discovery + analysis

import type {Network as BitcoinJsNetwork} from 'bitcoinjs-lib-zcash';

import type {AccountInfo, TransactionInfo} from '../../index';
import * as channel from './channel';
import {loadBlockRange} from './blocks';
import {recomputeDateFormats} from './dates';
import type {BlockRange, AccountNewInfo} from '../types';

import {GetChainTransactions} from './get-chain-transactions';
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
    lastConfirmedChange: -1,
    lastConfirmedMain: -1,
    version: 4,
};

let recvInfo: ?AccountInfo;
let recvNetwork: BitcoinJsNetwork;
let recvXpub: string;
let recvSegwit: boolean;
let recvWebAssembly: boolean;
let recvGap: number;
let recvCashAddress: boolean;

// what (new Date().getTimezoneOffset()) returns
// note that it is NEGATIVE from the UTC string timezone
// so, UTC+2 timezone returns -120...
// it's javascript, it's insane by default
let recvTimeOffset: number;

// init on worker start
channel.initPromise.then(({
    accountInfo,
    network,
    xpub,
    segwit,
    webassembly,
    cashAddress,
    gap,
    timeOffset,
}) => {
    recvInfo = accountInfo;
    recvNetwork = network;
    recvSegwit = segwit;
    recvXpub = xpub;
    recvWebAssembly = webassembly;
    recvCashAddress = cashAddress;
    recvGap = gap;

    recvTimeOffset = timeOffset;
});

channel.startDiscoveryPromise.then(() => {
    let initialState = recvInfo == null ? defaultInfo : recvInfo;

    // version null => 1 added infos about fees and sizes; we cannot calculate that
    // version 2 was correction in mytrezor
    // v3 added info, whether utxo is my own or not
    // so we have to re-download everything -> setting initial state as if nothing is known
    if (initialState.version == null || initialState.version < 4) {
        initialState = defaultInfo;
    }

    recomputeDateFormats(initialState.transactions, recvTimeOffset);

    // first load blocks, then count last used indexes,
    // then start asking for new transactions,
    // then integrate new transactions into old transactions
    loadBlockRange(initialState).then(range => {
        // when starting from 0, take as if there is no info
        const oldState = range.firstHeight === 0
            ? defaultInfo
            : initialState;

        const lastConfirmedMain = oldState.lastConfirmedMain;
        const lastConfirmedChange = oldState.lastConfirmedChange;

        const unconfirmedTxids = oldState.transactions
            .filter(t => t.height == null)
            .map(t => t.hash);

        const mainAddresses = oldState.usedAddresses
            .map(a => a.address)
            .concat(oldState.unusedAddresses);

        const changeAddresses = oldState.changeAddresses;

        // get all the new info, then...
        return discoverAccount(
            range,
            [lastConfirmedMain, lastConfirmedChange],
            oldState.transactions,
            mainAddresses,
            changeAddresses
        ).then((newInfo: AccountNewInfo): AccountInfo => {
            // then find out deleted info
            const deleted: Array<string> = findDeleted(
                unconfirmedTxids,
                newInfo
            );
            // ... then integrate
            const res: AccountInfo = integrateNewTxs(
                newInfo,
                oldState,
                range.last,
                deleted,
                recvGap,
                recvTimeOffset
            );
            return res;
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
    changeAddresses: Array<string>,
): Promise<AccountNewInfo> {
    function d(i: number) {
        return new GetChainTransactions(
          i,
          range,
          lastUsedAddresses[i],
          channel.chunkTransactions,
          i === 0 ? transactions : [], // used for visual counting
          i === 0 ? mainAddresses : changeAddresses,
          recvNetwork,
          recvXpub,
          recvSegwit,
          recvWebAssembly,
          recvCashAddress,
          recvGap
       ).discover();
    }

    return d(0)
        .then(main => d(1).then(change => ({main, change})));
}

function findDeleted(
    txids: Array<string>,
    newInfo: AccountNewInfo
): Array<string> {
    return txids.filter(id => {
        if (newInfo.main.newTransactions[id] != null) {
            return false;
        }
        if (newInfo.change.newTransactions[id] != null) {
            return false;
        }
        return true;
    });
}

