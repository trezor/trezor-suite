// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/script_signature.ts

import { DER } from '@noble/curves/abstract/weierstrass.js';
import { bytesToNumberBE, numberToBytesBE } from '@noble/curves/utils.js';

import { BufferNSchema, Type, UInt8, assertType } from '../types/validation';

// BIP62: 1 byte hashType flag (only 0x01, 0x02, 0x03, 0x81, 0x82 and 0x83 are allowed)
export function decode(buffer: Buffer) {
    const hashType = buffer.readUInt8(buffer.length - 1);
    const hashTypeMod = hashType & ~0x80;
    if (hashTypeMod <= 0 || hashTypeMod >= 4) throw new Error(`Invalid hashType ${hashType}`);

    const { r, s } = DER.toSig(buffer.subarray(0, -1));
    const signature = Buffer.concat([numberToBytesBE(r, 32), numberToBytesBE(s, 32)], 64);

    return { signature, hashType };
}

export function encode(signature: Buffer, hashType: number) {
    assertType(
        Type.Object({
            signature: BufferNSchema(64),
            hashType: UInt8,
        }),
        { signature, hashType },
    );

    const hashTypeMod = hashType & ~0x80;
    if (hashTypeMod <= 0 || hashTypeMod >= 4) throw new Error(`Invalid hashType ${hashType}`);

    const hashTypeBuffer = Buffer.allocUnsafe(1);
    hashTypeBuffer.writeUInt8(hashType, 0);

    const r = bytesToNumberBE(signature.subarray(0, 32));
    const s = bytesToNumberBE(signature.subarray(32, 64));

    return Buffer.concat([Buffer.from(DER.hexFromSig({ r, s }), 'hex'), hashTypeBuffer]);
}
