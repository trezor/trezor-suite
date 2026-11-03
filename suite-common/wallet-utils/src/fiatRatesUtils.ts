import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { type NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';
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
import { typedObjectKeys, unique } from '@trezor/utils';

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

export function getTickerFromFiatRateKey(fiatRateKey: CryptoBaseCurrencyPair): TickerId | null {
    const parts = fiatRateKey.split('-');
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const [symbol, tokenAddress]: [string, string] = parts;

    if (!isNetworkSymbol(symbol)) {
        console.error(`Failed to get ticker from fiat rate key: ${fiatRateKey}`);

        return null;
    }

    return {
        symbol,
        tokenAddress: tokenAddress as TokenAddress,
    };
}

export const roundTimestampToNearestPastHour = (timestamp: Timestamp): Timestamp =>
    asTimestamp(Math.floor(timestamp / ONE_HOUR_IN_SECONDS) * ONE_HOUR_IN_SECONDS);

export const roundTimestampsToNearestPastHour = (timestamps: Timestamp[]): Timestamp[] =>
    timestamps.map(timestamp => roundTimestampToNearestPastHour(timestamp));

const combineFiatRates = (fiatRates: RatesByTimestamps, accountRates: RatesByTimestamps) => {
    for (const fiatRateKey of typedObjectKeys(accountRates)) {
        if (Object.prototype.hasOwnProperty.call(accountRates, fiatRateKey)) {
            if (!fiatRates[fiatRateKey]) {
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                fiatRates[fiatRateKey] = accountRates[fiatRateKey];
            } else {
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const innerAccountRates: Record<Timestamp, number> = accountRates[fiatRateKey];
                const innerFiatRates: Record<Timestamp, number> = fiatRates[fiatRateKey];
                for (const timestamp of typedObjectKeys(innerAccountRates)) {
                    if (
                        Object.prototype.hasOwnProperty.call(innerAccountRates, timestamp) &&
                        !innerFiatRates[timestamp]
                    ) {
                        // @ts-expect-error: indexing with noUncheckedIndexedAccess
                        innerFiatRates[timestamp] = innerAccountRates[timestamp];
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
                if (!historicFiatRates[fiatRateKey]) {
                    // @ts-expect-error: indexing with noUncheckedIndexedAccess
                    historicFiatRates[fiatRateKey] = fiatRates[fiatRateKey];
                } else {
                    const target: Record<Timestamp, number> = historicFiatRates[fiatRateKey];
                    // @ts-expect-error: indexing with noUncheckedIndexedAccess
                    const source: Record<Timestamp, number> = fiatRates[fiatRateKey];
                    combineFiatRates(target, source);
                }
            }
        }
    });

    return historicFiatRates;
};

// A fiat rate key without its fiat currency, so that every fiat currency of the ticker matches.
const getFiatRateKeyPrefix = (symbol: NetworkSymbol, tokenAddress?: string) =>
    tokenAddress ? `${symbol}-${tokenAddress}-` : `${symbol}-`;

export const selectHistoricRatesByTransactions = (
    historicRates: RatesByTimestamps,
    txs: WalletAccountTransaction[],
) => {
    const selectedRates: RatesByTimestamps = {};
    const timestampsByFiatRateKeyPrefix = new Map<string, Set<Timestamp>>();

    txs.forEach(tx => {
        const { symbol, blockTime, tokens } = tx;
        const timestamp = roundTimestampToNearestPastHour(asTimestamp(blockTime ?? 0));
        const fiatRateKeyPrefixes = [
            getFiatRateKeyPrefix(symbol),
            ...tokens.map(token => getFiatRateKeyPrefix(symbol, token.contract)),
        ];

        fiatRateKeyPrefixes.forEach(fiatRateKeyPrefix => {
            let timestamps = timestampsByFiatRateKeyPrefix.get(fiatRateKeyPrefix);
            if (!timestamps) {
                timestamps = new Set();
                timestampsByFiatRateKeyPrefix.set(fiatRateKeyPrefix, timestamps);
            }
            timestamps.add(timestamp);
        });
    });

    typedObjectKeys(historicRates).forEach(fiatRateKey => {
        // Fiat currency codes contain no dash, token addresses can (Stellar `CODE-ISSUER`).
        const fiatRateKeyPrefix = fiatRateKey.slice(0, fiatRateKey.lastIndexOf('-') + 1);
        const timestamps = timestampsByFiatRateKeyPrefix.get(fiatRateKeyPrefix);
        if (!timestamps) return;

        const historicRatesForKey = historicRates[fiatRateKey];

        if (!historicRatesForKey) return;

        timestamps.forEach(timestamp => {
            if (historicRatesForKey[timestamp]) {
                if (!selectedRates[fiatRateKey]) {
                    selectedRates[fiatRateKey] = {};
                }
                const selectedRatesForKey = selectedRates[fiatRateKey];
                selectedRatesForKey[timestamp] = historicRatesForKey[timestamp];
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
    const uniqueTimestamps = unique(roundedTimestamps);

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
                // Providers drop the tickers they have no rate for, so pair by timestamp, not by index.
                rates: results.tickers.map(ticker => ({
                    rate: ticker.rates[localCurrency],
                    lastTickerTimestamp: asTimestamp(ticker.ts),
                })),
            });
        }
    } catch (error) {
        console.error(error);
    }
};
