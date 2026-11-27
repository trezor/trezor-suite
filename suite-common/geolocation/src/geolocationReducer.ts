import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type CountryCode } from './countries';
import { type DevicePresenceSignals } from './presence/presenceTypes';

export const GEOLOCATION_PREFIX = '@suite-common/geolocation';

export type CountryCodeFetchStatus = 'success' | 'failed';

export type CountryCodeFetch = { status: CountryCodeFetchStatus; timestamp: number };

export type GeolocationState = {
    countryCode: CountryCode | null;
    countryCodeFetch: CountryCodeFetch | null;
    deviceSignals: DevicePresenceSignals | null;
};

export const geolocationInitialState: GeolocationState = {
    countryCode: null,
    countryCodeFetch: null,
    deviceSignals: null,
};

const geolocationSlice = createSlice({
    name: GEOLOCATION_PREFIX,
    initialState: geolocationInitialState,
    reducers: {
        setCountryCode(state: GeolocationState, action: PayloadAction<CountryCode>) {
            state.countryCode = action.payload;
        },
        countryCodeFetchFinished(state: GeolocationState, action: PayloadAction<CountryCodeFetch>) {
            state.countryCodeFetch = action.payload;
        },
        setDevicePresenceSignals(
            state: GeolocationState,
            { payload }: PayloadAction<DevicePresenceSignals>,
        ) {
            const current = state.deviceSignals;

            if (
                current?.timeZone === payload.timeZone &&
                current.primaryRegion === payload.primaryRegion &&
                current.secondaryRegions.join(',') === payload.secondaryRegions.join(',')
            ) {
                return;
            }

            state.deviceSignals = payload;
        },
    },
});

export const geolocationActions = geolocationSlice.actions;
export const geolocationReducer = geolocationSlice.reducer;
