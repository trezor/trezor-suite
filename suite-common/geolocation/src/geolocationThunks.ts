import { createThunk } from '@trezor/redux-utils';
import { GEOLOCATION_API_URL } from '@trezor/urls';
import { scheduleAction } from '@trezor/utils';

import { type CountryCode } from './countries';
import { COUNTRY_CODE_FETCH_TIMEOUT_MS } from './geolocationConstants';
import { GEOLOCATION_PREFIX, geolocationActions } from './geolocationReducer';
import {
    type GeolocationRootState,
    selectCountryCodeFetchGeneration,
} from './geolocationSelectors';

const getCountry = (data: unknown) =>
    typeof data === 'object' &&
    data !== null &&
    'country' in data &&
    typeof data.country === 'string'
        ? data.country
        : undefined;

const fetchCountry = () =>
    scheduleAction(
        async signal => {
            const response = await fetch(GEOLOCATION_API_URL, { signal });

            return response.ok ? getCountry(await response.json()) : undefined;
        },
        { timeout: COUNTRY_CODE_FETCH_TIMEOUT_MS },
    );

type FetchCountryCodeThunkState = GeolocationRootState;

export const fetchCountryCodeThunk = createThunk<void, void, { state: FetchCountryCodeThunkState }>(
    `${GEOLOCATION_PREFIX}/fetchCountryCodeThunk`,
    async (_, { dispatch, getState }) => {
        const generation = selectCountryCodeFetchGeneration(getState());
        const country = await fetchCountry().catch(() => undefined);

        if (country === undefined) {
            dispatch(
                geolocationActions.countryCodeFetchFinished({
                    status: 'failed',
                    timestamp: Date.now(),
                    generation,
                }),
            );

            return;
        }

        const countryCode = country.trim().toUpperCase() as unknown as CountryCode;

        dispatch(geolocationActions.setCountryCode(countryCode));
        dispatch(
            geolocationActions.countryCodeFetchFinished({
                status: 'success',
                timestamp: Date.now(),
                generation,
            }),
        );
    },
);
