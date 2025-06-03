import { createThunk } from '@suite-common/redux-utils';
import { GEOLOCATION_API_URL } from '@trezor/urls';

import { CountryCode } from './countries';
import { GEOLOCATION_PREFIX, geolocationActions } from './geolocationReducer';

type GeolocationResponse = {
    country: string;
};

export const fetchCountryCodeThunk = createThunk<void, void, void>(
    `${GEOLOCATION_PREFIX}/fetchCountryCodeThunk`,
    async (_, { dispatch }) => {
        try {
            const response = await fetch(GEOLOCATION_API_URL);
            const data = (await response.json()) as GeolocationResponse;

            if (typeof data?.country === 'string') {
                const countryCode = data.country.trim().toUpperCase() as unknown as CountryCode;

                dispatch(geolocationActions.setCountryCode(countryCode));
            }
        } catch {
            // silently fail
        }
    },
);
