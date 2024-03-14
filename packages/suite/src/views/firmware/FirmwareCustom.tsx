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
import {
    FirmwareInstallation,
    FirmwareCloseButton,
    CheckSeedStep,
    ReconnectDevicePrompt,
    SelectCustomFirmware,
} from 'src/components/firmware';
import { DEVICE, UI } from '@trezor/connect';

const StyledModal = styled(Modal)<{ $isNarrow: boolean }>`
    width: ${({ $isNarrow }) => ($isNarrow ? '450px' : '620px')};
`;

const ModalContent = styled.div`
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const FirmwareCustom = () => {
    const [firmwareBinary, setFirmwareBinary] = useState<ArrayBuffer>();

    const dispatch = useDispatch();

    const { setStatus, firmwareUpdate, resetReducer, status, error, uiEvent } = useFirmware();
    const { device } = useDevice();
    const deviceModelInternal = device?.features?.internal_model;

    const showReconnectPrompt =
        (uiEvent?.type === DEVICE.BUTTON && uiEvent.payload.code === 'ButtonRequest_Other') ||
        (uiEvent?.type === UI.FIRMWARE_DISCONNECT && uiEvent.payload.manual) ||
        (uiEvent?.type === UI.FIRMWARE_RECONNECT && uiEvent.payload.manual) ||
        (device?.mode === 'bootloader' &&
            status === 'error' &&
            error === 'Firmware install cancelled' &&
            uiEvent?.type === DEVICE.BUTTON &&
            uiEvent.payload.code === 'ButtonRequest_FirmwareUpdate');

    const onFirmwareSelected = useCallback(
        (fw: ArrayBuffer) => {
            setFirmwareBinary(fw);
            // If there is no firmware installed, check-seed and waiting-for-bootloader steps could be skipped.
            if (device?.firmware === 'none') {
                firmwareCustom(fw);
                // No need to check seed on a device which is not initialized.
            } else if (device?.mode === 'initialize') {
                setStatus('waiting-for-bootloader');
            } else {
                console.log('ELSE');
                setStatus('check-seed');
            }
        },
        [device?.firmware, device?.mode, setStatus, firmwareCustom],
    );

    const onSeedChecked = useCallback(() => {
        firmwareUpdate({ binary: firmwareBinary });
    }, [firmwareUpdate, firmwareBinary]);

    const onInstall = useCallback(() => {
        if (firmwareBinary) {
            firmwareUpdate({ binary: firmwareBinary });
        }
    }, [firmwareBinary, firmwareUpdate]);

    const onClose = useCallback(() => {
        if (device?.status !== 'available') {
            dispatch(acquireDevice(device));
        }
        dispatch(closeModalApp());
        resetReducer();
    }, [dispatch, device, resetReducer]);

    const shouldDisplayConnectPrompt = (device?: TrezorDevice) =>
        !device?.connected || !device?.features;

    const isCancelable = ['initial', 'check-seed', 'done', 'partially-done', 'error'].includes(
        status,
    );

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
                    return shouldDisplayConnectPrompt(device) ? (
                        <ConnectDevicePromptManager device={device} />
                    ) : (
                        <SelectCustomFirmware device={device} onSuccess={onFirmwareSelected} />
                    );
                case 'check-seed':
                    return <CheckSeedStep onSuccess={onSeedChecked} />;
                // case 'waiting-for-bootloader':
                //     return shouldDisplayConnectPrompt(liveDevice) ? (
                //         <ConnectDevicePromptManager device={liveDevice} />
                //     ) : (
                //         <ReconnectDevicePrompt
                //             expectedDevice={liveDevice}
                //             requestedMode="bootloader"
                //             onSuccess={onInstall}
                //             onClose={onClose}
                //         />
                //     );
                case 'started': // called from firmwareUpdate()
                case 'partially-done': // only relevant for T1B1, updating from very old fw is done in 2 fw updates, partially-done means first update was installed
                case 'done':
                    return (
                        <FirmwareInstallation
                            cachedDevice={device}
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
        [error, device, status, onClose, onFirmwareSelected, onSeedChecked],
    );

    if (device?.type === 'unacquired') return <DeviceAcquire />;
    if (device?.type === 'unreadable') return <DeviceUnreadable />;
    if (device && !device.features) return <DeviceUnknown />;

    return (
        <StyledModal
            $isNarrow={status === 'initial'}
            isCancelable={isCancelable}
            onCancel={onClose}
            heading={<Translation id="TR_DEVICE_SETTINGS_CUSTOM_FIRMWARE_TITLE" />}
            modalPrompt={
                status === 'waiting-for-confirmation' && (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        deviceModelInternal={deviceModelInternal}
                        deviceUnitColor={device?.features?.unit_color}
                    />
                )
            }
            data-test="@firmware-custom"
        >
            {showReconnectPrompt && (
                <ReconnectDevicePrompt
                    requestedMode="bootloader"
                    onClose={onClose}
                    onSuccess={onInstall}
                />
            )}
            <ModalContent>
                <Step />
            </ModalContent>
        </StyledModal>
    );
};
