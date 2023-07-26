// todo: at this moment this is used only in Firmware effectively being the 3rd level of
// prerequisites management (1st level Preloader, 2nd level Onboarding - UnexpectedStates, 3rd level Firmware)
// I think that with some effort this could be also removed and optimized

import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'src/hooks/suite';
import { ConnectDevicePrompt } from 'src/components/suite';
import { isWebUsb } from 'src/utils/suite/transport';
import { getConnectedDeviceStatus } from 'src/utils/suite/device';
import type { TrezorDevice } from 'src/types/suite';

// todo: these should be replaced
import { NoTransport } from './components/NoTransport';
import { NoDeviceDetected } from './components/NoDeviceDetected';
import { UnexpectedDeviceState } from './components/UnexpectedDeviceState';
import { motion } from 'framer-motion';
import { motionEasing } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const ContentWrapper = styled(motion.div)`
    display: flex;
`;

interface ConnectDevicePromptManagerProps {
    device: TrezorDevice | undefined;
    children?: React.ReactNode;
}

/**
 *  Renders children only if device is connected and in normal mode
 *  Handles all connection-related problems and displays appropriate UI to inform user
 *  Handled cases:
 *  1. transport layer (bridge/webusb) not available
 *  2. Device not detected
 *  3. Device in unexpected state (unreadable, seedless, in bootloader)
 */
export const ConnectDevicePromptManager = ({
    device,
    children,
}: ConnectDevicePromptManagerProps) => {
    const { transport } = useSelector(state => ({
        transport: state.suite.transport,
    }));
    const deviceStatus = getConnectedDeviceStatus(device);
    const isDetectingDevice =
        (device && device.features && device.connected) || deviceStatus === 'unreadable';
    const deviceModelInternal = device?.features?.internal_model;

    const deviceInUnexpectedState = isDetectingDevice
        ? deviceStatus !== 'ok' && deviceStatus !== 'initialized'
        : false;

    let content: JSX.Element | null = null;

    // todo: move to some hook or something

    if (!transport?.type) {
        // No transport layer available to communicate with the device => we should offer downloading the Bridge. (Eg. firefox user without bridge installed)
        // It shouldn't happen in Chrome and desktop app as bridge is built-in and there should be WebUSB as a fallback
        // In normal circumstances transport.type is "bridge" or "WebUsbPlugin".
        content = <NoTransport />;
    } else if (!isDetectingDevice) {
        // Transport layer is available, but still no device detected (show WebUSB "check for devices" button if possible and provide helpful tips)
        content = <NoDeviceDetected offerWebUsb={isWebUsb(transport)} />;
    } else if (deviceInUnexpectedState) {
        // Device detected, but it is in unexpected state (unreadable, seedless, in bootloader)
        content = (
            <UnexpectedDeviceState
                deviceStatus={deviceStatus!}
                deviceModelInternal={deviceModelInternal}
            />
        );
    }

    return (
        <Wrapper>
            <ConnectDevicePrompt
                connected={isDetectingDevice}
                showWarning={deviceInUnexpectedState}
            />

            <ContentWrapper
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5, ease: motionEasing.enter }}
            >
                {content ?? children}
            </ContentWrapper>
        </Wrapper>
    );
};
