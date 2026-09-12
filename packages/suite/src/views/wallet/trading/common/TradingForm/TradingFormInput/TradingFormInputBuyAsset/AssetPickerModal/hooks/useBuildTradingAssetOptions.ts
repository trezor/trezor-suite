import { useMemo } from 'react';

import { selectSupportedNetworkSymbols } from '@suite-common/networks';
import {
    type TradeableAssetBalance,
    type TradeableAssetSearchFields,
    type TradingAssetOption,
    buildTradeableAssetSearchIndex,
    filterTradeableAssetsBySearch,
    orderTradeableAssetsByOwnership,
    usePreferredCurrencyUsdThreshold,
    useTradingAssets,
} from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { useSelector } from 'src/hooks/suite';
import { selectTradeableAssetBalances } from 'src/selectors/wallet/tradeableAssetBalancesSelectors';

import { useAssetsContext } from '../../../TradingFormInputAssetPicker';

export type TradingAssetListItem = {
    asset: TradingAssetOption;
    balance: TradeableAssetBalance | undefined;
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
    const { includedCryptoIds, excludedCryptoIds } = useAssetsContext();
    const { buildAssetOptions } = useTradingAssets();
    const balances = useSelector(selectTradeableAssetBalances);
    const supportedNetworks = useSelector(selectSupportedNetworkSymbols);
    const preferredCurrencyUsdThreshold = usePreferredCurrencyUsdThreshold();

    const includedAssets = useMemo(() => {
        const { assets } = buildAssetOptions({ includedCryptoIds });

        return assets.filter(asset => !excludedCryptoIds.has(asset.id));
    }, [buildAssetOptions, includedCryptoIds, excludedCryptoIds]);

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

        return supportedNetworks.filter(symbol => networksInList.has(symbol));
    }, [includedAssets, supportedNetworks]);

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
        }));
    }, [orderedAssets, networkSymbol, searchIndex, search, balances]);

    return { listItems, networks };
}
