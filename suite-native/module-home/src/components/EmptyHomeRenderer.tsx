import { useSelector } from 'react-redux';

import { useIsUsbDeviceConnectFeatureEnabled } from '@suite-native/feature-flags';
import {
    selectIsSelectedDeviceAuthorized,
    selectIsSelectedDeviceImported,
} from '@suite-common/wallet-core';
import { selectIsAppFreshStart } from '@suite-native/accounts';

import { EmptyPortfolioTrackerState } from './EmptyPortfolioTrackerState';
import { EmptyConnectedDeviceState } from './EmptyConnectedDeviceState';
import { EmptyPortfolioCrossroads } from './EmptyPortfolioCrossroads';

export const EmptyHomeRenderer = () => {
    const { isUsbDeviceConnectFeatureEnabled } = useIsUsbDeviceConnectFeatureEnabled();
    const isDeviceImported = useSelector(selectIsSelectedDeviceImported);
    const isDeviceAuthorized = useSelector(selectIsSelectedDeviceAuthorized);
    const isAppFreshStart = useSelector(selectIsAppFreshStart);

    // crossroad should be displayed only if there is no real device connected.
    if (isAppFreshStart) {
        return <EmptyPortfolioCrossroads />;
    }

    if (isUsbDeviceConnectFeatureEnabled && !isDeviceImported && isDeviceAuthorized) {
        return <EmptyConnectedDeviceState />;
    }

    return <EmptyPortfolioTrackerState />;
};
