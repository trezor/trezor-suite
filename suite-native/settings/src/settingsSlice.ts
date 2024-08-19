import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PROTO } from '@trezor/connect';
import { FiatCurrencyCode } from '@suite-common/suite-config';

export interface AppSettingsState {
    isOnboardingFinished: boolean;
    fiatCurrencyCode: FiatCurrencyCode;
    bitcoinUnits: PROTO.AmountUnit;
    viewOnlyCancelationTimestamp?: number;
}

export type SettingsSliceRootState = {
    appSettings: AppSettingsState;
};

export const appSettingsInitialState: AppSettingsState = {
    fiatCurrencyCode: 'usd',
    bitcoinUnits: PROTO.AmountUnit.BITCOIN,
    isOnboardingFinished: false,
    viewOnlyCancelationTimestamp: undefined,
};

export const appSettingsPersistWhitelist: Array<keyof AppSettingsState> = [
    'isOnboardingFinished',
    'fiatCurrencyCode',
    'bitcoinUnits',
    'viewOnlyCancelationTimestamp',
];

export const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState: appSettingsInitialState,
    reducers: {
        setFiatCurrency: (
            state,
            { payload: { localCurrency } }: PayloadAction<{ localCurrency: FiatCurrencyCode }>,
        ) => {
            state.fiatCurrencyCode = localCurrency;
        },
        setIsOnboardingFinished: state => {
            state.isOnboardingFinished = true;
        },
        setBitcoinUnits: (state, { payload }: PayloadAction<PROTO.AmountUnit>) => {
            state.bitcoinUnits = payload;
        },
        setViewOnlyCancelationTimestamp: (state, { payload }: PayloadAction<number>) => {
            state.viewOnlyCancelationTimestamp = payload;
        },
    },
});

export const selectFiatCurrencyCode = (state: SettingsSliceRootState) =>
    state.appSettings.fiatCurrencyCode;
export const selectBitcoinUnits = (state: SettingsSliceRootState) => state.appSettings.bitcoinUnits;
export const selectIsOnboardingFinished = (state: SettingsSliceRootState) =>
    state.appSettings.isOnboardingFinished;
export const selectViewOnlyCancelationTimestamp = (state: SettingsSliceRootState) =>
    state.appSettings.viewOnlyCancelationTimestamp;

export const {
    setIsOnboardingFinished,
    setFiatCurrency,
    setBitcoinUnits,
    setViewOnlyCancelationTimestamp,
} = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
