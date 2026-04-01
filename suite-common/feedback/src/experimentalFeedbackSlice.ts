import { type ActionReducerMapBuilder, type PayloadAction, createSlice } from '@reduxjs/toolkit';

type UsageCount<T extends string> = Partial<Record<T, number>>;

export type ExperimentalFeedbackState<FeatureName extends string = string> = {
    usageCounts: UsageCount<FeatureName>;
    pendingFeedbackFeatures: FeatureName[];
};

export type ExperimentalFeedbackRootState<FeatureName extends string = string> = {
    experimentalFeedback: ExperimentalFeedbackState<FeatureName>;
};

export const experimentalFeedbackInitialState: ExperimentalFeedbackState = {
    usageCounts: {},
    pendingFeedbackFeatures: [],
};

export const FEEDBACK_THRESHOLD = 3;

export function createExperimentalFeedbackSlice<FeatureName extends string>(options?: {
    extraReducers?: (
        builder: ActionReducerMapBuilder<ExperimentalFeedbackState<FeatureName>>,
    ) => void;
}) {
    return createSlice({
        name: 'experimentalFeedback',
        initialState: experimentalFeedbackInitialState as ExperimentalFeedbackState<FeatureName>,
        reducers: {
            /** Increments usage count and queues the feedback modal once the threshold is reached.
             * Counting stops at the threshold to avoid re-triggering the modal. */
            featureUsed: (state, { payload }: PayloadAction<FeatureName>) => {
                const counts = state.usageCounts as UsageCount<FeatureName>;
                const pending = state.pendingFeedbackFeatures as FeatureName[];

                const currentCount = counts[payload] ?? 0;

                if (currentCount < FEEDBACK_THRESHOLD) {
                    const newCount = currentCount + 1;

                    counts[payload] = newCount;

                    if (newCount === FEEDBACK_THRESHOLD && !pending.includes(payload)) {
                        pending.push(payload);
                    }
                }
            },
            /** Queues the feedback modal for a feature. Pass `isFeatureBeingDisabled: true` when
             * the user turns the feature off — this resets the usage count so a fresh count
             * starts if the feature is re-enabled later. This is the intended way to trigger
             * feedback on toggle-off: a single dispatch both resets the count and opens the
             * modal. */
            feedbackRequested: (
                state,
                {
                    payload,
                }: PayloadAction<{ feature: FeatureName; isFeatureBeingDisabled?: boolean }>,
            ) => {
                const counts = state.usageCounts as UsageCount<FeatureName>;
                const pending = state.pendingFeedbackFeatures as FeatureName[];
                if (payload.isFeatureBeingDisabled) {
                    delete counts[payload.feature];
                }
                if (!pending.includes(payload.feature)) {
                    pending.push(payload.feature);
                }
            },
            feedbackDismissed: (state, { payload }: PayloadAction<FeatureName>) => {
                const pending = state.pendingFeedbackFeatures as FeatureName[];
                const index = pending.indexOf(payload);
                if (index !== -1) {
                    pending.splice(index, 1);
                }
            },
        },
        ...(options?.extraReducers !== undefined ? { extraReducers: options.extraReducers } : {}),
    });
}
