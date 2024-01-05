import { Type, Static } from '@trezor/schema-utils';
import { PROTO } from '../../../constants';
import { GetPublicKey, PublicKey, DerivationPath } from '../../params';

// cardanoGetAddress

export type CardanoCertificatePointer = Static<typeof CardanoCertificatePointer>;
export const CardanoCertificatePointer = Type.Object({
    blockIndex: Type.Number(),
    txIndex: Type.Number(),
    certificateIndex: Type.Number(),
});

export type CardanoAddressParameters = Static<typeof CardanoAddressParameters>;
export const CardanoAddressParameters = Type.Object({
    addressType: PROTO.EnumCardanoAddressType,
    path: Type.Optional(DerivationPath),
    stakingPath: Type.Optional(DerivationPath),
    stakingKeyHash: Type.Optional(Type.String()),
    certificatePointer: Type.Optional(CardanoCertificatePointer),
    paymentScriptHash: Type.Optional(Type.String()),
    stakingScriptHash: Type.Optional(Type.String()),
});

export type CardanoGetAddress = Static<typeof CardanoGetAddress>;
export const CardanoGetAddress = Type.Object({
    addressParameters: CardanoAddressParameters,
    protocolMagic: Type.Number(),
    networkId: Type.Number(),
    address: Type.Optional(Type.String()),
    showOnTrezor: Type.Optional(Type.Boolean()),
    derivationType: Type.Optional(PROTO.EnumCardanoDerivationType),
    chunkify: Type.Optional(Type.Boolean()),
});

export interface CardanoAddress {
    addressParameters: CardanoAddressParameters;
    protocolMagic: number;
    networkId: number;
    serializedPath: string;
    serializedStakingPath: string;
    address: string;
}

// cardanoGetNativeScriptHash

export type CardanoNativeScript = Static<typeof CardanoNativeScript>;
export const CardanoNativeScript = Type.Recursive(This =>
    Type.Object({
        type: PROTO.EnumCardanoNativeScriptType,
        scripts: Type.Optional(Type.Array(This)),
        keyHash: Type.Optional(Type.String()),
        keyPath: Type.Optional(DerivationPath),
        requiredSignaturesCount: Type.Optional(Type.Number()),
        invalidBefore: Type.Optional(Type.String()),
        invalidHereafter: Type.Optional(Type.String()),
    }),
);

export type CardanoGetNativeScriptHash = Static<typeof CardanoGetNativeScriptHash>;
export const CardanoGetNativeScriptHash = Type.Object({
    script: CardanoNativeScript,
    displayFormat: PROTO.EnumCardanoNativeScriptHashDisplayFormat,
    derivationType: Type.Optional(PROTO.EnumCardanoDerivationType),
});

export type CardanoNativeScriptHash = Static<typeof CardanoNativeScriptHash>;
export const CardanoNativeScriptHash = Type.Object({
    scriptHash: Type.String(),
});

// cardanoGetPublicKey

export type CardanoGetPublicKey = Static<typeof CardanoGetPublicKey>;
export const CardanoGetPublicKey = Type.Intersect([
    GetPublicKey,
    Type.Object({
        derivationType: Type.Optional(PROTO.EnumCardanoDerivationType),
    }),
]);

export interface CardanoPublicKey extends PublicKey {
    node: PROTO.HDNodeType;
}

// cardanoSignTransaction

export type CardanoInput = Static<typeof CardanoInput>;
export const CardanoInput = Type.Object({
    path: Type.Optional(DerivationPath),
    prev_hash: Type.String(),
    prev_index: Type.Number(),
});

export type CardanoToken = Static<typeof CardanoToken>;
export const CardanoToken = Type.Object({
    assetNameBytes: Type.String(),
    amount: Type.Optional(Type.String()),
    mintAmount: Type.Optional(Type.String()),
});

export type CardanoAssetGroup = Static<typeof CardanoAssetGroup>;
export const CardanoAssetGroup = Type.Object({
    policyId: Type.String(),
    tokenAmounts: Type.Array(CardanoToken),
});

