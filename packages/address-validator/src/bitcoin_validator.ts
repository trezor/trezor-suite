import { decode as decodeBase58 } from './crypto/base58';
import * as bech32 from './crypto/bech32';
import * as cryptoUtils from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

const { addressType } = cryptoUtils;
const DEFAULT_NETWORK_TYPE: NetworkType = 'prod';

function getDecoded(address: string): number[] | null {
    try {
        return decodeBase58(address);
    } catch {
        return null;
    }
}

function getChecksum(hashFunction: Currency['hashFunction'], payload: string): string {
    switch (hashFunction) {
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

function getAddressVersion(address: string, currency?: Currency): string | null {
    const currencyConfig = currency || ({} as Currency);
    const expectedLength = currencyConfig.expectedLength || 25;
    const hashFunction = currencyConfig.hashFunction || 'sha256';
    const decoded = getDecoded(address);
    if (decoded) {
        const { length } = decoded;

        if (length !== expectedLength) {
            return null;
        }

        if (currencyConfig.regex && !currencyConfig.regex.test(address)) {
            return null;
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
    currency: Currency,
    networkType: NetworkType,
): number | null {
    if (!currency.addressTypes) {
        return null;
    }
    const detectedAddressType = getAddressVersion(address, currency);
    if (detectedAddressType) {
        const correctAddressTypes =
            currency.addressTypes[networkType] ||
            Object.keys(currency.addressTypes).reduce<string[]>(
                (all, key) => all.concat(currency.addressTypes?.[key] ?? []),
                [],
            );

        return correctAddressTypes.indexOf(detectedAddressType);
    }

    return null;
}

function isValidPayToPublicKeyHashAddress(
    address: string,
    currency: Currency,
    networkType: NetworkType,
): boolean {
    return getOutputIndex(address, currency, networkType) === 0;
}

function isValidPayToScriptHashAddress(
    address: string,
    currency: Currency,
    networkType: NetworkType,
): boolean {
    const index = getOutputIndex(address, currency, networkType);

    return index !== null && index > 0;
}

function isValidPayToWitnessScriptHashAddress(
    address: string,
    currency: Currency,
    networkType: NetworkType,
): boolean {
    try {
        const hrp = currency.segwitHrp?.[networkType];
        if (!hrp) return false;
        const decoded = bech32.decode(hrp, address);

        return !!decoded && decoded.version === 0 && decoded.program.length === 32;
    } catch {
        return false;
    }
}

function isValidPayToWitnessPublicKeyHashAddress(
    address: string,
    currency: Currency,
    networkType: NetworkType,
): boolean {
    try {
        const hrp = currency.segwitHrp?.[networkType];
        if (!hrp) return false;
        const decoded = bech32.decode(hrp, address);

        return !!decoded && decoded.version === 0 && decoded.program.length === 20;
    } catch {
        return false;
    }
}

function isValidPayToTaprootAddress(
    address: string,
    currency: Currency,
    networkType: NetworkType,
): boolean {
    try {
        const hrp = currency.segwitHrp?.[networkType];
        if (!hrp) return false;

        const decoded = bech32.decode(hrp, address, true);

        return !!decoded && decoded.version === 1 && decoded.program.length === 32;
    } catch {
        return false;
    }
}

function isValidSegwitAddress(
    address: string,
    currency: Currency,
    networkType: NetworkType,
): boolean {
    if (!currency.segwitHrp) {
        return false;
    }
    const hrp = currency.segwitHrp[networkType];
    if (!hrp) {
        return false;
    }
    let ret = bech32.decode(hrp, address, false);
    if (ret) {
        if (ret.version === 0 || ret.program.length === 20 || ret.program.length === 32) {
            return false;
        }

        return address.toLowerCase() === bech32.encode(hrp, ret.version, ret.program, false);
    }
    ret = bech32.decode(hrp, address, true);
    if (ret) {
        if (ret.version > 1 || ret.program.length !== 32) {
            return address.toLowerCase() === bech32.encode(hrp, ret.version, ret.program, true);
        }
    }

    return false;
}

function getAddressType(
    address: string,
    currency: Currency,
    networkType: NetworkType = DEFAULT_NETWORK_TYPE,
): AddressType | undefined {
    if (isValidPayToPublicKeyHashAddress(address, currency, networkType)) {
        return addressType.P2PKH;
    }
    if (isValidPayToScriptHashAddress(address, currency, networkType)) {
        return addressType.P2SH;
    }
    if (isValidPayToWitnessScriptHashAddress(address, currency, networkType)) {
        return addressType.P2WSH;
    }
    if (isValidPayToWitnessPublicKeyHashAddress(address, currency, networkType)) {
        return addressType.P2WPKH;
    }
    if (isValidPayToTaprootAddress(address, currency, networkType)) {
        return addressType.P2TR;
    }
    if (isValidSegwitAddress(address, currency, networkType)) {
        return addressType.WITNESS_UNKNOWN;
    }

    return undefined;
}

function isValidAddress(
    address: string,
    currency: Currency,
    networkType: NetworkType = DEFAULT_NETWORK_TYPE,
): boolean {
    const addrType = getAddressType(address, currency, networkType);

    return addrType !== undefined && addrType !== addressType.WITNESS_UNKNOWN;
}

function getAddressType(
    address: string,
    currency: Currency,
    networkType: NetworkType = DEFAULT_NETWORK_TYPE,
): AddressType | undefined {
    if (isValidPayToPublicKeyHashAddress(address, currency, networkType)) {
        return addressType.P2PKH;
    }
    if (isValidPayToScriptHashAddress(address, currency, networkType)) {
        return addressType.P2SH;
    }
    if (isValidPayToWitnessScriptHashAddress(address, currency, networkType)) {
        return addressType.P2WSH;
    }
    if (isValidPayToWitnessPublicKeyHashAddress(address, currency, networkType)) {
        return addressType.P2WPKH;
    }
    if (isValidPayToTaprootAddress(address, currency, networkType)) {
        return addressType.P2TR;
    }
    if (isValidSegwitAddress(address, currency, networkType)) {
        return addressType.WITNESS_UNKNOWN;
    }

    return undefined;
}

export { isValidAddress, getAddressType };
