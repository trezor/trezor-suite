import { AnyAction, PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { ExperimentalFeature } from '@suite/experimental';

import { FEEDBACK_THRESHOLD } from './constants';

export type ExperimentalFeedbackState = {
    usageCounts: Partial<Record<ExperimentalFeature, number>>;
    pendingFeedbackFeatures: ExperimentalFeature[];
};

export type ExperimentalFeedbackRootState = {
    experimentalFeedback: ExperimentalFeedbackState;
};

export const initialState: ExperimentalFeedbackState = {
    usageCounts: {},
    pendingFeedbackFeatures: [],
};

export const experimentalFeedbackSlice = createSlice({
    name: 'experimentalFeedback',
    initialState,
    reducers: {
        /** Increments usage count and queues the feedback modal once the threshold is reached.
         * Counting stops at the threshold to avoid re-triggering the modal. */
        featureUsed: (state, { payload }: PayloadAction<ExperimentalFeature>) => {
            const currentCount = state.usageCounts[payload] ?? 0;

            if (currentCount < FEEDBACK_THRESHOLD) {
                const newCount = currentCount + 1;

                state.usageCounts[payload] = newCount;

                if (
                    newCount === FEEDBACK_THRESHOLD &&
                    !state.pendingFeedbackFeatures.includes(payload)
                ) {
                    state.pendingFeedbackFeatures.push(payload);
                }
            }
        },
        /** Queues the feedback modal for a feature. Pass `isFeatureBeingDisabled: true` when the
         * user turns the feature off — this resets the usage count so a fresh count starts if
         * the feature is re-enabled later. This is the intended way to trigger feedback on
         * toggle-off: a single dispatch both resets the count and opens the modal. */
        feedbackRequested: (
            state,
            {
                payload,
            }: PayloadAction<{ feature: ExperimentalFeature; isFeatureBeingDisabled?: boolean }>,
        ) => {
            if (payload.isFeatureBeingDisabled) {
                delete state.usageCounts[payload.feature];
            }
            if (!state.pendingFeedbackFeatures.includes(payload.feature)) {
                state.pendingFeedbackFeatures.push(payload.feature);
            }
        },
        feedbackDismissed: (state, { payload }: PayloadAction<ExperimentalFeature>) => {
            const index = state.pendingFeedbackFeatures.indexOf(payload);
            if (index !== -1) {
                state.pendingFeedbackFeatures.splice(index, 1);
            }
        },
    },
    extraReducers: builder => {
        builder.addMatcher(
            (action): action is AnyAction => action.type === '@storage/load',
            (state, action: AnyAction) => action.payload.experimentalFeedback ?? state,
        );
    },
});

export const { featureUsed, feedbackRequested, feedbackDismissed } =
    experimentalFeedbackSlice.actions;
export const experimentalFeedbackReducer = experimentalFeedbackSlice.reducer;
