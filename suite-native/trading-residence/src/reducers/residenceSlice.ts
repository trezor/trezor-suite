import { createSlice } from '@reduxjs/toolkit';

import { TradingCountryCode } from '@suite-common/trading';

export type TradingResidenceState = {
    country: TradingCountryCode;
    onboardingCompleted: boolean;
};
export type TradingResidenceRootState = {
    wallet: {
        trading: {
            residence: TradingResidenceState;
        };
    };
};

export const tradingResidenceInitialState: TradingResidenceState = {
    country: 'unknown',
    onboardingCompleted: false,
};

export const TRADING_RESIDENCE = 'tradingResidence';

const residenceSlice = createSlice({
    name: TRADING_RESIDENCE,
    initialState: tradingResidenceInitialState,
    reducers: {
        setResidenceCountry(state, action: { payload: TradingCountryCode }) {
            state.country = action.payload;
        },
        setOnboardingVisited(state) {
            state.onboardingCompleted = true;
        },
    },
});

export const tradingResidenceReducer = residenceSlice.reducer;
export const tradingResidenceActions = residenceSlice.actions;
