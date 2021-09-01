// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/script.ts
// differences:
// - bitcoin-ops extended by decred codes.

import * as bip66 from 'bip66';
import * as pushdata from 'pushdata-bitcoin';
import * as typeforce from 'typeforce';
import * as ecc from 'tiny-secp256k1';
import * as scriptNumber from './scriptNumber';
import * as scriptSignature from './scriptSignature';
import { OPS, REVERSE_OPS } from './ops';
import * as types from '../types';
import type { Stack, StackElement } from '../types';

const OP_INT_BASE = OPS.OP_RESERVED; // OP_1 - 1

function isOPInt(value: number) {
    return (
        types.Number(value) &&
        (value === OPS.OP_0 ||
            (value >= OPS.OP_1 && value <= OPS.OP_16) ||
            value === OPS.OP_1NEGATE)
    );
}

function isPushOnlyChunk(value: StackElement) {
    return types.Buffer(value) || isOPInt(value);
}

export function isPushOnly(value: Stack) {
    return types.Array(value) && value.every(isPushOnlyChunk);
}

function asMinimalOP(buffer: Buffer) {
    if (buffer.length === 0) return OPS.OP_0;
    if (buffer.length !== 1) return;
    if (buffer[0] >= 1 && buffer[0] <= 16) return OP_INT_BASE + buffer[0];
    if (buffer[0] === 0x81) return OPS.OP_1NEGATE;
}

export function compile(chunks: Buffer | Stack) {
    // TODO: remove me
    if (types.Buffer(chunks)) return chunks;

    typeforce(types.Array, chunks);

    const bufferSize = chunks.reduce((accum: number, chunk) => {
        // data chunk
        if (types.Buffer(chunk)) {
            // adhere to BIP62.3, minimal push policy
            if (chunk.length === 1 && asMinimalOP(chunk) !== undefined) {
                return accum + 1;
            }

            return accum + pushdata.encodingLength(chunk.length) + chunk.length;
        }

        // opcode
        return accum + 1;
    }, 0.0);

    const buffer = Buffer.allocUnsafe(bufferSize);
    let offset = 0;

    chunks.forEach(chunk => {
        // data chunk
        if (types.Buffer(chunk)) {
            // adhere to BIP62.3, minimal push policy
            const opcode = asMinimalOP(chunk);
            if (opcode !== undefined) {
                buffer.writeUInt8(opcode, offset);
                offset += 1;
                return;
            }

            offset += pushdata.encode(buffer, chunk.length, offset);
            chunk.copy(buffer, offset);
            offset += chunk.length;

            // opcode
        } else {
            buffer.writeUInt8(chunk, offset);
            offset += 1;
        }
    });

    if (offset !== buffer.length) throw new Error('Could not decode chunks');
    return buffer;
}

export function decompile(buffer: Buffer | Stack) {
    // TODO: remove me
    if (types.Array(buffer)) return buffer;

    typeforce(types.Buffer, buffer);

    const chunks: Stack = [];
    let i = 0;

    while (i < buffer.length) {
        const opcode = buffer[i];

        // data chunk
        if (opcode > OPS.OP_0 && opcode <= OPS.OP_PUSHDATA4) {
            const d = pushdata.decode(buffer, i);

            // did reading a pushDataInt fail? empty script
            if (d === null) return [];
            i += d.size;

            // attempt to read too much data? empty script
            if (i + d.number > buffer.length) return [];

            const data = buffer.slice(i, i + d.number);
            i += d.number;

            // decompile minimally
            const op = asMinimalOP(data);
            if (op !== undefined) {
                chunks.push(op);
            } else {
                chunks.push(data);
            }

            // opcode
        } else {
            chunks.push(opcode);

            i += 1;
        }
    }

    return chunks;
}

export function toASM(chunks: Buffer | Stack) {
    if (types.Buffer(chunks)) {
        chunks = decompile(chunks);
    }

    return chunks
        .map(chunk => {
            // data?
            if (types.Buffer(chunk)) {
                const op = asMinimalOP(chunk);
                if (op === undefined) return chunk.toString('hex');
                chunk = op;
            }
            // opcode!
            return REVERSE_OPS[chunk];
        })
        .join(' ');
}

export function fromASM(asm: string) {
    typeforce(types.String, asm);

    return compile(
        asm.split(' ').map(chunkStr => {
            // opcode?
            if (OPS[chunkStr] !== undefined) return OPS[chunkStr];
            typeforce(types.Hex, chunkStr);

            // data!
            return Buffer.from(chunkStr, 'hex');
        }),
    );
}

export function toStack(chunks0: Buffer | Stack) {
    const chunks = decompile(chunks0);
    typeforce(isPushOnly, chunks);

    return chunks?.map(op => {
        if (types.Buffer(op)) return op;
        if (op === OPS.OP_0) return Buffer.allocUnsafe(0);
        return scriptNumber.encode(op - OP_INT_BASE);
    });
}

export function isCanonicalPubKey(buffer: Buffer) {
    return ecc.isPoint(buffer);
}

export function isDefinedHashType(hashType: number) {
    const hashTypeMod = hashType & ~0x80;

    // return hashTypeMod > SIGHASH_ALL && hashTypeMod < SIGHASH_SINGLE
    return hashTypeMod > 0x00 && hashTypeMod < 0x04;
}

export function isCanonicalScriptSignature(buffer: Buffer) {
    if (!types.Buffer(buffer)) return false;
    if (!isDefinedHashType(buffer[buffer.length - 1])) return false;

    return bip66.check(buffer.slice(0, -1));
}

export const number = scriptNumber;
export const signature = scriptSignature;

export { OPS } from './ops';
