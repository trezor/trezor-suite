import { useDispatch, useSelector } from 'react-redux';

import { disposeAllLocalFirstStorageThunk } from '@suite-common/local-first-storage';
import { initNativeLocalFirstStorageThunk } from '@suite-native/native-local-first-storage';

import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
    toggleFeatureFlag,
} from './featureFlagsSlice';

export const useToggleFeatureFlag = (featureFlag: FeatureFlag): (() => void) => {
    const dispatch = useDispatch();

    const originalFlagState = useSelector((state: FeatureFlagsRootState) =>
        selectIsFeatureFlagEnabled(state, FeatureFlag.IsLocalFirstStorageEnabled),
    );

    return () => {
        console.log('____useToggleFeatureFlag', featureFlag);

        dispatch(toggleFeatureFlag({ featureFlag }));

        if (featureFlag === FeatureFlag.IsLocalFirstStorageEnabled) {
            if (!originalFlagState) {
                dispatch(initNativeLocalFirstStorageThunk());
            } else {
                dispatch(disposeAllLocalFirstStorageThunk());
            }
        }
    };
};
