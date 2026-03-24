import { type AnyAction } from '@reduxjs/toolkit';

import type { FeedbackFeatureName } from '@suite/experimental';
import { createExperimentalFeedbackSlice } from '@suite-common/feedback';

export const experimentalFeedbackSlice = createExperimentalFeedbackSlice<FeedbackFeatureName>({
    extraReducers: builder =>
        builder.addMatcher(
            // TODO unify storage load functionality as part of: https://github.com/trezor/trezor-suite/issues/26094
            (action): action is AnyAction => action.type === '@storage/load',
            (state, action: AnyAction) => action.payload.experimentalFeedback ?? state,
        ),
});

export const { featureUsed, feedbackRequested, feedbackDismissed } =
    experimentalFeedbackSlice.actions;
export const experimentalFeedbackReducer = experimentalFeedbackSlice.reducer;
export const initialState = experimentalFeedbackSlice.getInitialState();
