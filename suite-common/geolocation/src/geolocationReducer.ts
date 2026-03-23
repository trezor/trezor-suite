import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type CountryCode } from './countries';

export const GEOLOCATION_PREFIX = '@suite-common/geolocation';

export type GeolocationState = {
    countryCode: CountryCode | null;
};

export const geolocationInitialState: GeolocationState = {
    countryCode: null,
};

const geolocationSlice = createSlice({
    name: GEOLOCATION_PREFIX,
    initialState: geolocationInitialState,
    reducers: {
        setCountryCode(state, action: PayloadAction<CountryCode>) {
            state.countryCode = action.payload;
        },
    },
});

export const geolocationActions = geolocationSlice.actions;
export const geolocationReducer = geolocationSlice.reducer;
