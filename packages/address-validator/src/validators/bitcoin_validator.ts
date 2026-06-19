import { blake256 } from '@noble/hashes/blake1.js';
import { blake2b } from '@noble/hashes/blake2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { base58 } from '@scure/base';

import { typedObjectKeys } from '@trezor/utils';

import type { AddressValidator } from '../AddressValidator';
import { addressType } from '../addressType';
import * as bech32 from '../crypto/bech32';
import type { NetworkEnvironment } from '../networkEnvironment';
import { bchValidator } from './bch_validator';
import type { NetworkSymbol } from '../networkTypes';

type HashFunction = 'sha256' | 'blake256' | 'blake256keccak256' | 'keccak256';

type BitcoinCurrency = {
    symbol: NetworkSymbol;
    segwitHrp?: Record<string, string>;
    addressTypes: Record<string, string[]>;
    expectedLength?: number;
    hashFunction?: HashFunction;
    regex?: RegExp;
};

const BITCOIN_NETWORK_CONFIG = {
    segwitHrp: { prod: 'bc', testnet: 'tb', regtest: 'bcrt' },
    addressTypes: {
        prod: ['00', '05'],
        testnet: ['6f', 'c4', '3c', '26'],
        regtest: ['6f', 'c4', '3c', '26'],
    },
};

const BITCOIN_CURRENCIES: Partial<Record<NetworkSymbol, BitcoinCurrency>> = {
    btc: {
        symbol: 'btc',
        ...BITCOIN_NETWORK_CONFIG,
    },
    test: {
        symbol: 'test',
        ...BITCOIN_NETWORK_CONFIG,
    },
    regtest: {
        symbol: 'regtest',
        ...BITCOIN_NETWORK_CONFIG,
    },
    ltc: {
        symbol: 'ltc',
        segwitHrp: { prod: 'ltc', testnet: 'tltc' },
        addressTypes: { prod: ['30', '32'], testnet: ['6f', 'c4', '3a'] },
    },
    doge: {
        symbol: 'doge',
        addressTypes: { prod: ['1e', '16'], testnet: ['71', 'c4'] },
    },
    zec: {
        symbol: 'zec',
        expectedLength: 26,
        addressTypes: { prod: ['1cb8', '1cbd'], testnet: ['1d25', '1cba'] },
    },
};

const getCurrency = (symbol: NetworkSymbol): BitcoinCurrency => {
    const currency = BITCOIN_CURRENCIES[symbol];

    if (!currency) {
        throw new Error(`Unsupported bitcoin network symbol: ${symbol}`);
    }

    return currency;
};

const getNetworkEnvironment = (symbol: NetworkSymbol): NetworkEnvironment => {
    switch (symbol) {
        case 'test':
            return 'testnet';
        case 'regtest':
            return 'regtest';
        default:
            return 'prod';
    }
};

const getNetworkEnvironments = (
    symbol: NetworkSymbol,
    currency: BitcoinCurrency,
): NetworkEnvironment[] => {
    const networkEnvironment = getNetworkEnvironment(symbol);

    if (symbol === 'btc' || symbol === 'test' || symbol === 'regtest') {
        return [networkEnvironment];
    }

    return [
        networkEnvironment,
        ...(typedObjectKeys(currency.addressTypes) as NetworkEnvironment[]).filter(
            environment => environment !== networkEnvironment,
        ),
    ];
};

function getDecoded(address: string): number[] | null {
    try {
        return Array.from(base58.decode(address));
    } catch {
        // if decoding fails, assume invalid address
        return null;
    }
}

const toHex = (bytes: number[]): string => bytesToHex(Uint8Array.from(bytes));

function getChecksum(hashFunction: HashFunction, payload: string): string {
    // Each currency may implement different hashing algorithm
    switch (hashFunction) {
        // blake then keccak hash chain
        case 'blake256keccak256': {
            const blake = blake2b(hexToBytes(payload), { dkLen: 32 });

            return bytesToHex(keccak_256(blake)).slice(0, 8);
        }
        case 'blake256':
            return bytesToHex(blake256(blake256(hexToBytes(payload)))).slice(0, 8);
        case 'keccak256':
            return bytesToHex(keccak_256(hexToBytes(payload))).slice(0, 8);
        case 'sha256':
            return bytesToHex(sha256(sha256(hexToBytes(payload)))).slice(0, 8);
    }
}

function getAddressTypeHex(address: string, currency: BitcoinCurrency): string | null {
    // should be 25 bytes per btc address spec and 26 decred
    const expectedLength = currency.expectedLength || 25;
    const hashFunction: HashFunction = currency.hashFunction || 'sha256';
    const decoded = getDecoded(address);
    if (decoded) {
        const { length } = decoded;

        if (length !== expectedLength) {
            return null;
        }

        if (currency.regex) {
            if (!currency.regex.test(address)) {
                return null;
            }
        }

        const checksum = toHex(decoded.slice(length - 4, length));
        const body = toHex(decoded.slice(0, length - 4));
        const goodChecksum = getChecksum(hashFunction, body);

        return checksum === goodChecksum ? toHex(decoded.slice(0, expectedLength - 24)) : null;
    }

    return null;
}

