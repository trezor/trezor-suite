import * as address from './address';
import * as bip32 from './bip32';
import * as bufferutils from './bufferutils';
import { composeTx } from './compose';
import * as crypto from './crypto';
import { deriveAddresses, getXpubOrDescriptorInfo } from './derivation';
import { createAddressCache, discovery } from './discovery';
import * as networks from './networks';
import * as payments from './payments';
import * as script from './script';

export { Transaction } from './transaction';
export { Psbt } from './psbt';

export {
    address,
    bip32,
    bufferutils,
    crypto,
    payments,
    script,
    networks,
    composeTx,
    deriveAddresses,
    getXpubOrDescriptorInfo,
    discovery,
    createAddressCache,
};

export type { PaymentType } from './derivation';
export type { AddressCache, AddressProvider } from './discovery';
export type {
    ComposeInput,
    ComposeOutput,
    ComposeChangeAddress,
    ComposeRequest,
    ComposeResult,
    ComposeResultNonFinal,
    ComposeResultError,
    ComposeResultFinal,
    ComposedTransaction,
    CoinSelectPaymentType,
} from './types';
export type { Network } from './networks';
export type { BIP32Interface } from './bip32';
export type { TransactionInputOutputSortingStrategy } from './types/compose';
