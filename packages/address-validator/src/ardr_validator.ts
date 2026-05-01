import { addressType } from './crypto/utils';

const ardorRegex = new RegExp('^ARDOR(-[A-Z0-9]{4}){3}(-[A-Z0-9]{5})$');

export const isValidAddress = (address: string): boolean => {
    if (!ardorRegex.test(address)) {
        return false;
    }

    return true;
};

export const getAddressType = (address: string, _currency?: any, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
