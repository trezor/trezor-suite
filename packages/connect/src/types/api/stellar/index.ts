// Stellar types from stellar-sdk
// https://github.com/stellar/js-stellar-base

import { PROTO } from '../../../constants';
import { DerivationPath } from '../../params';
import { Type, Static } from '@trezor/schema-utils';

export type StellarAsset = Static<typeof StellarAsset>;
export const StellarAsset = Type.Object({
    type: Type.Union([PROTO.EnumStellarAssetType, Type.KeyOfEnum(PROTO.StellarAssetType)]),
    code: Type.Optional(Type.String()),
    issuer: Type.Optional(Type.String()),
});

export type StellarCreateAccountOperation = Static<typeof StellarCreateAccountOperation>;
export const StellarCreateAccountOperation = Type.Object({
    type: Type.Literal('createAccount'), // Proto: "StellarCreateAccountOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
    destination: Type.String(), // Proto: "new_account",
    startingBalance: Type.String(), // Proto: "starting_balance"
});

export type StellarPaymentOperation = Static<typeof StellarPaymentOperation>;
export const StellarPaymentOperation = Type.Object({
    type: Type.Literal('payment'), // Proto: "StellarPaymentOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
    destination: Type.String(), // Proto: "destination_account"
    asset: StellarAsset, // Proto: ok
    amount: Type.String(), // Proto: ok
});

export type StellarPathPaymentStrictReceiveOperation = Static<
    typeof StellarPathPaymentStrictReceiveOperation
>;
export const StellarPathPaymentStrictReceiveOperation = Type.Object({
    type: Type.Literal('pathPaymentStrictReceive'), // Proto: "StellarPathPaymentStrictReceiveOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
    sendAsset: StellarAsset, // Proto: "send_asset"
    sendMax: Type.Uint(), // Proto: "send_max"
    destination: Type.String(), // Proto: "destination_account"
    destAsset: StellarAsset, // Proto: "destination_asset"
    destAmount: Type.Uint(), // Proto "destination_amount"
    path: Type.Optional(Type.Array(StellarAsset)), // Proto: "paths"
});

export type StellarPathPaymentStrictSendOperation = Static<
    typeof StellarPathPaymentStrictSendOperation
>;
export const StellarPathPaymentStrictSendOperation = Type.Object({
    type: Type.Literal('pathPaymentStrictSend'), // Proto: "StellarPathPaymentStrictSendOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
    sendAsset: StellarAsset, // Proto: "send_asset"
    sendAmount: Type.Uint(), // Proto: "send_amount"
    destination: Type.String(), // Proto: "destination_account"
    destAsset: StellarAsset, // Proto: "destination_asset"
    destMin: Type.Uint(), // Proto "destination_min"
    path: Type.Optional(Type.Array(StellarAsset)), // Proto: "paths"
});

export type StellarPassiveSellOfferOperation = Static<typeof StellarPassiveSellOfferOperation>;
export const StellarPassiveSellOfferOperation = Type.Object({
    type: Type.Literal('createPassiveSellOffer'), // Proto: "StellarCreatePassiveSellOfferOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
    buying: StellarAsset, // Proto: "buying_asset"
    selling: StellarAsset, // Proto: "selling_asset"
    amount: Type.Uint(), // Proto: ok
    price: Type.Object({
        // Proto: "price_n" and "price_d"
        n: Type.Number(),
        d: Type.Number(),
    }),
});

export type StellarManageSellOfferOperation = Static<typeof StellarManageSellOfferOperation>;
export const StellarManageSellOfferOperation = Type.Object({
    type: Type.Literal('manageSellOffer'), // Proto: "StellarManageSellOfferOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
    buying: StellarAsset, // Proto: "buying_asset"
    selling: StellarAsset, // Proto: "selling_asset"
    amount: Type.Uint(), // Proto: ok
    offerId: Type.Optional(Type.Uint()), // Proto: "offer_id" // not found in stellar-sdk
    price: Type.Object({
        // Proto: "price_n" and "price_d"
        n: Type.Number(),
        d: Type.Number(),
    }),
});

export type StellarManageBuyOfferOperation = Static<typeof StellarManageBuyOfferOperation>;
export const StellarManageBuyOfferOperation = Type.Object({
    type: Type.Literal('manageBuyOffer'), // Proto: "StellarManageBuyOfferOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
    buying: StellarAsset, // Proto: "buying_asset"
    selling: StellarAsset, // Proto: "selling_asset"
    amount: Type.Uint(), // Proto: ok
    offerId: Type.Optional(Type.Uint()), // Proto: "offer_id" // not found in stellar-sdk
    price: Type.Object({
        // Proto: "price_n" and "price_d"
        n: Type.Number(),
        d: Type.Number(),
    }),
});

