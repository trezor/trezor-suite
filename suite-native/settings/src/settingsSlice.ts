import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { PROTO } from '@trezor/connect';

export interface AppSettingsState {
    isOnboardingFinished: boolean;
    fiatCurrencyCode: FiatCurrencyCode;
    bitcoinUnits: PROTO.AmountUnit;
    viewOnlyCancelationTimestamp?: number;
    isFirmwareRevisionCheckEnabled: boolean;
    isFirmwareHashCheckEnabled: boolean;
}

export type SettingsSliceRootState = {
    appSettings: AppSettingsState;
};

export const appSettingsInitialState: AppSettingsState = {
    fiatCurrencyCode: 'usd',
    bitcoinUnits: PROTO.AmountUnit.BITCOIN,
    isOnboardingFinished: false,
    viewOnlyCancelationTimestamp: undefined,
    isFirmwareRevisionCheckEnabled: true,
    isFirmwareHashCheckEnabled: true,
};

export const appSettingsPersistWhitelist: Array<keyof AppSettingsState> = [
    'isOnboardingFinished',
    'fiatCurrencyCode',
    'bitcoinUnits',
    'viewOnlyCancelationTimestamp',
    'isFirmwareRevisionCheckEnabled',
    'isFirmwareHashCheckEnabled',
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
        setCheckFirmwareAuthenticity: (state, { payload }: PayloadAction<boolean>) => {
            state.isFirmwareRevisionCheckEnabled = payload;
            state.isFirmwareHashCheckEnabled = payload;
        },
    },
});

export const selectFiatCurrencyCode = (state: SettingsSliceRootState) =>
    state.appSettings.fiatCurrencyCode;
export const selectBitcoinUnits = (state: SettingsSliceRootState) => state.appSettings.bitcoinUnits;
export const selectAreSatsAmountUnit = (state: SettingsSliceRootState) =>
    selectBitcoinUnits(state) === PROTO.AmountUnit.SATOSHI;
export const selectIsOnboardingFinished = (state: SettingsSliceRootState) =>
    state.appSettings.isOnboardingFinished;
export const selectViewOnlyCancelationTimestamp = (state: SettingsSliceRootState) =>
    state.appSettings.viewOnlyCancelationTimestamp;

/**
 * Determine if either FW revision or FW hash check is disabled
 * (both are controlled by the same setting, see setCheckFirmwareAuthenticity reducer)
 */
export const selectIsFirmwareAuthenticityCheckEnabled = (state: SettingsSliceRootState) =>
    state.appSettings.isFirmwareRevisionCheckEnabled &&
    state.appSettings.isFirmwareHashCheckEnabled;

export const selectIsAmountInSats = (
    state: SettingsSliceRootState,
    symbol: NetworkSymbol | null | undefined,
) => {
    if (!symbol) {
        return false;
    }

    const network = getNetwork(symbol);
    const isAmountUnitSupported = network && network.features.includes('amount-unit');

    return isAmountUnitSupported && selectAreSatsAmountUnit(state);
};

export const {
    setIsOnboardingFinished,
    setFiatCurrency,
    setBitcoinUnits,
    setViewOnlyCancelationTimestamp,
    setCheckFirmwareAuthenticity,
} = appSettingsSlice.actions;
export const appSettingsReducer = appSettingsSlice.reducer;
