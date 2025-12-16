import { addressType } from './crypto/utils';
import cbor from 'cbor';
import CRC from 'crc';
import { decode as base58decode } from './crypto/base58';
import { bech32 } from 'bech32';
import type { AddressType, Currency, NetworkType } from './types';

const DEFAULT_NETWORK_TYPE: NetworkType = 'prod';

function getDecoded(address: string): unknown {
    try {
        const decoded = base58decode(address);
        return cbor.decode(new Uint8Array(decoded).buffer);
    } catch (e) {
        return null;
    }
}

function isValidLegacyAddress(address: string): boolean {
    const decoded = getDecoded(address) as any;
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

function isValidBech32Address(
    address: string,
    currency: Currency,
    networkType: NetworkType,
): boolean {
    if (!currency.segwitHrp) {
        return false;
    }
    const hrp = currency.segwitHrp[networkType];
    if (!hrp) {
        return false;
    }

    try {
        const dec = bech32.decode(address, networkType === 'prod' ? 103 : 108);
        if (
            dec === null ||
            dec.prefix !== hrp ||
            dec.words.length < 1 ||
            (dec.words[0] > 16 && networkType !== 'stake')
        ) {
            return false;
        }
    } catch (err) {
        return false;
    }

    return true;
}

function isValidAddress(
    address: string,
    currency: Currency,
    networkType: NetworkType = DEFAULT_NETWORK_TYPE,
): boolean {
    return isValidLegacyAddress(address) || isValidBech32Address(address, currency, networkType);
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

export default {
    isValidAddress,
    getAddressType,
};
