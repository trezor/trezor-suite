import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { fetchCountryCodeThunk, selectCountryCode } from '@suite-common/geolocation';
import { selectDispatch } from '@suite-common/redux-utils';

export const useGeolocationCountryCode = () => {
    const { dispatch } = useServices(selectDispatch);
    const countryCode = useSelector(selectCountryCode);

    useEffect(() => {
        if (!countryCode) {
            dispatch(fetchCountryCodeThunk());
        }
    }, [countryCode, dispatch]);
};
