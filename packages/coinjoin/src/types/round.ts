import { AccountAddress } from './account';
import { RoundPhase, CoinjoinAffiliateRequest } from './coordinator';

export interface SerializedAlice {
    accountKey: string;
    path: string;
    outpoint: string;
}

export interface SerializedCoinjoinRound {
    id: string;
    phase: RoundPhase;
    inputs: SerializedAlice[]; // list of registered inputs
    failed: SerializedAlice[]; // list of failed inputs
    addresses: AccountAddress[]; // list of addresses (outputs) used in this round in outputRegistration phase
    phaseDeadline: number; // deadline is inaccurate, phase may change earlier
    roundDeadline: number; // deadline is inaccurate,round may end earlier
}

export interface CoinjoinRoundEvent {
    round: SerializedCoinjoinRound;
}

interface CoinjoinTxInputs {
    path?: string;
    outpoint: string;
    amount: number;
    hash: string;
    index: number;
    commitmentData: string;
    scriptPubKey: string;
    ownershipProof: string;
}

interface CoinjoinTxOutputs {
    path?: string;
    address: string;
    amount: number;
}

export interface CoinjoinTransactionData {
    inputs: CoinjoinTxInputs[];
    outputs: CoinjoinTxOutputs[];
    affiliateRequest: CoinjoinAffiliateRequest;
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