export type StellarSetOptionsOperation = Static<typeof StellarSetOptionsOperation>;
export const StellarSetOptionsOperation = Type.Object({
    type: Type.Literal('setOptions'), // Proto: "StellarSetOptionsOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
    signer: Type.Optional(
        Type.Object({
            type: PROTO.EnumStellarSignerType,
            key: Type.Union([Type.String(), Type.Buffer()]),
            weight: Type.Optional(Type.Number()),
        }),
    ),
    inflationDest: Type.Optional(Type.String()), // Proto: "inflation_destination_account"
    clearFlags: Type.Optional(Type.Number()), // Proto: "clear_flags"
    setFlags: Type.Optional(Type.Number()), // Proto: "set_flags"
    masterWeight: Type.Optional(Type.Uint()), // Proto: "master_weight"
    lowThreshold: Type.Optional(Type.Uint()), // Proto: "low_threshold"
    medThreshold: Type.Optional(Type.Uint()), // Proto: "medium_threshold"
    highThreshold: Type.Optional(Type.Uint()), // Proto: "high_threshold"
    homeDomain: Type.Optional(Type.String()), // Proto: "home_domain"
});

export type StellarChangeTrustOperation = Static<typeof StellarChangeTrustOperation>;
export const StellarChangeTrustOperation = Type.Object({
    type: Type.Literal('changeTrust'), // Proto: "StellarChangeTrustOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
    line: StellarAsset, // Proto: ok
    limit: Type.String(), // Proto: ok
});

export type StellarAllowTrustOperation = Static<typeof StellarAllowTrustOperation>;
export const StellarAllowTrustOperation = Type.Object({
    type: Type.Literal('allowTrust'), // Proto: "StellarAllowTrustOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
    trustor: Type.String(), // Proto: "trusted_account"
    assetCode: Type.String(), // Proto: "asset_code"
    assetType: PROTO.EnumStellarAssetType, // Proto: "asset_type"
    authorize: Type.Optional(Type.Union([Type.Boolean(), Type.Undefined()])), // Proto: "is_authorized" > parse to number
});

export type StellarAccountMergeOperation = Static<typeof StellarAccountMergeOperation>;
export const StellarAccountMergeOperation = Type.Object({
    type: Type.Literal('accountMerge'), // Proto: "StellarAccountMergeOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
    destination: Type.String(), // Proto: "destination_account"
});

export type StellarManageDataOperation = Static<typeof StellarManageDataOperation>;
export const StellarManageDataOperation = Type.Object({
    type: Type.Literal('manageData'), // Proto: "StellarManageDataOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
    name: Type.String(), // Proto: "key"
    value: Type.Optional(Type.Union([Type.String(), Type.Buffer()])), // Proto: "value"
});

// (?) Missing in stellar API but present in Proto messages
export type StellarBumpSequenceOperation = Static<typeof StellarBumpSequenceOperation>;
export const StellarBumpSequenceOperation = Type.Object({
    type: Type.Literal('bumpSequence'), // Proto: "StellarBumpSequenceOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
    bumpTo: Type.Uint(), // Proto: "bump_to"
});

// (?) Missing in Proto messages, but present in Stellar API
export type StellarInflationOperation = Static<typeof StellarInflationOperation>;
export const StellarInflationOperation = Type.Object({
    type: Type.Literal('inflation'), // Proto: "StellarInflationOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
});

export type StellarClaimClaimableBalanceOperation = Static<
    typeof StellarClaimClaimableBalanceOperation
>;
export const StellarClaimClaimableBalanceOperation = Type.Object({
    type: Type.Literal('claimClaimableBalance'), // Proto: "StellarClaimClaimableBalanceOp"
    source: Type.Optional(Type.String()), // Proto: "source_account"
    balanceId: Type.String(), // Proto: "balance_id"
});

export type StellarOperation = Static<typeof StellarOperation>;
export const StellarOperation = Type.Union([
    StellarCreateAccountOperation,
    StellarPaymentOperation,
    StellarPathPaymentStrictReceiveOperation,
    StellarPathPaymentStrictSendOperation,
    StellarPassiveSellOfferOperation,
    StellarManageSellOfferOperation,
    StellarManageBuyOfferOperation,
    StellarSetOptionsOperation,
    StellarChangeTrustOperation,
    StellarAllowTrustOperation,
    StellarAccountMergeOperation,
    StellarInflationOperation,
    StellarManageDataOperation,
    StellarBumpSequenceOperation,
    StellarClaimClaimableBalanceOperation,
]);