function getOutputIndex(
    address: string,
    currency: BitcoinCurrency,
    network: NetworkEnvironment,
): number | null {
    const hex = getAddressTypeHex(address, currency);
    if (hex) {
        const correctAddressTypes =
            currency.addressTypes[network] ||
            Object.keys(currency.addressTypes).reduce(
                (all: string[], key: string) => all.concat(currency.addressTypes[key] || []),
                [],
            );

        return correctAddressTypes.indexOf(hex);
    }

    return null;
}

function isValidPayToPublicKeyHashAddress(
    address: string,
    currency: BitcoinCurrency,
    network: NetworkEnvironment,
): boolean {
    return getOutputIndex(address, currency, network) === 0;
}

function isValidPayToScriptHashAddress(
    address: string,
    currency: BitcoinCurrency,
    network: NetworkEnvironment,
): boolean {
    const idx = getOutputIndex(address, currency, network);

    return idx !== null && idx > 0;
}

function isValidPayToWitnessScriptHashAddress(
    address: string,
    currency: BitcoinCurrency,
    network: NetworkEnvironment,
): boolean {
    if (!currency.segwitHrp) {
        return false;
    }

    try {
        const hrp = currency.segwitHrp[network];
        if (!hrp) {
            return false;
        }

        const decoded = bech32.decode(hrp, address);

        return !!(decoded?.version === 0 && decoded.program.length === 32);
    } catch {
        return false;
    }
}

function isValidPayToWitnessPublicKeyHashAddress(
    address: string,
    currency: BitcoinCurrency,
    network: NetworkEnvironment,
): boolean {
    if (!currency.segwitHrp) {
        return false;
    }

    try {
        const hrp = currency.segwitHrp[network];
        if (!hrp) {
            return false;
        }

        const decoded = bech32.decode(hrp, address);

        return !!(decoded?.version === 0 && decoded.program.length === 20);
    } catch {
        return false;
    }
}

function isValidPayToTaprootAddress(
    address: string,
    currency: BitcoinCurrency,
    network: NetworkEnvironment,
): boolean {
    if (!currency.segwitHrp) {
        return false;
    }

    try {
        const hrp = currency.segwitHrp[network];
        if (!hrp) {
            return false;
        }

        const decoded = bech32.decode(hrp, address, true);

        return !!(decoded?.version === 1 && decoded.program.length === 32);
    } catch {
        return false;
    }
}

function isValidSegwitAddress(
    address: string,
    currency: BitcoinCurrency,
    network: NetworkEnvironment,
): boolean {
    if (!currency.segwitHrp) {
        return false;
    }
    const hrp = currency.segwitHrp[network];
    if (!hrp) {
        return false;
    }
    let ret = bech32.decode(hrp, address, false);
    if (ret) {
        if (ret.version === 0 || ret.program.length === 20 || ret.program.length === 32) {
            return false;
        } else {
            return address.toLowerCase() === bech32.encode(hrp, ret.version, ret.program, false);
        }
    }
    ret = bech32.decode(hrp, address, true);
    if (ret) {
        if (ret.version > 1 || ret.program.length !== 32) {
            return address.toLowerCase() === bech32.encode(hrp, ret.version, ret.program, true);
        }
    }

    return false;
}

const getAddressTypeForNetwork = (
    address: string,
    currency: BitcoinCurrency,
    network: NetworkEnvironment,
) => {
    if (isValidPayToPublicKeyHashAddress(address, currency, network)) {
        return addressType.P2PKH;
    }
    if (isValidPayToScriptHashAddress(address, currency, network)) {
        return addressType.P2SH;
    }
    if (isValidPayToWitnessScriptHashAddress(address, currency, network)) {
        return addressType.P2WSH;
    }
    if (isValidPayToWitnessPublicKeyHashAddress(address, currency, network)) {
        return addressType.P2WPKH;
    }
    if (isValidPayToTaprootAddress(address, currency, network)) {
        return addressType.P2TR;
    }
    if (isValidSegwitAddress(address, currency, network)) {
        return addressType.WITNESS_UNKNOWN;
    }

    return undefined;
};

export const getAddressType = (address: string, symbol: NetworkSymbol) => {
    if (symbol === 'bch') {
        return bchValidator.getAddressType(address, symbol);
    }

    const currency = getCurrency(symbol);
    const networkEnvironments = getNetworkEnvironments(symbol, currency);

    for (const networkEnvironment of networkEnvironments) {
        const resolvedAddressType = getAddressTypeForNetwork(address, currency, networkEnvironment);

        if (resolvedAddressType !== undefined) {
            return resolvedAddressType;
        }
    }

    return undefined;
};

export const isAddressValid = (address: string, symbol: NetworkSymbol): boolean => {
    const addrType = getAddressType(address, symbol);

    return addrType !== undefined && addrType !== addressType.WITNESS_UNKNOWN;
};

const getSupportedCoins = (): NetworkSymbol[] => [
    ...(typedObjectKeys(BITCOIN_CURRENCIES) as NetworkSymbol[]),
    'bch',
];

export const bitcoinValidator: AddressValidator = {
    isAddressValid,
    getAddressType,
    getSupportedCoins,
};
