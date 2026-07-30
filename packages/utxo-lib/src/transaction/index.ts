// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/transaction.ts
// fork: https://github.com/trezor/trezor-utxo-lib/blob/trezor/src/transaction.js
// differences:
// - `TransactionBase` is an abstract class. Methods like fromBuffer/toBuffer are enhanced by network type implementation.
// - `tx.outs[x].amount` as string.
// - removed unused methods: addInput, addOutput, clone, hashForSignature, hashForWitnessV0, setInputScript, setWitness.
// - added new fields: network, type, timestamp, expiry.
// - added new methods: getExtraData, getSpecificData.

import { isNetworkType } from '../networks';
import { TransactionBase, type TransactionOptions, isCoinbaseHash } from './base';
import * as bitcoin from './bitcoin';
import * as zcash from './zcash';

export type TxOptions = TransactionOptions & {
    txSpecific?: zcash.ZcashSpecific;
};

class Transaction extends TransactionBase<zcash.ZcashSpecific> {
    constructor(options: TxOptions = {}) {
        super(options);
        if (isNetworkType('zcash', this.network)) return zcash.fromConstructor(options);

        return bitcoin.fromConstructor(options);
    }

    static isCoinbaseHash(buffer: Buffer) {
        return isCoinbaseHash(buffer);
    }

    static fromBuffer(buffer: Buffer, options: TransactionOptions = {}) {
        if (isNetworkType('zcash', options.network)) return zcash.fromBuffer(buffer, options);

        return bitcoin.fromBuffer(buffer, options);
    }

    static fromHex(hex: string, options: TransactionOptions = {}) {
        return this.fromBuffer(Buffer.from(hex, 'hex'), { ...options, nostrict: false });
    }
}

export type { TransactionOptions, TxInput, TxOutput } from './base';
export { Transaction };
