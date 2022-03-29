import type { Messages } from '@trezor/transport';
import type { CardanoAddressParameters } from './cardanoGetAddress';
import type { Params, Response } from '../params';

export interface CardanoInput {
    path?: string | number[];
    prev_hash: string;
    prev_index: number;
}

export interface CardanoToken {
    assetNameBytes: string;
    amount?: string;
    mintAmount?: string;
}

export interface CardanoAssetGroup {
    policyId: string;
    tokenAmounts: CardanoToken[];
}

export type CardanoOutput =
    | {
          addressParameters: CardanoAddressParameters;
          amount: string;
          tokenBundle?: CardanoAssetGroup[];
          datumHash?: string;
      }
    | {
          address: string;
          amount: string;
          tokenBundle?: CardanoAssetGroup[];
          datumHash?: string;
      };

export interface CardanoPoolOwner {
    stakingKeyPath?: string | number[];
    stakingKeyHash?: string;
}

export interface CardanoPoolRelay {
    type: Messages.CardanoPoolRelayType;
    ipv4Address?: string;
    ipv6Address?: string;
    port?: number;
    hostName?: string;
}

export interface CardanoPoolMetadata {
    url: string;
    hash: string;
}

export interface CardanoPoolMargin {
    numerator: string;
    denominator: string;
}

export interface CardanoPoolParameters {
    poolId: string;
    vrfKeyHash: string;
    pledge: string;
    cost: string;
    margin: CardanoPoolMargin;
    rewardAccount: string;
    owners: CardanoPoolOwner[];
    relays: CardanoPoolRelay[];
    metadata: CardanoPoolMetadata;
}

export interface CardanoCertificate {
    type: Messages.CardanoCertificateType;
    path?: string | number[];
    pool?: string;
    poolParameters?: CardanoPoolParameters;
    scriptHash?: string;
    keyHash?: string;
}

export interface CardanoWithdrawal {
    path?: string | number[];
    amount: string;
    scriptHash?: string;
    keyHash?: string;
}

export type CardanoMint = CardanoAssetGroup[];

export interface CardanoCollateralInput {
    path?: string | number[];
    prev_hash: string;
    prev_index: number;
}

export interface CardanoRequiredSigner {
    keyPath?: string | number[];
    keyHash?: string;
}

export interface CardanoCatalystRegistrationParameters {
    votingPublicKey: string;
    stakingPath: string | number[];
    rewardAddressParameters: CardanoAddressParameters;
    nonce: string;
}

export interface CardanoAuxiliaryData {
    hash?: string;
    catalystRegistrationParameters?: CardanoCatalystRegistrationParameters;
}

export interface CardanoSignTransaction {
    inputs: CardanoInput[];
    outputs: CardanoOutput[];
    fee: string;
    ttl?: string;
    certificates?: CardanoCertificate[];
    withdrawals?: CardanoWithdrawal[];
    validityIntervalStart?: string;
    auxiliaryData?: CardanoAuxiliaryData;
    mint?: CardanoMint;
    scriptDataHash?: string;
    collateralInputs?: CardanoCollateralInput[];
    requiredSigners?: CardanoRequiredSigner[];
    additionalWitnessRequests?: (string | number[])[];
    protocolMagic: number;
    networkId: number;
    signingMode: Messages.CardanoTxSigningMode;
    derivationType?: Messages.CardanoDerivationType;
    includeNetworkId?: boolean;
}

export interface CardanoSignedTxWitness {
    type: Messages.CardanoTxWitnessType;
    pubKey: string;
    signature: string;
    chainCode?: string;
}

export interface CardanoAuxiliaryDataSupplement {
    type: Messages.CardanoTxAuxiliaryDataSupplementType;
    auxiliaryDataHash: string;
    catalystSignature?: string;
}

export interface CardanoSignedTxData {
    hash: string;
    witnesses: CardanoSignedTxWitness[];
    auxiliaryDataSupplement?: CardanoAuxiliaryDataSupplement;
}

export declare function cardanoSignTransaction(
    params: Params<CardanoSignTransaction>,
): Response<CardanoSignedTxData>;
