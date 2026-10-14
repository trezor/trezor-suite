export type NetworkAssetSymbolDefinition = {
    symbol: string;
    coin: string;
    network: string;
};

export type NetworkAssetsDefinition = {
    family: string;
    extraSymbols: readonly string[];
    symbols: readonly NetworkAssetSymbolDefinition[];
};
