import { useMemo, useState } from 'react';

import { normalizeForSearch } from '@suite-common/suite-utils';
import { cryptoIdToSymbol, useListDataFilter } from '@suite-common/trading';
import { type NetworkSymbol, getNetworkByCoingeckoId } from '@suite-common/wallet-config';
import { type TradeableAsset } from '@suite-native/trading-types';

const doesContractAddressIncludeValue = (asset: TradeableAsset, value: string) =>
    asset.contractAddress?.toLowerCase().includes(value.toLowerCase()) ?? false;

const doesSymbolIncludeValue = (asset: TradeableAsset, value: string) =>
    asset.symbol.toLowerCase().includes(value.toLowerCase());

const doesNameIncludeValue = (asset: TradeableAsset, value: string) =>
    asset.name.toLowerCase().includes(value.toLowerCase());

const doesNetworkNameIncludeValue = (asset: TradeableAsset, value: string) =>
    getNetworkByCoingeckoId(asset.networkId)?.name.toLowerCase().includes(value.toLowerCase()) ??
    false;

const doesNetworkSymbolIncludeValue = (asset: TradeableAsset, value: string) =>
    getNetworkByCoingeckoId(asset.networkId)?.symbol.toLowerCase().includes(value.toLowerCase()) ??
    false;

const filterCallback = (asset: TradeableAsset, filterValue: string): boolean =>
    doesNameIncludeValue(asset, filterValue) ||
    doesSymbolIncludeValue(asset, filterValue) ||
    doesNetworkNameIncludeValue(asset, filterValue) ||
    doesNetworkSymbolIncludeValue(asset, filterValue) ||
    doesContractAddressIncludeValue(asset, filterValue);

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
