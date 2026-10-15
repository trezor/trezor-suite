import type { NetworkAssetsModule, NetworkIconModule } from '@trezor/network-assets-types';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

import type { ExplorerNetworkConfig } from '../config/networks';

export type ConnectExplorerNetworkIconDeps = {
    networkConfig: readonly ExplorerNetworkConfig[];
};

export const createConnectExplorerNetworkIcon = (
    deps: ConnectExplorerNetworkIconDeps,
): NetworkIconModule => {
    const networkAssetsBySymbol = new Map<NetworkSymbol, NetworkAssetsModule>();

    deps.networkConfig.forEach(network => {
        networkAssetsBySymbol.set(network.symbol, network.icons);
    });

    return {
        getCryptoIcon: symbol => {
            const assets = networkAssetsBySymbol.get(symbol);

            return assets?.getIcons(symbol).coin;
        },
        getNetworkIcon: symbol => {
            const assets = networkAssetsBySymbol.get(symbol);

            if (!assets) {
                throw new Error(`Network assets for ${symbol} are not configured.`);
            }

            return assets.getIcons(symbol).network;
        },
        hasCryptoIcon: symbol => networkAssetsBySymbol.has(asNetworkSymbol(symbol)),
        hasNetworkIcon: (symbol): symbol is NetworkSymbol =>
            networkAssetsBySymbol.has(asNetworkSymbol(symbol)),
        getTokenLogoIdentifiers: (_symbol, contract) => (contract ? [contract] : []),
    };
};
