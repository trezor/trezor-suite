import {
    RegisteredAccountUtxo,
    RegisteredAccountAddress,
    AccountUtxo,
    AccountAddress,
    AllowedNetworks,
} from './account';
import {
    Round,
    RoundPhase,
    AllowedScriptTypes,
    CoinjoinStateEvent,
    TxPaymentRequest,
} from './coordinator';
import { Credentials } from './middleware';

export type CoinjoinRound = {
    id: string;
};

export interface CoinjoinStatusEvent {
    rounds: CoinjoinRound[];
    changed: CoinjoinRound[];
    feeRatesMedians: any[];
}

export type CoinjoinClientEvent = {
    type: 'round-change';
    payload: ActiveRound;
};

export type RegisterAccountParams = {
    type: AllowedScriptTypes;
    symbol: AllowedNetworks;
    descriptor: string;
    utxos: AccountUtxo[];
    addresses: AccountAddress[];
    anonymityLevel: number;
    maxRounds: number;
    maxFeePerKvbyte: number;
    maxCoordinatorFeeRate: number;
};

// data sent as request to wallet (witness request)
// contains data required to sign transaction and provide witnesses in return

type TxInputs = {
    path?: string;
    outpoint: string;
    index: number;
    hash: string;
    amount: number;
    commitmentData: string;
    scriptPubKey: string;
    ownershipProof: string;
    witness?: string;
    witnessIndex?: number;
};

interface TxOutputs {
    path?: string;
    address: string;
    amount: number;
}

export interface TransactionData {
    inputs: TxInputs[];
    outputs: TxOutputs[];
    paymentRequest: TxPaymentRequest; // TODO
}

// wasabi Arena
export interface ActiveRound {
    id: string;
    phase: RoundPhase;
    accounts: Record<string, ActiveRoundAccount>; // key(string) = account.descriptor
    commitmentData: string; // commitment data used for ownership proof and witness requests
    amountCredentialIssuerParameters: Round['amountCredentialIssuerParameters'];
    vsizeCredentialIssuerParameters: Round['vsizeCredentialIssuerParameters'];
    roundParameters: Extract<CoinjoinStateEvent, { Type: 'RoundCreated' }>['roundParameters'] & {
        inputRegistrationEnd: string;
    };
    coinjoinState: Round['coinjoinState'];
    addresses?: RegisteredAccountAddress[]; // list of addresses (outputs) used in this round in outputRegistration phase
    transactionData?: TransactionData; // transaction to sign
}

export interface ActiveRoundOptions {
    signal: AbortSignal;
    coordinatorName: string;
    coordinatorUrl: string;
    middlewareUrl: string;
    log: (...args: any[]) => any;
}

export interface ActiveRoundAccount {
    type: AllowedScriptTypes;
    utxos: RegisteredAccountUtxo[]; // wasabi Alice
    addresses: RegisteredAccountAddress[]; // wasabi Bob
    // amounts: number[];
    // amountCredentials: Credentials[];
    // vsizeCredentials: Credentials[];
}

export interface DecomposedOutputs {
    outputSize: number;
    amounts: number[];
    addresses: RegisteredAccountAddress[];
    amountCredentials: Credentials[];
    vsizeCredentials: Credentials[];
}

export type RequestedAccount = {
    utxos: {
        path: string;
        outpoint: string;
        ownershipProof?: string;
        witness?: string;
        witnessIndex?: number;
        error?: string; // error from the wallet
    }[];
    addresses: RegisteredAccountAddress[];
};

export type RequestEvent =
    | {
          type: 'ownership';
          round: string;
          accounts: Record<string, RequestedAccount>;
          commitmentData: string;
      }
    | {
          type: 'witness';
          round: string;
          accounts: Record<string, RequestedAccount>;
          transaction: TransactionData;
      };
