// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/address.ts
// differences:
// - `fromBase58Check` method is using additional "network" param and bs58check.decodeAddress instead of bs58check.decode. checking multibyte version (Zcash and Decred support).
// - `toBase58Check` method is using additional "network" param and bs58check.encodeAddress instead of bs58check.encode.

import { bech32, bech32m } from 'bech32';
import * as bs58check from './bs58check';
import * as bscript from './script';
import * as payments from './payments';
import { bitcoin as BITCOIN_NETWORK, Network } from './networks';
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
    types.typeforce(types.tuple(types.Hash160bit, types.UInt16), [hash, version]);

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
    const data = output.subarray(2);

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
        return payments.p2tr({ output, network }).address as string;
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

function decodeAddress(address: string, network: Network) {
    try {
        const { hash, version } = fromBase58Check(address, network);
        return { success: true, format: 'base58', version, hash } as const;
    } catch {
        try {
            const { data, prefix, version } = fromBech32(address);
            if (prefix === network.bech32) {
                return { success: true, format: 'bech32', version, hash: data } as const;
            }
            return { success: false, error: 'bech32-invalid-prefix' } as const;
        } catch {
            // silent
        }
    }
    return { success: false, error: 'unknown-format' } as const;
}

// Returned address types are compatible with trezor-address-validator types
function identifyAddressType(
    format: 'base58' | 'bech32',
    version: number,
    hash: Buffer,
    network: Network,
) {
    if (format === 'base58') {
        if (version === network.pubKeyHash) return 'p2pkh' as const;
        if (version === network.scriptHash) return 'p2sh' as const;
    } else if (format === 'bech32') {
        if (version === 0) {
            if (hash.length === 20) return 'p2wpkh' as const;
            if (hash.length === 32) return 'p2wsh' as const;
        } else if (version === 1 && hash.length === 32) {
            return 'p2tr' as const;
        } else if (
            version >= FUTURE_SEGWIT_MIN_VERSION &&
            version <= FUTURE_SEGWIT_MAX_VERSION &&
            hash.length >= FUTURE_SEGWIT_MIN_SIZE &&
            hash.length <= FUTURE_SEGWIT_MAX_SIZE
        ) {
            return 'p2w-unknown' as const;
        }
    }
    return 'unknown';
}

function createOutputScript(
    type: Exclude<ReturnType<typeof identifyAddressType>, 'unknown'>,
    hash: Buffer,
    version: number,
) {
    switch (type) {
        case 'p2pkh':
            return payments.p2pkh({ hash }).output as Buffer;
        case 'p2sh':
            return payments.p2sh({ hash }).output as Buffer;
        case 'p2wpkh':
            return payments.p2wpkh({ hash }).output as Buffer;
        case 'p2wsh':
            return payments.p2wsh({ hash }).output as Buffer;
        case 'p2tr':
        case 'p2w-unknown':
            return bscript.compile([version + FUTURE_SEGWIT_VERSION_DIFF, hash]);
        // no default
    }
}

export function getAddressType(address: string, network = BITCOIN_NETWORK) {
    const { success, format, version, hash } = decodeAddress(address, network);
    return success ? identifyAddressType(format, version, hash, network) : 'unknown';
}

export function toOutputScript(address: string, network = BITCOIN_NETWORK) {
    const { success, format, version, hash, error } = decodeAddress(address, network);
    if (success) {
        const type = identifyAddressType(format, version, hash, network);
        if (type !== 'unknown') {
            return createOutputScript(type, hash, version);
        }
    } else if (error === 'bech32-invalid-prefix') {
        throw new Error(`${address} has an invalid prefix`);
    }
    throw new Error(`${address} has no matching Script`);
}
