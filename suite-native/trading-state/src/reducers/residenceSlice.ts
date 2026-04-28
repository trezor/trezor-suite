import { createSlice } from '@reduxjs/toolkit';

import { type TradingCountryCode } from '@suite-common/trading';
import { tradingInitialState } from '@suite-native/trading-consts';

export const TRADING_RESIDENCE = 'tradingResidence';

type SetResidenceCountryPayload = {
    country: TradingCountryCode;
    countrySubdivision?: string;
};

const residenceSlice = createSlice({
    name: TRADING_RESIDENCE,
    initialState: tradingInitialState.residence,
    reducers: {
        setResidenceCountry(state, action: { payload: SetResidenceCountryPayload }) {
            state.country = action.payload.country;
            state.countrySubdivision = action.payload.countrySubdivision;
        },
        setOnboardingVisited(state) {
            state.wasOnboardingVisited = true;
        },
    },
});

export const residenceReducer = residenceSlice.reducer;
export const residenceActions = residenceSlice.actions;
