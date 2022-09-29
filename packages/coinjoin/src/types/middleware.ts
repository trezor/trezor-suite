import { AllowedScriptTypes } from './coordinator';

export interface Credentials {
    value: number;
    randomness: string;
    mac: {
        t: string;
    };
}

export type SelectUtxo = {
    outpoint: string;
    amount: number;
    scriptType: AllowedScriptTypes;
    anonymitySet: number;
};

interface AnalyzeTransactionVin {
    publicKey: string;
    value: number;
}

interface AnalyzeTransactionVout extends AnalyzeTransactionVin {
    scriptPubKey: string;
}

export interface AnalyzeTransaction {
    internalInputs: AnalyzeTransactionVin[];
    internalOutputs: AnalyzeTransactionVout[];
    externalInputs: AnalyzeTransactionVin[]; // unnecessary?
    externalOutputs: AnalyzeTransactionVout[]; // value not needed?
}

export interface AnalyzeResult {
    results: {
        pubKey: string;
        anonymitySet: number;
    }[];
}
