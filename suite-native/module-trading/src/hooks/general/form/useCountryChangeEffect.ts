import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import {
    type TradingCountryCode,
    type TradingCountryOption,
    type TradingCountrySubdivisionOption,
} from '@suite-common/trading';
import { residenceActions } from '@suite-native/trading-state';

export type CountrySubdivisionFormWatch = (
    keys: ['country', 'countrySubdivision'],
) => [TradingCountryOption | undefined, TradingCountrySubdivisionOption | undefined];

export const useCountryChangeEffect = (watch: CountrySubdivisionFormWatch) => {
    const dispatch = useDispatch();

    const [countryOption, countrySubdivisionOption] = watch(['country', 'countrySubdivision']);
    const country = countryOption?.value as TradingCountryCode | undefined;
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
