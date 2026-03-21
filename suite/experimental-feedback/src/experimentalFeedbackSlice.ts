import { type AnyAction } from '@reduxjs/toolkit';

import type { ExperimentalFeature } from '@suite/experimental';
import { createFeatureFeedbackSlice } from '@suite-common/feedback';

export const featureFeedbackSlice = createFeatureFeedbackSlice<ExperimentalFeature>({
    extraReducers: builder =>
        builder.addMatcher(
            (action): action is AnyAction => action.type === '@storage/load',
            (state, action: AnyAction) => action.payload.featureFeedback ?? state,
        ),
});

export const { featureUsed, feedbackRequested, feedbackDismissed } = featureFeedbackSlice.actions;
export const featureFeedbackReducer = featureFeedbackSlice.reducer;
export const initialState = featureFeedbackSlice.getInitialState();
