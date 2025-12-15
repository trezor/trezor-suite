import { useDispatch } from 'react-redux';

import { type FeatureFlag, toggleFeatureFlag } from './featureFlagsSlice';

export const useToggleFeatureFlag = (featureFlag: FeatureFlag): (() => void) => {
    const dispatch = useDispatch();

    return () => {
        dispatch(toggleFeatureFlag({ featureFlag }));
    };
};
