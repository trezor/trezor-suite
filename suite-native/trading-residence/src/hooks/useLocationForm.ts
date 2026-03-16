import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { nonSanctionedRegional } from '@suite-common/trading';
import { useForm } from '@suite-native/forms';
import { selectTradingResidenceCountry } from '@suite-native/trading-state';

import { type TradingLocationFormValues } from '../types/tradingLocationForm';
import { getPreferredCountryOption } from '../utils/getPreferredCountryOption';
import { locationFormValidationSchema } from '../utils/locationFormValidationSchema';

export const useLocationForm = () => {
    const countryCode = useSelector(selectTradingResidenceCountry);

    const defaultCountry = useMemo(() => {
        if (countryCode) {
            const country = nonSanctionedRegional.countriesOptionsMap.get(countryCode);
            if (country) {
                return country;
            }
        }

        return getPreferredCountryOption();
    }, [countryCode]);

    return useForm<TradingLocationFormValues>({
        defaultValues: {
            country: defaultCountry,
        },
        validation: locationFormValidationSchema,
    });
};
