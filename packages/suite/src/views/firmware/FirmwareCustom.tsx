import React, { useState, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice } from '@trezor/components';
import { useActions, useDevice, useFirmware } from '@suite-hooks';
import { Translation, Modal } from '@suite-components';
import { DeviceAcquire } from '@suite-views/device-acquire';
import { DeviceUnknown } from '@suite-views/device-unknown';
import { DeviceUnreadable } from '@suite-views/device-unreadable';
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
import * as suiteActions from '@suite-actions/suiteActions';

const StyledModal = styled(Modal)<{ isNarrow: boolean }>`
    width: ${({ isNarrow }) => (isNarrow ? '450px' : '620px')};
`;

const ModalContent = styled.div<{ isNarrow: boolean }>`
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: ${({ isNarrow }) => (isNarrow ? '380px' : '550px')};
`;

export const FirmwareCustom = () => {
    const [firmwareBinary, setFirmwareBinary] = useState<ArrayBuffer>();
    const { closeModalApp, acquireDevice } = useActions({
        closeModalApp: routerActions.closeModalApp,
        acquireDevice: suiteActions.acquireDevice,
    });

    const { setStatus, firmwareCustom, resetReducer, status, error } = useFirmware();
    const { device: liveDevice } = useDevice();
    const cachedDevice = useCachedDevice(liveDevice);

    const onFirmwareSelected = useCallback(
        (fw: ArrayBuffer) => {
            setFirmwareBinary(fw);
            // if there is no firmware installed, check-seed and waiting-for-bootloader steps could be skipped
            if (liveDevice?.firmware === 'none') {
                firmwareCustom(fw);
            } else {
                setStatus('check-seed');
            }
        },
        [liveDevice?.firmware, setStatus, firmwareCustom],
    );

    const onSeedChecked = useCallback(() => {
        setStatus('waiting-for-bootloader');
    }, [setStatus]);

    const onInstall = useCallback(() => {
        if (firmwareBinary) {
            firmwareCustom(firmwareBinary);
        }
    }, [firmwareBinary, firmwareCustom]);

    const onClose = useCallback(() => {
        if (liveDevice?.status !== 'available') {
            acquireDevice(liveDevice);
        }
        closeModalApp();
        resetReducer();
    }, [liveDevice, acquireDevice, closeModalApp, resetReducer]);

    const shouldDisplayConnectPrompt = (device?: TrezorDevice) =>
        !device?.connected || !device?.features;

    const isCancelable = [
        'initial',
        'check-seed',
        'done',
        'partially-done',
        'waiting-for-bootloader',
        'error',
    ].includes(status);

    const Step = useMemo(
        () => () => {
            switch (status) {
                case 'error':
                    return (
                        <OnboardingStepBox
                            image="FIRMWARE"
                            heading={<Translation id="TR_FW_INSTALLATION_FAILED" />}
                            description={
                                <Translation
                                    id="TOAST_GENERIC_ERROR"
                                    values={{ error: error || '' }}
                                />
                            }
                            innerActions={
                                <CloseButton onClick={onClose}>
                                    <Translation id="TR_BACK" />
                                </CloseButton>
                            }
                            nested
                        />
                    );
                case 'initial':
                    return shouldDisplayConnectPrompt(liveDevice) ? (
                        <ConnectDevicePromptManager device={liveDevice} />
                    ) : (
                        <SelectCustomFirmware device={liveDevice} onSuccess={onFirmwareSelected} />
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
                            onClose={onClose}
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
                case 'validation':
                    return (
                        <FirmwareInstallation
                            cachedDevice={cachedDevice}
                            standaloneFwUpdate
                            customFirmware
                            onSuccess={onClose}
                            onClose={onClose}
                        />
                    );
                default:
                    // 'ensure' type completeness
                    throw new Error(`state "${status}" is not handled here`);
            }
        },
        [
            cachedDevice,
            error,
            liveDevice,
            status,
            onClose,
            onFirmwareSelected,
            onInstall,
            onSeedChecked,
        ],
    );

    if (liveDevice?.type === 'unacquired') return <DeviceAcquire />;
    if (liveDevice?.type === 'unreadable') return <DeviceUnreadable />;
    if (liveDevice && !liveDevice.features) return <DeviceUnknown />;

    return (
        <StyledModal
            isNarrow={status === 'initial'}
            isCancelable={isCancelable}
            onCancel={onClose}
            heading={<Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_TITLE" />}
            modalPrompt={
                status === 'waiting-for-confirmation' && (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        trezorModel={liveDevice?.features?.major_version === 1 ? 1 : 2}
                    />
                )
            }
            data-test="@firmware-custom"
        >
            <ModalContent isNarrow={status === 'initial'}>
                <Step />
            </ModalContent>
        </StyledModal>
    );
};
