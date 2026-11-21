import {
    type CustomEvmNetworkDefinition,
    getCustomEvmNetworkSymbol,
} from '@suite-common/wallet-types';
import { EVM_NATIVE_CURRENCY_DECIMALS } from '@trezor/network-ethereum-suite-common';

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

export type BuildViemChainCatalogueParams = {
    excludedChainIds: Iterable<number>;
    includeTestnets: boolean;
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

type IsSupportedChainParams = {
    chain: ViemChain;
    excludedChainIds: ReadonlySet<number>;
    includeTestnets: boolean;
};

const isSupportedChain = ({ chain, excludedChainIds, includeTestnets }: IsSupportedChainParams) =>
    chain.nativeCurrency.decimals === EVM_NATIVE_CURRENCY_DECIMALS &&
    chain.rpcUrls.default.http.length > 0 &&
    !excludedChainIds.has(chain.id) &&
    (includeTestnets || !chain.testnet);

const mapChainToDefinition = (chain: ViemChain): CustomEvmNetworkDefinition => ({
    symbol: getCustomEvmNetworkSymbol(chain.id),
    chainId: chain.id,
    name: chain.name,
    displaySymbol: chain.nativeCurrency.symbol,
    currencyName: chain.nativeCurrency.name,
    rpcUrls: [...chain.rpcUrls.default.http],
    explorerUrl: chain.blockExplorers?.default?.url ?? '',
    testnet: !!chain.testnet,
});

/** Order in which the picker lists the networks. */
export const compareCustomEvmNetworks = (
    first: CustomEvmNetworkDefinition,
    second: CustomEvmNetworkDefinition,
) => first.name.localeCompare(second.name);

export const buildViemChainCatalogue = (
    chains: readonly ViemChain[],
    { excludedChainIds, includeTestnets }: BuildViemChainCatalogueParams,
): CustomEvmNetworkDefinition[] => {
    const excludedChainIdSet = new Set(excludedChainIds);
    // Viem exports deprecated aliases of the same chain, so the first accepted entry wins.
    const acceptedChainIds = new Set<number>();
    const definitions: CustomEvmNetworkDefinition[] = [];

    chains.forEach(chain => {
        if (
            acceptedChainIds.has(chain.id) ||
            !isSupportedChain({ chain, excludedChainIds: excludedChainIdSet, includeTestnets })
        ) {
            return;
        }

        acceptedChainIds.add(chain.id);
        definitions.push(mapChainToDefinition(chain));
    });

    return definitions.sort(compareCustomEvmNetworks);
};
