import type { NetworkAssetsModule, NetworkIcon } from '@trezor/network-assets-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type NetworkIconDeps<TSymbol extends string> = {
    supportedNetworks: readonly TSymbol[];
    assets: Pick<NetworkAssetsModule<TSymbol>, 'getIcons' | 'getIconPaths'>;
    isWrappedNativeToken?: (symbol: TSymbol, contract: string) => boolean;
    getTokenLogoIdentifiers?: (
        symbol: TSymbol,
        contract: string,
    ) => readonly string[] | Promise<readonly string[]>;
};

export const createNetworkIcon = <TSymbol extends string>(
    deps: NetworkIconDeps<TSymbol>,
): NetworkIcon => {
    const resolveSymbol = (symbol: string): TSymbol | undefined =>
        deps.supportedNetworks.find(networkSymbol => networkSymbol === symbol);

    const getIcon: NetworkIcon['getIcon'] = symbol => {
        const networkSymbol = resolveSymbol(symbol);
        if (!networkSymbol) {
            throw new Error(`Unsupported network symbol: ${symbol}.`);
        }

        return deps.assets.getIcons(networkSymbol);
    };

    const hasNetworkIcon: NetworkIcon['hasNetworkIcon'] = (symbol): symbol is NetworkSymbol =>
        resolveSymbol(symbol) !== undefined;

    return {
        getIcon,
        getIconPaths: symbol => {
            const networkSymbol = resolveSymbol(symbol);
            if (!networkSymbol) {
                throw new Error(`Unsupported network symbol: ${symbol}.`);
            }

            return deps.assets.getIconPaths(networkSymbol);
        },
        getCryptoIcon: symbol => {
            const networkSymbol = resolveSymbol(symbol);
            const src = networkSymbol ? deps.assets.getIcons(networkSymbol).coin : undefined;

            return typeof src === 'string' ? src : undefined;
        },
        getNetworkIcon: symbol => {
            if (!hasNetworkIcon(symbol)) return undefined;
            const src = getIcon(symbol).network;

            return typeof src === 'string' ? src : undefined;
        },
        hasCryptoIcon: symbol => resolveSymbol(symbol) !== undefined,
        hasNetworkIcon,
        isTestnetNetworkIcon: symbol => getIcon(symbol).testnet,
        isWrappedNativeToken: (symbol, contract) => {
            const networkSymbol = resolveSymbol(symbol);

            return (
                !!networkSymbol &&
                !!contract &&
                (deps.isWrappedNativeToken?.(networkSymbol, contract) ?? false)
            );
        },
        getTokenLogoIdentifiers: (symbol, contract) => {
            if (!contract) return [];
            const networkSymbol = resolveSymbol(symbol);

            return networkSymbol && deps.getTokenLogoIdentifiers
                ? deps.getTokenLogoIdentifiers(networkSymbol, contract)
                : [contract];
        },
    };
};
