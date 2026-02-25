import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { ExperimentalFeature } from '@suite/experimental';

import { FEEDBACK_THRESHOLD } from './constants';

export type ExperimentalFeedbackState = {
    usageCounts: Partial<Record<ExperimentalFeature, number>>;
    pendingFeedbackFeatures: ExperimentalFeature[];
};

export type ExperimentalFeedbackRootState = {
    experimentalFeedback: ExperimentalFeedbackState;
};

const initialState: ExperimentalFeedbackState = {
    usageCounts: {
        'suite-sync': 3,
    },
    pendingFeedbackFeatures: ['suite-sync'],
};

export const experimentalFeedbackSlice = createSlice({
    name: 'experimentalFeedback',
    initialState,
    reducers: {
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
        feedbackRequested: (
            state,
            { payload }: PayloadAction<{ feature: ExperimentalFeature; isDisabled?: boolean }>,
        ) => {
            if (payload.isDisabled) {
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
});

export const { featureUsed, feedbackRequested, feedbackDismissed } =
    experimentalFeedbackSlice.actions;
export const experimentalFeedbackReducer = experimentalFeedbackSlice.reducer;
