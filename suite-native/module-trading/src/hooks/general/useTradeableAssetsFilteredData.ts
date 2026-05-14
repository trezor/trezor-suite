import { useMemo, useState } from 'react';

import { normalizeForSearch } from '@suite-common/suite-utils';
import { cryptoIdToSymbol, useListDataFilter } from '@suite-common/trading';
import { type NetworkSymbol, getNetworkByCoingeckoId } from '@suite-common/wallet-config';
import { type TradeableAsset } from '@suite-native/trading-types';

const doesContractAddressIncludeValue = (asset: TradeableAsset, value: string) => {
    if (!asset.contractAddress) {
        return false;
    }

    return normalizeForSearch(asset.contractAddress).includes(value);
};

const doesSymbolIncludeValue = (asset: TradeableAsset, value: string) =>
    normalizeForSearch(asset.symbol).includes(value);

const doesNameIncludeValue = (asset: TradeableAsset, value: string) =>
    normalizeForSearch(asset.name).includes(value);

const doesNetworkNameIncludeValue = (asset: TradeableAsset, value: string) => {
    const network = getNetworkByCoingeckoId(asset.networkId);
    if (!network) {
        return false;
    }

    return normalizeForSearch(network.name).includes(value);
};

const doesNetworkSymbolIncludeValue = (asset: TradeableAsset, value: string) => {
    const network = getNetworkByCoingeckoId(asset.networkId);
    if (!network) {
        return false;
    }

    return normalizeForSearch(network.symbol).includes(value);
};

const filterCallback = (asset: TradeableAsset, filterValue: string): boolean => {
    const normalizedFilterValue = normalizeForSearch(filterValue);

    return (
        doesNameIncludeValue(asset, normalizedFilterValue) ||
        doesSymbolIncludeValue(asset, normalizedFilterValue) ||
        doesNetworkNameIncludeValue(asset, normalizedFilterValue) ||
        doesNetworkSymbolIncludeValue(asset, normalizedFilterValue) ||
        doesContractAddressIncludeValue(asset, normalizedFilterValue)
    );
};

const sortCallback = (a: TradeableAsset, b: TradeableAsset, filterValue: string): number => {
    const query = normalizeForSearch(filterValue);
    if (!query) {
        return 0;
    }

    const getWeight = (asset: TradeableAsset): number => {
        const name = normalizeForSearch(asset.name);
        const symbol = normalizeForSearch(asset.symbol);
        const network = getNetworkByCoingeckoId(asset.networkId);
        const networkName = normalizeForSearch(network?.name ?? '');
        const networkSymbol = normalizeForSearch(network?.symbol ?? '');
        const contractAddress = asset.contractAddress?.toLowerCase() ?? '';

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

    const weightA = getWeight(a);
    const weightB = getWeight(b);

    if (weightA !== weightB) {
        return weightA - weightB;
    }

    return a.name.localeCompare(b.name);
};

export const useTradeableAssetsFilteredData = ({ assets }: { assets: TradeableAsset[] }) => {
    const [filterSymbol, setFilterSymbol] = useState<NetworkSymbol | undefined>(undefined);

    const assetsFilteredByNetwork = useMemo(() => {
        if (!filterSymbol) {
            return assets;
        }

        return assets.filter(a => filterSymbol === cryptoIdToSymbol(a.cryptoId));
    }, [assets, filterSymbol]);

    const { setFilterValue, filteredData, filterValue } = useListDataFilter(
        assetsFilteredByNetwork,
        filterCallback,
        sortCallback,
    );

    const filterValueWithNetwork = `Network:${filterSymbol ? filterSymbol : 'all'};Search:${filterValue}`;

    return { setFilterSymbol, setFilterValue, filteredData, filterValue: filterValueWithNetwork };
};
