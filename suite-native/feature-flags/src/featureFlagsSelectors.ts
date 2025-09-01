import { FeatureFlag, FeatureFlagsRootState } from './featureFlagsSlice';

export const selectIsFeatureFlagEnabled = (state: FeatureFlagsRootState, key: FeatureFlag) =>
    state.featureFlags[key];
