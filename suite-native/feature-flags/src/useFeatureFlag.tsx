import { useDispatch, useSelector } from 'react-redux';

import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
    toggleFeatureFlag,
} from './featureFlagsSlice';

type FeatureFlagHookReturnType = [boolean, () => void];

export const useFeatureFlag = (featureFlag: FeatureFlag): FeatureFlagHookReturnType => {
    const dispatch = useDispatch();

    const isFeatureFlagEnabled = useSelector((state: FeatureFlagsRootState) =>
        selectIsFeatureFlagEnabled(state, featureFlag),
    );

    const toggleIsFeatureFlagEnabled = () => {
        dispatch(toggleFeatureFlag({ featureFlag }));
    };

    return [isFeatureFlagEnabled, toggleIsFeatureFlagEnabled];
};
