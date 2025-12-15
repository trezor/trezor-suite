import { launchArguments } from '@suite-native/config';

import type { FeatureFlag, FeatureFlagsRootState } from './featureFlagsSlice';

export const selectIsFeatureFlagEnabled = (state: FeatureFlagsRootState, key: FeatureFlag) =>
    launchArguments[key] ?? state.featureFlags[key];
