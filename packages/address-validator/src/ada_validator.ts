import { bech32 } from '@scure/base';
import * as cbor from 'cbor';
import CRC from 'crc';

import * as base58 from './crypto/base58';
import { addressType } from './crypto/utils';

const DEFAULT_NETWORK_TYPE = 'prod';

function getDecoded(address: string): any {
    try {
        const decoded = base58.decode(address);

        return cbor.decode(new Uint8Array(decoded).buffer as ArrayBuffer);
    } catch {
        return null;
    }
}

function isValidLegacyAddress(address: string): boolean {
    const decoded = getDecoded(address);
    if (!decoded || (!Array.isArray(decoded) && decoded.length !== 2)) {
        return false;
    }

    const tagged = decoded[0];
    const validCrc = decoded[1];
    if (typeof validCrc !== 'number') {
        return false;
    }
    const crc = CRC.crc32(tagged.value);

    return crc === validCrc;
}

function isValidBech32Address(address: string, currency: any, networkType: string): boolean {
    if (!currency.segwitHrp) {
        return false;
    }
    const hrp = currency.segwitHrp[networkType];
    if (!hrp) {
        return false;
    }

    let dec;
    try {
        dec = bech32.decode(address as `${string}1${string}`, networkType === 'prod' ? 103 : 108);
    } catch {
        return false;
    }

    if (
        dec === null ||
        dec.prefix !== hrp ||
        dec.words.length < 1 ||
        (dec.words[0] > 16 && networkType !== 'stake')
    ) {
        return false;
    }

    return true;
}

export const isValidAddress = (address: string, currency?: any, networkType?: string): boolean => {
    const network = networkType || DEFAULT_NETWORK_TYPE;

    return isValidLegacyAddress(address) || isValidBech32Address(address, currency, network);
};

export const getAddressType = (address: string, currency?: any, networkType?: string) => {
    if (isValidAddress(address, currency, networkType)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
