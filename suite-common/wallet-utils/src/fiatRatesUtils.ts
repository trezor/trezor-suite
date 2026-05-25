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
        symbol: symbol as NetworkSymbol,
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
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const historicRatesForKey: Record<Timestamp, number> = historicRates[fiatRateKey];
                if (historicRatesForKey[timestamp]) {
                    if (!selectedRates[fiatRateKey]) {
                        selectedRates[fiatRateKey] = {};
                    }
                    const selectedRatesForKey: Record<Timestamp, number> =
                        selectedRates[fiatRateKey];
                    selectedRatesForKey[timestamp] = historicRatesForKey[timestamp];
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
                rates: results.tickers.map((ticker, index) => {
                    // @ts-expect-error: indexing with noUncheckedIndexedAccess
                    const lastTickerTimestamp: Timestamp = uniqueTimestamps[index];

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
