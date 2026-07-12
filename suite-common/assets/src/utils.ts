import { type BaseCurrencyAmount } from '@suite-common/wallet-types';

export interface AssetFiatBalance {
    fiatBalance: BaseCurrencyAmount | null;
    symbol: string;
}

export interface AssetFiatBalanceWithPercentage extends AssetFiatBalance {
    fiatPercentage: number;
    fiatPercentageOffset: number;
}

export const calculateAssetsPercentage = <T>(
    assetsData: Array<AssetFiatBalance & T>,
): Array<AssetFiatBalanceWithPercentage & T> => {
    const fiatTotal = assetsData.reduce((sum, next) => {
        const value = Number(next.fiatBalance);

        return sum + (Number.isNaN(value) ? 0 : value);
    }, 0);
    let previousPercentage = 0;

    return assetsData.map(asset => {
        const fiatBalance = Number(asset.fiatBalance);
        if (fiatTotal === 0 || Number.isNaN(fiatBalance) || fiatBalance === 0) {
            return { ...asset, fiatPercentage: 0, fiatPercentageOffset: 0 };
        }

        const fiatPercentage = (100 / fiatTotal) * fiatBalance;

        const assetWithPercentage = {
            ...asset,
            fiatPercentage,
            fiatPercentageOffset: previousPercentage,
        };
        previousPercentage += fiatPercentage;

        return assetWithPercentage;
    });
};
