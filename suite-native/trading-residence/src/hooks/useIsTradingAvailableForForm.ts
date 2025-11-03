import { tradingCountriesWhitelistSet } from '@suite-native/trading-atoms';

import { useFormCountryCode } from './useFormCountryCode';

export const useIsTradingAvailableForForm = () => {
    const countryCode = useFormCountryCode();

    return tradingCountriesWhitelistSet.has(countryCode);
};
