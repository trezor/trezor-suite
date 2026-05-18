import { bech32 } from '@scure/base';
import * as cbor from 'cbor';
import CRC from 'crc';

import * as base58 from './crypto/base58';
import { addressType } from './crypto/utils';
import type { Currency } from './currency-types';

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
    // SUSPECTED-BUG-MUTATION: The guard `!Array.isArray(decoded) && decoded.length !== 2` is contradictory — it only rejects non-array objects whose `.length` is not exactly 2, so a 3-element array (or any array with length !== 2) falls through to `decoded[0]` / `decoded[1]` below despite the immediately-following code requiring decoded to be a 2-element array. Author likely intended `Array.isArray(decoded) && decoded.length !== 2` (reject if it IS an array but has wrong length) or `!Array.isArray(decoded) || decoded.length !== 2` (reject anything that is not a 2-element array).
    // Mutator: LogicalOperator  Original: `!Array.isArray(decoded) && decoded.length !== 2`  →  Mutant: `!Array.isArray(decoded) || decoded.length !== 2`
    // Needs human spec review before locking behavior with a test.
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

export const isValidAddress = (
    address: string,
    currency?: Currency,
    networkType?: string,
): boolean => {
    const network = networkType || DEFAULT_NETWORK_TYPE;

    return isValidLegacyAddress(address) || isValidBech32Address(address, currency, network);
};

export const getAddressType = (address: string, currency?: Currency, networkType?: string) => {
    if (isValidAddress(address, currency, networkType)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
