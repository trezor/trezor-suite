import React, { useState } from 'react';
import styled from 'styled-components';
import * as routerActions from '@suite-actions/routerActions';
import { TrezorDevice } from '@suite-types';
import {
    CheckSeedStep,
    CloseButton,
    FirmwareInitial,
    FirmwareInstallation,
} from '@firmware-components';
import { DeviceAcquire, DeviceUnknown, DeviceUnreadable } from '@suite-views';
import { Translation, Modal } from '@suite-components';
import { OnboardingStepBox } from '@onboarding-components';
import { useActions, useFirmware, useSelector, useTheme } from '@suite-hooks';
import { ConfirmOnDevice, Icon } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    text-align: left;
    position: relative;
    padding: 40px 0px 20px 0px;
`;

const CancelIconWrapper = styled.div`
    display: inline-block;
    position: absolute;
    top: 20px;
    right: 20px;
    align-items: center;
    cursor: pointer;
`;

const Firmware = () => {
    const { theme } = useTheme();
    const { resetReducer, status, error } = useFirmware();
    const { device } = useSelector(state => ({
        device: state.suite.device,
    }));
    const { closeModalApp } = useActions({
        closeModalApp: routerActions.closeModalApp,
    });

    const onClose = () => {
        closeModalApp();
        resetReducer();
    };

    const [cachedDevice, setCachedDevice] = useState<TrezorDevice | undefined>(device);

    // some of the application states can be reused here.
    // some don't make sense handling here as they are handled somewhere up the tree
    // some must be handled in lower layers because of specifics of fw update process (eg. device-disconnected)
    const getSuiteApplicationState = () => {
        if (!device) return;
        // device features cannot be read, device is probably used in another window
        if (device.type === 'unacquired') return DeviceAcquire;
        // Webusb unreadable device (HID)
        if (device.type === 'unreadable') return DeviceUnreadable;
        // device features unknown (this shouldn't happened tho)
        if (!device.features) return DeviceUnknown;
    };

    const getComponent = () => {
        // edge case 1 - error
        if (error) {
            return (
                <OnboardingStepBox
                    image="FIRMWARE"
                    heading={<Translation id="TR_FW_INSTALLATION_FAILED" />}
                    description={<Translation id="TOAST_GENERIC_ERROR" values={{ error }} />}
                    innerActions={
                        <CloseButton onClick={onClose}>
                            <Translation id="TR_BACK" />
                        </CloseButton>
                    }
                    nested
                />
            );
        }

        switch (status) {
            case 'initial':
            case 'waiting-for-bootloader': // waiting for user to reconnect in bootloader
                return (
                    <FirmwareInitial
                        cachedDevice={cachedDevice}
                        setCachedDevice={setCachedDevice}
                        standaloneFwUpdate
                    />
                );
            case 'check-seed': // triggered from FirmwareInitial
                return <CheckSeedStep />;
            case 'waiting-for-confirmation': // waiting for confirming installation on a device
            case 'started': // called from firmwareUpdate()
            case 'installing':
            case 'wait-for-reboot':
            case 'unplug': // only relevant for T1, TT auto restarts itself
            case 'reconnect-in-normal': // only relevant for T1, TT auto restarts itself
            case 'partially-done': // only relevant for T1, updating from very old fw is done in 2 fw updates, partially-done means first update was installed
            case 'done':
                return <FirmwareInstallation cachedDevice={cachedDevice} standaloneFwUpdate />;
            default:
                // 'ensure' type completeness
                throw new Error(`state "${status}" is not handled here`);
        }
    };

    const Component = getComponent();

    if (!Component) return null;

    const ApplicationStateModal = getSuiteApplicationState();

    if (ApplicationStateModal) return <ApplicationStateModal />;

    const isCancelable = [
        'initial',
        'check-seed',
        'done',
        'partially-done',
        'waiting-for-bootloader',
        'error',
    ].includes(status);

    return (
        <Modal
            cancelable={isCancelable}
            header={
                status === 'waiting-for-confirmation' && (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        trezorModel={device?.features?.major_version === 1 ? 1 : 2}
                        animated
                    />
                )
            }
            onCancel={onClose}
            useFixedHeight
            fixedHeight={['90vh', '90vh', '500px', '500px']}
            fixedWidth={['100vw', '90vw', '620px', '620px']}
            data-test="@firmware"
            centerContent
            noPadding
        >
            <Wrapper>
                {isCancelable && (
                    // we need to provide custom close button as we don't use default one included in Modal's heading component
                    <CancelIconWrapper data-test="@modal/close-button" onClick={onClose}>
                        <Icon size={24} color={theme.TYPE_DARK_GREY} icon="CROSS" />
                    </CancelIconWrapper>
                )}
                {Component}
            </Wrapper>
        </Modal>
    );
};

export default Firmware;
