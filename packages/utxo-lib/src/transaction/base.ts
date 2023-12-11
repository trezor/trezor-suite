import * as varuint from 'varuint-bitcoin';
import { reverseBuffer, getChunkSize } from '../bufferutils';
import * as bcrypto from '../crypto';
import * as types from '../types';
import * as bscript from '../script';

import { bitcoin as BITCOIN_NETWORK, Network, isNetworkType } from '../networks';

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
    types.typeforce(types.Hash256bit, buffer);
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

    // Litecoin
    // transaction with hogex input and output
    // for example
    // see https://ltc2.trezor.io/tx/efe11e0d8d562e73b7795c2a3b7e44c6b6390f2c42c3ae90bb1005009c27a3f3
    isMwebPegOutTx(): boolean {
        if (!isNetworkType('litecoin', this.network)) {
            return false;
        }
        return (
            this.outs.some(output => {
                const asm = bscript.toASM(output.script);
                return asm.startsWith('OP_8');
            }) &&
            this.ins.some(
                input =>
                    // at least 1 anyone can spend input
                    !input.script.length,
            )
        );
    }

    weight(): number {
        const base = this.byteLength(false, false);
        const total = this.byteLength(true, false);
        return base * 3 + total;
    }

    virtualSize(): number {
        return Math.ceil(this.weight() / 4);
    }

    byteLength(_ALLOW_WITNESS = true, _ALLOW_MWEB = true): number {
        const hasWitnesses = _ALLOW_WITNESS && this.hasWitnesses();

        return (
            (hasWitnesses ? 10 : 8) +
            (this.timestamp ? 4 : 0) +
            varuint.encodingLength(this.ins.length) +
            varuint.encodingLength(this.outs.length) +
            this.ins.reduce((sum, input) => sum + 40 + varSliceSize(input.script), 0) +
            this.outs.reduce((sum, output) => sum + 8 + varSliceSize(output.script), 0) +
            (hasWitnesses
                ? this.ins.reduce((sum, input) => sum + vectorSize(input.witness), 0)
                : 0) +
            (_ALLOW_MWEB && this.isMwebPegOutTx() ? 3 : 0)
        );
    }

    getHash(forWitness = false, forMweb = false): Buffer {
        // wtxid for coinbase is always 32 bytes of 0x00
        if (forWitness && this.isCoinbase()) return Buffer.alloc(32, 0);
        return bcrypto.hash256(this.toBuffer(undefined, undefined, forWitness, forMweb));
    }

    getId(): string {
        // transaction hash's are displayed in reverse order
        return reverseBuffer(this.getHash(false)).toString('hex');
    }

    // bip-0141 format: chunks size + (chunk[i].size + chunk[i])
    getWitness(index: number) {
        if (
            !this.hasWitnesses() ||
            !this.ins[index] ||
            !Array.isArray(this.ins[index].witness) ||
            this.ins[index].witness.length < 1
        )
            return;
        const { witness } = this.ins[index];
        const chunks = witness.reduce(
            (arr, chunk) => arr.concat([getChunkSize(chunk.length), chunk]),
            [getChunkSize(witness.length)],
        );
        return Buffer.concat(chunks);
    }

    getExtraData(): Buffer | void {
        // to override by coin specific
    }

    getSpecificData(): S | void {
        return this.specific;
    }

    toBuffer(
        _buffer?: Buffer,
        _initialOffset?: number,
        _ALLOW_WITNESS = true,
        _ALLOW_MWEB = true,
    ): Buffer {
        // to override by coin specific
        return EMPTY_SCRIPT;
    }

    toHex(): string {
        return this.toBuffer().toString('hex');
    }
}
