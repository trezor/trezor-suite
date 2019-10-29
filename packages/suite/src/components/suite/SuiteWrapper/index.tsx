import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button, P } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import { isWebUSB } from '@suite-utils/device';
import ConnectDevice from '@suite-components/landing/ConnectDevice';
import Loading from '@suite-components/landing/Loading';
import SuiteLayout from '@suite-components/SuiteLayout';
import Bridge from '@suite-views/bridge';
import AcquireDevice from '@suite-components/AcquireDevice';

import { AppState, Dispatch } from '@suite-types';

interface OwnProps {
    children: React.ReactNode;
}

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
    devices: state.devices,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = OwnProps & ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Index = (props: Props) => {
    const { suite, goto } = props;
    const { transport, loaded, device } = props.suite;

    if (!loaded || !transport) {
        // still loading or
        // connect was initialized, but didn't emit "TRANSPORT" event yet (it could take a while).
        return <Loading />;
    }

    if (!transport.type) {
        return (
            <SuiteLayout>
                <Bridge />
            </SuiteLayout>
        );
    }

    // no available device
    if (!device) {
        return (
            <ConnectDevice
                showWebUsb={isWebUSB(suite.transport)}
                // showDisconnect={shouldShowDisconnectDevice}
                // deviceLabel={deviceLabel}
                deviceLabel=""
                showDisconnect={false}
            />
        );
    }

    if (device.type === 'unacquired') {
        return <AcquireDevice />;
    }

    if (device.features && device.mode === 'initialize') {
        return (
            <SuiteLayout showSuiteHeader>
                <P data-test="initialize-message">Device is not set up.</P>
                <Button onClick={() => goto('onboarding-index')}>Go to setup wizard</Button>
            </SuiteLayout>
        );
    }

    /*
        This cases happens after failed firwmare update or for fresh device. 
    */
    if (
        device.features &&
        device.mode === 'bootloader' &&
        device.features.firmware_present === false
    ) {
        return (
            <SuiteLayout showSuiteHeader>
                <P data-test="no-firmware-message">Device has no firmware installed. </P>
                <Button onClick={() => goto('onboarding-index')}>Go to setup wizard</Button>
            </SuiteLayout>
        );
    }

    // general bootloader case, has firmware installed
    if (device.features && device.mode === 'bootloader') {
        return (
            <SuiteLayout showSuiteHeader>
                <P data-test="bootloader-message">Device is in bootloader mode. Reconnect it.</P>
                <Button onClick={() => goto('suite-device-firmware')}>Or go to firmware</Button>
            </SuiteLayout>
        );
    }

    if (device.type === 'unreadable') {
        return (
            <SuiteLayout showSuiteHeader>
                <P data-test="unreadable-device-message">
                    We cant see details about your device. It might be Trezor with old firmware or
                    possibly any USB device. To make communication possible, you will need to
                    install Trezor Bridge.{' '}
                </P>
                <Button onClick={() => goto('suite-bridge')}>See details</Button>
            </SuiteLayout>
        );
    }

    if (device.features && device.firmware === 'required') {
        return (
            <SuiteLayout showSuiteHeader>
                <P data-test="firmware-required-message">
                    Your device has firmware that is no longer supported. You will need to update
                    it.{' '}
                </P>
                <Button onClick={() => goto('suite-device-firmware')}>See details</Button>
            </SuiteLayout>
        );
    }

    if (device.features && device.mode === 'seedless') {
        return (
            <SuiteLayout showSuiteHeader>
                <P data-test="seedles-message">
                    Your device is in seedless mode and is not allowed to be used with this wallet.
                </P>
            </SuiteLayout>
        );
    }

    return <>{props.children}</>;
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Index);
