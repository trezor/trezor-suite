import { useState, useMemo, useCallback } from 'react';

import styled from 'styled-components';

import { acquireDevice } from '@suite-common/wallet-core';
import { ConfirmOnDevice } from '@trezor/components';

import { useDevice, useDispatch, useFirmware } from 'src/hooks/suite';
import { Translation, Modal } from 'src/components/suite';
import { DeviceAcquire } from 'src/views/suite/device-acquire';
import { DeviceUnknown } from 'src/views/suite/device-unknown';
import { DeviceUnreadable } from 'src/views/suite/device-unreadable';
import { closeModalApp } from 'src/actions/suite/routerActions';
import type { TrezorDevice } from 'src/types/suite';
import { ConnectDevicePromptManager, OnboardingStepBox } from 'src/components/onboarding';
import { useCachedDevice } from 'src/hooks/firmware/useCachedDevice';
import {
    FirmwareInstallation,
    FirmwareCloseButton,
    CheckSeedStep,
    ReconnectDevicePrompt,
    SelectCustomFirmware,
} from 'src/components/firmware';

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

    const dispatch = useDispatch();

    const { setStatus, firmwareCustom, resetReducer, status, error } = useFirmware();
    const { device: liveDevice } = useDevice();
    const cachedDevice = useCachedDevice(liveDevice);
    const liveDeviceModelInternal = liveDevice?.features?.internal_model;

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
            dispatch(acquireDevice(liveDevice));
        }
        dispatch(closeModalApp());
        resetReducer();
    }, [dispatch, liveDevice, resetReducer]);

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
                            innerActions={<FirmwareCloseButton onClick={onClose} />}
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
                case 'unplug': // only relevant for T1B1, T2T1 auto restarts itself
                case 'reconnect-in-normal': // only relevant for T1B1, T2T1 auto restarts itself
                case 'partially-done': // only relevant for T1B1, updating from very old fw is done in 2 fw updates, partially-done means first update was installed
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
                        deviceModelInternal={liveDeviceModelInternal}
                        deviceUnitColor={liveDevice?.features?.unit_color}
                    />
                )
            }
            data-test-id="@firmware-custom"
        >
            <ModalContent isNarrow={status === 'initial'}>
                <Step />
            </ModalContent>
        </StyledModal>
    );
};
