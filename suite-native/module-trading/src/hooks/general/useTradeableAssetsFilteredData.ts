import { type NetworkConfigDeps, selectNetworkConfigDeps } from '@suite-common/networks';
import { useServices } from '@suite-common/dependency-injection';
import { useMemo, useState } from 'react';

import {
    type TradeableAssetBalances,
    type TradeableAssetSearchFields,
    buildTradeableAssetSearchIndex,
    cryptoIdToNetworkSymbol,
    filterTradeableAssetsBySearch,
    orderTradeableAssetsByOwnership,
} from '@suite-common/trading';
import { type NetworkSymbol, getNetworkByCoingeckoId } from '@suite-common/wallet-config';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { type TradeableAsset } from '@suite-native/trading-types';

const EMPTY_ASSET_BALANCES: TradeableAssetBalances = new Map();

const getAssetCryptoId = (asset: TradeableAsset) => asset.cryptoId;

const getAssetSearchFields = (
    networkConfigDeps: NetworkConfigDeps,
    asset: TradeableAsset,
): TradeableAssetSearchFields => {
    const network = getNetworkByCoingeckoId(networkConfigDeps, asset.networkId);

    return {
        name: asset.name,
        symbol: asset.symbol,
        networkName: network ? network.name : '',
        networkSymbol: network ? network.symbol : '',
        contractAddress: asset.contractAddress ?? '',
    };
};

export const useTradeableAssetsFilteredData = ({
    assets,
    assetBalances = EMPTY_ASSET_BALANCES,
    preferredCurrencyUsdThreshold = null,
}: {
    assets: TradeableAsset[];
    assetBalances?: TradeableAssetBalances;
    preferredCurrencyUsdThreshold?: BaseCurrencyAmount | null;
}) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const [filterSymbol, setFilterSymbol] = useState<NetworkSymbol | undefined>(undefined);
    const [filterValue, setFilterValue] = useState('');

    const searchIndex = useMemo(
        () =>
            buildTradeableAssetSearchIndex({
                assets,
                getSearchFields: getAssetSearchFields.bind(null, networkConfigDeps),
            }),
        [networkConfigDeps, assets],
    );

    const orderedAssets = useMemo(
        () =>
            orderTradeableAssetsByOwnership({
                assets,
                balances: assetBalances,
                threshold: preferredCurrencyUsdThreshold,
                getAssetCryptoId,
            }),
        [assets, assetBalances, preferredCurrencyUsdThreshold],
    );

    const assetsFilteredByNetwork = useMemo(() => {
        if (!filterSymbol) {
            return orderedAssets;
        }

        return orderedAssets.filter(
            asset => filterSymbol === cryptoIdToNetworkSymbol(networkConfigDeps, asset.cryptoId),
        );
    }, [networkConfigDeps, filterSymbol, orderedAssets]);

    const filteredData = useMemo(
        () =>
            filterTradeableAssetsBySearch({
                assets: assetsFilteredByNetwork,
                searchIndex,
                search: filterValue,
            }),
        [assetsFilteredByNetwork, searchIndex, filterValue],
    );

    const filterValueWithNetwork = `Network:${filterSymbol ? filterSymbol : 'all'};Search:${filterValue}`;

    return {
        filterSymbol,
        setFilterSymbol,
        setFilterValue,
        filteredData,
        filterValue: filterValueWithNetwork,
    };
};