export type CardanoOutput = Static<typeof CardanoOutput>;
export const CardanoOutput = Type.Intersect([
    Type.Union([
        Type.Object({
            addressParameters: CardanoAddressParameters,
        }),
        Type.Object({
            address: Type.String(),
        }),
    ]),
    Type.Object({
        amount: Type.String(),
        tokenBundle: Type.Optional(Type.Array(CardanoAssetGroup)),
        datumHash: Type.Optional(Type.String()),
        format: Type.Optional(PROTO.EnumCardanoTxOutputSerializationFormat),
        inlineDatum: Type.Optional(Type.String()),
        referenceScript: Type.Optional(Type.String()),
    }),
]);

export type CardanoPoolOwner = Static<typeof CardanoPoolOwner>;
export const CardanoPoolOwner = Type.Object({
    stakingKeyPath: Type.Optional(DerivationPath),
    stakingKeyHash: Type.Optional(Type.String()),
});

export type CardanoPoolRelay = Static<typeof CardanoPoolRelay>;
export const CardanoPoolRelay = Type.Object({
    type: PROTO.EnumCardanoPoolRelayType,
    ipv4Address: Type.Optional(Type.String()),
    ipv6Address: Type.Optional(Type.String()),
    port: Type.Optional(Type.Number()),
    hostName: Type.Optional(Type.String()),
});

export type CardanoPoolMetadata = Static<typeof CardanoPoolMetadata>;
export const CardanoPoolMetadata = Type.Object({
    url: Type.String(),
    hash: Type.String(),
});

export type CardanoPoolMargin = Static<typeof CardanoPoolMargin>;
export const CardanoPoolMargin = Type.Object({
    numerator: Type.String(),
    denominator: Type.String(),
});

export type CardanoPoolParameters = Static<typeof CardanoPoolParameters>;
export const CardanoPoolParameters = Type.Object({
    poolId: Type.String(),
    vrfKeyHash: Type.String(),
    pledge: Type.String(),
    cost: Type.String(),
    margin: CardanoPoolMargin,
    rewardAccount: Type.String(),
    owners: Type.Array(CardanoPoolOwner, { minItems: 1 }),
    relays: Type.Array(CardanoPoolRelay),
    metadata: Type.Optional(CardanoPoolMetadata),
});

export type CardanoCertificate = Static<typeof CardanoCertificate>;
export const CardanoCertificate = Type.Object({
    type: PROTO.EnumCardanoCertificateType,
    path: Type.Optional(DerivationPath),
    pool: Type.Optional(Type.String()),
    poolParameters: Type.Optional(CardanoPoolParameters),
    scriptHash: Type.Optional(Type.String()),
    keyHash: Type.Optional(Type.String()),
});

export type CardanoWithdrawal = Static<typeof CardanoWithdrawal>;
export const CardanoWithdrawal = Type.Object({
    path: Type.Optional(DerivationPath),
    amount: Type.String(),
    scriptHash: Type.Optional(Type.String()),
    keyHash: Type.Optional(Type.String()),
});

export type CardanoMint = Static<typeof CardanoMint>;
export const CardanoMint = Type.Array(CardanoAssetGroup);

export type CardanoCollateralInput = Static<typeof CardanoCollateralInput>;
export const CardanoCollateralInput = Type.Object({
    path: Type.Optional(DerivationPath),
    prev_hash: Type.String(),
    prev_index: Type.Number(),
});

export type CardanoRequiredSigner = Static<typeof CardanoRequiredSigner>;
export const CardanoRequiredSigner = Type.Object({
    keyPath: Type.Optional(DerivationPath),
    keyHash: Type.Optional(Type.String()),
});

export type CardanoReferenceInput = Static<typeof CardanoReferenceInput>;
export const CardanoReferenceInput = Type.Object({
    prev_hash: Type.String(),
    prev_index: Type.Number(),
});

