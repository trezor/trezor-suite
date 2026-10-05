import type { NetworkAssetsModule, NetworkIcons } from '@trezor/network-assets-types';
import { type NetworkSymbol } from '@trezor/network-module-types';
import type { ProductComponentsIconServices } from '@trezor/product-components';

import type { ExplorerNetworkConfig } from '../config/networks';

export type ConnectExplorerNetworkIconDeps = {
    networkConfig: readonly ExplorerNetworkConfig[];
};

export type ConnectExplorerNetworkIcon = ProductComponentsIconServices;

export const createConnectExplorerNetworkIcon = (
    deps: ConnectExplorerNetworkIconDeps,
): ConnectExplorerNetworkIcon => {
    const networkAssetsBySymbol = new Map<string, NetworkAssetsModule>();

    deps.networkConfig.forEach(network => {
        network.icons.getSupportedNetworks().forEach(symbol => {
            networkAssetsBySymbol.set(symbol, network.icons);
        });
    });

    const getIcon = (symbol: NetworkSymbol): NetworkIcons => {
        const assets = networkAssetsBySymbol.get(symbol);
        if (!assets) {
            throw new Error(`Missing Explorer network config: ${symbol}.`);
        }

        return assets.getIcons(symbol);
    };

    return {
        getCryptoIcon: symbol => {
            const assets = networkAssetsBySymbol.get(symbol);
            const src = assets?.getIcons(symbol).coin;

            return typeof src === 'string' ? src : undefined;
        },
        getNetworkIcon: symbol => {
            const assets = networkAssetsBySymbol.get(symbol);
            const src = assets?.getIcons(symbol).network;

            return typeof src === 'string' ? src : undefined;
        },
        hasCryptoIcon: symbol => networkAssetsBySymbol.has(symbol),
        hasNetworkIcon: (symbol): symbol is NetworkSymbol => networkAssetsBySymbol.has(symbol),
        isTestnetNetworkIcon: symbol => getIcon(symbol).testnet,
        isWrappedNativeToken: () => false,
        getTokenLogoIdentifiers: (_symbol, contract) => (contract ? [contract] : []),
    };
};
