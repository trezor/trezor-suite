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

const getAssetSearchFields = (asset: TradeableAsset): TradeableAssetSearchFields => {
    const network = getNetworkByCoingeckoId(asset.networkId);

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
    const [filterSymbol, setFilterSymbol] = useState<NetworkSymbol | undefined>(undefined);
    const [filterValue, setFilterValue] = useState('');

    const searchIndex = useMemo(
        () => buildTradeableAssetSearchIndex({ assets, getSearchFields: getAssetSearchFields }),
        [assets],
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
            asset => filterSymbol === cryptoIdToNetworkSymbol(asset.cryptoId),
        );
    }, [filterSymbol, orderedAssets]);

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
