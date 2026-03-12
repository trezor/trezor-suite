import type { Network } from '@trezor/utxo-lib';

import type { AccountAddress } from './account';
import type { AliceShape, SerializedAlice } from './alice';
import type {
    AffiliationId,
    CoinjoinAffiliateRequest,
    CoinjoinRoundParameters,
    Round,
} from './coordinator';
import type { Logger } from './logger';
import type { RawLiquidityClue } from './middleware';
import type { CoinjoinPrisonShape } from './prison';
import type { EndRoundState, RoundPhase, SessionPhase } from '../enums';

export type SessionPhaseEvent = {
    phase: SessionPhase;
    accountKeys: string[];
};

export interface CoinjoinRoundOptions {
    network: Network;
    signal: AbortSignal;
    coordinatorName: string;
    coordinatorUrl: string;
    middlewareUrl: string;
    logger: Logger;
    affiliationId?: AffiliationId;
    setSessionPhase: (event: SessionPhaseEvent) => void;
}

// shape if src/client/CoinjoinRound.ts
export interface CoinjoinRoundShape {
    readonly prison: CoinjoinPrisonShape;
    id: string;
    blameOf: string;
    phase: RoundPhase;
    endRoundState: EndRoundState;
    coinjoinState: Round['CoinjoinState'];
    inputRegistrationEnd: string;
    amountCredentialIssuerParameters: Round['AmountCredentialIssuerParameters'];
    vsizeCredentialIssuerParameters: Round['VsizeCredentialIssuerParameters'];
    affiliateRequest: Round['AffiliateRequest'];

    roundParameters: CoinjoinRoundParameters;
    inputs: AliceShape[]; // list of registered inputs
    failed: AliceShape[]; // list of failed inputs
    phaseDeadline: number; // deadline is inaccurate, phase may change earlier
    roundDeadline: number; // deadline is inaccurate,round may end earlier
    commitmentData: string; // commitment data used for ownership proof and witness requests
    addresses: (AccountAddress & { accountKey: string })[]; // list of addresses (outputs) used in this round in outputRegistration phase
    transactionSignTries: number[]; // timestamps for processing transactionSigning phase
    transactionData?: CoinjoinTransactionData; // transaction to sign
    broadcastedTxDetails?: BroadcastedTransactionDetails; // transaction broadcasted
    liquidityClues?: CoinjoinTransactionLiquidityClue[]; // updated liquidity clues

    setSessionPhase(phase: SessionPhase): void;
    signedSuccessfully(): void;
    isSignedSuccessfully(): boolean;
}

export type CoinjoinRoundGenerator = (
    round: Round,
    prison: CoinjoinPrisonShape,
    options: CoinjoinRoundOptions,
) => CoinjoinRoundShape;

export interface SerializedCoinjoinRound {
    id: string;
    phase: RoundPhase;
    endRoundState: EndRoundState;
    inputs: SerializedAlice[]; // list of registered inputs
    failed: SerializedAlice[]; // list of failed inputs
    addresses: AccountAddress[]; // list of addresses (outputs) used in this round in outputRegistration phase
    phaseDeadline: number; // deadline is inaccurate, phase may change earlier
    roundDeadline: number; // deadline is inaccurate,round may end earlier
    broadcastedTxDetails?: BroadcastedTransactionDetails; // calculated from tx data and witnesses from coordinator
}

export interface CoinjoinRoundEvent {
    round: SerializedCoinjoinRound;
}

export interface CoinjoinTxInputs {
    path?: string;
    outpoint: string;
    amount: number;
    hash: string;
    index: number;
    commitmentData: string;
    address: string;
    scriptPubKey: string;
    ownershipProof: string;
}

export interface CoinjoinTxOutputs {
    path?: string;
    address: string;
    scriptPubKey: string;
    amount: number;
}

export interface CoinjoinTransactionData {
    inputs: CoinjoinTxInputs[];
    outputs: CoinjoinTxOutputs[];
    affiliateRequest: CoinjoinAffiliateRequest;
}

export interface BroadcastedTransactionDetails extends CoinjoinTransactionData {
    txid: string;
    hash: string;
    hex: string;
    size: number;
    vsize: number;
}

export interface CoinjoinTransactionLiquidityClue {
    accountKey: string;
    rawLiquidityClue: RawLiquidityClue;
}

export interface CoinjoinRequestOwnershipEvent {
    type: 'ownership';
    roundId: string;
    inputs: SerializedAlice[];
    commitmentData: string;
}

export interface CoinjoinRequestSignatureEvent {
    type: 'signature';
    roundId: string;
    inputs: SerializedAlice[];
    transaction: CoinjoinTransactionData;
    liquidityClues: CoinjoinTransactionLiquidityClue[];
}

export type CoinjoinRequestEvent = CoinjoinRequestOwnershipEvent | CoinjoinRequestSignatureEvent;

export interface CoinjoinResponseOwnership {
    outpoint: string;
    ownershipProof: string;
}

export interface CoinjoinResponseWitness {
    outpoint: string;
    signature: string;
    index: number;
}

export interface CoinjoinResponseWithError {
    outpoint: string;
    error: string;
}

export interface CoinjoinResponseOwnershipEvent {
    type: 'ownership';
    roundId: string;
    inputs: (CoinjoinResponseOwnership | CoinjoinResponseWithError)[];
}

export interface CoinjoinResponseSignatureEvent {
    type: 'signature';
    roundId: string;
    inputs: (CoinjoinResponseWitness | CoinjoinResponseWithError)[];
}

export type CoinjoinResponseEvent = CoinjoinResponseOwnershipEvent | CoinjoinResponseSignatureEvent;
