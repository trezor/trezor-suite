import { useSelector } from 'react-redux';

import { selectIsLocalFirstStorageEnabled } from '@suite-common/local-first-storage/src/labeling/labelingSelectors';
import { selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';

export const useIsLabelingEnabled = () => {
    const isFeatureFlagOn = useSelector(selectIsLocalFirstStorageEnabled);

    const isPortfolioTracker = useSelector(selectIsPortfolioTrackerDevice);

    return isFeatureFlagOn && !isPortfolioTracker;
};
