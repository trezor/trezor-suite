export type {
    AnalyzeExternalVinVout,
    AnalyzeInternalVinVout,
    AnalyzeResult,
    AnalyzeTransactionDetails,
    RawLiquidityClue,
} from '@trezor/coinjoin-analysis';

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
