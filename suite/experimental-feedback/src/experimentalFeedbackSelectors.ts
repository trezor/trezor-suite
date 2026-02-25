import { ExperimentalFeature } from '@suite/experimental';

import { ExperimentalFeedbackRootState } from './experimentalFeedbackSlice';

export const selectExperimentalFeatureUsageCount = (
    state: ExperimentalFeedbackRootState,
    feature: ExperimentalFeature,
) => state.experimentalFeedback.usageCounts[feature] ?? 0;

/** Returns the next feature awaiting feedback, or `null` if the queue is empty.
 * Features are processed one at a time; call `feedbackDismissed` to advance the queue. */
export const selectPendingFeedbackFeature = (state: ExperimentalFeedbackRootState) =>
    state.experimentalFeedback.pendingFeedbackFeatures[0] ?? null;