export type CardanoCVoteRegistrationDelegation = Static<typeof CardanoCVoteRegistrationDelegation>;
export const CardanoCVoteRegistrationDelegation = Type.Object({
    votePublicKey: Type.String(),
    weight: Type.Number(),
});

export type CardanoCVoteRegistrationParameters = Static<typeof CardanoCVoteRegistrationParameters>;
export const CardanoCVoteRegistrationParameters = Type.Object({
    votePublicKey: Type.Optional(Type.String()),
    stakingPath: DerivationPath,
    paymentAddressParameters: Type.Optional(CardanoAddressParameters),
    nonce: Type.String(),
    format: Type.Optional(PROTO.EnumCardanoCVoteRegistrationFormat),
    delegations: Type.Optional(Type.Array(CardanoCVoteRegistrationDelegation)),
    votingPurpose: Type.Optional(Type.Number()),
    paymentAddress: Type.Optional(Type.String()),
});

export type CardanoAuxiliaryData = Static<typeof CardanoAuxiliaryData>;
export const CardanoAuxiliaryData = Type.Object({
    hash: Type.Optional(Type.String()),
    cVoteRegistrationParameters: Type.Optional(CardanoCVoteRegistrationParameters),
});

export type CardanoSignTransaction = Static<typeof CardanoSignTransaction>;
export const CardanoSignTransaction = Type.Object({
    inputs: Type.Array(CardanoInput),
    outputs: Type.Array(CardanoOutput),
    fee: Type.Uint(),
    ttl: Type.Optional(Type.Uint()),
    certificates: Type.Optional(Type.Array(CardanoCertificate)),
    withdrawals: Type.Optional(Type.Array(CardanoWithdrawal)),
    validityIntervalStart: Type.Optional(Type.String()),
    auxiliaryData: Type.Optional(CardanoAuxiliaryData),
    mint: Type.Optional(CardanoMint),
    scriptDataHash: Type.Optional(Type.String()),
    collateralInputs: Type.Optional(Type.Array(CardanoCollateralInput)),
    requiredSigners: Type.Optional(Type.Array(CardanoRequiredSigner)),
    collateralReturn: Type.Optional(CardanoOutput),
    totalCollateral: Type.Optional(Type.String()),
    referenceInputs: Type.Optional(Type.Array(CardanoReferenceInput)),
    additionalWitnessRequests: Type.Optional(Type.Array(DerivationPath)),
    protocolMagic: Type.Number(),
    networkId: Type.Number(),
    signingMode: PROTO.EnumCardanoTxSigningMode,
    derivationType: Type.Optional(PROTO.EnumCardanoDerivationType),
    includeNetworkId: Type.Optional(Type.Boolean()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type CardanoSignTransactionExtended = Static<typeof CardanoSignTransactionExtended>;
export const CardanoSignTransactionExtended = Type.Intersect([
    CardanoSignTransaction,
    Type.Object({
        unsignedTx: Type.Object({
            body: Type.String(),
            hash: Type.String(),
        }),
        testnet: Type.Boolean(),
    }),
]);

export type CardanoSignedTxWitness = Static<typeof CardanoSignedTxWitness>;
export const CardanoSignedTxWitness = Type.Object({
    type: PROTO.EnumCardanoTxWitnessType,
    pubKey: Type.String(),
    signature: Type.String(),
    chainCode: Type.Optional(Type.String()),
});

export type CardanoAuxiliaryDataSupplement = Static<typeof CardanoAuxiliaryDataSupplement>;
export const CardanoAuxiliaryDataSupplement = Type.Object({
    type: PROTO.EnumCardanoTxAuxiliaryDataSupplementType,
    auxiliaryDataHash: Type.String(),
    cVoteRegistrationSignature: Type.Optional(Type.String()),
});

export type CardanoSignedTxData = Static<typeof CardanoSignedTxData>;
export const CardanoSignedTxData = Type.Object({
    hash: Type.String(),
    witnesses: Type.Array(CardanoSignedTxWitness),
    auxiliaryDataSupplement: Type.Optional(CardanoAuxiliaryDataSupplement),
});
