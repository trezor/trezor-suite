import { useDispatch } from 'react-redux';

import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import { type TickerId, type Timestamp } from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { type UpdateFiatRatesThunkState, updateFiatRatesThunk } from './fiatRatesThunks';

type UseMissingRateTickersQueryProps = {
    missingRateTickers: TickerId[];
    baseCurrencyCode: BaseCurrencyCode;
};

export const useMissingRateTickersQuery = ({
    missingRateTickers,
    baseCurrencyCode,
}: UseMissingRateTickersQueryProps) => {
    const dispatch =
        useDispatch<
            ThunkDispatch<UpdateFiatRatesThunkState, Record<never, never>, UnknownAction>
        >();

    return useQuery({
        queryKey: commonQueryKeys.missingRateTickers(missingRateTickers, baseCurrencyCode),
        queryFn: () =>
            dispatch(
                updateFiatRatesThunk({
                    tickers: missingRateTickers,
                    baseCurrencyCode,
                    rateType: 'current',
                    fetchAttemptTimestamp: Date.now() as Timestamp,
                    forceFetchToken: true,
                }),
            ).unwrap(),
        enabled: missingRateTickers.length > 0,
    });
};
