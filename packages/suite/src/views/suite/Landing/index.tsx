import React from 'react';

import LandingWrapper from './components/LandingWrapper';
import BetaDisclaimer from './components/BetaDisclaimer';
import BrowserNotSupported from './components/BrowserNotSupported';
import ConnectDevice from './components/ConnectDevice';
import InstallBridge from '../InstallBridge/Container';
import { isWebUSB } from '../../../utils/device';

const Root = (props: any) => {
    const { initialized, browserState, transport } = props.connect;
    const { disconnectRequest } = props.wallet;
    const localStorageError = props.localStorage.error;
    const connectError = props.connect.error;

    if (props.wallet.showBetaDisclaimer) return <BetaDisclaimer />;

    const error = !initialized ? localStorageError || connectError : null;
    const shouldShowUnsupportedBrowser = browserState.supported === false;
    const shouldShowInstallBridge = initialized && connectError;
    const shouldShowConnectDevice = props.wallet.ready && props.devices.length < 1;
    const shouldShowDisconnectDevice = !!disconnectRequest;
    const isLoading =
        !error &&
        !shouldShowUnsupportedBrowser &&
        !shouldShowConnectDevice &&
        !shouldShowUnsupportedBrowser;

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
