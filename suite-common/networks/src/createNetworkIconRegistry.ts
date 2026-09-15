import type { NetworkIconSource } from '@trezor/network-assets';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';

export type NetworkIconRegistryDeps = NetworkModuleRepositoryDep;

export type NetworkBadgeData = { src: NetworkIconSource; testnet: boolean };

export type NetworkIconData = {
    symbol: string;
    name: string;
    displaySymbol: string;
    color: `#${string}`;
    src: NetworkIconSource;
    nativeSrc: NetworkIconSource;
    badge: NetworkBadgeData;
    supportsTokens: boolean;
};

export type TokenIconData = {
    src?: NetworkIconSource;
    coingeckoId?: string;
    contractAddresses?: readonly string[];
    badge?: NetworkBadgeData;
};

export type GetTokenIconParams = {
    symbol: string;
    contractAddress?: string | null;
    showNetworkIcon?: boolean;
    wrappedTokenIcon?: 'token' | 'network';
};

export type NetworkIconRegistry = {
    getNetworkIcon(symbol: string): NetworkIconData | undefined;
    getTokenIcon(params: GetTokenIconParams): TokenIconData | Promise<TokenIconData> | undefined;
};

export type NetworkIconRegistryDep = { networkIconRegistry: NetworkIconRegistry };

export const createNetworkIconRegistry = (deps: NetworkIconRegistryDeps): NetworkIconRegistry => {
    const networks = new Map<string, NetworkIconData>();
    for (const symbol of deps.networkModuleRepository.getSupportedNetworks()) {
        const module = deps.networkModuleRepository.get(symbol);
        const config = module.getNetworkConfig(symbol);
        const icons = module.icon.getIcons(symbol);
        const nativeSymbol = config.settlementLayer ?? symbol;
        const nativeIcons = deps.networkModuleRepository.isSupportedNetwork(nativeSymbol)
            ? deps.networkModuleRepository.get(nativeSymbol).icon.getIcons(nativeSymbol)
            : undefined;
        networks.set(symbol, {
            symbol,
            name: config.name,
            displaySymbol: config.displaySymbol,
            color: config.color,
            src: icons.coin,
            nativeSrc: nativeIcons?.coin ?? icons.coin,
            badge: { src: icons.network, testnet: config.testnet },
            supportsTokens: config.features.includes('tokens'),
        });
    }

    return {
        getNetworkIcon: symbol => networks.get(symbol),
        getTokenIcon: ({ symbol, contractAddress, showNetworkIcon, wrappedTokenIcon }) => {
            if (!deps.networkModuleRepository.isSupportedNetwork(symbol)) return undefined;
            const module = deps.networkModuleRepository.get(symbol);
            const network = networks.get(symbol);
            if (!network) return undefined;
            const config = module.getNetworkConfig(symbol);
            const useNativeIcon =
                wrappedTokenIcon === 'network' &&
                !!contractAddress &&
                !!module.icon.isWrappedNativeToken?.(symbol, contractAddress);
            if (!contractAddress || useNativeIcon) {
                return {
                    src: showNetworkIcon ? network.nativeSrc : network.src,
                    ...(showNetworkIcon &&
                    (config.settlementLayer || wrappedTokenIcon === 'network')
                        ? { badge: network.badge }
                        : {}),
                };
            }
            const { coingeckoId } = config;
            if (!coingeckoId) return { src: network.src };

            const resolve = (addresses: readonly string[]): TokenIconData => {
                const native =
                    addresses.length === 0 ||
                    addresses.includes('0x0000000000000000000000000000000000000000');
                const nativeSymbol = config.displaySymbol.toLowerCase();
                const nativeConfig = deps.networkModuleRepository.isSupportedNetwork(nativeSymbol)
                    ? deps.networkModuleRepository.get(nativeSymbol).getNetworkConfig(nativeSymbol)
                    : undefined;

                return {
                    coingeckoId: native
                        ? (nativeConfig?.tradeCryptoId ?? coingeckoId)
                        : coingeckoId,
                    contractAddresses: addresses,
                    ...(showNetworkIcon ? { badge: network.badge } : {}),
                };
            };
            const addresses = module.icon.getTokenLogoIdentifiers(symbol, contractAddress);

            return addresses instanceof Promise ? addresses.then(resolve) : resolve(addresses);
        },
    };
};

export const selectNetworkIconRegistry = (
    services: NetworkIconRegistryDep,
): NetworkIconRegistryDep => ({
    networkIconRegistry: services.networkIconRegistry,
});
