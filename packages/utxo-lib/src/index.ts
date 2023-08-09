import * as address from './address';
import * as bip32 from './bip32';
import * as bufferutils from './bufferutils';
import * as crypto from './crypto';
import * as payments from './payments';
import * as script from './script';
import * as networks from './networks';
import { composeTx } from './compose';
import { deriveAddresses, getXpubOrDescriptorInfo } from './derivation';
import { discovery } from './discovery';

export { Transaction } from './transaction';

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
};

export type { PaymentType } from './derivation';
export type {
    ComposeInput,
    ComposeOutput,
    ComposeRequest,
    ComposeResult,
    ComposeResultFinal,
    ComposedTransaction,
    CoinSelectPaymentType,
} from './types';
export type { Network } from './networks';
export type { BIP32Interface } from './bip32';
