export interface Credentials {
    value: number;
    randomness: string;
    mac: {
        t: string;
    };
}

export type UtxoForRound = {
    outpoint: string;
    amount: number;
    scriptPubKey: string;
    anonymitySet: number;
};

export interface AnalyzeInternalVinVout {
    address: string;
    value: number;
}

export interface AnalyzeExternalVinVout {
    scriptPubKey: string;
    value: number;
}

export interface AnalyzeTransactionDetails {
    internalInputs: AnalyzeInternalVinVout[];
    internalOutputs: AnalyzeInternalVinVout[];
    externalInputs: AnalyzeExternalVinVout[];
    externalOutputs: AnalyzeExternalVinVout[];
}

export interface AnalyzeResult {
    results: {
        address: string;
        anonymitySet: number;
    }[];
}

export type RawLiquidityClue = number | null;
