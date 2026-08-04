import { tradingQueryKeys, useQuery } from '@suite-common/react-query';
import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { getWeakRandomId } from '@trezor/utils';

import { tradeApi } from '../tradeApi';
import { type TradingCountryCode, type TradingOTC } from '../types';

const FALLBACK_API_KEY = getWeakRandomId(20);

export const getOtcProvidersByCountry = (
    data: TradingOTC | null | undefined,
    country: TradingCountryCode,
) =>
    returnStableArrayIfEmpty(
        Array.isArray(data?.links)
            ? data.links.filter(
                  link =>
                      Array.isArray(link?.allowedCountries) &&
                      link.allowedCountries.includes(country),
              )
            : undefined,
    );

export const useFetchOtc = () =>
    useQuery({
        queryKey: tradingQueryKeys.otcData(),
        queryFn: async () => {
            if (!tradeApi.getCurrentApiKey()) {
                tradeApi.createApiKey(FALLBACK_API_KEY);
            }

            return (await tradeApi.getOTCData()) ?? null;
        },
        staleTime: 1000 * 6,
    });
