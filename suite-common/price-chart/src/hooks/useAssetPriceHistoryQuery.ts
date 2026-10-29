import { type UseQueryResult, useQuery } from '@suite-common/react-query';

import {
    type AssetPricePoint,
    type FetchAssetPriceHistoryParams,
    fetchAssetPriceHistory,
} from '../services/fetchAssetPriceHistory';

const ASSET_PRICE_HISTORY_STALE_TIME_MS = 5 * 60 * 1000;

const getAssetPriceHistoryQueryKey = ({
    ticker,
    fiatCurrency,
    range,
}: FetchAssetPriceHistoryParams) =>
    [
        'asset-price-history',
        ticker.symbol,
        ticker.tokenAddress,
        ticker.protocols?.includes('erc4626') ?? false,
        fiatCurrency,
        range,
    ] as const;

const fetchAssetPriceHistoryOrNull = async (
    params: FetchAssetPriceHistoryParams,
    signal: AbortSignal,
): Promise<AssetPricePoint[] | null> => {
    try {
        return await fetchAssetPriceHistory(params, signal);
    } catch (error) {
        if (signal.aborted) throw error;

        console.error('Failed to fetch asset price history.');

        return null;
    }
};

export const useAssetPriceHistoryQuery = ({
    ticker,
    fiatCurrency,
    range,
}: FetchAssetPriceHistoryParams): UseQueryResult<AssetPricePoint[] | null> =>
    useQuery({
        queryKey: getAssetPriceHistoryQueryKey({ ticker, fiatCurrency, range }),
        queryFn: ({ signal }) =>
            fetchAssetPriceHistoryOrNull({ ticker, fiatCurrency, range }, signal),
        staleTime: ASSET_PRICE_HISTORY_STALE_TIME_MS,
    });
