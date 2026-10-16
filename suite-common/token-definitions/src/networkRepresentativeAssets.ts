import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';

import { type RankedTokenStructure } from './tokenDefinitionsTypes';

export type RepresentativeAsset = {
    symbol: string;
    contract?: string;
};

export const MAX_REPRESENTATIVE_ASSETS = 5;

type BuildNetworkRepresentativeAssetsParams = {
    networks: readonly Network[];
    definitions: RankedTokenStructure;
};

export const buildNetworkRepresentativeAssets = ({
    networks,
    definitions,
}: BuildNetworkRepresentativeAssetsParams): Map<NetworkSymbol, RepresentativeAsset[]> => {
    const assetsByNetwork = new Map<NetworkSymbol, RepresentativeAsset[]>();
    const networksByPlatform = new Map<string, Network>();

    networks.forEach(network => {
        if (network.testnet) {
            return;
        }

        assetsByNetwork.set(network.symbol, [{ symbol: network.displaySymbol }]);
        if (network.coingeckoId && network.features.includes('tokens')) {
            networksByPlatform.set(network.coingeckoId, network);
        }
    });

    // The catalogue is already ranked; filtering retains market-cap order within each network.
    definitions.forEach(token => {
        const network = networksByPlatform.get(token.assetPlatformId);
        if (!network) {
            return;
        }

        const assets = assetsByNetwork.get(network.symbol);
        if (!assets || assets.length >= MAX_REPRESENTATIVE_ASSETS) {
            return;
        }

        const isDuplicate = assets.some(asset =>
            network.networkType === 'ethereum'
                ? asset.contract?.toLowerCase() === token.address.toLowerCase()
                : asset.contract === token.address,
        );
        if (isDuplicate) {
            return;
        }

        assets.push({ symbol: token.symbol.toUpperCase(), contract: token.address });
    });

    return assetsByNetwork;
};
