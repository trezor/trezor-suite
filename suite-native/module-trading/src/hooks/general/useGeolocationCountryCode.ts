import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { fetchCountryCodeThunk, selectCountryCode } from '@suite-common/geolocation';
import { useDispatch } from '@suite-common/redux-utils';

export const useGeolocationCountryCode = () => {
    const dispatch = useDispatch();
    const countryCode = useSelector(selectCountryCode);

    useEffect(() => {
        if (!countryCode) {
            dispatch(fetchCountryCodeThunk());
        }
    }, [countryCode, dispatch]);
};
