import { AssetType } from './assetsSelectors';

export const calculateAssetsPercentage = (assetsData: AssetType[]) => {
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
