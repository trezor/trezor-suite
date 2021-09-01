// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/address.ts
// differences:
// - `fromBase58Check` method is using additional "network" param and bs58check.decodeAddress instead of bs58check.decode. checking multibyte version (Zcash and Decred support).
// - `toBase58Check` method is using additional "network" param and bs58check.encodeAddress instead of bs58check.encode.

import { bech32, bech32m } from 'bech32';
import * as bs58check from './bs58check';
import * as typeforce from 'typeforce';
import * as bscript from './script';
import * as payments from './payments';
import { bitcoin as BITCOIN_NETWORK } from './networks';
import * as types from './types';

export interface Base58CheckResult {
    hash: Buffer;
    version: number;
}

export interface Bech32Result {
    version: number;
    prefix: string;
    data: Buffer;
}

export function fromBase58Check(address: string, network = BITCOIN_NETWORK): Base58CheckResult {
    return bs58check.decodeAddress(address, network);
}

export function fromBech32(address: string): Bech32Result {
    let result: ReturnType<typeof bech32.decode> | undefined;
    let version: number;
    try {
        result = bech32.decode(address);
    } catch (e) {
        // silent
    }

    if (result) {
        [version] = result.words;
        if (version !== 0) throw new TypeError(`${address} uses wrong encoding`);
    } else {
        result = bech32m.decode(address);
        [version] = result.words;
        if (version === 0) throw new TypeError(`${address} uses wrong encoding`);
    }

    const data = bech32.fromWords(result.words.slice(1));

    return {
        version,
        prefix: result.prefix,
        data: Buffer.from(data),
    };
}

export function toBase58Check(hash: Buffer, version: number, network = BITCOIN_NETWORK): string {
    typeforce(types.tuple(types.Hash160bit, types.UInt16), [hash, version]);

    return bs58check.encodeAddress(hash, version, network);
}

export function toBech32(data: Buffer, version: number, prefix: string) {
    const words = bech32.toWords(data);
    words.unshift(version);

    return version === 0 ? bech32.encode(prefix, words) : bech32m.encode(prefix, words);
}

const FUTURE_SEGWIT_MAX_SIZE = 40;
const FUTURE_SEGWIT_MIN_SIZE = 2;
const FUTURE_SEGWIT_MAX_VERSION = 16;
const FUTURE_SEGWIT_MIN_VERSION = 1;
const FUTURE_SEGWIT_VERSION_DIFF = 0x50;

function toFutureSegwitAddress(output: Buffer, network = BITCOIN_NETWORK) {
    const data = output.slice(2);

    if (data.length < FUTURE_SEGWIT_MIN_SIZE || data.length > FUTURE_SEGWIT_MAX_SIZE)
        throw new TypeError('Invalid program length for segwit address');

    const version = output[0] - FUTURE_SEGWIT_VERSION_DIFF;

    if (version < FUTURE_SEGWIT_MIN_VERSION || version > FUTURE_SEGWIT_MAX_VERSION)
        throw new TypeError('Invalid version for segwit address');

    if (output[1] !== data.length) throw new TypeError('Invalid script for segwit address');

    return toBech32(data, version, network.bech32);
}

export function fromOutputScript(output: Buffer, network = BITCOIN_NETWORK) {
    try {
        return payments.p2pkh({ output, network }).address as string;
    } catch (e) {
        // empty
    }
    try {
        return payments.p2sh({ output, network }).address as string;
    } catch (e) {
        // empty
    }
    try {
        return payments.p2wpkh({ output, network }).address as string;
    } catch (e) {
        // empty
    }
    try {
        return payments.p2wsh({ output, network }).address as string;
    } catch (e) {
        // empty
    }
    try {
        return toFutureSegwitAddress(output, network);
    } catch (e) {
        // empty
    }

    throw new Error(`${bscript.toASM(output)} has no matching Address`);
}

export function toOutputScript(address: string, network = BITCOIN_NETWORK) {
    let decodeBase58: Base58CheckResult | undefined;
    let decodeBech32: Bech32Result | undefined;

    try {
        decodeBase58 = fromBase58Check(address, network);
    } catch (e) {
        // silent error
    }

    if (decodeBase58) {
        if (decodeBase58.version === network.pubKeyHash)
            return payments.p2pkh({ hash: decodeBase58.hash }).output as Buffer;
        if (decodeBase58.version === network.scriptHash)
            return payments.p2sh({ hash: decodeBase58.hash }).output as Buffer;
    } else {
        try {
            decodeBech32 = fromBech32(address);
        } catch (e) {
            // silent error
        }

        if (decodeBech32) {
            if (decodeBech32.prefix !== network.bech32)
                throw new Error(`${address} has an invalid prefix`);
            if (decodeBech32.version === 0) {
                if (decodeBech32.data.length === 20)
                    return payments.p2wpkh({ hash: decodeBech32.data }).output as Buffer;
                if (decodeBech32.data.length === 32)
                    return payments.p2wsh({ hash: decodeBech32.data }).output as Buffer;
            }
            if (
                decodeBech32.version >= FUTURE_SEGWIT_MIN_VERSION &&
                decodeBech32.version <= FUTURE_SEGWIT_MAX_VERSION &&
                decodeBech32.data.length >= FUTURE_SEGWIT_MIN_SIZE &&
                decodeBech32.data.length <= FUTURE_SEGWIT_MAX_SIZE
            ) {
                return bscript.compile([
                    decodeBech32.version + FUTURE_SEGWIT_VERSION_DIFF,
                    decodeBech32.data,
                ]);
            }
        }
    }

    throw new Error(`${address} has no matching Script`);
}
