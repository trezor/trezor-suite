import { getCustomEvmNetworkSymbol } from '@suite-common/wallet-types';

import {
    type BuildChainCatalogueParams,
    type CustomNetworkCatalogueEntry,
    compareCatalogueEntries,
    getUnsupportedReason,
} from './customNetworkCatalogue';

/**
 * The subset of viem's `Chain` the catalogue reads, so the builder stays testable with plain objects.
 */
export type ViemChain = {
    id: number;
    name: string;
    testnet?: boolean;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: { default: { http: readonly string[] } };
    blockExplorers?: { default?: { url: string } };
};

const isViemChain = (value: unknown): value is ViemChain =>
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'number' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'nativeCurrency' in value &&
    typeof value.nativeCurrency === 'object' &&
    'rpcUrls' in value &&
    typeof value.rpcUrls === 'object';

export const loadViemChainCatalogue = async (): Promise<ViemChain[]> => {
    // The chain list is hundreds of kilobytes, so it must stay out of the main bundle.
    const viemChains = await import(/* webpackChunkName: "viem-chains" */ 'viem/chains');

    // The namespace also types its own members, so the entries are narrowed from unknown.
    const entries: unknown[] = Object.values(viemChains);

    return entries.filter(isViemChain);
};

type IsListedChainParams = {
    chain: ViemChain;
    excludedChainIds: ReadonlySet<number>;
    includeTestnets: boolean;
};

const isListedChain = ({ chain, excludedChainIds, includeTestnets }: IsListedChainParams) =>
    !excludedChainIds.has(chain.id) && (includeTestnets || !chain.testnet);

const mapChainToCatalogueEntry = (chain: ViemChain): CustomNetworkCatalogueEntry => ({
    definition: {
        symbol: getCustomEvmNetworkSymbol(chain.id),
        chainId: chain.id,
        name: chain.name,
        displaySymbol: chain.nativeCurrency.symbol,
        currencyName: chain.nativeCurrency.name,
        rpcUrls: [...chain.rpcUrls.default.http],
        explorerUrl: chain.blockExplorers?.default?.url ?? '',
        testnet: !!chain.testnet,
    },
    unsupportedReason: getUnsupportedReason({
        nativeCurrencyDecimals: chain.nativeCurrency.decimals,
        rpcUrlCount: chain.rpcUrls.default.http.length,
        hasExplorerUrl: !!chain.blockExplorers?.default?.url,
    }),
});

/** Viem chains to list, the ones the user can add first. */
export const buildViemChainCatalogue = (
    chains: readonly ViemChain[],
    { excludedChainIds, includeTestnets }: BuildChainCatalogueParams,
): CustomNetworkCatalogueEntry[] => {
    const excludedChainIdSet = new Set(excludedChainIds);
    // Viem exports deprecated aliases of the same chain, so the first listed entry wins.
    const listedChainIds = new Set<number>();
    const entries: CustomNetworkCatalogueEntry[] = [];

    chains.forEach(chain => {
        if (
            listedChainIds.has(chain.id) ||
            !isListedChain({ chain, excludedChainIds: excludedChainIdSet, includeTestnets })
        ) {
            return;
        }

        listedChainIds.add(chain.id);
        entries.push(mapChainToCatalogueEntry(chain));
    });

    return entries.sort(compareCatalogueEntries);
};
