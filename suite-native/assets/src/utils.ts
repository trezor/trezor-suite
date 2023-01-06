import { AssetType } from './assetsSelectors';

export const calculateAssetsPercentage = (assetsData: AssetType[]) => {
    const fiatTotal = assetsData.reduce((sum, next) => sum + Number(next.fiatBalance), 0);
    let previousPercentage = 0;

    return assetsData.map(asset => {
        if (fiatTotal === 0) {
            return { ...asset, fiatPercentage: 0, fiatPercentageOffset: 0 };
        }

        const fiatPercentage = Number.isNaN(asset.fiatBalance)
            ? 0
            : (100 / fiatTotal) * Number(asset.fiatBalance);

        const assetWithPercentage = {
            ...asset,
            fiatPercentage,
            fiatPercentageOffset: previousPercentage,
        };
        previousPercentage += fiatPercentage;
        return assetWithPercentage;
    });
};
