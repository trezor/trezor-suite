import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
    TRADING_SETTINGS_PREFIX,
} from '../constants';

export type TradingSettingsState = {
    maxSlippagePercentage: string; // Number in string format representing percentage, e.g. '1' for 1%
};

export const settingsInitialState: TradingSettingsState = {
    maxSlippagePercentage: TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
};

export const tradingSettingsSlice = createSlice({
    name: TRADING_SETTINGS_PREFIX,
    initialState: settingsInitialState,
    reducers: {
        setMaxSlippagePercentage: (state, { payload }: PayloadAction<string>) => {
            state.maxSlippagePercentage = payload;
        },
    },
});

export const tradingSettingsActions = tradingSettingsSlice.actions;
export const tradingSettingsReducer = tradingSettingsSlice.reducer;
