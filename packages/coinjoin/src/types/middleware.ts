export interface Credentials {
    Value: number;
    Randomness: string;
    Mac: {
        t: string;
    };
}

export type UtxoForRound = {
    Outpoint: string;
    Amount: number;
    ScriptPubKey: string;
    AnonymitySet: number;
};

export interface AnalyzeInternalVinVout {
    Address: string;
    Value: number;
}

export interface AnalyzeExternalVinVout {
    ScriptPubKey: string;
    Value: number;
}

export interface AnalyzeTransactionDetails {
    InternalInputs: AnalyzeInternalVinVout[];
    InternalOutputs: AnalyzeInternalVinVout[];
    ExternalInputs: AnalyzeExternalVinVout[];
    ExternalOutputs: AnalyzeExternalVinVout[];
}

export interface AnalyzeResult {
    Results: {
        Address: string;
        AnonymitySet: number;
    }[];
}

export type RawLiquidityClue = number | null;
