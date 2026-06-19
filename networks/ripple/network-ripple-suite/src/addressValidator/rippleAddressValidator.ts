import {
    type AddressValidator,
    addressType,
} from '@network-module/suite-types/src/AddressValidator';
import { base58xrp } from '@scure/base';

import * as cryptoUtils from './crypto/utils';

const ALLOWED_CHARS = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';

const regexp = new RegExp('^r[' + ALLOWED_CHARS + ']{27,35}$');

function verifyChecksum(address: string): boolean {
    const bytes = base58xrp.decode(address);
    const computedChecksum = cryptoUtils.sha256Checksum(cryptoUtils.toHex(bytes.slice(0, -4)));
    const checksum = cryptoUtils.toHex(bytes.slice(-4));

    return computedChecksum === checksum;
}

export const isAddressValid = (address: string, _symbol: string): boolean => {
    if (regexp.test(address)) {
        return verifyChecksum(address);
    }

    return false;
};

export const getAddressType = (address: string, _symbol: string) => {
    if (isAddressValid(address, _symbol)) {
        return addressType.ADDRESS;
    }

    return undefined;
};

const getSupportedCoins: AddressValidator['getSupportedCoins'] = () => ['xrp', 'txrp'];

export const rippleValidator: AddressValidator = {
    isAddressValid,
    getAddressType,
    getSupportedCoins,
};
