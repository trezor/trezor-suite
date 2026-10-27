/**
 * An input or output belonging to the analyzed account. The address is an opaque identifier here:
 * upstream derives a dummy key from it, but nothing in the result depends on how it parses.
 */
export type AnalyzeInternalVinVout = {
    Address: string;
    Value: number;
};

/**
 * An input or output belonging to somebody else. External inputs carry a value in the request shape
 * but upstream never reads it, so only their count matters.
 */
export type AnalyzeExternalVinVout = {
    ScriptPubKey: string;
    Value: number;
};

export type AnalyzeTransactionDetails = {
    InternalInputs: AnalyzeInternalVinVout[];
    InternalOutputs: AnalyzeInternalVinVout[];
    ExternalInputs: AnalyzeExternalVinVout[];
    ExternalOutputs: AnalyzeExternalVinVout[];
};

export type AnalyzeResult = {
    Results: {
        Address: string;
        AnonymitySet: number;
    }[];
};

/**
 * The liquidity clue as it is persisted in account state: an amount in satoshi, or `null` while no
 * coinjoin has been observed yet.
 */
export type RawLiquidityClue = number | null;
