import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js';
import { base58, base58check as createBase58check } from '@scure/base';

const bs58check = createBase58check(nobleSha256);

import { isCashAddress, toCashAddress, toLegacyAddress } from './bchUtils';
import { blake256 } from './crypto';
import { bitcoin as BITCOIN_NETWORK, isNetworkType } from './networks';

export function decodeBlake(buffer: Buffer) {
    const want = buffer.subarray(-4);
    const payload = buffer.subarray(0, -4);
    const got = blake256(blake256(payload)).subarray(0, 4);

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const w0: number = want[0];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const w1: number = want[1];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const w2: number = want[2];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const w3: number = want[3];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const g0: number = got[0];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const g1: number = got[1];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const g2: number = got[2];
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const g3: number = got[3];
    if ((w0 ^ g0) | (w1 ^ g1) | (w2 ^ g2) | (w3 ^ g3)) throw new Error('invalid checksum');

    return payload;
}

export function decodeBlake256Key(key: string) {
    const bytes = base58.decode(key);
    const buffer = Buffer.from(bytes);

    return decodeBlake(buffer);
}

export function decodeBlake256(address: string) {
    const bytes = base58.decode(address);
    const buffer = Buffer.from(bytes);
    if (buffer.length !== 26) throw new Error(`${address} invalid address length`);
    let payload;
    try {
        payload = decodeBlake(buffer);
    } catch (e) {
        if (e instanceof Error) {
            throw new Error(`${address} ${e.message}`);
        }
        throw new Error(`${address} ${e}`);
    }

    return payload;
}

export function encodeBlake256(payload: Buffer) {
    const checksum = blake256(blake256(payload)).subarray(0, 4);

    return base58.encode(Buffer.concat([payload, checksum]));
}

export function encode(payload: Buffer, network = BITCOIN_NETWORK) {
    return isNetworkType('decred', network) ? encodeBlake256(payload) : bs58check.encode(payload);
}

export function decode(payload: string, network = BITCOIN_NETWORK) {
    return isNetworkType('decred', network) ? decodeBlake256(payload) : bs58check.decode(payload);
}

export function decodeAddress(address: string, network = BITCOIN_NETWORK) {
    // Zcash and Decred add an extra prefix resulting in a bigger (22 bytes) payload.
    // Identify them by checking if the version is multibyte (2 bytes instead of 1)
    let payload: Buffer;
    if (isNetworkType('bitcoinCash', network)) {
        if (!isCashAddress(address)) throw Error(`${address} is not a cash address`);
        payload = Buffer.from(bs58check.decode(toLegacyAddress(address)));
    } else {
        payload = Buffer.from(decode(address, network));
    }

    // TODO: 4.0.0, move to "toOutputScript"
    if (payload.length < 21) throw new TypeError(`${address} is too short`);
    if (payload.length > 22) throw new TypeError(`${address} is too long`);

    const multibyte = payload.length === 22;
    const offset = multibyte ? 2 : 1;

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const version: number = multibyte ? payload.readUInt16BE(0) : payload[0];
    const hash = payload.subarray(offset);

    return { version, hash };
}

export function encodeAddress(hash: Buffer, version: number, network = BITCOIN_NETWORK) {
    // Zcash and Decred add an extra prefix resulting in a bigger (22 bytes) payload.
    // Identify them by checking if the version is multibyte (2 bytes instead of 1)
    const multibyte = version > 0xff;
    const size = multibyte ? 22 : 21;
    const offset = multibyte ? 2 : 1;

    const payload = Buffer.allocUnsafe(size);
    if (multibyte) {
        payload.writeUInt16BE(version, 0);
    } else {
        payload.writeUInt8(version, 0);
    }

    hash.copy(payload, offset);

    const encoded = encode(payload, network);

    return isNetworkType('bitcoinCash', network) ? toCashAddress(encoded) : encoded;
}
