import type { addressType } from './crypto/utils';

type AddressType = (typeof addressType)[keyof typeof addressType];

export interface Validator {
    isValidAddress: (address: string, currency?: Currency, networkType?: string) => boolean;
    getAddressType?: (
        address: string,
        currency?: Currency,
        networkType?: string,
    ) => AddressType | undefined;
}

export interface Currency {
    name: string;
    symbol: string;
    validator: Validator;
    regexp?: string;
    segwitHrp?: Record<string, string>;
    addressTypes?: Record<string, (string | number)[]>;
    iAddressTypes?: Record<string, (string | number)[]>;
    subAddressTypes?: Record<string, (string | number)[]>;
    expectedLength?: number;
    hashFunction?: string;
    regex?: RegExp;
}
