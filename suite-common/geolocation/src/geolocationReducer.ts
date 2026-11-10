import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type CountryCode } from './countries';

export const GEOLOCATION_PREFIX = '@suite-common/geolocation';

export type CountryCodeFetchStatus = 'success' | 'failed';

export type CountryCodeFetch = { status: CountryCodeFetchStatus; timestamp: number };

export type GeolocationState = {
    countryCode: CountryCode | null;
    countryCodeFetch: CountryCodeFetch | null;
};

export const geolocationInitialState: GeolocationState = {
    countryCode: null,
    countryCodeFetch: null,
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
    },
});

export const geolocationActions = geolocationSlice.actions;
export const geolocationReducer = geolocationSlice.reducer;
