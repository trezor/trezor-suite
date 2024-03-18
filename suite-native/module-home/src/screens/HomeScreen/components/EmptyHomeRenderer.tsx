import { useSelector } from 'react-redux';

import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import {
    selectAreAllDevicesDisconnectedOrAccountless,
    selectIsDeviceAuthorized,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { selectIsDeviceReadyToUse } from '@suite-native/device';

import { EmptyPortfolioTrackerState } from './EmptyPortfolioTrackerState';
import { EmptyConnectedDeviceState } from './EmptyConnectedDeviceState';
import { EmptyPortfolioCrossroads } from './EmptyPortfolioCrossroads';

export const EmptyHomeRenderer = () => {
    const [isUsbDeviceConnectFeatureEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const areAllDevicesDisconnectedOrAccountless = useSelector(
        selectAreAllDevicesDisconnectedOrAccountless,
    );
    const isDeviceReadyToUse = useSelector(selectIsDeviceReadyToUse);

    // This state is present only for a fraction of second while redirecting to the Connecting screen is already happening.
    // Because the animation takes some time, this makes sure that the screen content of newly selected device does not flash during the redirect.
    if (!isPortfolioTrackerDevice && !isDeviceReadyToUse) {
        return null;
    }

    if (isUsbDeviceConnectFeatureEnabled) {
        // Crossroads should be displayed if there is no real device connected and portfolio tracker has no accounts
        // or if there is device connected, but not authorized (PIN enter cancelled).
        if (areAllDevicesDisconnectedOrAccountless || !isDeviceAuthorized) {
            return <EmptyPortfolioCrossroads />;
        }

        if (!isPortfolioTrackerDevice && isDeviceAuthorized) {
            return <EmptyConnectedDeviceState />;
        }
    }

    return <EmptyPortfolioTrackerState />;
};
