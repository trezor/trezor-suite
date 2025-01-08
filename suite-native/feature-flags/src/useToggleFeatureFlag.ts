import { useDispatch } from 'react-redux';

import { FeatureFlag, toggleFeatureFlag } from './featureFlagsSlice';

export const useToggleFeatureFlag = (featureFlag: FeatureFlag): (() => void) => {
    const dispatch = useDispatch();

    return () => dispatch(toggleFeatureFlag({ featureFlag }));
};
