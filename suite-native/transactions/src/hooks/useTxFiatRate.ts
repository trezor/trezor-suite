import { useSelector } from 'react-redux';

import { mobileQueryKeys, useQuery } from '@suite-common/react-query';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import {
    type AccountKey,
    type RatesByTimestamps,
    type Timestamp,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { getFiatRateKey, roundTimestampToNearestPastHour } from '@suite-common/wallet-utils';
import { type WalletAccountTransaction } from '@suite-native/tokens';

import { readHistoricRates } from '../historicRatesStorage';

export const useTxFiatRate = (
    accountKey: AccountKey,
    transaction: WalletAccountTransaction,
    tokenAddress?: TokenAddress,
): number | undefined => {
    const localCurrency = useSelector(selectBaseCurrency);

    const { data } = useQuery<RatesByTimestamps, Error, number | undefined>({
        queryKey: mobileQueryKeys.historicRates(accountKey, localCurrency),
        // Restore persisted rates from MMKV on first mount; falls back to empty map.
        // useFiatRatesForTransactionsQuery will merge new rates in via setQueryData.
        queryFn: () =>
            readHistoricRates(accountKey, localCurrency) ?? ({} as RatesByTimestamps),
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
