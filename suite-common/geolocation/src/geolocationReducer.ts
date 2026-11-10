import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type CountryCode } from './countries';

export const GEOLOCATION_PREFIX = '@suite-common/geolocation';

export type CountryCodeFetchStatus = 'success' | 'failed';

export type CountryCodeFetch = { status: CountryCodeFetchStatus; timestamp: number };

export type CountryCodeFetchFinishedPayload = CountryCodeFetch & { generation: number };

export type GeolocationState = {
    countryCode: CountryCode | null;
    countryCodeFetch: CountryCodeFetch | null;
    countryCodeFetchGeneration: number;
};

export const geolocationInitialState: GeolocationState = {
    countryCode: null,
    countryCodeFetch: null,
    countryCodeFetchGeneration: 0,
};

const geolocationSlice = createSlice({
    name: GEOLOCATION_PREFIX,
    initialState: geolocationInitialState,
    reducers: {
        setCountryCode(state: GeolocationState, action: PayloadAction<CountryCode>) {
            state.countryCode = action.payload;
        },
        countryCodeFetchFinished(
            state: GeolocationState,
            action: PayloadAction<CountryCodeFetchFinishedPayload>,
        ) {
            const { status, timestamp, generation } = action.payload;

            if (generation !== state.countryCodeFetchGeneration) {
                return;
            }

            state.countryCodeFetch = { status, timestamp };
        },
        invalidateCountryCodeFetch(state: GeolocationState) {
            state.countryCodeFetch = null;
            state.countryCodeFetchGeneration += 1;
        },
    },
});

export const geolocationActions = geolocationSlice.actions;
export const geolocationReducer = geolocationSlice.reducer;
