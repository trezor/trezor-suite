import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OnboardingState {
    isFinished: boolean;
}

type OnboardingSlice = {
    appOnboarding: OnboardingState;
};

const initialState: OnboardingState = {
    isFinished: false,
};

export const appOnboardingSlice = createSlice({
    name: 'appOnboarding',
    initialState,
    reducers: {
        setOnboardingFinished: (state, action: PayloadAction<boolean>) => {
            state.isFinished = action.payload;
        },
    },
});

export const selectIsOnboardingFinished = (state: OnboardingSlice) =>
    state.appOnboarding.isFinished;

export const { setOnboardingFinished } = appOnboardingSlice.actions;
export const appOnboardingReducer = appOnboardingSlice.reducer;
