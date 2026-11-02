import type {
    GetCryptoIconDep,
    GetNetworkIconDep,
    GetTokenLogoIdentifiersDep,
    HasNetworkIconDep,
    NetworkIconModule,
} from '@trezor/network-assets-types';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';

export type NetworkIconDeps = NetworkModuleRepositoryDep;

export type NetworkIconDep = { networkIcon: NetworkIconModule };

export const createNetworkIcon = (deps: NetworkIconDeps): NetworkIconModule => ({
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

export const injectGetCryptoIcon = (services: { networks: NetworkIconDep }): GetCryptoIconDep => ({
    getCryptoIcon: services.networks.networkIcon.getCryptoIcon,
});

export const injectGetNetworkIcon = (services: {
    networks: NetworkIconDep;
}): GetNetworkIconDep => ({
    getNetworkIcon: services.networks.networkIcon.getNetworkIcon,
});

export const injectGetTokenLogoIdentifiers = (services: {
    networks: NetworkIconDep;
}): GetTokenLogoIdentifiersDep => ({
    getTokenLogoIdentifiers: services.networks.networkIcon.getTokenLogoIdentifiers,
});

export const injectHasNetworkIcon = (services: {
    networks: NetworkIconDep;
}): HasNetworkIconDep => ({
    hasNetworkIcon: services.networks.networkIcon.hasNetworkIcon,
});
