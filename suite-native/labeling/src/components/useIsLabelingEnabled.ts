import { useSelector } from 'react-redux';

import { selectIsFeatureLocalFirstStorageAvailable } from '@suite-common/suite-sync';
import { selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';

export const useIsLabelingEnabled = () => {
    const isFeatureFlagOn = useSelector(selectIsFeatureLocalFirstStorageAvailable);

    const isPortfolioTracker = useSelector(selectIsPortfolioTrackerDevice);

    return isFeatureFlagOn && !isPortfolioTracker;
};
