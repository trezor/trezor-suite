/* @flow */

// Only types, no actual code here

import type {
    TransactionWithHeight,
} from '../../bitcore';

import type {
    AccountInfo,
    TargetInfo,
} from '../index';

import type {
    Transaction as BitcoinJsTransaction,
} from 'bitcoinjs-lib-zcash';

import type {Network as BitcoinJsNetwork} from 'bitcoinjs-lib-zcash';

/* ----- messages INTO into worker, from handler ------ */

// All the info about addresses plus transactions
// It is sent when we ask for transactions
export type ChunkDiscoveryInfo = {
    addresses: Array<string>,
    transactions: Array<TransactionWithHeight>,
};

// responses for general promises
export type PromiseResponseType = {
    type: 'lookupSyncStatus',
    response: number,
} | {
    type: 'lookupBlockHash',
    response: string,
} | {
    type: 'doesTransactionExist',
    response: boolean,
};

// response for transactions
type StreamUpdateType = {
    type: 'chunkTransactions',
    response: ChunkDiscoveryInfo | string,
};

// This is message INTO worker
export type InMessage = {
    // starting worker
    type: 'init',
    state: ?AccountInfo,
    network: BitcoinJsNetwork,
    webassembly: boolean,
    xpub: string,
    segwit: boolean,
} | {
    // starting discovery after init
    type: 'startDiscovery',
} | {
    // general message for sending promise result into worker
    type: 'promiseResponseSuccess',
    response: PromiseResponseType,
    id: number,
} | {
    // general message for sending promise result into worker
    type: 'promiseResponseFailure',
    failure: string,
    id: number,
} | {
    // general message for sending stream update into worker
    type: 'streamResponseUpdate',
    update: StreamUpdateType,
    id: number,
} | {
    // general message for sending stream update into worker
    type: 'streamResponseFinish',
    id: number,
};

/* ----- messages OUT from worker, into handler ------ */

// Promises I can ask for
export type PromiseRequestType = {
    type: 'lookupSyncStatus',
} | {
    type: 'lookupBlockHash',
    height: number,
} | {
    type: 'doesTransactionExist',
    txid: string,
}

// Streams I can ask for (right now only one)
export type StreamRequestType = {
    type: 'chunkTransactions',
    chainId: number,
    firstIndex: number,
    lastIndex: number,
    startBlock: number,
    endBlock: number,
    pseudoCount: number,
    addresses: ?Array<string>,
}

// general message, asking for promise
export type PromiseRequestOutMessage = {
    type: 'promiseRequest',
    request: PromiseRequestType,
    id: number,
}

// general message, asking for stream
export type StreamRequestOutMessage = {
    type: 'streamRequest',
    request: StreamRequestType,
    id: number,
};

export type OutMessage =
PromiseRequestOutMessage |
StreamRequestOutMessage | {
    // result from the discovery
    type: 'result',
    result: AccountInfo,
} | {
    // error from the discovery (shouldn't happen, but can :))
    type: 'error',
    error: string,
};

/* ----- types used internally IN the worker ------ */

// Info about transaction, with some derived information
export type ChainNewTransaction = {
    tx: BitcoinJsTransaction,
    height: ?number,
    outputAddresses: Array<string>,
    timestamp: ?number,
    hash: string,
    vsize: number,
    fee: number,
}

// New transactions on a chain
export type ChainNewTransactions = {[id: string]: ChainNewTransaction};

// Simple map address => id, id
export type AddressToPath = {[address: string]: [number, number]};

// What gets out of discovery
export type ChainNewInfo = {
    allAddresses: Array<string>,
    newTransactions: ChainNewTransactions,
}

// New additional info about an account, on two chains
export type AccountNewInfo = {
    main: ChainNewInfo,
    change: ChainNewInfo,
}

export type Block = { hash: string, height: number };
export type BlockRange = { first: Block, last: Block, nullBlock: Block };

// export type InputsForAnalysis = Array<{id: string, index: number}>

export type TransactionInfoBalanceless = {
    isCoinbase: boolean,
    dateInfo: ?string,
    dateInfoDayFormat: ?string,
    dateInfoTimeFormat: ?string,
    height: ?number,
    hash: string,

    targets: Array<TargetInfo>,
    myOutputs: {[i: number]: TargetInfo},

    type: 'self' | 'recv' | 'sent',

    value: number,

    inputs: Array<{id: string, index: number}>, // needing this for analysis

    tsize: number, // total size - in case of segwit, total, with segwit data
    vsize: number, // virtual size - segwit concept - same as size in non-segwit

    fee: number,
}

export type TargetsType = {
    targets: Array<TargetInfo>,
    myOutputs: {[i: number]: TargetInfo},
    type: 'self' | 'recv' | 'sent',
    value: number,
};

