import { startTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { mobileQueryKeys, useQuery, useQueryClient } from '@suite-common/react-query';
import {
    selectBaseCurrency,
    updateTxsFiatRatesThunk,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type CryptoBaseCurrencyPair,
    type RatesByTimestamps,
    type TickerResult,
    type Timestamp,
    type TokenAddress,
} from '@suite-common/wallet-types';
import {
    getFiatRateKey,
    getFiatRateKeyFromTicker,
    roundTimestampToNearestPastHour,
} from '@suite-common/wallet-utils';
import { type WalletAccountTransaction } from '@suite-native/tokens';

import { writeHistoricRates } from '../historicRatesStorage';

type UseFiatRatesForTransactionsQueryParams = {
    accountKey: AccountKey;
    // Re-fires whenever new transactions are loaded so their rates are checked.
    transactions: WalletAccountTransaction[];
    enabled: boolean;
};

const toRateMap = (results: TickerResult[]): RatesByTimestamps => {
    const map = {} as RatesByTimestamps;
    for (const { tickerId, localCurrency, rates } of results) {
        const key = getFiatRateKeyFromTicker(tickerId, localCurrency);
        if (!map[key]) {
            map[key] = {} as Record<Timestamp, number>;
        }
        for (const { rate, lastTickerTimestamp } of rates) {
            if (rate !== undefined) {
                map[key][lastTickerTimestamp] = rate;
            }
        }
    }
    return map;
};

export const useFiatRatesForTransactionsQuery = ({
    accountKey,
    transactions,
    enabled,
}: UseFiatRatesForTransactionsQueryParams) => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const localCurrency = useSelector(selectBaseCurrency);

    return useQuery({
        queryKey: mobileQueryKeys.txFiatRates(accountKey, localCurrency, transactions.length),
        queryFn: async () => {
            const existingRates =
                queryClient.getQueryData<RatesByTimestamps>(
                    mobileQueryKeys.historicRates(accountKey, localCurrency),
                ) ?? ({} as RatesByTimestamps);

            const txsNeedingRates = transactions.filter(tx => {
                if (!tx.blockTime) return false;
                const ts = roundTimestampToNearestPastHour(tx.blockTime as Timestamp);
                if (!existingRates[getFiatRateKey(tx.symbol, localCurrency)]?.[ts]) return true;

                return tx.tokens.some(
                    token =>
                        !existingRates[
                            getFiatRateKey(
                                tx.symbol,
                                localCurrency,
                                token.contract as TokenAddress,
                            )
                        ]?.[ts],
                );
            });

            if (txsNeedingRates.length === 0) return null;

            const { rates } = await dispatch(
                updateTxsFiatRatesThunk({
                    accountKey,
                    txs: txsNeedingRates,
                    baseCurrencyCode: localCurrency,
                }),
            ).unwrap();

            const newRates = toRateMap(rates);

            // startTransition marks this as a non-urgent update so React can spread
            // the subscriber re-renders across frames rather than committing all
            // visible list items at once (avoids the FlashList "max renders" warning).
            startTransition(() => {
                queryClient.setQueryData<RatesByTimestamps>(
                    mobileQueryKeys.historicRates(accountKey, localCurrency),
                    (prev = {} as RatesByTimestamps) => {
                        const merged = { ...prev };
                        for (const [key, timestamps] of Object.entries(newRates) as [
                            CryptoBaseCurrencyPair,
                            Record<Timestamp, number>,
                        ][]) {
                            merged[key] = { ...(prev[key] ?? {}), ...timestamps };
                        }
                        return merged;
                    },
                );
            });

            // Persist the updated map so rates are available immediately on the
            // next app launch without a network round-trip.
            const persisted = queryClient.getQueryData<RatesByTimestamps>(
                mobileQueryKeys.historicRates(accountKey, localCurrency),
            );
            if (persisted) {
                writeHistoricRates(accountKey, localCurrency, persisted);
            }

            return null;
        },
        enabled,
        staleTime: Infinity,
    });
};
