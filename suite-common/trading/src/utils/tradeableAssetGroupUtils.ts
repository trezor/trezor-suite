import { type BaseCurrencyAmount } from '@suite-common/wallet-types';

export type TradeableAssetGroups<TAsset> = {
    assets: TAsset[];
    lowBalanceAssets: TAsset[];
    nonTradeableAssets: TAsset[];
};

export const groupTradeableAssetsByTradability = <TAsset>({
    assets,
    threshold,
    getFiatBalance,
    getIsTradeable,
}: {
    assets: readonly TAsset[];
    threshold: BaseCurrencyAmount | null;
    getFiatBalance: (asset: TAsset) => BaseCurrencyAmount | null;
    getIsTradeable: (asset: TAsset) => boolean;
}): TradeableAssetGroups<TAsset> => {
    const regularAssets: TAsset[] = [];
    const lowBalanceAssets: TAsset[] = [];
    const nonTradeableAssets: TAsset[] = [];

    assets.forEach(asset => {
        if (!getIsTradeable(asset)) {
            nonTradeableAssets.push(asset);

            return;
        }

        const fiatBalance = getFiatBalance(asset);

        if (fiatBalance !== null && threshold !== null && fiatBalance.lt(threshold)) {
            lowBalanceAssets.push(asset);

            return;
        }

        regularAssets.push(asset);
    });

    return { assets: regularAssets, lowBalanceAssets, nonTradeableAssets };
};
