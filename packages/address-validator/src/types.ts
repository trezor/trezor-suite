export type NetworkType = 'prod' | 'testnet' | 'regtest' | 'both' | 'stake' | string;

export type AddressType =
    | 'address'
    | 'p2pkh'
    | 'p2wpkh'
    | 'p2wsh'
    | 'p2sh'
    | 'p2tr'
    | 'p2w-unknown';

export interface AddressValidator {
    isValidAddress(address: string, currency?: Currency, networkType?: NetworkType): boolean;
    getAddressType?(
        address: string,
        currency?: Currency,
        networkType?: NetworkType,
    ): AddressType | undefined;
}

export interface SegwitHrpMap {
    prod?: string;
    testnet?: string;
    regtest?: string;
    stake?: string;
    [key: string]: string | undefined;
}

export interface Currency {
    name: string;
    symbol: string;
    validator: AddressValidator;
    segwitHrp?: SegwitHrpMap;
    addressTypes?: Record<string, string[]>;
    subAddressTypes?: Record<string, string[]>;
    iAddressTypes?: Record<string, string[]>;
    regexp?: string;
    regex?: RegExp;
    hashFunction?:
        | 'blake256keccak256'
        | 'blake256'
        | 'keccak256'
        | 'groestl512x2'
        | 'sha256'
        | string;
    expectedLength?: number;
    [key: string]: unknown;
}
