/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    isValidAddress as BTCIsValidAddress,
    getAddressType as BTCGetAddressType,
} from './bitcoin_validator';
import { addressType, base32 } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

const BTCValidator = {
    isValidAddress: BTCIsValidAddress,
    getAddressType: BTCGetAddressType,
};

const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
const DEFAULT_NETWORK_TYPE: NetworkType = 'prod';

function polymod(values: number[]): number {
    let chk = 1;
    for (let p = 0; p < values.length; ++p) {
        const top = chk >> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ values[p];
        for (let i = 0; i < 5; ++i) {
            if ((top >> i) & 1) {
                chk ^= GENERATOR[i];
            }
        }
    }

    return chk;
}

function hrpExpand(hrp: string): number[] {
    const ret: number[] = [];
    let p;
    for (p = 0; p < hrp.length; ++p) {
        ret.push(hrp.charCodeAt(p) >> 5);
    }
    ret.push(0);
    for (p = 0; p < hrp.length; ++p) {
        ret.push(hrp.charCodeAt(p) & 31);
    }

    return ret;
}

function verifyChecksum(hrp: string, data: number[]): boolean {
    return polymod(hrpExpand(hrp).concat(data)) === 1;
}

function validateAddress(address: string, currency: Currency, networkType: NetworkType): boolean {
    let prefix = 'bitcoincash';
    const regexp = currency.regexp ? new RegExp(currency.regexp) : null;
    let rawAddress: string;

    const res = address.split(':');
    if (res.length > 2) {
        return false;
    }
    if (res.length === 1) {
        rawAddress = address;
    } else {
        if (res[0] !== 'bitcoincash') {
            return false;
        }
        rawAddress = res[1];
    }

    if (regexp && !regexp.test(rawAddress)) {
        return false;
    }

    if (rawAddress.toLowerCase() !== rawAddress && rawAddress.toUpperCase() !== rawAddress) {
        return false;
    }

    const decoded = base32.b32decode(rawAddress);
    if (networkType === 'testnet') {
        prefix = 'bchtest';
    }

    try {
        if (verifyChecksum(prefix, Array.from(decoded))) {
            return false;
        }
    } catch (_) {
        return false;
    }

    return true;
}

function isValidAddress(address: string, currency: Currency, networkType: NetworkType): boolean {
    return (
        validateAddress(address, currency, networkType) ||
        (currency.symbol !== 'bch' && BTCValidator.isValidAddress(address, currency, networkType))
    );
}

function getAddressType(
    address: string,
    currency: Currency,
    networkType: NetworkType = DEFAULT_NETWORK_TYPE,
): AddressType | undefined {
    if (isValidAddress(address, currency, networkType)) {
        return addressType.ADDRESS;
    }

    return undefined;
}

export { isValidAddress, getAddressType };
