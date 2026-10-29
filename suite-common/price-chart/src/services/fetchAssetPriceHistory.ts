import {
    fetchCoinGeckoMarketChart,
    fetchErc4626UnderlyingAsset,
} from '@suite-common/fiat-services';
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

const getPriceHistoryTicker = async (ticker: TickerId): Promise<TickerId> => {
    const isErc4626Vault = ticker.protocols?.includes('erc4626') ?? false;

    if (!isErc4626Vault || !ticker.tokenAddress) {
        return ticker;
    }

    const underlyingAsset = await fetchErc4626UnderlyingAsset({
        coin: ticker.symbol,
        contract: ticker.tokenAddress,
    });

    return { symbol: ticker.symbol, tokenAddress: underlyingAsset.contract };
};

export const fetchAssetPriceHistory = async (
    { ticker, fiatCurrency, range }: FetchAssetPriceHistoryParams,
    signal?: AbortSignal,
): Promise<AssetPricePoint[] | null> => {
    const { coinGeckoDays: days } = assetPriceChartRangeOptionsByRange[range];
    const priceHistoryTicker = await getPriceHistoryTicker(ticker);
    const prices = await fetchCoinGeckoMarketChart({
        ticker: priceHistoryTicker,
        fiatCurrency,
        days,
        signal,
    });

    if (prices === null) {
        return null;
    }

    return prices.map(([timestamp, price]) => ({ timestamp, price }));
};
