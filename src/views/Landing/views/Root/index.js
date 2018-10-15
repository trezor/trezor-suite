/* @flow */

import React from 'react';
import { isWebUSB } from 'utils/device';

import LandingWrapper from 'views/Landing/components/LandingWrapper';
import BrowserNotSupported from 'views/Landing/components/BrowserNotSupported';
import ConnectDevice from 'views/Landing/components/ConnectDevice';
import InstallBridge from 'views/Landing/views/InstallBridge/Container';

import type { Props } from './Container';

const Root = (props: Props) => {
    const { initialized, browserState, transport } = props.connect;
    const { disconnectRequest } = props.wallet;
    const localStorageError = props.localStorage.error;
    const connectError = props.connect.error;

    const error = !initialized ? (localStorageError || connectError) : null;
    const shouldShowUnsupportedBrowser = browserState.supported === false;
    const shouldShowInstallBridge = initialized && connectError;
    const shouldShowConnectDevice = props.wallet.ready && props.devices.length < 1;
    const shouldShowDisconnectDevice = !!disconnectRequest;
    const isLoading = !error && !shouldShowUnsupportedBrowser && !shouldShowConnectDevice && !shouldShowUnsupportedBrowser;

    const deviceLabel = disconnectRequest ? disconnectRequest.label : '';
    // corner case: display InstallBridge view on "/" route
    // it has it's own Container and props
    if (shouldShowInstallBridge) return <InstallBridge />;

    return (
        <LandingWrapper loading={isLoading} error={error}>
            {shouldShowUnsupportedBrowser && <BrowserNotSupported />}
            {(shouldShowConnectDevice || shouldShowDisconnectDevice) && (
                <ConnectDevice
                    deviceLabel={deviceLabel}
                    showWebUsb={isWebUSB(transport)}
                    showDisconnect={shouldShowDisconnectDevice}
                />
            )}
        </LandingWrapper>
    );
};

export default Root;
