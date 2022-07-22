import React, { useState } from 'react';
import styled from 'styled-components';
import * as routerActions from '@suite-actions/routerActions';
import { ModalVariant, TrezorDevice } from '@suite-types';
import {
    CheckSeedStep,
    CloseButton,
    FirmwareInitial,
    FirmwareInstallation,
} from '@firmware-components';
import { DeviceAcquire } from '@suite-views/device-acquire';
import { DeviceUnknown } from '@suite-views/device-unknown';
import { DeviceUnreadable } from '@suite-views/device-unreadable';
import { Translation, Modal } from '@suite-components';
import { OnboardingStepBox } from '@onboarding-components';
import { useActions, useFirmware, useSelector } from '@suite-hooks';
import { ConfirmOnDevice, variables } from '@trezor/components';
import * as suiteActions from '@suite-actions/suiteActions';

const Wrapper = styled.div<{ isWithTopPadding: boolean }>`
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    text-align: left;
    position: relative;

    ${variables.SCREEN_QUERY.ABOVE_TABLET} {
        padding-top: ${({ isWithTopPadding }) => isWithTopPadding && '44px'};
    }
`;

const StyledModal = styled(Modal)`
    width: 620px;
    min-height: 500px;

    > ${Modal.Body} {
        padding: 0;
        margin-top: 0;
        height: 100%;

        > * {
            height: 100%;
        }
    }
`;

type FirmwareProps = {
    variant?: ModalVariant;
};

export const Firmware = ({ variant }: FirmwareProps) => {
    const { resetReducer, status, setStatus, error, firmwareUpdate, firmwareHashInvalid } =
        useFirmware();
    const { device } = useSelector(state => ({
        device: state.suite.device,
    }));
    const { closeModalApp, acquireDevice } = useActions({
        closeModalApp: routerActions.closeModalApp,
        acquireDevice: suiteActions.acquireDevice,
    });

    const onClose = () => {
        if (device?.status !== 'available') {
            acquireDevice(device);
        }
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

        // special and hopefully very rare case. this appears when somebody tried to fool user into using a hacked firmware
        if (device?.id && firmwareHashInvalid.includes(device.id)) {
            return (
                <OnboardingStepBox
                    image="UNI_ERROR"
                    heading={<Translation id="TR_FIRMWARE_HASH_MISMATCH" />}
                    nested
                />
            );
        }

        switch (status) {
            case 'error': {
                return (
                    <OnboardingStepBox
                        image="FIRMWARE"
                        heading={<Translation id="TR_FW_INSTALLATION_FAILED" />}
                        description={
                            <Translation id="TOAST_GENERIC_ERROR" values={{ error: error || '' }} />
                        }
                        innerActions={
                            <CloseButton onClick={onClose}>
                                <Translation id="TR_BACK" />
                            </CloseButton>
                        }
                        nested
                    />
                );
            }
            case 'initial':
            case 'waiting-for-bootloader': // waiting for user to reconnect in bootloader
                return (
                    <FirmwareInitial
                        cachedDevice={cachedDevice}
                        setCachedDevice={setCachedDevice}
                        standaloneFwUpdate
                        switchType={variant === ModalVariant.SwitchFirmwareType}
                        onInstall={firmwareUpdate}
                    />
                );
            case 'check-seed': // triggered from FirmwareInitial
                return <CheckSeedStep onSuccess={() => setStatus('waiting-for-bootloader')} />;
            case 'waiting-for-confirmation': // waiting for confirming installation on a device
            case 'started': // called from firmwareUpdate()
            case 'installing':
            case 'wait-for-reboot':
            case 'unplug': // only relevant for T1, TT auto restarts itself
            case 'reconnect-in-normal': // only relevant for T1, TT auto restarts itself
            case 'partially-done': // only relevant for T1, updating from very old fw is done in 2 fw updates, partially-done means first update was installed
            case 'validation':
            case 'done':
                return (
                    <FirmwareInstallation
                        cachedDevice={cachedDevice}
                        standaloneFwUpdate
                        onSuccess={onClose}
                    />
                );
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
        <StyledModal
            isCancelable={isCancelable}
            modalPrompt={
                status === 'waiting-for-confirmation' && (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        trezorModel={device?.features?.major_version === 1 ? 1 : 2}
                    />
                )
            }
            onCancel={onClose}
            data-test="@firmware"
        >
            <Wrapper isWithTopPadding={!isCancelable}>{Component}</Wrapper>
        </StyledModal>
    );
};
