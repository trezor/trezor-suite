import React from 'react';
import styled from 'styled-components';
import { useSelector } from '@suite-hooks';
import { isWebUSB } from '@suite-utils/transport';
import { getConnectedDeviceStatus } from '@suite-utils/device';
import { ConnectDevicePrompt } from '@onboarding-components';
import NoTransport from './components/NoTransport';
import NoDeviceDetected from './components/NoDeviceDetected';
import UnexpectedDeviceState from './components/UnexpectedDeviceState';
import { TrezorDevice } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

interface Props {
    device: TrezorDevice | undefined;
    children?: React.ReactNode;
}

const ConnectDevicePromptManager = ({ device, children }: Props) => {
    // Renders children only if device is connected and in normal mode
    // Handles all connection-related problems and displays appropriate UI to inform user
    // Handled cases:
    // 1. transport layer (bridge/webusb) not available
    // 2. Device not detected
    // 3. Device in unexpected state (unreadable, seedless, in bootloader)

    const { transport } = useSelector(state => ({
        transport: state.suite.transport,
    }));
    const deviceStatus = getConnectedDeviceStatus(device);
    const isDetectingDevice =
        (device && device.features && device.connected) || deviceStatus === 'unreadable';

    const deviceInUnexpectedState = isDetectingDevice
        ? deviceStatus !== 'ok' && deviceStatus !== 'initialized'
        : false;

    let content: JSX.Element | null = null;
    if (!transport?.type) {
        // No transport layer available to communicate with the device => we should offer downloading the Bridge. (Eg. firefox user without bridge installed)
        // It shouldn't happen in Chrome and desktop app as bridge is built-in and there should be WebUSB as a fallback
        // In normal circumstances transport.type is "bridge" or "WebUsbPlugin".
        content = <NoTransport />;
    } else if (!isDetectingDevice) {
        // Transport layer is available, but still no device detected (show WebUSB "check for devices" button if possible and provide helpful tips)
        content = <NoDeviceDetected offerWebUsb={isWebUSB(transport)} />;
    } else if (deviceInUnexpectedState) {
        // Device detected, but it is in unexpected state (unreadable, seedless, in bootloader)
        content = (
            <UnexpectedDeviceState
                deviceStatus={deviceStatus!}
                trezorModel={device?.features?.major_version}
            />
        );
    }

    return (
        <Wrapper>
            <ConnectDevicePrompt
                connected={isDetectingDevice}
                showWarning={deviceInUnexpectedState}
            />
            {content ?? children}
        </Wrapper>
    );
};

export default ConnectDevicePromptManager;
