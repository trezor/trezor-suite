import { tradingQueryKeys, useQuery } from '@suite-common/react-query';
import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { getWeakRandomId } from '@trezor/utils';

import { invityAPI } from '../invityAPI';
import { type TradingCountryCode, type TradingOTC } from '../types';

const FALLBACK_API_KEY = getWeakRandomId(20);

export const getOtcProvidersByCountry = (
    data: TradingOTC | undefined,
    country: TradingCountryCode,
) =>
    returnStableArrayIfEmpty(data?.links?.filter(link => link.allowedCountries?.includes(country)));

export const useFetchOtc = () =>
    useQuery({
        queryKey: tradingQueryKeys.otcData(),
        queryFn: async () => {
            if (!invityAPI.getCurrentApiKey()) {
                invityAPI.createInvityAPIKey(FALLBACK_API_KEY);
            }

            return await invityAPI.getOTCData();
        },
        staleTime: 1000 * 6,
    });
