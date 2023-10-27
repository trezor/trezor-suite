import { useSelector } from 'react-redux';

import { useIsUsbDeviceConnectFeatureEnabled } from '@suite-native/feature-flags';
import {
    selectIsSelectedDeviceAuthorized,
    selectIsSelectedDeviceImported,
} from '@suite-common/wallet-core';

import { EmptyPortfolioTrackerState } from './EmptyPortfolioTrackerState';
import { EmptyConnectedDeviceState } from './EmptyConnectedDeviceState';
import { EmptyPortfolioCrossroads } from './EmptyPortfolioCrossroads';

export const EmptyHomeRenderer = () => {
    const { isUsbDeviceConnectFeatureEnabled } = useIsUsbDeviceConnectFeatureEnabled();
    const isDeviceImported = useSelector(selectIsSelectedDeviceImported);
    const isDeviceAuthorized = useSelector(selectIsSelectedDeviceAuthorized);

    if (isUsbDeviceConnectFeatureEnabled) {
        if (!isDeviceImported && isDeviceAuthorized) {
            return <EmptyConnectedDeviceState />;
        }
    } else if (isDeviceImported) {
        return <EmptyPortfolioTrackerState />;
    }

    return <EmptyPortfolioCrossroads />;
};
