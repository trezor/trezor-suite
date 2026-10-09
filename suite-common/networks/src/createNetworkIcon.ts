import type { NetworkIcon } from '@trezor/network-assets-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';

export type NetworkIconDeps = NetworkModuleRepositoryDep;
export type NetworkIconDep = { networkIcon: NetworkIcon };
export type HasNetworkIconDep = { hasNetworkIcon: NetworkIcon['hasNetworkIcon'] };

export const createNetworkIcon = (deps: NetworkIconDeps): NetworkIcon => {
    const resolveSymbol = (symbol: string): NetworkSymbol | undefined => {
        if (deps.networkModuleRepository.isSupportedNetwork(symbol)) {
            return symbol;
        }

        return deps.networkModuleRepository.getSupportedNetworks().find(networkSymbol => {
            const config = deps.networkModuleRepository
                .get(networkSymbol)
                .getNetworkConfig(networkSymbol);

            return config.displaySymbol.toLowerCase() === symbol;
        });
    };

    const getIcon: NetworkIcon['getIcon'] = symbol =>
        deps.networkModuleRepository.get(symbol).icon.getIcon(symbol);
    const getCryptoIcon: NetworkIcon['getCryptoIcon'] = symbol => {
        const networkSymbol = resolveSymbol(symbol);
        if (!networkSymbol) return undefined;

        const src = getIcon(networkSymbol).coin;

        return typeof src === 'string' ? src : undefined;
    };
    const hasNetworkIcon: NetworkIcon['hasNetworkIcon'] = (symbol): symbol is NetworkSymbol =>
        deps.networkModuleRepository.isSupportedNetwork(symbol);

    return {
        getIcon,
        getIconPaths: symbol => deps.networkModuleRepository.get(symbol).icon.getIconPaths(symbol),
        getCryptoIcon,
        hasCryptoIcon: symbol => resolveSymbol(symbol) !== undefined,
        hasNetworkIcon,
        getNetworkIcon: symbol => {
            if (!hasNetworkIcon(symbol)) return undefined;

            const src = getIcon(symbol).network;

            return typeof src === 'string' ? src : undefined;
        },
        isTestnetNetworkIcon: symbol => getIcon(symbol).testnet,
        isWrappedNativeToken: (symbol, contract) => {
            const networkSymbol = resolveSymbol(symbol);

            return (
                !!networkSymbol &&
                !!contract &&
                !!deps.networkModuleRepository
                    .get(networkSymbol)
                    .icon.isWrappedNativeToken(networkSymbol, contract)
            );
        },
        getTokenLogoIdentifiers: (symbol, contract) => {
            if (!contract) return [];
            const networkSymbol = resolveSymbol(symbol);

            return networkSymbol
                ? deps.networkModuleRepository
                      .get(networkSymbol)
                      .icon.getTokenLogoIdentifiers(networkSymbol, contract)
                : [contract];
        },
    };
};

export const injectNetworkIcon = (services: { networks: NetworkIconDep }): NetworkIconDep => ({
    networkIcon: services.networks.networkIcon,
});

export const injectHasNetworkIcon = (services: {
    networks: NetworkIconDep;
}): HasNetworkIconDep => ({
    hasNetworkIcon: services.networks.networkIcon.hasNetworkIcon,
});
