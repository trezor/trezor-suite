/** URL emitted by web bundlers or an asset reference registered by Metro. */
export type NetworkIconSource = string | number;

export type NetworkIcons = {
    coin: NetworkIconSource;
    network: NetworkIconSource;
    testnet: boolean;
};

export type NetworkIconPaths = {
    coin: string;
    network: string;
};

/**
 * Keep literal require() calls so Metro can discover assets at build time.
 * Paths are repeated in require.resolve() for Node tools that need filesystem paths without
 * loading SVG modules. Both getters stay lazy so registering assets does not load the SVGs.
 */
export type NetworkIconAsset = {
    getIcons: () => NetworkIcons;
    getIconPaths: () => NetworkIconPaths;
};

/** @serviceContract */
export type NetworkAssetsModule<TSymbol extends string = string> = {
    getSupportedNetworks(): readonly TSymbol[];
    /** Bundled icon sources for rendering, loaded only when requested. */
    getIcons(symbol: TSymbol): NetworkIcons;
    /** Original SVG file paths for Node tools, without loading the SVG modules. */
    getIconPaths(symbol: TSymbol): NetworkIconPaths;
};
