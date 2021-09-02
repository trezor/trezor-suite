// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/transaction.ts
// fork: https://github.com/trezor/trezor-utxo-lib/blob/trezor/src/transaction.js
// differences:
// - `TransactionBase` is an abstract class. Methods like fromBuffer/toBuffer are enhanced by network type implementation.
// - `tx.outs[x].amount` as string.
// - removed unused methods: addInput, addOutput, clone, hashForSignature, hashForWitnessV0, setInputScript, setWitness.
// - added new fields: network, type, timestamp, expiry.
// - added new methods: getExtraData, getSpecificData.

import { isNetworkType } from '../networks';
import { isCoinbaseHash, TransactionBase, TransactionOptions } from './base';
import * as bitcoin from './bitcoin';
import * as dash from './dash';
import * as decred from './decred';
import * as peercoin from './peercoin';
import * as zcash from './zcash';

type TxOptions = TransactionOptions & {
    txSpecific?: dash.DashSpecific | zcash.ZcashSpecific;
};

class Transaction extends TransactionBase<dash.DashSpecific | zcash.ZcashSpecific> {
    constructor(options: TxOptions = {}) {
        super(options);
        if (isNetworkType('dash', this.network)) return dash.fromConstructor(options);
        if (isNetworkType('decred', this.network)) return decred.fromConstructor(options);
        if (isNetworkType('peercoin', this.network)) return peercoin.fromConstructor(options);
        if (isNetworkType('zcash', this.network)) return zcash.fromConstructor(options);
        return bitcoin.fromConstructor(options);
    }

    static isCoinbaseHash(buffer: Buffer) {
        return isCoinbaseHash(buffer);
    }

    static fromBuffer(buffer: Buffer, options: TransactionOptions = {}) {
        if (isNetworkType('dash', options.network)) return dash.fromBuffer(buffer, options);
        if (isNetworkType('decred', options.network)) return decred.fromBuffer(buffer, options);
        if (isNetworkType('peercoin', options.network)) return peercoin.fromBuffer(buffer, options);
        if (isNetworkType('zcash', options.network)) return zcash.fromBuffer(buffer, options);
        return bitcoin.fromBuffer(buffer, options);
    }

    static fromHex(hex: string, options: TransactionOptions = {}) {
        return this.fromBuffer(
            Buffer.from(hex, 'hex'),
            Object.assign(options, { nostrict: false }),
        );
    }
}

export { TransactionOptions, TxOptions, Transaction };
