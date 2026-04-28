import { isCountrySubdivisionEmpty } from '@suite-common/trading';
import { useFormContext } from '@suite-native/forms';
import { tradingCountriesWhitelistSet } from '@suite-native/trading-consts';

import { type TradingLocationFormValues } from '../types/tradingLocationForm';

export const useIsTradingAvailableForForm = () => {
    const { watch } = useFormContext<TradingLocationFormValues>();
    const countryCode = watch('country').value;
    const countrySubdivision = watch('countrySubdivision');

    return (
        tradingCountriesWhitelistSet.has(countryCode) &&
        !isCountrySubdivisionEmpty(countryCode, countrySubdivision?.value)
    );
};
