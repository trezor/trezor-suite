/** URL emitted by web bundlers or an asset reference registered by Metro. */
export type NetworkIconSource = string | number;

export type NetworkIcons = {
    coin: NetworkIconSource;
    network: NetworkIconSource;
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
export type NetworkAssetsModule<TNetworkSymbol extends string = string> = {
    /** Bundled icon sources for rendering, loaded only when requested. */
    getIcons(symbol: TNetworkSymbol): NetworkIcons;
    /** Original SVG file paths for Node tools, without loading the SVG modules. */
    getIconPaths(symbol: TNetworkSymbol): NetworkIconPaths;
    /** Family-specific logo keys; the shared lookup defaults to the original contract. */
    getTokenLogoIdentifiers?(
        symbol: TNetworkSymbol,
        contract: string,
    ): readonly string[] | Promise<readonly string[]>;
};
