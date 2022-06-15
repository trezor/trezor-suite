import {
    AllowedScriptTypes,
    RegistrationData,
    ConfirmationData,
    RealCredentials,
} from './coordinator';
import { Credentials } from './middleware';

export interface AccountUtxo {
    outpoint: string;
    path: string;
    txid: string;
    vout: number;
    amount: number;
    confirmations?: number;
    blockHeight?: number;
}

export interface AccountAddress {
    path: string;
    address: string;
    transfers?: number;
}

export type AllowedNetworks = 'btc' | 'test' | 'regtest';

export interface Account {
    type: AllowedScriptTypes;
    symbol: AllowedNetworks;
    descriptor: string;
    utxos: AccountUtxo[];
    addresses: AccountAddress[];
    anonymityLevel: number;
    maxRounds: number;
    maxFeePerKvbyte: number;
    maxCoordinatorFeeRate: number;
}

// export interface RoundUtxo extends AccountUtxo {
export interface RegisteredAccountUtxo {
    path: string;
    outpoint: string;
    amount: number;
    requested?: 'ownership' | 'witness';
    ownershipProof?: string; // data from inputRegistration phase, received as response to the reqeuest, provided by wallet (suite)
    registrationData?: RegistrationData; // data from inputRegistration phase
    realAmountCredentials?: RealCredentials; // data from inputRegistration phase
    realVsizeCredentials?: RealCredentials; // data from inputRegistration phase
    confirmationData?: ConfirmationData;
    confirmedAmountCredentials?: Credentials[];
    confirmedVsizeCredentials?: Credentials[];
    witness?: string;
    witnessIndex?: number;
    error?: Error;
}

export interface RegisteredAccountAddress extends AccountAddress {
    scriptPubKey: string;
}

export interface RegisteredAccount extends Omit<Account, 'utxos' | 'addresses'> {
    utxos: RegisteredAccountUtxo[];
    addresses: RegisteredAccountAddress[];
    completedRounds: number;
}
