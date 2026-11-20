import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { base58xrp } from '@scure/base';

import { type AddressValidator, addressType } from '@trezor/network-module-suite-common-types';
import type { RippleNetworkSymbol } from '@trezor/network-ripple-types';

const ALLOWED_CHARS = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';

const regexp = new RegExp('^r[' + ALLOWED_CHARS + ']{27,35}$');

function verifyChecksum(address: string): boolean {
    const bytes = base58xrp.decode(address);
    const computedChecksum = bytesToHex(sha256(sha256(bytes.slice(0, -4)))).slice(0, 8);
    const checksum = bytesToHex(bytes.slice(-4));

    return computedChecksum === checksum;
}

export const isAddressValid = (_symbol: RippleNetworkSymbol, address: string): boolean => {
    if (regexp.test(address)) {
        return verifyChecksum(address);
    }

    return false;
};

export const getAddressType = (_symbol: RippleNetworkSymbol, address: string) => {
    if (isAddressValid(_symbol, address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};

export const rippleValidator: AddressValidator<RippleNetworkSymbol> = {
    isAddressValid,
    getAddressType,
};
