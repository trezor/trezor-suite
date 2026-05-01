import { addressType } from './crypto/utils';

const accountRegex = new RegExp('^[a-z0-9-.]{3,}$');
const segmentRegex = new RegExp('^[a-z][a-z0-9-]+[a-z0-9]$');
const doubleDashRegex = new RegExp('--');

export const isValidAddress = (address: string): boolean => {
    if (!accountRegex.test(address)) {
        return false;
    }
    const segments = address.split('.');
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (segment.length < 3) {
            return false;
        }
        if (!segmentRegex.test(segment)) {
            return false;
        }
        if (doubleDashRegex.test(segment)) {
            return false;
        }
    }

    return true;
};

export const getAddressType = (address: string, _currency?: any, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
