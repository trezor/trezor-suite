import { addressType, base58, byteArray2hexStr, hexStr2byteArray, sha256 } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

function decodeBase58Address(base58String: string): number[] | false {
    if (typeof base58String !== 'string') {
        return false;
    }
    if (base58String.length <= 4) {
        return false;
    }

    let decoded: number[];
    try {
        decoded = base58(base58String);
    } catch {
        return false;
    }

    if (decoded.length <= 4) {
        return false;
    }

    const offset = decoded.length - 4;
    const checksum = decoded.slice(offset);
    const address = decoded.slice(0, offset);
    const hash0 = sha256(byteArray2hexStr(address));
    const hash1 = hexStr2byteArray(sha256(hash0));
    const computedChecksum = hash1.slice(0, 4);

    return decoded.length > 0 &&
        checksum[0] === computedChecksum[0] &&
        checksum[1] === computedChecksum[1] &&
        checksum[2] === computedChecksum[2] &&
        checksum[3] === computedChecksum[3]
        ? address
        : false;
}

function getEnv(currency: Currency, networkType?: NetworkType): string | undefined {
    const env = networkType === 'testnet' ? 'testnet' : 'prod';
    const networks = currency.addressTypes?.[env];

    return networks ? networks[0] : undefined;
}

function isValidAddress(
    mainAddress: string,
    currency: Currency,
    networkType?: NetworkType,
): boolean {
    const address = decodeBase58Address(mainAddress);

    if (!address || address.length !== 21) {
        return false;
    }

    const prefix = getEnv(currency, networkType);
    if (prefix === undefined) return false;

    // Convert address byte to hex string for comparison
    const addressPrefix = address[0].toString(16).padStart(2, '0');

    return prefix === addressPrefix;
}

function getAddressType(
    address: string,
    currency: Currency,
    networkType?: NetworkType,
): AddressType | undefined {
    if (isValidAddress(address, currency, networkType)) {
        return addressType.ADDRESS;
    }

    return undefined;
}

export { isValidAddress, getAddressType };
