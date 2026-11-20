import { type UseQueryResult, commonQueryKeys, useQuery } from '@suite-common/react-query';

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
    commonQueryKeys.assetPriceHistory(ticker.symbol, ticker.tokenAddress, fiatCurrency, range);

export const useAssetPriceHistoryQuery = ({
    ticker,
    fiatCurrency,
    range,
}: FetchAssetPriceHistoryParams): UseQueryResult<AssetPricePoint[] | null> =>
    useQuery({
        queryKey: getAssetPriceHistoryQueryKey({ ticker, fiatCurrency, range }),
        queryFn: ({ signal }) => fetchAssetPriceHistory({ ticker, fiatCurrency, range }, signal),
        staleTime: ASSET_PRICE_HISTORY_STALE_TIME_MS,
    });
