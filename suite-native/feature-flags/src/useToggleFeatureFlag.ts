import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';

import { type FeatureFlag, toggleFeatureFlag } from './featureFlagsSlice';

export const useToggleFeatureFlag = (featureFlag: FeatureFlag): (() => void) => {
    const { dispatch } = useServices(injectDispatch);

    return () => {
        dispatch(toggleFeatureFlag({ featureFlag }));
    };
};
