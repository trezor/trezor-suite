import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';

import { type RankedTokenStructure } from './tokenDefinitionsTypes';

export type NetworkAsset = {
    networkSymbol: NetworkSymbol;
    symbol: string;
    name: string;
    contract?: string;
};

type BuildNetworkAssetCatalogParams = {
    networks: readonly Network[];
    definitions: RankedTokenStructure;
};

export const buildNetworkAssetCatalog = ({
    networks,
    definitions,
}: BuildNetworkAssetCatalogParams): NetworkAsset[] => {
    const mainnets = networks.filter(network => !network.testnet);
    const assets: NetworkAsset[] = mainnets.map(network => ({
        networkSymbol: network.symbol,
        symbol: network.displaySymbol,
        name: network.name,
    }));
    const networksByPlatform = new Map(
        mainnets
            .filter(network => network.coingeckoId && network.features.includes('tokens'))
            .map(network => [network.coingeckoId, network]),
    );
    const includedContracts = new Set<string>();

    // Filtering retains the published rank; duplicate identities keep their highest-ranked entry.
    definitions.forEach(token => {
        const network = networksByPlatform.get(token.assetPlatformId);
        if (!network) {
            return;
        }

        const contract =
            network.networkType === 'ethereum' ? token.address.toLowerCase() : token.address;
        const key = `${network.symbol}:${contract}`;
        if (includedContracts.has(key)) {
            return;
        }

        includedContracts.add(key);
        assets.push({
            networkSymbol: network.symbol,
            symbol: token.symbol.toUpperCase(),
            name: token.name,
            contract: token.address,
        });
    });

    return assets;
};
