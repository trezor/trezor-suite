import { type EvmNetwork, getChainIdFromCaip2 } from '@suite-common/evm-networks-api';
import { getCustomEvmNetworkSymbol } from '@suite-common/wallet-types';

import {
    type BuildChainCatalogueParams,
    type CustomNetworkCatalogueEntry,
    compareCatalogueEntries,
    getUnsupportedReason,
} from './customNetworkCatalogue';

const mapEvmNetworkToCatalogueEntry = (
    network: EvmNetwork,
    chainId: number,
): CustomNetworkCatalogueEntry => ({
    definition: {
        symbol: getCustomEvmNetworkSymbol(chainId),
        chainId,
        name: network.name,
        displaySymbol: network.nativeCurrency.symbol,
        currencyName: network.nativeCurrency.name,
        rpcUrls: [...network.rpcUrls],
        explorerUrl: network.explorerUrl ?? '',
        testnet: network.networkType === 'testnet',
        coingeckoId: network.coingeckoId,
        nativeAssetCryptoId: network.nativeAssetCryptoId,
        tradeCryptoId: network.tradeCryptoId,
    },
    iconUrl: network.iconUrl,
    mayClearSign: network.mayClearSign,
    simulationSupport: network.simulationSupport,
    unsupportedReason: getUnsupportedReason({
        nativeCurrencyDecimals: network.nativeCurrency.decimals,
        rpcUrlCount: network.rpcUrls.length,
    }),
});

/** Networks of the EVM networks service to list, the ones the user can add first. */
export const buildRemoteChainCatalogue = (
    networks: readonly EvmNetwork[],
    { excludedChainIds, includeTestnets }: BuildChainCatalogueParams,
): CustomNetworkCatalogueEntry[] => {
    const excludedChainIdSet = new Set(excludedChainIds);

    return networks
        .flatMap(network => {
            const chainId = getChainIdFromCaip2(network.caip2);
            const isListed =
                chainId !== undefined &&
                !excludedChainIdSet.has(chainId) &&
                (includeTestnets || network.networkType !== 'testnet');

            return isListed ? [mapEvmNetworkToCatalogueEntry(network, chainId)] : [];
        })
        .sort(compareCatalogueEntries);
};
