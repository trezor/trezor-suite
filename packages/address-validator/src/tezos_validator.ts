/* eslint-disable import/no-default-export */
import * as base58 from './crypto/base58';
import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';

const prefix = new Uint8Array([6, 161, 159]);

function decodeRaw(buffer: number[]): number[] | undefined {
    const payload = buffer.slice(0, -4);
    const checksum = buffer.slice(-4);
    const newChecksum = cryptoUtils.hexStr2byteArray(
        cryptoUtils.sha256x2(cryptoUtils.byteArray2hexStr(payload)),
    );

    if (
        (checksum[0] ^ newChecksum[0]) |
        (checksum[1] ^ newChecksum[1]) |
        (checksum[2] ^ newChecksum[2]) |
        (checksum[3] ^ newChecksum[3])
    ) {
        return;
    }

    return payload;
}

const isValidAddress = (address: string): boolean => {
    try {
        const buffer = base58.decode(address);
        const payload = decodeRaw(buffer);
        if (!payload) return false;
        payload.slice(prefix.length);

        return true;
    } catch {
        return false;
    }
};

const validator = {
    isValidAddress,

    getAddressType(address: string, _currency?: any, _networkType?: string) {
        if (this.isValidAddress(address)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};

export default validator;
