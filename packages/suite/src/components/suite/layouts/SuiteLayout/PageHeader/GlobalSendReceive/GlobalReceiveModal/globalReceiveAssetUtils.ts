import {
    type TradeableAssetBalance,
    type TradeableAssetBalances,
    type TradeableAssetSearchFields,
    type TradeableAssetSearchIndex,
    type TradingAssetOption,
    buildTradeableAssetSearchIndex,
    filterTradeableAssetsBySearch,
    orderTradeableAssetsByOwnership,
} from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';

export type GlobalReceiveAssetListItem = {
    asset: TradingAssetOption;
    balance: TradeableAssetBalance | undefined;
};

export type GlobalReceiveAssetSections = {
    assetsWithBalance: GlobalReceiveAssetListItem[];
    allAssets: GlobalReceiveAssetListItem[];
};

export const getGlobalReceiveAssetDescriptionValues = (
    asset: TradingAssetOption,
): { assetName: string; networkName?: string } => {
    const assetName = asset.displaySymbolName ?? asset.name;

    return asset.isNativeToken ? { assetName } : { assetName, networkName: asset.networkName };
};

type GetGlobalReceiveAssetSectionsParams = {
    assets: readonly TradingAssetOption[];
    balances: TradeableAssetBalances;
    search: string;
    searchIndex?: TradeableAssetSearchIndex<TradingAssetOption>;
    networkSymbol: NetworkSymbol | undefined;
};

const getAssetSearchFields = (asset: TradingAssetOption): TradeableAssetSearchFields => ({
    name: asset.displaySymbolName ?? asset.name,
    symbol: asset.displaySymbol,
    networkName: asset.networkName,
    networkSymbol: asset.networkSymbol,
    contractAddress: asset.contractAddress ?? '',
});

export const buildGlobalReceiveAssetSearchIndex = (assets: readonly TradingAssetOption[]) =>
    buildTradeableAssetSearchIndex({ assets, getSearchFields: getAssetSearchFields });

const compareHeldAssets = (
    balances: TradeableAssetBalances,
    assetA: TradingAssetOption,
    assetB: TradingAssetOption,
): number => {
    const fiatAmountA = balances.get(assetA.id)?.fiatAmount ?? null;
    const fiatAmountB = balances.get(assetB.id)?.fiatAmount ?? null;

    if (fiatAmountA === null && fiatAmountB === null) {
        return 0;
    }

    if (fiatAmountA === null) {
        return 1;
    }

    if (fiatAmountB === null) {
        return -1;
    }

    return fiatAmountB.comparedTo(fiatAmountA) ?? 0;
};

export const getGlobalReceiveAssetSections = ({
    assets,
    balances,
    search,
    searchIndex = buildGlobalReceiveAssetSearchIndex(assets),
    networkSymbol,
}: GetGlobalReceiveAssetSectionsParams): GlobalReceiveAssetSections => {
    const orderedAssets = orderTradeableAssetsByOwnership({
        assets,
        balances,
        threshold: null,
        getAssetCryptoId: asset => asset.id,
    });
    const assetsFilteredByNetwork = networkSymbol
        ? orderedAssets.filter(asset => asset.networkSymbol === networkSymbol)
        : orderedAssets;
    const filteredAssets = filterTradeableAssetsBySearch({
        assets: assetsFilteredByNetwork,
        searchIndex,
        search,
    });

    const heldAssets: TradingAssetOption[] = [];
    const remainingAssets: TradingAssetOption[] = [];

    filteredAssets.forEach(asset => {
        if (balances.has(asset.id)) {
            heldAssets.push(asset);
        } else {
            remainingAssets.push(asset);
        }
    });

    const assetsWithBalance = heldAssets
        .toSorted((assetA, assetB) => compareHeldAssets(balances, assetA, assetB))
        .map(asset => ({ asset, balance: balances.get(asset.id) }));
    const allAssets = remainingAssets.map(asset => ({
        asset,
        balance: balances.get(asset.id),
    }));

    return { assetsWithBalance, allAssets };
};
