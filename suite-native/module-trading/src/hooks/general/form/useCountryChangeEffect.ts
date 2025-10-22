import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { TradingCountryOption } from '@suite-common/trading';
import { tradingResidenceActions } from '@suite-native/trading-residence';

export type CuntryFormWatch = (key: 'country') => TradingCountryOption;

export const useCountryChangeEffect = (watch: CuntryFormWatch) => {
    const dispatch = useDispatch();

    const country = watch('country')?.value;
    const prevCountryCode = useRef(country);

    useEffect(() => {
        if (prevCountryCode.current === country) {
            return;
        }

        dispatch(tradingResidenceActions.setResidenceCountry(country));
    }, [country, dispatch]);
};
