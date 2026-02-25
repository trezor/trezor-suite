import { ExperimentalFeature, ExperimentalFeedbackRootState } from './experimentalFeedbackSlice';

export const selectExperimentalFeatureUsageCount = (
    state: ExperimentalFeedbackRootState,
    feature: ExperimentalFeature,
) => state.experimentalFeedback.usageCounts[feature] ?? 0;

export const selectPendingFeedbackFeature = (state: ExperimentalFeedbackRootState) =>
    state.experimentalFeedback.pendingFeedbackFeatures[0] ?? null;
