import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

import { type AddressValidator, addressType } from '@trezor/network-module-suite-types';

import type { EthereumNetworkSymbol } from '../supportedNetworks';

function verifyChecksum(address: string): boolean {
    const stripped = address.replace('0x', '');
    const addressHash = bytesToHex(keccak_256(utf8ToBytes(stripped.toLowerCase())));

    for (let i = 0; i < 40; i++) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const hashChar: string = addressHash[i];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const strippedChar: string = stripped[i];
        if (
            (parseInt(hashChar, 16) > 7 && strippedChar.toUpperCase() !== strippedChar) ||
            (parseInt(hashChar, 16) <= 7 && strippedChar.toLowerCase() !== strippedChar)
        ) {
            return false;
        }
    }

    return true;
}

export const isAddressValid = (address: string, _symbol: EthereumNetworkSymbol): boolean => {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        // Check if it has the basic requirements of an address
        return false;
    }

    if (/^0x[0-9a-f]{40}$/.test(address) || /^0x?[0-9A-F]{40}$/.test(address)) {
        // If it's all small caps or all all caps, return true
        return true;
    }

    return verifyChecksum(address);
};

export const getAddressType = (address: string, _symbol: EthereumNetworkSymbol) => {
    if (isAddressValid(address, _symbol)) {
        return addressType.ADDRESS;
    }

    return undefined;
};

export const ethereumValidator: AddressValidator<EthereumNetworkSymbol> = {
    isAddressValid,
    getAddressType,
};
