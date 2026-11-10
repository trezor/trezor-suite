import { createThunk } from '@trezor/redux-utils';
import { GEOLOCATION_API_URL } from '@trezor/urls';
import { scheduleAction } from '@trezor/utils';

import { isCountryCode } from './countries';
import { COUNTRY_CODE_FETCH_TIMEOUT_MS } from './geolocationConstants';
import { GEOLOCATION_PREFIX, geolocationActions } from './geolocationReducer';
import { type GeolocationRootState, selectCountryCode } from './geolocationSelectors';

const getCountryCode = (data: unknown) => {
    if (
        typeof data !== 'object' ||
        data === null ||
        !('country' in data) ||
        typeof data.country !== 'string'
    ) {
        return undefined;
    }

    const code = data.country.trim().toUpperCase();

    return isCountryCode(code) ? code : undefined;
};

const fetchCountry = () =>
    scheduleAction(
        async signal => {
            const response = await fetch(GEOLOCATION_API_URL, { signal });

            return response.ok ? getCountryCode(await response.json()) : undefined;
        },
        { timeout: COUNTRY_CODE_FETCH_TIMEOUT_MS },
    );

let inFlightFetch: Promise<void> | null = null;

type FetchCountryCodeThunkState = GeolocationRootState;

export const fetchCountryCodeThunk = createThunk<void, void, { state: FetchCountryCodeThunkState }>(
    `${GEOLOCATION_PREFIX}/fetchCountryCodeThunk`,
    async (_, { dispatch, getState }) => {
        if (inFlightFetch) {
            await inFlightFetch;

            return;
        }

        const fetchAndStore = async () => {
            const countryCode = await fetchCountry().catch(() => undefined);

            if (countryCode === undefined) {
                dispatch(
                    geolocationActions.countryCodeFetchFinished({
                        status: 'failed',
                        timestamp: Date.now(),
                    }),
                );

                return;
            }

            if (countryCode !== selectCountryCode(getState())) {
                dispatch(geolocationActions.setCountryCode(countryCode));
            }

            dispatch(
                geolocationActions.countryCodeFetchFinished({
                    status: 'success',
                    timestamp: Date.now(),
                }),
            );
        };

        inFlightFetch = fetchAndStore();

        try {
            await inFlightFetch;
        } finally {
            inFlightFetch = null;
        }
    },
);
