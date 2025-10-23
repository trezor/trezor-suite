import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getLocales } from 'expo-localization';

import { TradingCountryCode, nonSanctionedRegional } from '@suite-common/trading';
import { useForm } from '@suite-native/forms';

import { selectTradingResidenceCountry } from '../selectors/residenceSelectors';
import { TradingLocationFormValues } from '../types/tradingLocationForm';
import { locationFormValidationSchema } from '../utils/locationFormValidationSchema';

export const useLocationForm = () => {
    const countryCode = useSelector(selectTradingResidenceCountry);

    const defaultCountry = useMemo(() => {
        const { countriesOptionsMap } = nonSanctionedRegional;

        if (countryCode) {
            const country = countriesOptionsMap.get(countryCode);
            if (country) {
                return country;
            }
        }

        const preferredCountryCode = getLocales()
            .map(({ regionCode }) => regionCode)
            .find(regionCode => countriesOptionsMap.has(regionCode as TradingCountryCode)) as
            | TradingCountryCode
            | undefined;

        if (preferredCountryCode) {
            return countriesOptionsMap.get(preferredCountryCode);
        }

        return countriesOptionsMap.get('unknown')!;
    }, [countryCode]);

    return useForm<TradingLocationFormValues>({
        defaultValues: {
            country: defaultCountry,
        },
        validation: locationFormValidationSchema,
    });
};
