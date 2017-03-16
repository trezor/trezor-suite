/* @flow */
// `discovery` is for account discovery process, plus monitoring.
// In this file, there is only Flow "interface", no actual code.
//
// Discovery for 1 trezor is from several account discoveries; we discover
// accounts one after another; howver, this is NOT dealt with in this library
// at all. This library deals with just one account.
//
// Two classes "implement" this - mockDiscovery and workeŕDiscovery
//
// In the comments and in the names, "hash" and "id" are used interchangably
// and both mean the "reverse endian" hash that bitcoin uses for
// identification, not actual hash.
// Actual hash is not used anywhere in the API.

import {
    Stream,
    StreamWithEnding,
} from '../utils/stream';
import type {Network as BitcoinJsNetwork} from 'bitcoinjs-lib-zcash';

// First, we describe all the types that go out of discovery
// and that are directly used in web wallet.

// Information about utxos
// UTXO == unspent transaction output = all I can spend
export type UtxoInfo = {
    index: number; // index of output IN THE TRANSACTION
    transactionHash: string; // hash of the transaction
    value: number; // how much money sent
    addressPath: [number, number]; // path
    height: ?number; // null == unconfirmed
    coinbase: boolean;
}

// Some info about output
export type TargetInfo = {
    address: string;
    value: number;
    i: number; // index in the transaction
}

export type TransactionInfo = {
    isCoinbase: boolean;

    // complete date Date().toString()
    // (used instead of Date for easier saving/parsing)
    dateInfo: ?string;
    // only day YYYY-MM-DD
    dateInfoDayFormat: ?string;
    // only time HH:MM:SS
    dateInfoTimeFormat: ?string;

    height: ?number;
    hash: string;

    // targets - only the shown and "relevant" outputs
    // note: should not be used in any advanced logic, it's heuristic
    targets: Array<TargetInfo>;

    // all outputs that belong to my addresses
    myOutputs: {[i: number]: TargetInfo};

    type: 'self' | 'recv' | 'sent';

    // value - tx itself
    // balance - balance on account after this tx
    // both are little heuristics! it is "relevant" value/balance
    value: number;
    balance: number;

    inputs: Array<{id: string, index: number}>; // needing this for later analysis
}

// This is used for used addresses
// Where we display address and number of received BTC.
// NOTE: received does *not* mean current balance on address!!!
// We don't expose that to the user.
// It's really just sum of received outputs.
export type AddressWithReceived = {
    // regular base58check address
    address: string;
    // received, in satoshis
    received: number;
};

// Complete info about one account.
// (trezor usually has several accounts, 1 at minimum)
export type AccountInfo = {
    utxos: Array<UtxoInfo>;
    transactions: Array<TransactionInfo>;

    // all addresses FROM THE MAIN CHAIN that has at least 1 confirmed transaction
    usedAddresses: Array<AddressWithReceived>;

    // addresses that has <1 transaction
    // (max 20, but can be less! can be even 0)
    unusedAddresses: Array<string>;

    changeAddresses: Array<string>; // not needed in mytrezor; needed for watching

    // first unconfirmed change index
    changeIndex: number;
    allowChange: boolean;

    // balance (== all utxos added)
    balance: number;

    // index for outgoing addresses
    sentAddresses: {[txPlusIndex: string]: string};

    // what is last block I saw
    lastBlock: {height: number; hash: string};
};

// This is number of currently loaded transactions.
// Used only for displaying "Loading..." status.
export type AccountLoadStatus = {
    transactions: number,
};

export type Discovery = {
    +discoverAccount: (
        initial: ?AccountInfo,
        xpub: string,
        network: BitcoinJsNetwork
    ) => StreamWithEnding<AccountLoadStatus, AccountInfo>;

    +monitorAccountActivity: (
        initial: AccountInfo,
        xpub: string,
        network: BitcoinJsNetwork
    ) => Stream<AccountInfo | Error>;
}
