import { AnyAction } from '@reduxjs/toolkit';

import type { ExperimentalFeature } from '@suite/experimental';
import { createExperimentalFeedbackSlice } from '@suite-common/feedback';

export const experimentalFeedbackSlice = createExperimentalFeedbackSlice<ExperimentalFeature>({
    extraReducers: builder =>
        builder.addMatcher(
            (action): action is AnyAction => action.type === '@storage/load',
            (state, action: AnyAction) => action.payload.experimentalFeedback ?? state,
        ),
});

export const { featureUsed, feedbackRequested, feedbackDismissed } =
    experimentalFeedbackSlice.actions;
export const experimentalFeedbackReducer = experimentalFeedbackSlice.reducer;
export const initialState = experimentalFeedbackSlice.getInitialState();