export type StellarTransaction = Static<typeof StellarTransaction>;
export const StellarTransaction = Type.Object({
    source: Type.String(), // Proto: "source_account"
    fee: Type.Number(), // Proto: ok
    sequence: Type.Uint(), // Proto: "sequence_number"
    timebounds: Type.Optional(
        Type.Object({
            minTime: Type.Number(), // Proto: "timebounds_start"
            maxTime: Type.Number(), // Proto: "timebounds_end"
        }),
    ),
    memo: Type.Optional(
        Type.Object({
            type: PROTO.EnumStellarMemoType, // Proto: "memo_type"
            id: Type.Optional(Type.Uint()), // Proto: "memo_id"
            text: Type.Optional(Type.String()), // Proto: "memo_text"
            hash: Type.Optional(Type.Union([Type.String(), Type.Buffer()])), // Proto: "memo_hash"
        }),
    ),
    operations: Type.Array(StellarOperation), // Proto: calculated array length > "num_operations"
});

export type StellarSignTransaction = Static<typeof StellarSignTransaction>;
export const StellarSignTransaction = Type.Object({
    path: DerivationPath,
    networkPassphrase: Type.String(),
    transaction: StellarTransaction,
});

export type StellarSignedTx = Static<typeof StellarSignedTx>;
export const StellarSignedTx = Type.Object({
    publicKey: Type.String(),
    signature: Type.String(),
});

// NOTE: StellarOperation (stellar-sdk) transformed to type & payload from PROTO
export type StellarOperationMessage = Static<typeof StellarOperationMessage>;
export const StellarOperationMessage = Type.Union([
    Type.Intersect([
        Type.Object({
            type: Type.Literal('StellarCreateAccountOp'),
        }),
        PROTO.StellarCreateAccountOp,
    ]),
    Type.Intersect([
        Type.Object({
            type: Type.Literal('StellarPaymentOp'),
        }),
        PROTO.StellarPaymentOp,
    ]),
    Type.Intersect([
        Type.Object({
            type: Type.Literal('StellarPathPaymentStrictReceiveOp'),
        }),
        PROTO.StellarPathPaymentStrictReceiveOp,
    ]),
    Type.Intersect([
        Type.Object({
            type: Type.Literal('StellarPathPaymentStrictSendOp'),
        }),
        PROTO.StellarPathPaymentStrictSendOp,
    ]),
    Type.Intersect([
        Type.Object({
            type: Type.Literal('StellarManageSellOfferOp'),
        }),
        PROTO.StellarManageSellOfferOp,
    ]),
    Type.Intersect([
        Type.Object({
            type: Type.Literal('StellarManageBuyOfferOp'),
        }),
        PROTO.StellarManageBuyOfferOp,
    ]),
    Type.Intersect([
        Type.Object({
            type: Type.Literal('StellarCreatePassiveSellOfferOp'),
        }),
        PROTO.StellarCreatePassiveSellOfferOp,
    ]),
    Type.Intersect([
        Type.Object({
            type: Type.Literal('StellarSetOptionsOp'),
        }),
        PROTO.StellarSetOptionsOp,
    ]),
    Type.Intersect([
        Type.Object({
            type: Type.Literal('StellarChangeTrustOp'),
        }),
        PROTO.StellarChangeTrustOp,
    ]),
    Type.Intersect([
        Type.Object({
            type: Type.Literal('StellarAllowTrustOp'),
        }),
        PROTO.StellarAllowTrustOp,
    ]),
    Type.Intersect([
        Type.Object({
            type: Type.Literal('StellarAccountMergeOp'),
        }),
        PROTO.StellarAccountMergeOp,
    ]),
    Type.Intersect([
        Type.Object({
            type: Type.Literal('StellarManageDataOp'),
        }),
        PROTO.StellarManageDataOp,
    ]),
    Type.Intersect([
        Type.Object({
            type: Type.Literal('StellarBumpSequenceOp'),
        }),
        PROTO.StellarBumpSequenceOp,
    ]),
    Type.Intersect([
        Type.Object({
            type: Type.Literal('StellarClaimClaimableBalanceOp'),
        }),
        PROTO.StellarClaimClaimableBalanceOp,
    ]),
]);
