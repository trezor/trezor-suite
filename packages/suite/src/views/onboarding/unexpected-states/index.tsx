import React from 'react';
import styled from 'styled-components';
import { P } from '@trezor/components';
import { connect } from 'react-redux';

import { AppState } from '@suite-types';
import { Translation } from '@suite-components/Translation';
import { DeviceRecoveryMode } from '@suite-views';
import * as STEP from '@onboarding-constants/steps';
import steps from '@onboarding-config/steps';
import { Step } from '@onboarding-types';
import Reconnect from './components/Reconnect';
import IsSameDevice from './components/IsSameDevice';
import IsNotNewDevice from './components/IsNotNewDevice';
import DeviceIsUsedHere from './components/DeviceIsUsedHere';
import { isWebUSB } from '@suite-utils/transport';

const Wrapper = styled.div`
    height: 100%;
    text-align: center;
`;

const IsInBootloader = () => (
    <P>
        <Translation id="TR_CONNECTED_DEVICE_IS_IN_BOOTLOADER" />
    </P>
);

const mapStateToProps = (state: AppState) => ({
    onboarding: state.onboarding,
    suite: state.suite,
});

type Props = ReturnType<typeof mapStateToProps> & {
    children: React.ReactNode;
};

const UnexpectedState = ({ onboarding, suite, children }: Props) => {
    const { prevDevice, path, activeStepId } = onboarding;
    const { device, transport } = suite;
    const activeStep = steps.find(s => s.id === activeStepId);

    const isNotSameDevice = () => {
        const prevDeviceId = prevDevice && prevDevice.features && prevDevice.id;
        // if no device was connected before, assume it is same device
        if (!prevDeviceId) {
            return false;
        }
        const deviceId = device && device.features && device.id;
        if (!deviceId) {
            return null;
        }
        return deviceId !== prevDeviceId;
    };

    const isNotNewDevice = () => {
        if (!device || !path || !path.includes('new')) {
            return null;
        }
        return device && device.features && device.features.firmware_present !== false;
    };

    if (!activeStep) {
        return null;
    }

    const isStepDisallowed = (state: Required<Step>['disallowedDeviceStates'][number]) => {
        switch (state) {
            case STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED:
                return !device;
            case STEP.DISALLOWED_IS_NOT_SAME_DEVICE:
                return isNotSameDevice();
            case STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER:
                return device?.features && device.mode === 'bootloader';
            case STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE:
                return device?.type === 'unacquired';
            case STEP.DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE:
                return isNotNewDevice();
            case STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE:
                return device?.features?.recovery_mode;
            default:
                return null;
        }
    };

    const disallowedState = activeStep?.disallowedDeviceStates?.find(state =>
        isStepDisallowed(state),
    );

    const getUnexpectedStateComponent = () => {
        switch (disallowedState) {
            case STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED:
                return <Reconnect showWebUsb={isWebUSB(transport)} />;
            case STEP.DISALLOWED_IS_NOT_SAME_DEVICE:
                return <IsSameDevice />;
            case STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER:
                return <IsInBootloader />;
            case STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE:
                return <DeviceIsUsedHere />;
            case STEP.DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE:
                return <IsNotNewDevice />;
            case STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE:
                return <DeviceRecoveryMode modalProps={{ noBackground: true, size: 'small' }} />;
            default:
                return null;
        }
    };

    const unexpectedState = getUnexpectedStateComponent();
    return <Wrapper>{unexpectedState || children}</Wrapper>;
};

export default connect(mapStateToProps, {})(UnexpectedState);
