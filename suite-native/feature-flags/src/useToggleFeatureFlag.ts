import { injectDispatch } from '@suite-common/redux-utils';
import { useServices } from '@trezor/dependency-injection';

import { type FeatureFlag, toggleFeatureFlag } from './featureFlagsSlice';

export const useToggleFeatureFlag = (featureFlag: FeatureFlag): (() => void) => {
    const { dispatch } = useServices(injectDispatch);

    return () => {
        dispatch(toggleFeatureFlag({ featureFlag }));
    };
};
