import { addressType } from './crypto/utils';

function isValidEOSAddress(address: string): boolean {
    const regex = /^[a-z0-9]+$/g;
    if (address.search(regex) !== -1 && address.length === 12) {
        return true;
    }

    return false;
}

export const isValidAddress = (address: string): boolean => isValidEOSAddress(address);

export const getAddressType = (address: string, _currency?: any, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
