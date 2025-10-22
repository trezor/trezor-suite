import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { TradingCountryOption } from '@suite-common/trading';
import { tradingResidenceActions } from '@suite-native/trading-residence';

export type CountryFormWatch = (key: 'country') => TradingCountryOption | undefined;

export const useCountryChangeEffect = (watch: CountryFormWatch) => {
    const dispatch = useDispatch();

    const country = watch('country')?.value;
    const prevCountryCode = useRef(country);

    useEffect(() => {
        if (prevCountryCode.current === country || !country) {
            return;
        }

        dispatch(tradingResidenceActions.setResidenceCountry(country));
        prevCountryCode.current = country;
    }, [country, dispatch]);
};
