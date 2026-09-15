import type { NetworkAssetsModule, NetworkIcons } from './NetworkAssetsModule';

export type NetworkAssetsRegistryDeps = {
    networkAssetsModules: readonly NetworkAssetsModule[];
};

export type NetworkAssetsRegistry = {
    getSupportedNetworks(): readonly string[];
    getIcons(symbol: string): NetworkIcons | undefined;
};

export const createNetworkAssetsRegistry = (
    deps: NetworkAssetsRegistryDeps,
): NetworkAssetsRegistry => {
    // TODO: Use NetworkSymbol instead of string once
    // https://github.com/trezor/trezor-suite/pull/32093 is merged.
    const modules = new Map<string, NetworkAssetsModule>();

    for (const module of deps.networkAssetsModules) {
        for (const symbol of module.getSupportedNetworks()) {
            modules.set(symbol, module);
        }
    }

    return {
        getSupportedNetworks: () => Array.from(modules.keys()),
        getIcons: symbol => modules.get(symbol)?.getIcons(symbol),
    };
};
