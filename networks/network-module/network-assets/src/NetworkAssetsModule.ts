/** URL emitted by web bundlers or an asset reference registered by Metro. */
export type NetworkIconSource = string | number;

export type NetworkIcons = { coin: NetworkIconSource; network: NetworkIconSource };

/** @serviceContract */
export type NetworkAssetsModule<TSymbol extends string = string> = {
    getSupportedNetworks(): readonly TSymbol[];
    getIcons(symbol: TSymbol): NetworkIcons;
};
