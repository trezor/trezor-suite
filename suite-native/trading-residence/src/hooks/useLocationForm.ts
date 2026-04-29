import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getDefaultCountrySubdivision, nonSanctionedRegional } from '@suite-common/trading';
import { useForm } from '@suite-native/forms';
import {
    selectTradingResidenceCountry,
    selectTradingResidenceCountrySubdivision,
} from '@suite-native/trading-state';

import { type TradingLocationFormValues } from '../types/tradingLocationForm';
import { getPreferredCountryOption } from '../utils/getPreferredCountryOption';
import { locationFormValidationSchema } from '../utils/locationFormValidationSchema';

export const useLocationForm = () => {
    const countryCode = useSelector(selectTradingResidenceCountry);
    const countrySubdivisionCode = useSelector(selectTradingResidenceCountrySubdivision);

    const defaultCountry = useMemo(() => {
        if (countryCode) {
            const country = nonSanctionedRegional.countriesOptionsMap.get(countryCode);
            if (country) {
                return country;
            }
        }

        return getPreferredCountryOption();
    }, [countryCode]);

    const defaultCountrySubdivision = useMemo(
        () => getDefaultCountrySubdivision(countrySubdivisionCode, defaultCountry.value),
        [countrySubdivisionCode, defaultCountry.value],
    );

    return useForm<TradingLocationFormValues>({
        defaultValues: {
            country: defaultCountry,
            countrySubdivision: defaultCountrySubdivision,
        },
        validation: locationFormValidationSchema,
    });
};
