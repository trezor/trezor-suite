import { createSlice } from '@reduxjs/toolkit';

import { type TradingCountryCode } from '@suite-common/trading';
import { tradingInitialState } from '@suite-native/trading-consts';
import { type TradingResidenceState } from '@suite-native/trading-types';

export const TRADING_RESIDENCE = 'tradingResidence';

type SetResidenceCountryPayload = {
    country: TradingCountryCode;
    countrySubdivision?: string;
};

const residenceSlice = createSlice({
    name: TRADING_RESIDENCE,
    initialState: tradingInitialState.residence,
    reducers: {
        setResidenceCountry(
            state: TradingResidenceState,
            action: { payload: SetResidenceCountryPayload },
        ) {
            state.country = action.payload.country;
            state.countrySubdivision = action.payload.countrySubdivision;
        },
        setOnboardingVisited(state: TradingResidenceState) {
            state.wasOnboardingVisited = true;
        },
    },
});

export const residenceReducer = residenceSlice.reducer;
export const residenceActions = residenceSlice.actions;
