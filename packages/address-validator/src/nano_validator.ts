import { addressType, blake2b, toHex } from './crypto/utils';
import baseX from 'base-x';
import type { AddressType, Currency, NetworkType } from './types';

const ALLOWED_CHARS = '13456789abcdefghijkmnopqrstuwxyz';

const codec = baseX(ALLOWED_CHARS);
// https://github.com/nanocurrency/raiblocks/wiki/Accounts,-Keys,-Seeds,-and-Wallet-Identifiers
const regexp = new RegExp(`^(xrb|nano)_([${ALLOWED_CHARS}]{60})$`);

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

function verifyChecksum(address: string): boolean {
    const match = regexp.exec(address);
    if (!match) return false;

    const bytes = codec.decode(match[2]).slice(-37);
    // https://github.com/nanocurrency/raiblocks/blob/master/rai/lib/numbers.cpp#L73
    const computedChecksum = blake2b(toHex(bytes.slice(0, -5)), 5);
    const checksum = toHex(bytes.slice(-5).reverse());

    return computedChecksum === checksum;
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

export default {
    isValidAddress,
    verifyChecksum,
    getAddressType,
};
