import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';

import { type FeatureFlag, toggleFeatureFlag } from './featureFlagsSlice';

export const useToggleFeatureFlag = (featureFlag: FeatureFlag): (() => void) => {
    const { dispatch } = useServices(selectDispatch);

    return () => {
        dispatch(toggleFeatureFlag({ featureFlag }));
    };
};
