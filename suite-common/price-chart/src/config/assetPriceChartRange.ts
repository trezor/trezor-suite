export enum AssetPriceChartRange {
    Day = '1d',
    Week = '1w',
    Month = '1m',
    HalfYear = '6m',
    Year = '1y',
    All = 'all',
}

export const INITIAL_ASSET_PRICE_CHART_RANGE = AssetPriceChartRange.Week;

export type AssetPriceChartRangeOption = {
    range: AssetPriceChartRange;
    label: string;
    coinGeckoDays: number | 'max';
};

export const assetPriceChartRangeOptionsByRange = {
    [AssetPriceChartRange.Day]: { range: AssetPriceChartRange.Day, label: '1D', coinGeckoDays: 1 },
    [AssetPriceChartRange.Week]: {
        range: AssetPriceChartRange.Week,
        label: '1W',
        coinGeckoDays: 7,
    },
    [AssetPriceChartRange.Month]: {
        range: AssetPriceChartRange.Month,
        label: '1M',
        coinGeckoDays: 30,
    },
    [AssetPriceChartRange.HalfYear]: {
        range: AssetPriceChartRange.HalfYear,
        label: '6M',
        coinGeckoDays: 180,
    },
    [AssetPriceChartRange.Year]: {
        range: AssetPriceChartRange.Year,
        label: '1Y',
        coinGeckoDays: 365,
    },
    [AssetPriceChartRange.All]: {
        range: AssetPriceChartRange.All,
        label: 'All',
        coinGeckoDays: 'max',
    },
} as const satisfies Record<AssetPriceChartRange, AssetPriceChartRangeOption>;

export const assetPriceChartRangeOptions = Object.values(assetPriceChartRangeOptionsByRange);
