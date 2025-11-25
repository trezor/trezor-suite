import {
    WithSuiteSyncAndDeviceState,
    selectIsFeatureLocalFirstStorageAvailable,
} from '@suite-common/suite-sync';
import { selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';

export const selectIsLabelingEnabled = (state: WithSuiteSyncAndDeviceState) => {
    const isLabelingFeatureFlagOn = selectIsFeatureLocalFirstStorageAvailable(state);
    const isPortfolioTracker = selectIsPortfolioTrackerDevice(state);

    return isLabelingFeatureFlagOn && !isPortfolioTracker;
};
