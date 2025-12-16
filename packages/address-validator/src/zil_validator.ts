import { bech32 } from 'bech32';

import { addressType } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

const ALLOWED_CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

const regexp = new RegExp(`^(zil)1([${ALLOWED_CHARS}]+)$`); // zil + bech32 separated by '1'

function isValidAddress(
    address: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): boolean {
    const match = regexp.exec(address);
    if (!match) {
        return false;
    }
    const decoded = bech32.decode(address);

    return !!decoded && decoded.words.length === 32;
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

export { isValidAddress, getAddressType };
