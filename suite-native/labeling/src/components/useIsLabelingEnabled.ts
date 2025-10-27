import { useSelector } from 'react-redux';

import { selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';
import {
    FeatureFlag,
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
} from '@suite-native/feature-flags';

export const useIsLabelingEnabled = () => {
    const isFeatureFlagOn = useSelector((state: FeatureFlagsRootState) =>
        selectIsFeatureFlagEnabled(state, FeatureFlag.showLocalFirstStorage),
    );

    const isPortfolioTracker = useSelector(selectIsPortfolioTrackerDevice);

    return isFeatureFlagOn && !isPortfolioTracker;
};
