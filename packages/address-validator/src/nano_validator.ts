import baseX from 'base-x';

import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';

const ALLOWED_CHARS = '13456789abcdefghijkmnopqrstuwxyz';

const codec = baseX(ALLOWED_CHARS);
const regexp = new RegExp('^(xrb|nano)_([' + ALLOWED_CHARS + ']{60})$');

function verifyChecksum(address: string): boolean {
    const match = regexp.exec(address);
    if (!match) return false;
    const bytes = codec.decode(match[2]).slice(-37);
    // https://github.com/nanocurrency/raiblocks/blob/master/rai/lib/numbers.cpp#L73
    const computedChecksum = cryptoUtils.blake2b(cryptoUtils.toHex(bytes.slice(0, -5)), 5);
    const checksum = cryptoUtils.toHex(bytes.slice(-5).reverse());

    return computedChecksum === checksum;
}

export const isValidAddress = (address: string): boolean => {
    if (regexp.test(address)) {
        return verifyChecksum(address);
    }

    return false;
};

export const getAddressType = (address: string, _currency?: any, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
