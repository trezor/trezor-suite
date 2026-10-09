import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { fetchCountryCodeThunk, selectCountryCode } from '@suite-common/geolocation';
import { injectDispatch } from '@suite-common/redux-utils';
import { useServices } from '@trezor/dependency-injection';

export const useGeolocationCountryCode = () => {
    const { dispatch } = useServices(injectDispatch);
    const countryCode = useSelector(selectCountryCode);

    useEffect(() => {
        if (!countryCode) {
            dispatch(fetchCountryCodeThunk());
        }
    }, [countryCode, dispatch]);
};
