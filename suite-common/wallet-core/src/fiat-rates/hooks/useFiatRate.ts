import { useSelector } from 'react-redux';

import { skipToken } from '@reduxjs/toolkit/query/react';

import { type RateTypeWithoutHistoric, type TickerId } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { selectBaseCurrency } from '../../settings/walletSettingsReducer';
import {
    fiatRatesApi,
    getFiatRateMaxAgeInSeconds,
    getFiatRateSubscriptionOptions,
} from '../fiatRatesApi';

type UseFiatRateParams = {
    ticker: TickerId | undefined;
    rateType?: RateTypeWithoutHistoric;
    /** Defaults to the base currency from the wallet settings. */
    baseCurrencyCode?: BaseCurrencyCode;
    forceFetchToken?: boolean;
    skipCache?: boolean;
    isDisabled?: boolean;
};

/**
 * Subscribes the component to one ticker rate: it is fetched when missing or stale and polled
 * while the component is mounted. Read the value from the result or from the fiat rate selectors.
 */
export const useFiatRate = ({
    ticker,
    rateType = 'current',
    baseCurrencyCode,
    forceFetchToken,
    skipCache,
    isDisabled = false,
}: UseFiatRateParams) => {
    const defaultBaseCurrencyCode = useSelector(selectBaseCurrency);
    const queryArgs =
        ticker && !isDisabled && !isTestnet(ticker.symbol)
            ? {
                  ticker,
                  baseCurrencyCode: baseCurrencyCode ?? defaultBaseCurrencyCode,
                  forceFetchToken,
                  skipCache,
              }
            : skipToken;
    const options = {
        ...getFiatRateSubscriptionOptions(rateType),
        refetchOnMountOrArgChange: getFiatRateMaxAgeInSeconds(rateType),
    };

    const currentRateQuery = fiatRatesApi.endpoints.getCurrentFiatRate.useQuery(
        rateType === 'current' ? queryArgs : skipToken,
        options,
    );
    const lastWeekRateQuery = fiatRatesApi.endpoints.getLastWeekFiatRate.useQuery(
        rateType === 'lastWeek' ? queryArgs : skipToken,
        options,
    );

    return rateType === 'current' ? currentRateQuery : lastWeekRateQuery;
};
