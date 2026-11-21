import {
    type GeolocationRootState,
    fetchCountryCodeThunk,
    selectCountryCodeFetch,
} from '@suite-common/geolocation';
import { createThunk } from '@trezor/redux-utils';

import {
    PRESENCE_IP_REFRESH_INTERVAL_MS,
    PRESENCE_IP_RETRY_INTERVAL_MS,
} from './presenceConstants';

const isFetchStale = (state: GeolocationRootState) => {
    const lastFetch = selectCountryCodeFetch(state);

    if (!lastFetch) {
        return true;
    }

    const elapsed = Date.now() - lastFetch.timestamp;
    const interval =
        lastFetch.status === 'success'
            ? PRESENCE_IP_REFRESH_INTERVAL_MS
            : PRESENCE_IP_RETRY_INTERVAL_MS;

    return elapsed < 0 || elapsed >= interval;
};

export type RefreshPresenceIpCountryThunkState = GeolocationRootState;

export const refreshPresenceIpCountryThunk = createThunk<
    void,
    void,
    { state: RefreshPresenceIpCountryThunkState }
>('@suite-common/regions/refreshPresenceIpCountry', async (_, { dispatch, getState }) => {
    if (!isFetchStale(getState())) {
        return;
    }

    await dispatch(fetchCountryCodeThunk());
});
