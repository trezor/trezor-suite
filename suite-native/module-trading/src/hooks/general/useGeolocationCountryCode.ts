import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchCountryCodeThunk, selectCountryCode } from '@suite-common/geolocation';

export const useGeolocationCountryCode = () => {
    const dispatch = useDispatch();
    const countryCode = useSelector(selectCountryCode);

    useEffect(() => {
        if (!countryCode) {
            dispatch(fetchCountryCodeThunk());
        }
    }, [countryCode, dispatch]);
};
