import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type CryptoBaseCurrencyPair,
    type RatesByTimestamps,
    type TickerId,
    type TickerResult,
    type Timestamp,
    type TokenAddress,
    type WalletAccountTransaction,
    asCryptoBaseCurrencyCode,
    asTimestamp,
} from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { typedObjectKeys } from '@trezor/utils';

const ONE_HOUR_IN_SECONDS = 60 * 60;

export const getFiatRateKey = (
    symbol: NetworkSymbol,
    baseCurrencyCode: BaseCurrencyCode,
    tokenAddress?: TokenAddress,
): CryptoBaseCurrencyPair => {
    if (tokenAddress) {
        return asCryptoBaseCurrencyCode(`${symbol}-${tokenAddress}-${baseCurrencyCode}`);
    }

    return asCryptoBaseCurrencyCode(`${symbol}-${baseCurrencyCode}`);
};

export const getFiatRateKeyFromTicker = (
    ticker: TickerId,
    fiatCurrency: BaseCurrencyCode,
): CryptoBaseCurrencyPair => {
    const { symbol, tokenAddress } = ticker;

    return getFiatRateKey(symbol, fiatCurrency, tokenAddress);
};

export const roundTimestampToNearestPastHour = (timestamp: Timestamp): Timestamp =>
    asTimestamp(Math.floor(timestamp / ONE_HOUR_IN_SECONDS) * ONE_HOUR_IN_SECONDS);

export const roundTimestampsToNearestPastHour = (timestamps: Timestamp[]): Timestamp[] =>
    timestamps.map(timestamp => roundTimestampToNearestPastHour(timestamp));

const combineFiatRates = (fiatRates: RatesByTimestamps, accountRates: RatesByTimestamps) => {
    for (const fiatRateKey of typedObjectKeys(accountRates)) {
        if (Object.prototype.hasOwnProperty.call(accountRates, fiatRateKey)) {
            const accountRate = accountRates[fiatRateKey];
            if (!accountRate) continue;

            const existingRate = fiatRates[fiatRateKey];
            if (!existingRate) {
                fiatRates[fiatRateKey] = accountRate;
            } else {
                for (const timestamp of typedObjectKeys(accountRate)) {
                    if (
                        Object.prototype.hasOwnProperty.call(accountRate, timestamp) &&
                        !existingRate[timestamp]
                    ) {
                        const value = accountRate[timestamp];
                        if (value !== undefined) {
                            existingRate[timestamp] = value;
                        }
                    }
                }
            }
        }
    }
};

export const buildHistoricRatesFromStorage = (storageHistoricRates: RatesByTimestamps[]) => {
    const historicFiatRates: RatesByTimestamps = {};

    storageHistoricRates.forEach(fiatRates => {
        for (const fiatRateKey of typedObjectKeys(fiatRates)) {
            if (Object.prototype.hasOwnProperty.call(fiatRates, fiatRateKey)) {
                const rate = fiatRates[fiatRateKey];
                if (!rate) continue;

                const existingRate = historicFiatRates[fiatRateKey];
                if (!existingRate) {
                    historicFiatRates[fiatRateKey] = rate;
                } else {
                    combineFiatRates(existingRate, rate);
                }
            }
        }
    });

    return historicFiatRates;
};

export const selectHistoricRatesByTransactions = (
    historicRates: RatesByTimestamps,
    txs: WalletAccountTransaction[],
) => {
    const selectedRates: RatesByTimestamps = {};

    txs.forEach(tx => {
        const { symbol, blockTime, tokens } = tx;
        const timestamp = roundTimestampToNearestPastHour(asTimestamp(blockTime ?? 0));

        typedObjectKeys(historicRates).forEach(fiatRateKey => {
            if (
                fiatRateKey.startsWith(symbol) ||
                tokens.some(token => fiatRateKey.startsWith(`[${symbol}-${token.contract}]`))
            ) {
                const ratesByTimestamp = historicRates[fiatRateKey];
                const rateValue = ratesByTimestamp?.[timestamp];
                if (rateValue) {
                    if (!selectedRates[fiatRateKey]) {
                        selectedRates[fiatRateKey] = {};
                    }
                    selectedRates[fiatRateKey][timestamp] = rateValue;
                }
            }
        });
    });

    return selectedRates;
};

export const fetchTransactionsRates = async (
    tickerId: TickerId,
    timestamps: Timestamp[],
    localCurrency: BaseCurrencyCode,
    isElectrumBackend: boolean,
    rates: TickerResult[],
) => {
    const roundedTimestamps = roundTimestampsToNearestPastHour(timestamps);
    const uniqueTimestamps = [...new Set(roundedTimestamps)];

    try {
        const results = await getFiatRatesForTimestamps(
            tickerId,
            uniqueTimestamps,
            localCurrency,
            isElectrumBackend,
        );
        if (results && 'tickers' in results) {
            // This is super anti-pattern, we should never push to an array that is passed as an argument
            rates.push({
                tickerId,
                localCurrency,
                rates: results.tickers.flatMap((ticker, index) => {
                    const lastTickerTimestamp = uniqueTimestamps[index];
                    if (lastTickerTimestamp === undefined) return [];

                    return {
                        rate: ticker?.rates[localCurrency],
                        lastTickerTimestamp,
                    };
                }),
            });
        }
    } catch (error) {
        console.error(error);
    }
};
