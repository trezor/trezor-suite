import { base58xrp } from '@scure/base';

import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';
import type { Currency } from './currency-types';

const ALLOWED_CHARS = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';

const regexp = new RegExp('^r[' + ALLOWED_CHARS + ']{27,35}$');

function verifyChecksum(address: string): boolean {
    const bytes = base58xrp.decode(address);
    const computedChecksum = cryptoUtils.sha256Checksum(cryptoUtils.toHex(bytes.slice(0, -4)));
    const checksum = cryptoUtils.toHex(bytes.slice(-4));

    return computedChecksum === checksum;
}

export const isValidAddress = (address: string): boolean => {
    if (regexp.test(address)) {
        return verifyChecksum(address);
    }

    return false;
};

export const getAddressType = (address: string, _currency?: Currency, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
