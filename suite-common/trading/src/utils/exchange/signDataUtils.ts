import { type Account } from '@suite-common/wallet-types';

import { getUnusedAddressFromAccount } from '../../utils';

export const simplifyJSON = (object: unknown): string => {
    if (object === undefined || object === null) {
        return '';
    }

    return JSON.stringify(
        object,
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2,
    )
        .replace(/[{}",[\]]/g, '')
        .replace(/^\s{2}/gm, '')
        .replace(/\n\s*\n/gm, '\n')
        .trim();
};

export const formatMessageValue = (value: unknown): string => {
    if (value === undefined || value === null) {
        return '';
    }

    if (typeof value === 'bigint') {
        return value.toString();
    }

    if (typeof value === 'object') {
        return simplifyJSON(value);
    }

    return String(value);
};

export const getSignerAddress = (sendAccount?: Account) => {
    if (!sendAccount) {
        return undefined;
    }

    try {
        return getUnusedAddressFromAccount(sendAccount).address;
    } catch {
        return undefined;
    }
};
