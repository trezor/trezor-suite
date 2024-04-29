import { useDispatch } from 'react-redux';

import { FirmwareStatus } from '@suite-common/suite-types';
import {
    checkFirmwareAuthenticity,
    firmwareUpdate,
    selectFirmware,
    firmwareActions,
} from '@suite-common/wallet-core';
import { DEVICE, FirmwareType, UI } from '@trezor/connect';
import { hasBitcoinOnlyFirmware, isBitcoinOnlyDevice } from '@trezor/device-utils';

import { useSelector, useDevice, useTranslation } from 'src/hooks/suite';
import { isWebUsb } from 'src/utils/suite/transport';
import { MODAL } from 'src/actions/suite/constants';

/*
There are three firmware update flows, depending on current firmware version:
- manual: devices with firmware version < 1.10.0 | 2.6.0 must be manually disconnected and reconnected in bootloader mode
- reboot_and_wait: newer devices can reboot to bootloader without manual disconnection, then user confirms installation
- reboot_and_upgrade: a device with firmware version >= 2.6.3 can reboot and upgrade in one step (not supported for reinstallation and downgrading)
*/

export const useFirmware = () => {
    const { translationString } = useTranslation();
    const dispatch = useDispatch();
    const firmware = useSelector(selectFirmware);
    const transport = useSelector(state => state.suite.transport);
    const modal = useSelector(state => state.modal);
    const { device } = useDevice();

    // Device in its state before installation is cached when installation begins. Until then, access device as normal.
    const originalDevice = firmware.cachedDevice || device;
    // To instruct user to reboot to bootloader manually, UI.FIRMWARE_DISCONNECT event is emitted first, and UI.FIRMWARE_RECONNECT is emitted after the device disconnects.
    // These events are emitted later during the installation process as well, but we don't want to show the prompt again - that is why we must check the device mode or bootloader property.
    const showManualReconnectPrompt =
        ((firmware.uiEvent?.type === UI.FIRMWARE_DISCONNECT && device?.mode !== 'bootloader') ||
            (firmware.uiEvent?.type === UI.FIRMWARE_RECONNECT &&
                firmware.uiEvent.payload.bootloader)) &&
        firmware.uiEvent.payload.manual;
    const showReconnectPrompt =
        // T1 emits ButtonRequest_ProtectCall in reboot_and_wait flow, T2 devices emit ButtonRequest_Other in reboot_and_wait and reboot_and_upgrade flows:
        (firmware.uiEvent?.type === DEVICE.BUTTON &&
            firmware.uiEvent.payload.code &&
            ['ButtonRequest_ProtectCall', 'ButtonRequest_Other'].includes(
                firmware.uiEvent.payload.code,
            )) ||
        showManualReconnectPrompt;
    const showFingerprintCheck =
        modal.context === MODAL.CONTEXT_DEVICE &&
        modal.windowType === 'ButtonRequest_FirmwareCheck';
    const isCurrentlyBitcoinOnly = hasBitcoinOnlyFirmware(originalDevice);
    const confirmOnDevice =
        (firmware.uiEvent?.type === UI.FIRMWARE_RECONNECT && firmware.uiEvent.payload.bootloader) ||
        (firmware.uiEvent?.type === DEVICE.BUTTON &&
            firmware.uiEvent.payload.code === 'ButtonRequest_FirmwareUpdate');
    const showConfirmationPill =
        !showReconnectPrompt &&
        !!firmware.uiEvent &&
        !(
            firmware.uiEvent.type === UI.FIRMWARE_PROGRESS &&
            firmware.uiEvent.payload.operation === 'downloading'
        );

    const getUpdateStatus = () => {
        if (firmware.status === 'done') {
            return {
                operation: translationString('TR_FIRMWARE_STATUS_INSTALLATION_COMPLETED'),
                progress: 100,
            };
        }
        if (firmware.uiEvent?.type === UI.FIRMWARE_PROGRESS) {
            switch (firmware.uiEvent.payload.operation) {
                case 'flashing':
                    return {
                        operation: translationString('TR_INSTALLING'),
                        progress: firmware.uiEvent.payload.progress,
                    };
                case 'validating':
                    return {
                        operation: translationString('TR_VALIDATION'),
                        progress: 100,
                    };
            }
        }
        // Restarting from bootloader to normal mode:
        if (
            (firmware.uiEvent?.type === UI.FIRMWARE_DISCONNECT && device?.mode === 'bootloader') ||
            (firmware.uiEvent?.type === UI.FIRMWARE_RECONNECT &&
                !firmware.uiEvent.payload.bootloader)
        ) {
            return { operation: translationString('TR_WAIT_FOR_REBOOT'), progress: 100 };
        }

        return { operation: null, progress: 0 };
    };

    const getTargetFirmwareType = (shouldSwitchFirmwareType: boolean) => {
        const isBitcoinOnlyAvailable = !!originalDevice?.firmwareRelease?.release.url_bitcoinonly;

        return (isCurrentlyBitcoinOnly && !shouldSwitchFirmwareType) ||
            // Switching to Bitcoin-only:
            (!isCurrentlyBitcoinOnly && shouldSwitchFirmwareType && isBitcoinOnlyAvailable) ||
            // Bitcoin-only device:
            isBitcoinOnlyDevice(originalDevice)
            ? FirmwareType.BitcoinOnly
            : FirmwareType.Regular;
    };

    return {
        ...firmware,
        ...getUpdateStatus(),
        originalDevice,
        firmwareUpdate: (...params: Parameters<typeof firmwareUpdate>) =>
            dispatch(firmwareUpdate(...params)),
        checkFirmwareAuthenticity: () => dispatch(checkFirmwareAuthenticity()),
        setStatus: (status: FirmwareStatus | 'error') =>
            dispatch(firmwareActions.setStatus(status)),
        resetReducer: () => dispatch(firmwareActions.resetReducer()),
        isWebUSB: isWebUsb(transport),
        showFingerprintCheck,
        getTargetFirmwareType,
        showManualReconnectPrompt,
        confirmOnDevice,
        showReconnectPrompt,
        showConfirmationPill,
    };
};
