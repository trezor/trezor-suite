import {
    fetchCurrentFiatRates,
    fetchErc4626UnderlyingAsset,
    fetchLastWeekFiatRates,
    getFiatRatesForTimestamps,
} from '@suite-common/fiat-services';
import { type BackendType } from '@suite-common/wallet-config';
import {
    type CurrentFiatRatesResult,
    type FiatRatesResult,
    type TickerId,
    type Timestamp,
    asTimestamp,
} from '@suite-common/wallet-types';
import { roundTimestampsToNearestPastHour } from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

type FetchTickerFiatRateParams = {
    ticker: TickerId;
    baseCurrencyCode: BaseCurrencyCode;
    backendType: BackendType | undefined;
    skipCache: boolean;
};

const isErc4626Ticker = (ticker: TickerId, backendType: BackendType | undefined) =>
    ticker.protocols?.includes('erc4626') && (!backendType || backendType === 'blockbook');

const fetchErc4626UnderlyingTicker = async (ticker: TickerId) => {
    if (!ticker.tokenAddress) {
        throw new Error('Token address is missing from ERC4626 token');
    }

    const underlyingAsset = await fetchErc4626UnderlyingAsset({
        coin: ticker.symbol,
        contract: ticker.tokenAddress,
    });

    return {
        underlyingTicker: { symbol: ticker.symbol, tokenAddress: underlyingAsset.contract },
        toVaultRate: (rate: number) =>
            new BigNumber(rate).multipliedBy(underlyingAsset.exchangeRate).toNumber(),
    };
};

const toMilliseconds = <TRate extends FiatRatesResult>(rate: TRate): TRate => ({
    ...rate,
    lastTickerTimestamp: asTimestamp(rate.lastTickerTimestamp * 1000),
});

/**
 * Fetches the current rate of one ticker. Resolves with `null` when no provider knows the rate.
 * The `lastTickerTimestamp` of the result is in milliseconds.
 */
export const fetchCurrentTickerFiatRate = async ({
    ticker,
    baseCurrencyCode,
    backendType,
    skipCache,
}: FetchTickerFiatRateParams): Promise<CurrentFiatRatesResult | null> => {
    if (!isErc4626Ticker(ticker, backendType)) {
        const rate = await fetchCurrentFiatRates({
            ticker,
            localCurrency: baseCurrencyCode,
            backendType,
            skipCache,
        });

        return rate && toMilliseconds(rate);
    }

    const { underlyingTicker, toVaultRate } = await fetchErc4626UnderlyingTicker(ticker);
    const underlyingRate = await fetchCurrentFiatRates({
        ticker: underlyingTicker,
        localCurrency: baseCurrencyCode,
        backendType,
        skipCache,
    });

    if (!underlyingRate) {
        return null;
    }

    // The dollar rate is converted the same way, so the vault's current rate carries it too.
    return toMilliseconds({
        rate: toVaultRate(underlyingRate.rate),
        usdRate: toVaultRate(underlyingRate.usdRate),
        lastTickerTimestamp: underlyingRate.lastTickerTimestamp,
    });
};

/**
 * Fetches the rate of one ticker from a week ago. Resolves with `null` when no provider knows the
 * rate. The `lastTickerTimestamp` of the result is in milliseconds.
 */
export const fetchLastWeekTickerFiatRate = async ({
    ticker,
    baseCurrencyCode,
    backendType,
}: FetchTickerFiatRateParams): Promise<FiatRatesResult | null> => {
    if (!isErc4626Ticker(ticker, backendType)) {
        const rate = await fetchLastWeekFiatRates({
            ticker,
            localCurrency: baseCurrencyCode,
            backendType,
        });

        return rate && toMilliseconds(rate);
    }

    const { underlyingTicker, toVaultRate } = await fetchErc4626UnderlyingTicker(ticker);
    const underlyingRate = await fetchLastWeekFiatRates({
        ticker: underlyingTicker,
        localCurrency: baseCurrencyCode,
        backendType,
    });

    if (!underlyingRate?.rate) {
        return null;
    }

    return toMilliseconds({
        rate: toVaultRate(underlyingRate.rate),
        lastTickerTimestamp: underlyingRate.lastTickerTimestamp,
    });
};

type FetchTickerHistoricFiatRatesParams = {
    ticker: TickerId;
    baseCurrencyCode: BaseCurrencyCode;
    timestamps: Timestamp[];
    isElectrumBackend: boolean;
};

/**
 * Fetches rates of one ticker for the given timestamps, rounded to the nearest past hour. Resolves
 * with `null` when no provider answered.
 */
export const fetchTickerHistoricFiatRates = async ({
    ticker,
    baseCurrencyCode,
    timestamps,
    isElectrumBackend,
}: FetchTickerHistoricFiatRatesParams): Promise<Record<Timestamp, number> | null> => {
    const roundedTimestamps = [...new Set(roundTimestampsToNearestPastHour(timestamps))];

    const result = await getFiatRatesForTimestamps(
        ticker,
        roundedTimestamps,
        baseCurrencyCode,
        isElectrumBackend,
    );

    if (!result || !('tickers' in result)) {
        return null;
    }

    return result.tickers.reduce<Record<Timestamp, number>>(
        (ratesByTimestamp, tickerRates, index) => {
            const timestamp = roundedTimestamps[index];
            const rate = tickerRates?.rates[baseCurrencyCode];

            if (timestamp !== undefined && rate !== undefined) {
                ratesByTimestamp[timestamp] = rate;
            }

            return ratesByTimestamp;
        },
        {},
    );
};
