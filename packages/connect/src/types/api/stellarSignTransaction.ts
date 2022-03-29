// Stellar types from stellar-sdk
// https://github.com/stellar/js-stellar-base

import type { Messages } from '@trezor/transport';
import type { Params, Response } from '../params';

export interface StellarAsset {
    type: Messages.StellarAssetType;
    code?: string;
    issuer?: string;
}

export interface StellarCreateAccountOperation {
    type: 'createAccount'; // Proto: "StellarCreateAccountOp"
    source?: string; // Proto: "source_account"
    destination: string; // Proto: "new_account",
    startingBalance: string; // Proto: "starting_balance"
}

export interface StellarPaymentOperation {
    type: 'payment'; // Proto: "StellarPaymentOp"
    source?: string; // Proto: "source_account"
    destination: string; // Proto: "destination_account"
    asset: StellarAsset; // Proto: ok
    amount: string; // Proto: ok
}

export interface StellarPathPaymentStrictReceiveOperation {
    type: 'pathPaymentStrictReceive'; // Proto: "StellarPathPaymentStrictReceiveOp"
    source?: string; // Proto: "source_account"
    sendAsset: StellarAsset; // Proto: "send_asset"
    sendMax: string; // Proto: "send_max"
    destination: string; // Proto: "destination_account"
    destAsset: StellarAsset; // Proto: "destination_asset"
    destAmount: string; // Proto "destination_amount"
    path?: StellarAsset[]; // Proto: "paths"
}

export interface StellarPathPaymentStrictSendOperation {
    type: 'pathPaymentStrictSend'; // Proto: "StellarPathPaymentStrictSendOp"
    source?: string; // Proto: "source_account"
    sendAsset: StellarAsset; // Proto: "send_asset"
    sendAmount: string; // Proto: "send_amount"
    destination: string; // Proto: "destination_account"
    destAsset: StellarAsset; // Proto: "destination_asset"
    destMin: string; // Proto "destination_min"
    path?: StellarAsset[]; // Proto: "paths"
}

export interface StellarPassiveSellOfferOperation {
    type: 'createPassiveSellOffer'; // Proto: "StellarCreatePassiveSellOfferOp"
    source?: string; // Proto: "source_account"
    buying: StellarAsset; // Proto: "buying_asset"
    selling: StellarAsset; // Proto: "selling_asset"
    amount: string; // Proto: ok
    price: { n: number; d: number }; // Proto: "price_n" and "price_d"
}

export interface StellarManageSellOfferOperation {
    type: 'manageSellOffer'; // Proto: "StellarManageSellOfferOp"
    source?: string; // Proto: "source_account"
    buying: StellarAsset; // Proto: "buying_asset"
    selling: StellarAsset; // Proto: "selling_asset"
    amount: string; // Proto: ok
    offerId?: string; // Proto: "offer_id" // not found in stellar-sdk
    price: { n: number; d: number }; // Proto: "price_n" and "price_d"
}

export interface StellarManageBuyOfferOperation {
    type: 'manageBuyOffer'; // Proto: "StellarManageBuyOfferOp"
    source?: string; // Proto: "source_account"
    buying: StellarAsset; // Proto: "buying_asset"
    selling: StellarAsset; // Proto: "selling_asset"
    amount: string; // Proto: ok
    offerId?: string; // Proto: "offer_id" // not found in stellar-sdk
    price: { n: number; d: number }; // Proto: "price_n" and "price_d"
}

export interface StellarSetOptionsOperation {
    type: 'setOptions'; // Proto: "StellarSetOptionsOp"
    source?: string; // Proto: "source_account"
    signer?: {
        type: Messages.StellarSignerType;
        key: string | Buffer;
        weight?: number;
    };
    inflationDest?: string; // Proto: "inflation_destination_account"
    clearFlags?: number; // Proto: "clear_flags"
    setFlags?: number; // Proto: "set_flags"
    masterWeight?: Messages.UintType; // Proto: "master_weight"
    lowThreshold?: Messages.UintType; // Proto: "low_threshold"
    medThreshold?: Messages.UintType; // Proto: "medium_threshold"
    highThreshold?: Messages.UintType; // Proto: "high_threshold"
    homeDomain?: string; // Proto: "home_domain"
}

export interface StellarChangeTrustOperation {
    type: 'changeTrust'; // Proto: "StellarChangeTrustOp"
    source?: string; // Proto: "source_account"
    line: StellarAsset; // Proto: ok
    limit: string; // Proto: ok
}

export interface StellarAllowTrustOperation {
    type: 'allowTrust'; // Proto: "StellarAllowTrustOp"
    source?: string; // Proto: "source_account"
    trustor: string; // Proto: "trusted_account"
    assetCode: string; // Proto: "asset_code"
    assetType: Messages.StellarAssetType; // Proto: "asset_type"
    authorize?: boolean | typeof undefined; // Proto: "is_authorized" > parse to number
}

export interface StellarAccountMergeOperation {
    type: 'accountMerge'; // Proto: "StellarAccountMergeOp"
    source?: string; // Proto: "source_account"
    destination: string; // Proto: "destination_account"
}

export interface StellarManageDataOperation {
    type: 'manageData'; // Proto: "StellarManageDataOp"
    source?: string; // Proto: "source_account"
    name: string; // Proto: "key"
    value?: string | Buffer; // Proto: "value"
}

// (?) Missing in stellar API but present in Proto messages
export interface StellarBumpSequenceOperation {
    type: 'bumpSequence'; // Proto: "StellarBumpSequenceOp"
    source?: string; // Proto: "source_account"
    bumpTo: string; // Proto: "bump_to"
}

// (?) Missing in Proto messages, but present in Stellar API
export interface StellarInflationOperation {
    type: 'inflation';
    source?: string; // Proto: "source_account"
}

export type StellarOperation =
    | StellarCreateAccountOperation
    | StellarPaymentOperation
    | StellarPathPaymentStrictReceiveOperation
    | StellarPathPaymentStrictSendOperation
    | StellarPassiveSellOfferOperation
    | StellarManageSellOfferOperation
    | StellarManageBuyOfferOperation
    | StellarSetOptionsOperation
    | StellarChangeTrustOperation
    | StellarAllowTrustOperation
    | StellarAccountMergeOperation
    | StellarInflationOperation
    | StellarManageDataOperation
    | StellarBumpSequenceOperation;

export interface StellarTransaction {
    source: string; // Proto: "source_account"
    fee: number; // Proto: ok
    sequence: Messages.UintType; // Proto: "sequence_number"
    timebounds?: {
        minTime: number; // Proto: "timebounds_start"
        maxTime: number; // Proto: "timebounds_end"
    };
    memo?: {
        type: Messages.StellarMemoType; // Proto: "memo_type"
        id?: string; // Proto: "memo_id"
        text?: string; // Proto: "memo_text"
        hash?: string | Buffer; // Proto: "memo_hash"
    };
    operations: StellarOperation[]; // Proto: calculated array length > "num_operations"
}

export interface StellarSignTransaction {
    path: string | number[];
    networkPassphrase: string;
    transaction: StellarTransaction;
}

export interface StellarSignedTx {
    publicKey: string;
    signature: string;
}

export declare function stellarSignTransaction(
    params: Params<StellarSignTransaction>,
): Response<StellarSignedTx>;
