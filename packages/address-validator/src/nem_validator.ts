import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';

export const isValidAddress = (_address: string): boolean => {
    const address = _address.toString().toUpperCase().replace(/-/g, '');
    if (!address || address.length !== 40) {
        return false;
    }
    const decoded = cryptoUtils.toHex(cryptoUtils.base32.b32decode(address));
    const stepThreeChecksum = cryptoUtils.keccak256Checksum(
        Buffer.from(decoded.slice(0, 42), 'hex'),
    );

    return stepThreeChecksum === decoded.slice(42);
};

export const getAddressType = (address: string, _currency?: any, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
