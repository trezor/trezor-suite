import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';

import { type NetworkAsset, buildNetworkAssetCatalog } from './networkAssetCatalog';
import { type RankedTokenStructure } from './tokenDefinitionsTypes';

export type RepresentativeAsset = Pick<NetworkAsset, 'symbol' | 'contract'>;

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
    buildNetworkAssetCatalog({ networks, definitions }).forEach(
        ({ networkSymbol, symbol, contract }) => {
            const assets = assetsByNetwork.get(networkSymbol) ?? [];
            if (assets.length < MAX_REPRESENTATIVE_ASSETS) {
                assets.push(contract === undefined ? { symbol } : { symbol, contract });
                assetsByNetwork.set(networkSymbol, assets);
            }
        },
    );

    return assetsByNetwork;
};
