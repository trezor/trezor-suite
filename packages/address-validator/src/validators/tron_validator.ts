import { sha256 } from '@noble/hashes/sha2.js';
import { base58 } from '@scure/base';

import type { AddressValidator } from '../AddressValidator';
import { addressType } from '../addressType';
import type { NetworkSymbol } from '../networkTypes';

const TRON_ADDRESS_TYPE = 0x41;

function decodeBase58Address(base58Sting: unknown): number[] | false {
    if (typeof base58Sting !== 'string') {
        return false;
    }
    if (base58Sting.length <= 4) {
        return false;
    }

    let address: number[];
    try {
        address = Array.from(base58.decode(base58Sting));
    } catch {
        return false;
    }

    const len = address.length;
    const offset = len - 4;
    const checkSum = address.slice(offset);
    address = address.slice(0, offset);
    const checkSum1 = Array.from(sha256(sha256(Uint8Array.from(address))).slice(0, 4));
    if (
        checkSum[0] === checkSum1[0] &&
        checkSum[1] === checkSum1[1] &&
        checkSum[2] === checkSum1[2] &&
        checkSum[3] === checkSum1[3]
    ) {
        return address;
    }

    return false;
}

export const isAddressValid = (mainAddress: string, _symbol: NetworkSymbol): boolean => {
    const address = decodeBase58Address(mainAddress);

    if (!address) {
        return false;
    }

    if (address.length !== 21) {
        return false;
    }

    return TRON_ADDRESS_TYPE === address[0];
};

export const getAddressType = (address: string, symbol: NetworkSymbol) => {
    if (isAddressValid(address, symbol)) {
        return addressType.ADDRESS;
    }

    return undefined;
};

const getSupportedCoins = (): NetworkSymbol[] => ['trx', 'ttrx'];

export const tronValidator: AddressValidator = {
    isAddressValid,
    getAddressType,
    getSupportedCoins,
};
