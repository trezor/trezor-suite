/* eslint-disable import/no-default-export */
import BTCValidator from './bitcoin_validator';
import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';

const DEFAULT_NETWORK_TYPE = 'prod';
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

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

function verifyChecksum(hrp: string, data: number[] | Uint8Array): boolean {
    // Preserves original JS semantics: Array.prototype.concat does not spread a Uint8Array,
    // so `data` is appended as a single element. The bitwise ops in polymod then produce NaN,
    // which means this effectively never returns true for typed-array inputs. A real cashaddr
    // checksum implementation is tracked as a follow-up.
    return polymod(hrpExpand(hrp).concat(data as any)) === 1;
}

function validateAddress(address: string, currency: any, networkType?: string): boolean {
    let prefix = 'bitcoincash';
    const regexp = new RegExp(currency.regexp);
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

    if (!regexp.test(rawAddress)) {
        return false;
    }

    if (rawAddress.toLowerCase() !== rawAddress && rawAddress.toUpperCase() !== rawAddress) {
        return false;
    }

    const decoded = cryptoUtils.base32.b32decode(rawAddress);
    if (networkType === 'testnet') {
        prefix = 'bchtest';
    }

    try {
        if (verifyChecksum(prefix, decoded)) {
            return false;
        }
    } catch {
        return false;
    }

    return true;
}

const validator = {
    isValidAddress(address: string, currency?: any, networkType?: string): boolean {
        return (
            validateAddress(address, currency, networkType) ||
            (currency.symbol !== 'bch' &&
                BTCValidator.isValidAddress(address, currency, networkType))
        );
    },
    getAddressType(address: string, currency?: any, networkType?: string) {
        const network = networkType || DEFAULT_NETWORK_TYPE;
        if (this.isValidAddress(address, currency, network)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};

export default validator;
