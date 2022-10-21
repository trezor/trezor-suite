import { AllowedScriptTypes } from './coordinator';

export type RegisterAccountParams = {
    accountKey: string;
    scriptType: AllowedScriptTypes;
    utxos: AccountUtxo[];
    changeAddresses: Omit<AccountAddress, 'scriptPubKey'>[];
    targetAnonymity: number;
    maxFeePerKvbyte: number;
    maxCoordinatorFeeRate: number;
    maxRounds: number;
    skipRounds?: [number, number];
};

export interface AccountUtxo {
    path: string;
    outpoint: string;
    amount: number;
    anonymityLevel: number;
}

export interface AccountAddress {
    path: string;
    address: string;
    scriptPubKey: string;
}
