import { type PayloadAction, type UnknownAction } from '@reduxjs/toolkit';

import type { FeedbackFeatureName } from '@suite/experimental';
import { type FeatureFeedbackState, createFeatureFeedbackSlice } from '@suite-common/feedback';

type StorageLoadFeatureFeedbackAction = PayloadAction<
    { featureFeedback?: FeatureFeedbackState<FeedbackFeatureName> },
    '@storage/load'
>;

const featureFeedbackSlice = createFeatureFeedbackSlice<FeedbackFeatureName>({
    extraReducers: builder =>
        builder.addMatcher(
            (action: UnknownAction): action is StorageLoadFeatureFeedbackAction =>
                action.type === '@storage/load',
            (state, action) => action.payload.featureFeedback ?? state,
        ),
});

export const featureFeedbackActions = featureFeedbackSlice.actions;
export const { featureUsed, feedbackRequested, feedbackDismissed } = featureFeedbackActions;
export const featureFeedbackReducer = featureFeedbackSlice.reducer;
export const initialState = featureFeedbackSlice.getInitialState();
