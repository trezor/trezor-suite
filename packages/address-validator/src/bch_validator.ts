// CashAddr address format spec:
// https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md
import * as BTCValidator from './bitcoin_validator';
import { addressType } from './crypto/utils';

const DEFAULT_NETWORK_TYPE = 'prod';

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
        checksum = ((checksum & BigInt('0x07ffffffff')) << BigInt(5)) ^ BigInt(values[i]);
        for (let j = 0; j < 5; ++j) {
            if ((high >> BigInt(j)) & BigInt(1)) {
                checksum ^= CASHADDR_GENERATOR[j];
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
        const v = CASHADDR_CHARSET.indexOf(payload[i]);
        if (v === -1) return false;
        data.push(v);
    }

    return cashAddrPolymod(data) === BigInt(0);
}

function validateAddress(address: string, currency: any): boolean {
    if (address.toLowerCase() !== address && address.toUpperCase() !== address) {
        return false;
    }

    const normalized = address.toLowerCase();
    const colonIndex = normalized.indexOf(':');
    const regexp = new RegExp(currency.regexp);

    if (colonIndex !== -1) {
        const prefix = normalized.slice(0, colonIndex);
        const payload = normalized.slice(colonIndex + 1);
        if (prefix !== CASHADDR_PREFIX) {
            return false;
        }
        if (!regexp.test(payload)) {
            return false;
        }

        return verifyChecksum(prefix, payload);
    }

    if (!regexp.test(normalized)) {
        return false;
    }

    return verifyChecksum(CASHADDR_PREFIX, normalized);
}

export const isValidAddress = (address: string, currency?: any, networkType?: string): boolean =>
    validateAddress(address, currency) ||
    (currency.symbol !== 'bch' && BTCValidator.isValidAddress(address, currency, networkType));

export const getAddressType = (address: string, currency?: any, networkType?: string) => {
    const network = networkType || DEFAULT_NETWORK_TYPE;
    if (isValidAddress(address, currency, network)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
