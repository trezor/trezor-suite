import { NetworkSymbol } from '@suite-common/wallet-config';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import {
    TokenAddress,
    FiatRateKey,
    TickerId,
    Timestamp,
    RatesByTimestamps,
    WalletAccountTransaction,
    TickerResult,
} from '@suite-common/wallet-types';
import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';

const ONE_HOUR_IN_SECONDS = 60 * 60;

export const getFiatRateKey = (
    symbol: NetworkSymbol,
    fiatCurrency: FiatCurrencyCode,
    tokenAddress?: TokenAddress,
): FiatRateKey => {
    if (tokenAddress) {
        return `${symbol}-${tokenAddress}-${fiatCurrency}` as FiatRateKey;
    }

    return `${symbol}-${fiatCurrency}` as FiatRateKey;
};

export const getFiatRateKeyFromTicker = (
    ticker: TickerId,
    fiatCurrency: FiatCurrencyCode,
): FiatRateKey => {
    const { symbol, tokenAddress } = ticker;

    return getFiatRateKey(symbol, fiatCurrency, tokenAddress);
};

export const roundTimestampToNearestPastHour = (timestamp: Timestamp): Timestamp =>
    (Math.floor(timestamp / ONE_HOUR_IN_SECONDS) * ONE_HOUR_IN_SECONDS) as Timestamp;

export const roundTimestampsToNearestPastHour = (timestamps: Timestamp[]): Timestamp[] => {
    return timestamps.map(timestamp => {
        return roundTimestampToNearestPastHour(timestamp);
    });
};

const combineFiatRates = (fiatRates: RatesByTimestamps, accountRates: RatesByTimestamps) => {
    for (let fiatRate in accountRates) {
        const fiatRateKey = fiatRate as FiatRateKey;

        if (accountRates.hasOwnProperty(fiatRateKey)) {
            if (!fiatRates[fiatRateKey]) {
                fiatRates[fiatRateKey] = accountRates[fiatRateKey];
            } else {
                for (let timestampRate in accountRates[fiatRateKey]) {
                    const timestamp = timestampRate as unknown as Timestamp;
                    if (
                        accountRates[fiatRateKey].hasOwnProperty(timestamp) &&
                        !fiatRates[fiatRateKey][timestamp]
                    ) {
                        fiatRates[fiatRateKey][timestamp] = accountRates[fiatRateKey][timestamp];
                    }
                }
            }
        }
    }
};

export const buildHistoricRatesFromStorage = (storageHistoricRates: RatesByTimestamps[]) => {
    let historicFiatRates: RatesByTimestamps = {};

    storageHistoricRates.forEach(fiatRates => {
        for (let fiatRate in fiatRates) {
            if (fiatRates.hasOwnProperty(fiatRate)) {
                const fiatRateKey = fiatRate as FiatRateKey;

                if (!historicFiatRates[fiatRateKey]) {
                    historicFiatRates[fiatRateKey] = fiatRates[fiatRateKey];
                } else {
                    combineFiatRates(historicFiatRates[fiatRateKey], fiatRates[fiatRateKey]);
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
        const timestamp = roundTimestampToNearestPastHour(blockTime as Timestamp);

        Object.keys(historicRates).forEach(fiatRate => {
            const fiatRateKey = fiatRate as FiatRateKey;

            if (
                fiatRateKey.startsWith(symbol) ||
                tokens.some(token => fiatRateKey.startsWith(`[${symbol}-${token.contract}]`))
            ) {
                if (historicRates[fiatRateKey][timestamp]) {
                    if (!selectedRates[fiatRateKey]) {
                        selectedRates[fiatRateKey] = {};
                    }
                    selectedRates[fiatRateKey][timestamp] = historicRates[fiatRateKey][timestamp];
                }
            }
        });
    });

    return selectedRates;
};

export const fetchTransactionsRates = async (
    tickerId: TickerId,
    timestamps: Timestamp[],
    localCurrency: FiatCurrencyCode,
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
            rates.push({
                tickerId,
                localCurrency,
                rates: results.tickers.map((ticker, index) => ({
                    rate: ticker?.rates[localCurrency],
                    lastTickerTimestamp: uniqueTimestamps[index],
                })),
            });
        }
    } catch (error) {
        console.error(error);
    }
};
