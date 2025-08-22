import { useSelector } from 'react-redux';

import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';

export const useIsLabelingEnabled = () =>
    useSelector((state: FeatureFlagsRootState) =>
        selectIsFeatureFlagEnabled(state, FeatureFlag.IsLocalFirstStorageEnabled),
    );
