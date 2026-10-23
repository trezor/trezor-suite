import { fetchCoinGeckoMarketChart } from '@suite-common/fiat-services';
import type { TickerId } from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import {
    type AssetPriceChartRange,
    assetPriceChartRangeOptionsByRange,
} from '../config/assetPriceChartRange';

export type AssetPricePoint = {
    timestamp: number;
    price: number;
};

export type FetchAssetPriceHistoryParams = {
    ticker: TickerId;
    fiatCurrency: BaseCurrencyCode;
    range: AssetPriceChartRange;
};

export const fetchAssetPriceHistory = async ({
    ticker,
    fiatCurrency,
    range,
}: FetchAssetPriceHistoryParams): Promise<AssetPricePoint[] | null> => {
    const { coinGeckoDays: days } = assetPriceChartRangeOptionsByRange[range];
    const prices = await fetchCoinGeckoMarketChart({ ticker, fiatCurrency, days });

    if (prices === null) {
        return null;
    }

    return prices.map(([timestamp, price]) => ({ timestamp, price }));
};
