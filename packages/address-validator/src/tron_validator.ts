import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';

function decodeBase58Address(base58Sting: unknown): number[] | false {
    if (typeof base58Sting !== 'string') {
        return false;
    }
    if (base58Sting.length <= 4) {
        return false;
    }

    let address: number[];
    try {
        address = cryptoUtils.base58(base58Sting);
    } catch {
        return false;
    }

    const len = address.length;
    const offset = len - 4;
    const checkSum = address.slice(offset);
    address = address.slice(0, offset);
    const hash0 = cryptoUtils.sha256(cryptoUtils.byteArray2hexStr(address));
    const hash1 = cryptoUtils.hexStr2byteArray(cryptoUtils.sha256(hash0));
    const checkSum1 = hash1.slice(0, 4);
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

function getEnv(currency: any, networkType?: string): number {
    let evn = networkType || 'prod';

    if (evn !== 'prod' && evn !== 'testnet') evn = 'prod';

    return currency.addressTypes[evn][0];
}

export const isValidAddress = (
    mainAddress: string,
    currency?: any,
    networkType?: string,
): boolean => {
    const address = decodeBase58Address(mainAddress);

    if (!address) {
        return false;
    }

    if (address.length !== 21) {
        return false;
    }

    return getEnv(currency, networkType) === address[0];
};

export const getAddressType = (address: string, currency?: any, networkType?: string) => {
    if (isValidAddress(address, currency, networkType)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
