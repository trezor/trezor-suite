import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import {
    type TradingCountryOption,
    type TradingCountrySubdivisionOption,
} from '@suite-common/trading';
import { type Control, type FieldValues, type Path, useWatch } from '@suite-native/forms';
import { residenceActions } from '@suite-native/trading-state';

export const useCountryChangeEffect = <TFieldValues extends FieldValues>(
    control: Control<TFieldValues>,
) => {
    const dispatch = useDispatch();

    const [countryOption, countrySubdivisionOption] = useWatch({
        control,
        name: ['country', 'countrySubdivision'] as Path<TFieldValues>[],
    }) as unknown as [
        TradingCountryOption | undefined,
        TradingCountrySubdivisionOption | undefined,
    ];
    const country = countryOption?.value;
    const countrySubdivision = countrySubdivisionOption?.value;

    const prevCountryCode = useRef(country);
    const prevCountrySubdivision = useRef(countrySubdivision);

    useEffect(() => {
        const countryChanged = prevCountryCode.current !== country;
        const subdivisionChanged = prevCountrySubdivision.current !== countrySubdivision;

        if ((!countryChanged && !subdivisionChanged) || !country) {
            return;
        }

        dispatch(
            residenceActions.setResidenceCountry({
                country,
                countrySubdivision,
            }),
        );

        prevCountryCode.current = country;
        prevCountrySubdivision.current = countrySubdivision;
    }, [country, countrySubdivision, dispatch]);
};
