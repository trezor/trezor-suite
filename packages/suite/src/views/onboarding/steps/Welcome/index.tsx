import React, { useState } from 'react';
import styled from 'styled-components';
import { useSpring, Transition, useTransition, config, animated } from 'react-spring';
import { useSelector } from '@suite-hooks';
import { isWebUSB } from '@suite-utils/transport';
import { getConnectedDeviceStatus } from '@suite-utils/device';
import WelcomeLayout from '@onboarding-components/Layouts/WelcomeLayout';
import ConnectDevicePrompt from '@onboarding-components/ConnectDevicePrompt';
import NoTransport from './NoTransport';
import NoDeviceDetected from './NoDeviceDetected';
import UnexpectedDeviceState from './UnexpectedDeviceState';
import PreOnboardingSetup from './PreOnboardingSetup';

const WelcomeStep = () => {
    const { device, transport } = useSelector(state => ({
        device: state.suite.device,
        transport: state.suite.transport,
    }));
    const deviceStatus = getConnectedDeviceStatus(device);
    const isDetectingDevice =
        (device && device.features && device.connected) || deviceStatus === 'unreadable';

    const deviceInUnexpectedState = isDetectingDevice
        ? deviceStatus !== 'ok' && deviceStatus !== 'initialized'
        : false;

    let content: JSX.Element | null = null;
    // const componentId = '';
    if (!transport?.type) {
        // Whole onboarding is loaded only after TRANSPORT.START action, which sets suite.transport
        // No transport layer available to communicate with the device => we should offer bridge. (Eg. firefox user without bridge installed)
        // It shouldn't happen in Chrome and desktop app as bridge is built-in and there should be WebUSB as a fallback
        content = <NoTransport />;
        // componentId = 'transport';
    } else if (!isDetectingDevice) {
        // Transport layer is available, but still no device detected (show WebUSB "check for devices" button if possible and provide helpful tips)
        content = <NoDeviceDetected offerWebUsb={isWebUSB(transport)} />;
        // componentId = 'nodevice';
    } else if (deviceInUnexpectedState) {
        // Device detected, but it is in unexpected state (unreadable, seedless, in bootloader)
        content = <UnexpectedDeviceState deviceStatus={deviceStatus!} />;
        // componentId = 'unexpected-state';
    } else {
        // happy path, user connected uninitialized or initialized device
        // Show analytics, device security/integrity check
        content = <PreOnboardingSetup initialized={deviceStatus === 'initialized'} />;
        // componentId = 'analytics';
    }

    // const [items, _] = useState(['transport', 'nodevice', 'unexpected-state', 'analytics']);

    // const transitions = useTransition(items, null, {
    //     from: { opacity: 0 },
    //     enter: { opacity: 1 },
    //     leave: { opacity: 0 },
    // });

    return (
        <WelcomeLayout>
            <ConnectDevicePrompt
                connected={isDetectingDevice}
                showWarning={deviceInUnexpectedState}
            />
            {/* {transitions.map(
                ({ item, key, props }) =>
                    item === componentId && (
                        <animated.div key={item} style={props}>
                            {content}
                            {console.log('item', item)}
                            {console.log('key', key)}
                        </animated.div>
                    ),
            )} */}
            {content}
        </WelcomeLayout>
    );
};

export default WelcomeStep;
