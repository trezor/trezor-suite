import { type FeatureFeedbackRootState } from './feedbackSlice';

export const selectFeatureFeedback = <FeatureName extends string>(
    state: FeatureFeedbackRootState<FeatureName>,
) => state.featureFeedback;

/** Returns the next feature awaiting feedback, or `null` if the queue is empty.
 * Features are processed one at a time; call `feedbackDismissed` to advance the queue. */
export const selectPendingFeedbackFeature = <FeatureName extends string>(
    state: FeatureFeedbackRootState<FeatureName>,
): FeatureName | null => state.featureFeedback.pendingFeedbackFeatures[0] ?? null;
