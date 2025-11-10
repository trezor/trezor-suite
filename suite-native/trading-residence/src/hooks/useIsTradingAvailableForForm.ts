import { tradingCountriesWhitelistSet } from '@suite-native/trading-consts';

import { useFormCountryCode } from './useFormCountryCode';

export const useIsTradingAvailableForForm = () => {
    const countryCode = useFormCountryCode();

    return tradingCountriesWhitelistSet.has(countryCode);
};
