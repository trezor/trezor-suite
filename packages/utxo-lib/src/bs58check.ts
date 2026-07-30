import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js';
import { base58check as createBase58check } from '@scure/base';

const bs58check = createBase58check(nobleSha256);

import { isCashAddress, toCashAddress, toLegacyAddress } from './bchUtils';
import { bitcoin as BITCOIN_NETWORK, isNetworkType } from './networks';

export function encode(payload: Buffer) {
    return bs58check.encode(payload);
}

export function decode(payload: string) {
    return bs58check.decode(payload);
}

export function decodeAddress(address: string, network = BITCOIN_NETWORK) {
    // Zcash adds an extra prefix resulting in a bigger (22 bytes) payload.
    // Identify it by checking if the version is multibyte (2 bytes instead of 1)
    let payload: Buffer;
    if (isNetworkType('bitcoinCash', network)) {
        if (!isCashAddress(address)) throw Error(`${address} is not a cash address`);
        payload = Buffer.from(bs58check.decode(toLegacyAddress(address)));
    } else {
        payload = Buffer.from(decode(address));
    }

    // TODO: 4.0.0, move to "toOutputScript"
    if (payload.length < 21) throw new TypeError(`${address} is too short`);
    if (payload.length > 22) throw new TypeError(`${address} is too long`);

    const multibyte = payload.length === 22;
    const offset = multibyte ? 2 : 1;

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const indexedByte: number = payload[0];
    const version: number = multibyte ? payload.readUInt16BE(0) : indexedByte;
    const hash = payload.subarray(offset);

    return { version, hash };
}

export function encodeAddress(hash: Buffer, version: number, network = BITCOIN_NETWORK) {
    // Zcash adds an extra prefix resulting in a bigger (22 bytes) payload.
    // Identify it by checking if the version is multibyte (2 bytes instead of 1)
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

    const encoded = encode(payload);

    return isNetworkType('bitcoinCash', network) ? toCashAddress(encoded) : encoded;
}
