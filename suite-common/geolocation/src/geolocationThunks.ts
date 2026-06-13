import { createThunk } from '@suite-common/redux-utils';
import { GEOLOCATION_API_URL } from '@trezor/urls';

import { type CountryCode } from './countries';
import { GEOLOCATION_PREFIX, geolocationActions } from './geolocationReducer';

type GeolocationResponse = {
    country: string;
};

const GEOLOCATION_TIMEOUT_MS = 10_000;

export const fetchCountryCodeThunk = createThunk<void, void, void>(
    `${GEOLOCATION_PREFIX}/fetchCountryCodeThunk`,
    async (_, { dispatch }) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GEOLOCATION_TIMEOUT_MS);
        try {
            const response = await fetch(GEOLOCATION_API_URL, { signal: controller.signal });
            const data = (await response.json()) as GeolocationResponse;

            if (typeof data?.country === 'string') {
                const countryCode = data.country.trim().toUpperCase() as unknown as CountryCode;

                dispatch(geolocationActions.setCountryCode(countryCode));
            }
        } catch {
            // silently fail
        } finally {
            clearTimeout(timeoutId);
        }
    },
);
