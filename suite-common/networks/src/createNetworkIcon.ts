import type { HasNetworkIcon, NetworkIcon } from '@trezor/network-assets-types';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';

export type NetworkIconDeps = NetworkModuleRepositoryDep;

export type NetworkIconDep = { networkIcon: NetworkIcon };

export type HasNetworkIconDep = { hasNetworkIcon: HasNetworkIcon };

export const createNetworkIcon = (deps: NetworkIconDeps): NetworkIcon => ({
    getCryptoIcon: symbol => {
        if (!deps.networkModuleRepository.isSupportedNetwork(symbol)) return undefined;

        return deps.networkModuleRepository.get(symbol).icon.getIcons(symbol).coin;
    },
    hasCryptoIcon: deps.networkModuleRepository.isSupportedNetwork,
    hasNetworkIcon: deps.networkModuleRepository.isSupportedNetwork,
    getNetworkIcon: symbol =>
        deps.networkModuleRepository.get(symbol).icon.getIcons(symbol).network,
    getTokenLogoIdentifiers: (symbol, contract) => {
        if (!contract) return [];
        if (!deps.networkModuleRepository.isSupportedNetwork(symbol)) return [contract];

        const networkModule = deps.networkModuleRepository.get(symbol);

        return networkModule.icon.getTokenLogoIdentifiers?.(symbol, contract) ?? [contract];
    },
});

export const injectNetworkIcon = (services: { networks: NetworkIconDep }): NetworkIconDep => ({
    networkIcon: services.networks.networkIcon,
});

export const injectHasNetworkIcon = (services: {
    networks: NetworkIconDep;
}): HasNetworkIconDep => ({
    hasNetworkIcon: services.networks.networkIcon.hasNetworkIcon,
});
