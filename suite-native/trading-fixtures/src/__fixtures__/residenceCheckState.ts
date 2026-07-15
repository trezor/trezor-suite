import { FeatureFlag, featureFlagsInitialState } from '@suite-native/feature-flags';

export const residenceCheckDisabledState = {
    featureFlags: {
        ...featureFlagsInitialState,
        [FeatureFlag.IsTradingResidenceCheckEnabled]: false,
    },
};
