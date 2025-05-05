import { useMemo, useState } from 'react';

import { cryptoIdToSymbol } from '@suite-common/trading';
import { NetworkSymbol, getNetworkByCoingeckoId } from '@suite-common/wallet-config';

import { useListDataFilter } from './useListDataFilter';
import { TradeableAsset } from '../types';

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
    );

    const filterValueWithNetwork = `Network:${filterSymbol ? filterSymbol : 'all'};Search:${filterValue}`;

    return { setFilterSymbol, setFilterValue, filteredData, filterValue: filterValueWithNetwork };
};
