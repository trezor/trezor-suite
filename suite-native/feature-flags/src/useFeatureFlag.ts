import { useSelector } from 'react-redux';

import { selectIsFeatureFlagEnabled } from './featureFlagsSelectors';
import { type FeatureFlag, type FeatureFlagsRootState } from './featureFlagsSlice';

export const useFeatureFlag = (featureFlag: FeatureFlag): boolean => {
    const isFeatureFlagEnabled = useSelector((state: FeatureFlagsRootState) =>
        selectIsFeatureFlagEnabled(state, featureFlag),
    );

    return isFeatureFlagEnabled;
};
