import { type BaseCurrencyAmount } from '@suite-common/wallet-types';

export type TradeableAssetGroups<TAsset> = {
    assets: TAsset[];
    lowBalanceAssets: TAsset[];
    nonTradableAssets: TAsset[];
};

export const groupTradeableAssetsByTradability = <TAsset>({
    assets,
    threshold,
    getFiatBalance,
    getIsTradable,
}: {
    assets: readonly TAsset[];
    threshold: BaseCurrencyAmount | null;
    getFiatBalance: (asset: TAsset) => BaseCurrencyAmount | null;
    getIsTradable: (asset: TAsset) => boolean;
}): TradeableAssetGroups<TAsset> => {
    const regularAssets: TAsset[] = [];
    const lowBalanceAssets: TAsset[] = [];
    const nonTradableAssets: TAsset[] = [];

    assets.forEach(asset => {
        if (!getIsTradable(asset)) {
            nonTradableAssets.push(asset);

            return;
        }

        const fiatBalance = getFiatBalance(asset);

        if (fiatBalance !== null && threshold !== null && fiatBalance.lt(threshold)) {
            lowBalanceAssets.push(asset);

            return;
        }

        regularAssets.push(asset);
    });

    return { assets: regularAssets, lowBalanceAssets, nonTradableAssets };
};
