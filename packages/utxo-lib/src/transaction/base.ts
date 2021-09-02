import * as varuint from 'varuint-bitcoin';
import * as typeforce from 'typeforce';
import { reverseBuffer } from '../bufferutils';
import * as bcrypto from '../crypto';
import * as types from '../types';
import { bitcoin as BITCOIN_NETWORK, Network } from '../networks';

export function varSliceSize(someScript: Buffer) {
    const { length } = someScript;
    return varuint.encodingLength(length) + length;
}

export function vectorSize(someVector: Buffer[]) {
    return (
        varuint.encodingLength(someVector.length) +
        someVector.reduce((sum, witness) => sum + varSliceSize(witness), 0)
    );
}

export function isCoinbaseHash(buffer: Buffer): boolean {
    typeforce(types.Hash256bit, buffer);
    for (let i = 0; i < 32; ++i) {
        if (buffer[i] !== 0) return false;
    }
    return true;
}

export const EMPTY_SCRIPT = Buffer.allocUnsafe(0);

export interface TxOutput {
    script: Buffer;
    value: string;
    decredVersion?: number;
}

export interface TxInput {
    hash: Buffer;
    index: number;
    script: Buffer;
    sequence: number;
    witness: Buffer[];
    decredTree?: number;
    decredWitness?: {
        value: string;
        height: number;
        blockIndex: number;
        script: Buffer;
    };
}

export type TransactionOptions = {
    nostrict?: boolean; // used by fromBuffer method
    network?: Network;
};

export class TransactionBase<S = undefined> {
    version = 1;
    locktime = 0;
    ins: TxInput[] = [];
    outs: TxOutput[] = [];
    specific: S | undefined;

    network: Network;
    type: number | undefined; // Dash, Decred, Zcash
    timestamp: number | undefined; // Peercoin
    expiry: number | undefined; // Decred, Zcash. Block height after which this transactions will expire, or 0 to disable expiry

    constructor(options: TransactionOptions & { txSpecific?: S }) {
        this.network = options.network || BITCOIN_NETWORK;
        this.specific = options.txSpecific;
    }

    isCoinbase(): boolean {
        return this.ins.length === 1 && isCoinbaseHash(this.ins[0].hash);
    }

    hasWitnesses(): boolean {
        return this.ins.some(x => x.witness.length !== 0);
    }

    weight(): number {
        const base = this.byteLength(false);
        const total = this.byteLength(true);
        return base * 3 + total;
    }

    virtualSize(): number {
        return Math.ceil(this.weight() / 4);
    }

    byteLength(_ALLOW_WITNESS = true): number {
        const hasWitnesses = _ALLOW_WITNESS && this.hasWitnesses();

        return (
            (hasWitnesses ? 10 : 8) +
            (this.timestamp ? 4 : 0) +
            varuint.encodingLength(this.ins.length) +
            varuint.encodingLength(this.outs.length) +
            this.ins.reduce((sum, input) => sum + 40 + varSliceSize(input.script), 0) +
            this.outs.reduce((sum, output) => sum + 8 + varSliceSize(output.script), 0) +
            (hasWitnesses ? this.ins.reduce((sum, input) => sum + vectorSize(input.witness), 0) : 0)
        );
    }

    getHash(forWitness = false): Buffer {
        // wtxid for coinbase is always 32 bytes of 0x00
        if (forWitness && this.isCoinbase()) return Buffer.alloc(32, 0);
        return bcrypto.hash256(this.toBuffer(undefined, undefined, forWitness));
    }

    getId(): string {
        // transaction hash's are displayed in reverse order
        return reverseBuffer(this.getHash(false)).toString('hex');
    }

    getExtraData(): Buffer | void {
        // to override by coin specific
    }

    getSpecificData(): S | void {
        return this.specific;
    }

    toBuffer(_buffer?: Buffer, _initialOffset?: number, _ALLOW_WITNESS = true): Buffer {
        // to override by coin specific
        return EMPTY_SCRIPT;
    }

    toHex(): string {
        return this.toBuffer().toString('hex');
    }
}
