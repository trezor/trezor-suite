import { useSelector } from 'react-redux';

import { mobileQueryKeys, useQuery } from '@suite-common/react-query';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import {
    type RatesByTimestamps,
    type Timestamp,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { getFiatRateKey, roundTimestampToNearestPastHour } from '@suite-common/wallet-utils';
import { type WalletAccountTransaction } from '@suite-native/tokens';

import { readHistoricRates } from '../historicRatesStorage';

export const useTxFiatRate = (
    transaction: WalletAccountTransaction,
    tokenAddress?: TokenAddress,
): number | undefined => {
    const localCurrency = useSelector(selectBaseCurrency);

    const { data } = useQuery<RatesByTimestamps, Error, number | undefined>({
        queryKey: mobileQueryKeys.historicRates(localCurrency),
        // initialData seeds TQ cache synchronously from MMKV when no cache entry exists yet.
        // With staleTime: Infinity the data is treated as always fresh so queryFn never fires.
        queryFn: () => Promise.resolve({} as RatesByTimestamps),
        initialData: () => readHistoricRates(localCurrency) ?? ({} as RatesByTimestamps),
        staleTime: Infinity,
        gcTime: Infinity,
        select: rates => {
            if (!transaction.blockTime) return undefined;
            const key = getFiatRateKey(transaction.symbol, localCurrency, tokenAddress);
            const ts = roundTimestampToNearestPastHour(transaction.blockTime as Timestamp);

            return rates[key]?.[ts];
        },
    });

    return data;
};
