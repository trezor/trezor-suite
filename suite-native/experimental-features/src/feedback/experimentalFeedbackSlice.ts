import { createExperimentalFeedbackSlice } from '@suite-common/feedback';
import type { ExperimentalFeature } from '@suite-native/settings';

export const experimentalFeedbackSlice = createExperimentalFeedbackSlice<ExperimentalFeature>();

export const { featureUsed, feedbackRequested, feedbackDismissed } =
    experimentalFeedbackSlice.actions;
export const experimentalFeedbackReducer = experimentalFeedbackSlice.reducer;
