import { tradingQueryKeys, useQuery } from '@suite-common/react-query';
import { returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { getWeakRandomId } from '@trezor/utils';

import { tradeApi } from '../tradeApi';
import { type TradingCountryCode, type TradingOTC } from '../types';

const ANONYMOUS_ID = getWeakRandomId(20);

export const getOtcProvidersByCountry = (
    data: TradingOTC | null | undefined,
    country: TradingCountryCode,
) =>
    returnStableArrayIfEmpty(data?.links?.filter(link => link.allowedCountries?.includes(country)));

export const useFetchOtc = () =>
    useQuery({
        queryKey: tradingQueryKeys.otcData(),
        queryFn: async () => {
            if (!tradeApi.getCurrentApiKey()) {
                tradeApi.createAnonymousApiKey(ANONYMOUS_ID);
            }

            return (await tradeApi.getOTCData()) ?? null;
        },
        staleTime: 1000 * 6,
    });
