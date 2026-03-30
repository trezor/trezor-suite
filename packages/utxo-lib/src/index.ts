import * as address from './address';
import * as bip32 from './bip32';
import * as bufferutils from './bufferutils';
import * as crypto from './crypto';
import { deriveAddresses, getXpubOrDescriptorInfo } from './derivation';
import { createAddressCache, discovery } from './discovery';
import * as networks from './networks';
import * as payments from './payments';
import * as script from './script';

export { Transaction } from './transaction';

export {
    address,
    bip32,
    bufferutils,
    crypto,
    payments,
    script,
    networks,
    deriveAddresses,
    getXpubOrDescriptorInfo,
    discovery,
    createAddressCache,
};

export type { PaymentType } from './derivation';
export type { AddressCache, AddressProvider } from './discovery';
export type { Network } from './networks';
export type { BIP32Interface } from './bip32';
