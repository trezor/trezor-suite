import type { addressType } from './crypto/utils';

type AddressType = (typeof addressType)[keyof typeof addressType];

export type HashFunction = 'sha256' | 'blake256' | 'blake256keccak256' | 'keccak256';

export type NetworkEnvironment =
    | 'prod'
    | 'testnet'
    | 'regtest'
    // TODO: 'stake' is a Cardano address kind (stake vs payment), not a network
    // environment, and is orthogonal to mainnet/testnet. It is wedged in here
    // because the validator currently dispatches HRP/length rules through this
    // single parameter. Refactor: detect stake addresses inside ada_validator
    // and drop this member.
    | 'stake'
    | 'both';

export interface Validator {
    isValidAddress: (address: string, currency?: Currency, network?: NetworkEnvironment) => boolean;
    getAddressType?: (
        address: string,
        currency?: Currency,
        network?: NetworkEnvironment,
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
    hashFunction?: HashFunction;
    regex?: RegExp;
}
