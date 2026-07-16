import { type AnyAction } from '@reduxjs/toolkit';

import type { FeedbackFeatureName } from '@suite/experimental';
import { createFeatureFeedbackSlice } from '@suite-common/feedback';

const featureFeedbackSlice = createFeatureFeedbackSlice<FeedbackFeatureName>({
    extraReducers: builder =>
        builder.addMatcher(
            (action): action is AnyAction => action.type === '@storage/load',
            (state, action: AnyAction) => action.payload.featureFeedback ?? state,
        ),
});

export const featureFeedbackActions = featureFeedbackSlice.actions;
export const { featureUsed, feedbackRequested, feedbackDismissed } = featureFeedbackActions;
export const featureFeedbackReducer = featureFeedbackSlice.reducer;
export const initialState = featureFeedbackSlice.getInitialState();
