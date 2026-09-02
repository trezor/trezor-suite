import { isCountrySubdivisionEmpty } from '@suite-common/trading';
import { useFormContext, useWatch } from '@suite-native/forms';
import { tradingCountriesWhitelistSet } from '@suite-native/trading-consts';

import { type TradingLocationFormValues } from '../types/tradingLocationForm';

export const useIsTradingAvailableForForm = () => {
    const { control } = useFormContext<TradingLocationFormValues>();
    const [country, countrySubdivision] = useWatch({
        control,
        name: ['country', 'countrySubdivision'],
    });
    const countryCode = country?.value;

    return (
        tradingCountriesWhitelistSet.has(countryCode) &&
        !isCountrySubdivisionEmpty(countryCode, countrySubdivision?.value)
    );
};
