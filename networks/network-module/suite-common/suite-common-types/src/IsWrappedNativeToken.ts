/** Detects whether a token contract represents the network's wrapped native currency. */
export type IsWrappedNativeToken<TSymbol extends string> = (
    symbol: TSymbol,
    contract?: string | null,
) => boolean;
