// CashAddr address format spec:
// https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md

import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin/constants';
import { type AddressValidator, addressType } from '@trezor/network-module-suite-common-types';

type BitcoinCashNetworkSymbol = Extract<BitcoinNetworkSymbol, 'bch'>;

const CASHADDR_REGEXP = /^[qQpP]{1}[0-9a-zA-Z]{41}$/;

// Base32 charset used for the cashaddr payload (see "Base32" in the spec).
const CASHADDR_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

// Mainnet human-readable prefix; testnet/regtest use 'bchtest'/'bchreg'.
const CASHADDR_PREFIX = 'bitcoincash';

// BCH polymod generator constants from the cashaddr spec
// ("Checksum" section): https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md#checksum
const CASHADDR_GENERATOR = [
    BigInt('0x98f2bc8e61'),
    BigInt('0x79b76d99e2'),
    BigInt('0xf33e5fb3c4'),
    BigInt('0xae2eabe2a8'),
    BigInt('0x1e4f43e470'),
];

// Polymod implementation from the cashaddr spec ("Checksum" section):
// https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md#checksum
function cashAddrPolymod(values: number[]): bigint {
    let checksum = BigInt(1);
    for (let i = 0; i < values.length; ++i) {
        const high = checksum >> BigInt(35);
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const value: number = values[i];
        checksum = ((checksum & BigInt('0x07ffffffff')) << BigInt(5)) ^ BigInt(value);
        for (let j = 0; j < 5; ++j) {
            if ((high >> BigInt(j)) & BigInt(1)) {
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const gen: bigint = CASHADDR_GENERATOR[j];
                checksum ^= gen;
            }
        }
    }

    return checksum ^ BigInt(1);
}

// Expands the human-readable prefix into the low 5 bits of each character,
// terminated by a zero, as defined in the cashaddr spec ("Checksum" section).
function hrpExpand(prefix: string): number[] {
    const result: number[] = [];
    for (let i = 0; i < prefix.length; ++i) {
        result.push(prefix.charCodeAt(i) & 0x1f);
    }
    result.push(0);

    return result;
}

function verifyChecksum(prefix: string, payload: string): boolean {
    const data = hrpExpand(prefix);
    for (let i = 0; i < payload.length; ++i) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const char: string = payload[i];
        const v = CASHADDR_CHARSET.indexOf(char);
        if (v === -1) return false;
        data.push(v);
    }

    return cashAddrPolymod(data) === BigInt(0);
}

function validateAddress(address: string): boolean {
    if (address.toLowerCase() !== address && address.toUpperCase() !== address) {
        return false;
    }

    const normalized = address.toLowerCase();
    const colonIndex = normalized.indexOf(':');

    if (colonIndex !== -1) {
        const prefix = normalized.slice(0, colonIndex);
        const payload = normalized.slice(colonIndex + 1);
        if (prefix !== CASHADDR_PREFIX) {
            return false;
        }
        if (!CASHADDR_REGEXP.test(payload)) {
            return false;
        }

        return verifyChecksum(prefix, payload);
    }

    if (!CASHADDR_REGEXP.test(normalized)) {
        return false;
    }

    return verifyChecksum(CASHADDR_PREFIX, normalized);
}

export const isAddressValid = (address: string, _symbol: BitcoinCashNetworkSymbol): boolean =>
    validateAddress(address);

export const getAddressType = (address: string, symbol: BitcoinCashNetworkSymbol) => {
    if (isAddressValid(address, symbol)) {
        return addressType.ADDRESS;
    }

    return undefined;
};

export const bchValidator: AddressValidator<BitcoinCashNetworkSymbol> = {
    isAddressValid,
    getAddressType,
};
