import * as base58 from './crypto/base58';
import * as bech32 from './crypto/bech32';
import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';
import type { Currency, NetworkEnvironment } from './currency-types';

const DEFAULT_NETWORK: NetworkEnvironment = 'prod';

function getDecoded(address: string): number[] | null {
    try {
        return base58.decode(address);
    } catch {
        // if decoding fails, assume invalid address
        return null;
    }
}

function getChecksum(hashFunction: string | undefined, payload: string): string {
    // Each currency may implement different hashing algorithm
    switch (hashFunction) {
        // blake then keccak hash chain
        case 'blake256keccak256': {
            const blake = cryptoUtils.blake2b256(payload);

            return cryptoUtils.keccak256Checksum(Buffer.from(blake, 'hex'));
        }
        case 'blake256':
            return cryptoUtils.blake256Checksum(payload);
        case 'keccak256':
            return cryptoUtils.keccak256Checksum(payload);
        case 'groestl512x2':
            return cryptoUtils.groestl512x2(payload);
        case 'sha256':
        default:
            return cryptoUtils.sha256Checksum(payload);
    }
}

function getAddressTypeHex(address: string, currency: any): string | null {
    currency = currency || {};
    // should be 25 bytes per btc address spec and 26 decred
    const expectedLength = currency.expectedLength || 25;
    const hashFunction = currency.hashFunction || 'sha256';
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

        const checksum = cryptoUtils.toHex(decoded.slice(length - 4, length));
        const body = cryptoUtils.toHex(decoded.slice(0, length - 4));
        const goodChecksum = getChecksum(hashFunction, body);

        return checksum === goodChecksum
            ? cryptoUtils.toHex(decoded.slice(0, expectedLength - 24))
            : null;
    }

    return null;
}

function getOutputIndex(
    address: string,
    currency: any,
    network: NetworkEnvironment,
): number | null {
    const hex = getAddressTypeHex(address, currency);
    if (hex) {
        const correctAddressTypes =
            currency.addressTypes[network] ||
            Object.keys(currency.addressTypes).reduce(
                (all: string[], key: string) => all.concat(currency.addressTypes[key]),
                [],
            );

        return correctAddressTypes.indexOf(hex);
    }

    return null;
}

function isValidPayToPublicKeyHashAddress(
    address: string,
    currency: any,
    network: NetworkEnvironment,
): boolean {
    return getOutputIndex(address, currency, network) === 0;
}

function isValidPayToScriptHashAddress(
    address: string,
    currency: any,
    network: NetworkEnvironment,
): boolean {
    const idx = getOutputIndex(address, currency, network);

    return idx !== null && idx > 0;
}

function isValidPayToWitnessScriptHashAddress(
    address: string,
    currency: any,
    network: NetworkEnvironment,
): boolean {
    try {
        const hrp = currency.segwitHrp[network];
        const decoded = bech32.decode(hrp, address);

        return !!(decoded?.version === 0 && decoded.program.length === 32);
    } catch {
        return false;
    }
}

function isValidPayToWitnessPublicKeyHashAddress(
    address: string,
    currency: any,
    network: NetworkEnvironment,
): boolean {
    try {
        const hrp = currency.segwitHrp[network];
        const decoded = bech32.decode(hrp, address);

        return !!(decoded?.version === 0 && decoded.program.length === 20);
    } catch {
        return false;
    }
}

function isValidPayToTaprootAddress(
    address: string,
    currency: any,
    network: NetworkEnvironment,
): boolean {
    try {
        const hrp = currency.segwitHrp[network];
        const decoded = bech32.decode(hrp, address, true);

        return !!(decoded?.version === 1 && decoded.program.length === 32);
    } catch {
        return false;
    }
}

function isValidSegwitAddress(
    address: string,
    currency: any,
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

export const getAddressType = (
    address: string,
    currency?: Currency,
    network?: NetworkEnvironment,
) => {
    const resolvedNetwork = network || DEFAULT_NETWORK;
    if (isValidPayToPublicKeyHashAddress(address, currency, resolvedNetwork)) {
        return addressType.P2PKH;
    }
    if (isValidPayToScriptHashAddress(address, currency, resolvedNetwork)) {
        return addressType.P2SH;
    }
    if (isValidPayToWitnessScriptHashAddress(address, currency, resolvedNetwork)) {
        return addressType.P2WSH;
    }
    if (isValidPayToWitnessPublicKeyHashAddress(address, currency, resolvedNetwork)) {
        return addressType.P2WPKH;
    }
    if (isValidPayToTaprootAddress(address, currency, resolvedNetwork)) {
        return addressType.P2TR;
    }
    if (isValidSegwitAddress(address, currency, resolvedNetwork)) {
        return addressType.WITNESS_UNKNOWN;
    }

    return undefined;
};

export const isValidAddress = (
    address: string,
    currency?: Currency,
    network?: NetworkEnvironment,
): boolean => {
    const resolvedNetwork = network || DEFAULT_NETWORK;
    const addrType = getAddressType(address, currency, resolvedNetwork);

    return addrType !== undefined && addrType !== addressType.WITNESS_UNKNOWN;
};
