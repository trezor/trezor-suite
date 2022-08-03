import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OnboardingState {
    isOnboardingFinished: boolean;
}

type OnboardingSlice = {
    onboarding: OnboardingState;
};

const initialState: OnboardingState = {
    isOnboardingFinished: false,
};

export const onboardingSlice = createSlice({
    name: 'onboarding',
    initialState,
    reducers: {
        setOnboardingFinished: (state, action: PayloadAction<boolean>) => {
            state.isOnboardingFinished = action.payload;
        },
    },
});

export const selectIsOnboardingFinished = (state: OnboardingSlice) =>
    state.onboarding.isOnboardingFinished;

export const { setOnboardingFinished } = onboardingSlice.actions;
export const onboardingReducer = onboardingSlice.reducer;
