import { useMemo, useState } from 'react';

import { type CryptoId } from 'invity-api';

import { normalizeForSearch } from '@suite-common/suite-utils';
import { cryptoIdToSymbol } from '@suite-common/trading';
import { type NetworkSymbol, getNetworkByCoingeckoId } from '@suite-common/wallet-config';
import { type TradeableAsset } from '@suite-native/trading-types';

type AssetSearchFields = {
    name: string;
    symbol: string;
    networkName: string;
    networkSymbol: string;
    contractAddress: string;
};

const getAssetSearchFields = (asset: TradeableAsset): AssetSearchFields => {
    const network = getNetworkByCoingeckoId(asset.networkId);

    return {
        name: normalizeForSearch(asset.name),
        symbol: normalizeForSearch(asset.symbol),
        networkName: network ? normalizeForSearch(network.name) : '',
        networkSymbol: network ? normalizeForSearch(network.symbol) : '',
        contractAddress: asset.contractAddress ? normalizeForSearch(asset.contractAddress) : '',
    };
};

const doesAssetMatchQuery = (searchFields: AssetSearchFields, query: string): boolean =>
    searchFields.name.includes(query) ||
    searchFields.symbol.includes(query) ||
    searchFields.networkName.includes(query) ||
    searchFields.networkSymbol.includes(query) ||
    searchFields.contractAddress.includes(query);

const getAssetWeight = (searchFields: AssetSearchFields, query: string): number => {
    const { name, symbol, networkName, networkSymbol, contractAddress } = searchFields;

    if (name === query) {
        return 0;
    }
    if (symbol === query) {
        return 1;
    }
    if (name.startsWith(query)) {
        return 2;
    }
    if (symbol.startsWith(query)) {
        return 3;
    }
    if (name.includes(query)) {
        return 4;
    }
    if (symbol.includes(query)) {
        return 5;
    }
    if (networkName === query) {
        return 6;
    }
    if (networkSymbol === query) {
        return 7;
    }
    if (networkName.startsWith(query)) {
        return 8;
    }
    if (networkSymbol.startsWith(query)) {
        return 9;
    }
    if (networkName.includes(query)) {
        return 10;
    }
    if (networkSymbol.includes(query)) {
        return 11;
    }
    if (contractAddress.startsWith(query)) {
        return 12;
    }

    return 13;
};

export const useTradeableAssetsFilteredData = ({ assets }: { assets: TradeableAsset[] }) => {
    const [filterSymbol, setFilterSymbol] = useState<NetworkSymbol | undefined>(undefined);
    const [filterValue, setFilterValue] = useState('');

    const searchFieldsByAsset = useMemo(
        () => new Map(assets.map(asset => [asset, getAssetSearchFields(asset)])),
        [assets],
    );

    const assetsFilteredByNetwork = useMemo(() => {
        if (!filterSymbol) {
            return assets;
        }

        return assets.filter(a => filterSymbol === cryptoIdToSymbol(a.cryptoId));
    }, [assets, filterSymbol]);

    const filteredData = useMemo(() => {
        const query = normalizeForSearch(filterValue);
        if (!query) {
            return assetsFilteredByNetwork;
        }

        const matchingAssets: TradeableAsset[] = [];
        const weightByAsset = new Map<CryptoId, number>();

        assetsFilteredByNetwork.forEach(asset => {
            const searchFields = searchFieldsByAsset.get(asset);
            if (searchFields && doesAssetMatchQuery(searchFields, query)) {
                matchingAssets.push(asset);
                weightByAsset.set(asset.cryptoId, getAssetWeight(searchFields, query));
            }
        });

        return matchingAssets.sort((a, b) => {
            const weightA = weightByAsset.get(a.cryptoId) ?? 0;
            const weightB = weightByAsset.get(b.cryptoId) ?? 0;
            if (weightA !== weightB) {
                return weightA - weightB;
            }

            return a.name.localeCompare(b.name);
        });
    }, [assetsFilteredByNetwork, searchFieldsByAsset, filterValue]);

    const filterValueWithNetwork = `Network:${filterSymbol ? filterSymbol : 'all'};Search:${filterValue}`;

    return { setFilterSymbol, setFilterValue, filteredData, filterValue: filterValueWithNetwork };
};
