export type NetworkParams<TSymbol extends string = string> = {
    networks: readonly TSymbol[];
    networkNamesMap: Record<TSymbol, string> | null;
    isToken?: boolean;
};
