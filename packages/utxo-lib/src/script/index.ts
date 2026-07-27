// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/script.ts
// differences:
// - OP codes table extended by decred codes.

import { DER } from '@noble/curves/abstract/weierstrass.js';

import * as ecc from '../noble-compatibility';
import { OPS, REVERSE_OPS } from './ops';
import * as pushdata from './pushdata';
import * as scriptNumber from './scriptNumber';
import * as scriptSignature from './scriptSignature';
import type { Stack, StackElement } from '../types';
import {
    BufferSchema,
    HexSchema,
    Type,
    assertType,
    isArray,
    isBuffer,
    isNumber,
} from '../types/validation';

function isOPInt(value: number) {
    return (
        isNumber(value) &&
        (value === OPS.OP_0 ||
            (value >= OPS.OP_1 && value <= OPS.OP_16) ||
            value === OPS.OP_1NEGATE)
    );
}

function isPushOnlyChunk(value: StackElement) {
    return isBuffer(value) || isOPInt(value);
}

export function isPushOnly(value: Stack) {
    return isArray(value) && value.every(isPushOnlyChunk);
}

function asMinimalOP(buffer: Buffer) {
    if (buffer.length === 0) return OPS.OP_0;
    if (buffer.length !== 1) return;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const byte0: number = buffer[0];
    if (byte0 >= 1 && byte0 <= 16) return OPS.OP_RESERVED + byte0;
    if (byte0 === 0x81) return OPS.OP_1NEGATE;
}

export function compile(chunks: Buffer | Stack) {
    // TODO: remove me
    if (isBuffer(chunks)) return chunks;

    if (!isArray(chunks)) throw new TypeError('Expected Array');

    const bufferSize = chunks.reduce((accum: number, chunk) => {
        // data chunk
        if (isBuffer(chunk)) {
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
        if (isBuffer(chunk)) {
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
    if (isArray(buffer)) return buffer;

    assertType(BufferSchema, buffer);

    const chunks: Stack = [];
    let i = 0;

    while (i < buffer.length) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const opcode: number = buffer[i];

        // data chunk
        if (opcode > OPS.OP_0 && opcode <= OPS.OP_PUSHDATA4) {
            const d = pushdata.decode(buffer, i);

            // did reading a pushDataInt fail? empty script
            if (d === null) return [];
            i += d.size;

            // attempt to read too much data? empty script
            if (i + d.number > buffer.length) return [];

            const data = buffer.subarray(i, i + d.number);
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
    if (isBuffer(chunks)) {
        chunks = decompile(chunks);
    }

    return chunks
        .map(chunk => {
            // data?
            if (isBuffer(chunk)) {
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
    assertType(Type.String(), asm);

    return compile(
        asm.split(' ').map(chunkStr => {
            // opcode?
            const typedChunkStr = chunkStr as keyof typeof OPS | undefined;
            const opValue = typedChunkStr ? OPS[typedChunkStr] : undefined;
            if (opValue !== undefined) return opValue;
            assertType(HexSchema, chunkStr);

            // data!
            return Buffer.from(chunkStr, 'hex');
        }),
    );
}

export function toStack(chunks0: Buffer | Stack) {
    const chunks = decompile(chunks0);
    if (!isPushOnly(chunks)) throw new TypeError('Expected push-only script');

    return chunks?.map(op => {
        if (isBuffer(op)) return op;
        if (op === OPS.OP_0) return Buffer.allocUnsafe(0);

        return scriptNumber.encode(op - OPS.OP_RESERVED);
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
    if (!isBuffer(buffer)) return false;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const lastByte: number = buffer[buffer.length - 1];
    if (!isDefinedHashType(lastByte)) return false;

    try {
        DER.toSig(buffer.subarray(0, -1));

        return true;
    } catch {
        return false;
    }
}

export const number = scriptNumber;
export const signature = scriptSignature;

export { OPS } from './ops';
