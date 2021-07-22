import React, { useState } from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice } from '@trezor/components';
import { useActions, useDevice, useFirmware } from '@suite-hooks';
import { Translation, Modal } from '@suite-components';
import { DeviceAcquire, DeviceUnknown, DeviceUnreadable } from '@suite-views';
import * as routerActions from '@suite-actions/routerActions';
import type { TrezorDevice } from '@suite-types';
import { ConnectDevicePromptManager, OnboardingStepBox } from '@onboarding-components';
import { useCachedDevice } from '@firmware-hooks/useCachedDevice';
import {
    FirmwareInstallation,
    CloseButton,
    CheckSeedStep,
    ReconnectDevicePrompt,
    SelectCustomFirmware,
} from '@firmware-components';

const ModalContent = styled.div`
    text-align: left;
`;

const FirmwareCustom = () => {
    const { setStatus, firmwareCustom, resetReducer, status, error } = useFirmware();
    const { device: liveDevice } = useDevice();
    const cachedDevice = useCachedDevice(liveDevice);
    const [firmwareBinary, setFirmwareBinary] = useState<ArrayBuffer>();

    const { closeModalApp } = useActions({
        closeModalApp: routerActions.closeModalApp,
    });

    const onFirmwareSelected = (fw: ArrayBuffer) => {
        setFirmwareBinary(fw);
        // if there is no firmware installed, check-seed and waiting-for-bootloader steps could be skipped
        if (liveDevice?.firmware === 'none') {
            firmwareCustom(fw);
        } else {
            setStatus('check-seed');
        }
    };

    const onSeedChecked = () => {
        setStatus('waiting-for-bootloader');
    };

    const onInstall = () => {
        if (firmwareBinary) {
            firmwareCustom(firmwareBinary);
        }
    };

    const onClose = () => {
        closeModalApp();
        resetReducer();
    };

    const shouldDisplayConnectPrompt = (device?: TrezorDevice) =>
        !device?.connected ||
        !device?.features ||
        (device.firmware !== 'none' && device.mode === 'bootloader');

    const isCancelable = [
        'initial',
        'check-seed',
        'done',
        'partially-done',
        'waiting-for-bootloader',
        'error',
    ].includes(status);

    if (liveDevice?.type === 'unacquired') return <DeviceAcquire />;
    if (liveDevice?.type === 'unreadable') return <DeviceUnreadable />;
    if (liveDevice && !liveDevice.features) return <DeviceUnknown />;
    return (
        <Modal
            cancelable={isCancelable}
            onCancel={onClose}
            heading={<Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_TITLE" />}
            header={
                status === 'waiting-for-confirmation' && (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        trezorModel={liveDevice?.features?.major_version === 1 ? 1 : 2}
                        animated
                    />
                )
            }
            fixedWidth={['100vw', '90vw', '620px', '620px']}
            data-test="@firmware-custom"
        >
            <ModalContent>
                {(() => {
                    if (error) {
                        return (
                            <OnboardingStepBox
                                image="FIRMWARE"
                                heading={<Translation id="TR_FW_INSTALLATION_FAILED" />}
                                description={
                                    <Translation id="TOAST_GENERIC_ERROR" values={{ error }} />
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
                    switch (status) {
                        case 'initial':
                            return shouldDisplayConnectPrompt(liveDevice) ? (
                                <ConnectDevicePromptManager device={liveDevice} />
                            ) : (
                                <SelectCustomFirmware onSuccess={onFirmwareSelected} />
                            );
                        case 'check-seed':
                            return <CheckSeedStep onSuccess={onSeedChecked} />;
                        case 'waiting-for-bootloader':
                            return shouldDisplayConnectPrompt(cachedDevice) ? (
                                <ConnectDevicePromptManager device={cachedDevice} />
                            ) : (
                                <ReconnectDevicePrompt
                                    expectedDevice={cachedDevice}
                                    requestedMode="bootloader"
                                    onSuccess={onInstall}
                                />
                            );
                        case 'waiting-for-confirmation': // waiting for confirming installation on a device
                        case 'started': // called from firmwareUpdate()
                        case 'installing':
                        case 'wait-for-reboot':
                        case 'unplug': // only relevant for T1, TT auto restarts itself
                        case 'reconnect-in-normal': // only relevant for T1, TT auto restarts itself
                        case 'partially-done': // only relevant for T1, updating from very old fw is done in 2 fw updates, partially-done means first update was installed
                        case 'done':
                            return (
                                <FirmwareInstallation
                                    cachedDevice={cachedDevice}
                                    standaloneFwUpdate
                                    customFirmware
                                    onSuccess={onClose}
                                />
                            );
                        default:
                            // 'ensure' type completeness
                            throw new Error(`state "${status}" is not handled here`);
                    }
                })()}
            </ModalContent>
        </Modal>
    );
};

export default FirmwareCustom;
