import { getLocales } from 'expo-localization';

import { type TradingCountryCode, nonSanctionedRegional } from '@suite-common/trading';

export const getPreferredCountryOption = () => {
    const { countriesOptionsMap } = nonSanctionedRegional;

    const preferredCountryCode = getLocales()
        .map(({ regionCode }) => regionCode)
        .find(regionCode => countriesOptionsMap.has(regionCode as TradingCountryCode)) as
        TradingCountryCode | undefined;

    return countriesOptionsMap.get(preferredCountryCode ?? 'unknown')!;
};
