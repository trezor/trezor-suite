import {
    type GeolocationRootState,
    PRESENCE_IP_REFRESH_INTERVAL_MS,
    fetchCountryCodeThunk,
    selectCountryCodeFetch,
    selectCountryCodeFetchGeneration,
} from '@suite-common/geolocation';
import {
    Feature,
    type MessageSystemRootState,
    selectFeatureConfig,
} from '@suite-common/message-system';
import { createThunk } from '@trezor/redux-utils';

type InFlightFetch = { generation: number; promise: Promise<unknown> };

let inFlight: InFlightFetch | null = null;

const isFetchStale = (state: GeolocationRootState) => {
    const lastFetch = selectCountryCodeFetch(state);

    if (!lastFetch) {
        return true;
    }

    const elapsed = Date.now() - lastFetch.timestamp;

    return elapsed < 0 || elapsed >= PRESENCE_IP_REFRESH_INTERVAL_MS;
};

type RefreshPresenceIpCountryThunkParams = { isIpLookupAllowed: boolean };

export type RefreshPresenceIpCountryThunkState = MessageSystemRootState & GeolocationRootState;

export const refreshPresenceIpCountryThunk = createThunk<
    void,
    RefreshPresenceIpCountryThunkParams,
    { state: RefreshPresenceIpCountryThunkState }
>(
    '@suite-common/regions/refreshPresenceIpCountry',
    async ({ isIpLookupAllowed }, { dispatch, getState }) => {
        if (!selectFeatureConfig(getState(), Feature.regions.presenceRestriction)?.flag) {
            return;
        }

        const generation = selectCountryCodeFetchGeneration(getState());

        if (
            !isIpLookupAllowed ||
            inFlight?.generation === generation ||
            !isFetchStale(getState())
        ) {
            return;
        }

        const current: InFlightFetch = { generation, promise: dispatch(fetchCountryCodeThunk()) };
        inFlight = current;

        try {
            await current.promise;
        } finally {
            if (inFlight === current) {
                inFlight = null;
            }
        }
    },
);
