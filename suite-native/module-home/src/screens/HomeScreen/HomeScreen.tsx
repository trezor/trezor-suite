import React, { useRef } from 'react';
import { useSelector } from 'react-redux';

import {
    selectDeviceAuthFailed,
    selectIsDeviceAuthorized,
    selectIsDeviceInitialized,
    selectIsDeviceUnlocked,
    selectIsDiscoveredDeviceAccountless,
} from '@suite-common/wallet-core';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';

import { EmptyHomeRenderer } from './components/EmptyHomeRenderer';
import { PortfolioContent } from './components/PortfolioContent';
import { PortfolioGraphRef } from './components/PortfolioGraph';
import { useHomeRefreshControl } from './useHomeRefreshControl';
import { useShowViewOnlyAlert } from './useShowViewOnlyAlert';

export const HomeScreen = () => {
    const isDiscoveredDeviceAccountless = useSelector(selectIsDiscoveredDeviceAccountless);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isDeviceAuthFailed = useSelector(selectDeviceAuthFailed);
    const isDeviceUnlocked = useSelector(selectIsDeviceUnlocked);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);

    const isEmptyHomeRendererShown =
        (isDiscoveredDeviceAccountless && // There has to be no accounts and discovery not active.
            (isDeviceAuthorized || // Initial state is empty portfolio device, that is authorized.
                isDeviceAuthFailed || // When user click cancel on PIN entry or it fails from other reason.
                !isDeviceUnlocked)) || // When user click cancel, it takes some time before isDeviceAuthFailed is set.
        !isDeviceInitialized;

    const portfolioContentRef = useRef<PortfolioGraphRef>(null);
    const refreshControl = useHomeRefreshControl({
        isDiscoveredDeviceAccountless,
        portfolioContentRef,
    });

    useShowViewOnlyAlert();

    return (
        <Screen
            header={<DeviceManagerScreenHeader />}
            refreshControl={refreshControl}
            noHorizontalPadding
        >
            {isEmptyHomeRendererShown ? (
                <EmptyHomeRenderer />
            ) : (
                <PortfolioContent ref={portfolioContentRef} />
            )}
        </Screen>
    );
};
