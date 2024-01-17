import { useSelector } from 'react-redux';

import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import {
    selectAreAllDevicesDisconnectedOrAccountless,
    selectIsSelectedDeviceAuthorized,
    selectIsSelectedDeviceImported,
} from '@suite-common/wallet-core';
import { selectIsDeviceReadyToUse } from '@suite-native/device';

import { EmptyPortfolioTrackerState } from './EmptyPortfolioTrackerState';
import { EmptyConnectedDeviceState } from './EmptyConnectedDeviceState';
import { EmptyPortfolioCrossroads } from './EmptyPortfolioCrossroads';

export const EmptyHomeRenderer = () => {
    const [isUsbDeviceConnectFeatureEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    const isDeviceAuthorized = useSelector(selectIsSelectedDeviceAuthorized);
    const isDeviceImported = useSelector(selectIsSelectedDeviceImported);
    const areAllDevicesDisconnectedOrAccountless = useSelector(
        selectAreAllDevicesDisconnectedOrAccountless,
    );
    const isDeviceReadyToUse = useSelector(selectIsDeviceReadyToUse);

    // This state is present only for a fraction of second while redirecting to the Connecting screen is already happening.
    // Because the animation takes some time, this makes sure that the screen content of newly selected device does not flash during the redirect.
    if (!isDeviceImported && !isDeviceReadyToUse) {
        return null;
    }

    if (isUsbDeviceConnectFeatureEnabled) {
        // Crossroads should be displayed only if there is no real device connected and portfolio tracker has no accounts.
        if (areAllDevicesDisconnectedOrAccountless) {
            return <EmptyPortfolioCrossroads />;
        }

        if (!isDeviceImported && isDeviceAuthorized) {
            return <EmptyConnectedDeviceState />;
        }
    }

    return <EmptyPortfolioTrackerState />;
};
