import { AllowedScriptTypes } from './coordinator';
import { RawLiquidityClue } from './middleware';

export type RegisterAccountParams = {
    accountKey: string;
    scriptType: AllowedScriptTypes;
    utxos: Omit<AccountUtxo, 'scriptPubKey'>[];
    changeAddresses: Omit<AccountAddress, 'scriptPubKey'>[];
    targetAnonymity: number;
    rawLiquidityClue: RawLiquidityClue;
    maxFeePerKvbyte: number;
    maxCoordinatorFeeRate: number;
    maxRounds: number;
    skipRounds?: [number, number];
};

export interface AccountUtxo {
    path: string;
    outpoint: string;
    address: string;
    scriptPubKey: string;
    amount: number;
    anonymityLevel: number;
}

export interface AccountAddress {
    path: string;
    address: string;
    scriptPubKey: string;
}
