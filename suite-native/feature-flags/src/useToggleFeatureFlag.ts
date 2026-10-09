import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { type FeatureFlag, toggleFeatureFlag } from './featureFlagsSlice';

export const useToggleFeatureFlag = (featureFlag: FeatureFlag): (() => void) => {
    const { dispatch } = useServices(injectDispatch);

    return () => {
        dispatch(toggleFeatureFlag({ featureFlag }));
    };
};
