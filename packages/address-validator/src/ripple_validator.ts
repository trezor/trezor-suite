import baseX from 'base-x';

import { addressType, sha256Checksum, toHex } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

const ALLOWED_CHARS = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';

const codec = baseX(ALLOWED_CHARS);
const regexp = new RegExp(`^r[${ALLOWED_CHARS}]{27,35}$`);

function verifyChecksum(address: string): boolean {
    const bytes = codec.decode(address);
    const computedChecksum = sha256Checksum(toHex(bytes.slice(0, -4)));
    const checksum = toHex(bytes.slice(-4));

    return computedChecksum === checksum;
}

function isValidAddress(
    address: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): boolean {
    if (regexp.test(address)) {
        return verifyChecksum(address);
    }

    return false;
}

function getAddressType(
    address: string,
    currency?: Currency,
    networkType?: NetworkType,
): AddressType | undefined {
    if (isValidAddress(address, currency, networkType)) {
        return addressType.ADDRESS;
    }

    return undefined;
}

export { isValidAddress, verifyChecksum, getAddressType };
