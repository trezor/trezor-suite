import { AccountAddress } from './account';
import { CoinjoinAffiliateRequest } from './coordinator';
import { RawLiquidityClue } from './middleware';
import { RoundPhase, EndRoundState } from '../enums';

export interface SerializedAlice {
    accountKey: string;
    path: string;
    outpoint: string;
    error?: string;
}

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
