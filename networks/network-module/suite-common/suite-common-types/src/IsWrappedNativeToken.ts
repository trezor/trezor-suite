/** Detects whether a token contract represents the network's wrapped native currency. */
export type IsWrappedNativeToken<TNetworkSymbol extends string> = (
    symbol: TNetworkSymbol,
    contract?: string | null,
) => boolean;
