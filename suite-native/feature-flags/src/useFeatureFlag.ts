import { useSelector } from 'react-redux';

import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from './featureFlagsSlice';

export const useFeatureFlag = (featureFlag: FeatureFlag): boolean => {
    const isFeatureFlagEnabled = useSelector((state: FeatureFlagsRootState) =>
        selectIsFeatureFlagEnabled(state, featureFlag),
    );

    return isFeatureFlagEnabled;
};
