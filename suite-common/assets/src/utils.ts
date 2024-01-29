export interface AssetFiatBalance {
    fiatBalance: string;
    symbol: string;
}
export interface AssetFiatBalanceWithPercentage extends AssetFiatBalance {
    fiatPercentage: number;
    fiatPercentageOffset: number;
}

export const calculateAssetsPercentage = <T>(
    assetsData: Array<AssetFiatBalance & T>,
): Array<AssetFiatBalanceWithPercentage & T> => {
    const fiatTotal = assetsData.reduce((sum, next) => sum + Number(next.fiatBalance), 0);
    let previousPercentage = 0;

    return assetsData.map(asset => {
        const fiatBalance = Number(asset.fiatBalance);
        if (fiatTotal === 0 || Number.isNaN(asset.fiatBalance) || fiatBalance === 0) {
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
