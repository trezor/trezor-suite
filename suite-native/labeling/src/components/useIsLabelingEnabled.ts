import { useSelector } from 'react-redux';

import { selectIsFeatureSuiteSyncAvailable } from '@suite-common/suite-sync';
import { selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';

export const useIsLabelingEnabled = () => {
    const isFeatureFlagOn = useSelector(selectIsFeatureSuiteSyncAvailable);

    const isPortfolioTracker = useSelector(selectIsPortfolioTrackerDevice);

    return isFeatureFlagOn && !isPortfolioTracker;
};
