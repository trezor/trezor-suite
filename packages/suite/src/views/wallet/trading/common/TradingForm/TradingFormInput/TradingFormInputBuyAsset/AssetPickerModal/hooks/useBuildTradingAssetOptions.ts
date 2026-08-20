import { useMemo } from 'react';

import {
    type TradeableAssetBalance,
    type TradeableAssetSearchFields,
    type TradingAssetOption,
    buildTradeableAssetSearchIndex,
    filterTradeableAssetsBySearch,
    orderTradeableAssetsByOwnership,
    usePreferredCurrencyUsdThreshold,
} from '@suite-common/trading';
import { type NetworkSymbol, networkSymbolCollection } from '@suite-common/wallet-config';

import { ASSET_ROW_HEIGHT } from 'src/components/suite/asset-picker/constants';
import { useSelector } from 'src/hooks/suite';
import { selectTradeableAssetBalances } from 'src/selectors/wallet/tradeableAssetBalancesSelectors';

import { useAssetsContext } from '../../AssetOptionsContext';

export type TradingAssetListItem = {
    asset: TradingAssetOption;
    balance: TradeableAssetBalance | undefined;
    height: number;
};

const getAssetCryptoId = (asset: TradingAssetOption) => asset.id;

const getAssetSearchFields = (asset: TradingAssetOption): TradeableAssetSearchFields => ({
    name: asset.displaySymbolName ?? asset.name,
    symbol: asset.displaySymbol,
    networkName: asset.networkName,
    networkSymbol: asset.networkSymbol,
    contractAddress: asset.contractAddress ?? '',
});

export interface UseBuildTradingAssetOptionsProps {
    search: string;
    networkSymbol: NetworkSymbol | undefined;
}

export function useBuildTradingAssetOptions({
    search,
    networkSymbol,
}: UseBuildTradingAssetOptionsProps) {
    const { assets, excludedCryptoIds } = useAssetsContext();
    const balances = useSelector(selectTradeableAssetBalances);
    const preferredCurrencyUsdThreshold = usePreferredCurrencyUsdThreshold();

    const includedAssets = useMemo(
        () => assets.filter(asset => !excludedCryptoIds.has(asset.id)),
        [assets, excludedCryptoIds],
    );

    const searchIndex = useMemo(
        () =>
            buildTradeableAssetSearchIndex({
                assets: includedAssets,
                getSearchFields: getAssetSearchFields,
            }),
        [includedAssets],
    );

    const orderedAssets = useMemo(
        () =>
            orderTradeableAssetsByOwnership({
                assets: includedAssets,
                balances,
                threshold: preferredCurrencyUsdThreshold,
                getAssetCryptoId,
            }),
        [includedAssets, balances, preferredCurrencyUsdThreshold],
    );

    const networks = useMemo(() => {
        const networksInList = new Set(includedAssets.map(asset => asset.networkSymbol));

        return networkSymbolCollection.filter(symbol => networksInList.has(symbol));
    }, [includedAssets]);

    const listItems = useMemo(() => {
        const assetsFilteredByNetwork = networkSymbol
            ? orderedAssets.filter(asset => asset.networkSymbol === networkSymbol)
            : orderedAssets;

        return filterTradeableAssetsBySearch({
            assets: assetsFilteredByNetwork,
            searchIndex,
            search,
        }).map((asset): TradingAssetListItem => ({
            asset,
            balance: balances.get(asset.id),
            height: ASSET_ROW_HEIGHT,
        }));
    }, [orderedAssets, networkSymbol, searchIndex, search, balances]);

    return { listItems, networks };
}
