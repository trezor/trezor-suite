import { useSelector } from 'react-redux';

import { type TradingCountryCode, nonSanctionedRegional } from '@suite-common/trading';
import { useForm } from '@suite-native/forms';
import { selectTradingResidenceCountry } from '@suite-native/trading-state';
import { type ConciergeFormValues } from '@suite-native/trading-types';

import { useCountryChangeEffect } from '../general/form/useCountryChangeEffect';

type ConciergeFormProps = {
    defaultCountryCode?: TradingCountryCode;
};

export const useConciergeForm = ({ defaultCountryCode }: ConciergeFormProps) => {
    const storedCountryCode = useSelector(selectTradingResidenceCountry);
    const countryCode = storedCountryCode ?? defaultCountryCode ?? 'unknown';
    const country = nonSanctionedRegional.getCountryOptionWithWorldwideFallback(countryCode);

    const form = useForm<ConciergeFormValues>({
        defaultValues: {
            country,
        },
    });
    useCountryChangeEffect(form.control);

    return form;
};
