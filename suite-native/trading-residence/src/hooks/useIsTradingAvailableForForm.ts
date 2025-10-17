import { useFormCountryCode } from './useFormCountryCode';
import { tradingCountriesWhitelistSet } from '../utils/countriesWhitelist';

export const useIsTradingAvailableForForm = () => {
    const countryCode = useFormCountryCode();

    return tradingCountriesWhitelistSet.has(countryCode);
};
