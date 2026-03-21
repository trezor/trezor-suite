import { createFeatureFeedbackSlice } from '@suite-common/feedback';
import type { ExperimentalFeature } from '@suite-native/settings';

export const featureFeedbackSlice = createFeatureFeedbackSlice<ExperimentalFeature>();

export const { featureUsed, feedbackRequested, feedbackDismissed } = featureFeedbackSlice.actions;
export const featureFeedbackReducer = featureFeedbackSlice.reducer;
export const featureFeedbackInitialState = featureFeedbackSlice.getInitialState();
