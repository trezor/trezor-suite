import { useSelector } from 'react-redux';

import { launchArguments } from '@suite-native/config';

import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from './featureFlagsSlice';

export const useFeatureFlag = (featureFlag: FeatureFlag): boolean => {
    const isFeatureFlagEnabled = useSelector((state: FeatureFlagsRootState) =>
        selectIsFeatureFlagEnabled(state, featureFlag),
    );

    return launchArguments[featureFlag] ?? isFeatureFlagEnabled;
};
