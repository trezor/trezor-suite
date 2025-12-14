import {
    WithSuiteSyncAndDeviceState,
    selectIsFeatureSuiteSyncAvailable,
} from '@suite-common/suite-sync';
import { selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';

export const selectIsLabelingEnabled = (state: WithSuiteSyncAndDeviceState) => {
    const isSuiteSyncAvailable = selectIsFeatureSuiteSyncAvailable(state);
    const isPortfolioTracker = selectIsPortfolioTrackerDevice(state);

    return isSuiteSyncAvailable && !isPortfolioTracker;
};
