import { type ExperimentalFeedbackRootState } from './experimentalFeedbackSlice';

export const selectExperimentalFeatureUsageCount = <FeatureName extends string>(
    state: ExperimentalFeedbackRootState<FeatureName>,
    feature: FeatureName,
): number => state.experimentalFeedback.usageCounts[feature] ?? 0;

/** Returns the next feature awaiting feedback, or `null` if the queue is empty.
 * Features are processed one at a time; call `feedbackDismissed` to advance the queue. */
export const selectPendingFeedbackFeature = <FeatureName extends string>(
    state: ExperimentalFeedbackRootState<FeatureName>,
): FeatureName | null => state.experimentalFeedback.pendingFeedbackFeatures[0] ?? null;
