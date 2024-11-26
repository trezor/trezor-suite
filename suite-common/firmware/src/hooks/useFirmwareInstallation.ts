import { useDispatch, useSelector } from 'react-redux';
import { useMemo, useCallback } from 'react';

import { FirmwareStatus } from '@suite-common/suite-types';
import {
    firmwareUpdate as firmwareUpdateThunk,
    selectFirmware,
    firmwareActions,
} from '@suite-common/firmware';
import { DEVICE, DeviceModelInternal, FirmwareType, UI } from '@trezor/connect';
import {
    getFirmwareVersion,
    hasBitcoinOnlyFirmware,
    isBitcoinOnlyDevice,
} from '@trezor/device-utils';
import { selectDevice } from '@suite-common/wallet-core';

/*
There are three firmware update flows, depending on current firmware version:
- manual: devices with firmware version < 1.10.0 | 2.6.0 must be manually disconnected and reconnected in bootloader mode
- reboot_and_wait: newer devices can reboot to bootloader without manual disconnection, then user confirms installation
- reboot_and_upgrade: a device with firmware version >= 2.6.3 can reboot and upgrade in one step (not supported for reinstallation and downgrading)
*/

const VERSIONS_GUARANTEED_TO_WIPE_DEVICE_ON_UPDATE: ReturnType<typeof getFirmwareVersion>[] = [
    '1.6.1',
];

export type UseFirmwareInstallationParams =
    | {
          shouldSwitchFirmwareType?: boolean;
      }
    | undefined;

export type FirmwareOperationStatus = {
    operation: 'installing' | 'validating' | 'restarting' | 'completed' | null;
    progress: number;
};

export const useFirmwareInstallation = (
    { shouldSwitchFirmwareType }: UseFirmwareInstallationParams = {
        shouldSwitchFirmwareType: false,
    },
) => {
    const dispatch = useDispatch();
    const firmware = useSelector(selectFirmware);
    const device = useSelector(selectDevice);

    // Device in its state before installation is cached when installation begins.
    // Until then, access device as normal.
    const originalDevice = firmware.cachedDevice || device;

    // To instruct user to reboot to bootloader manually, UI.FIRMWARE_DISCONNECT event is emitted first,
    // and UI.FIRMWARE_RECONNECT is emitted after the device disconnects.
    const showManualReconnectPrompt =
        firmware.uiEvent?.type === UI.FIRMWARE_RECONNECT &&
        firmware.uiEvent.payload.method === 'manual';

    const showReconnectPrompt =
        // T1 emits ButtonRequest_ProtectCall in reboot_and_wait flow,
        // T2 devices emit ButtonRequest_Other in reboot_and_wait and reboot_and_upgrade flows:
        (firmware.uiEvent?.type === DEVICE.BUTTON &&
            firmware.uiEvent.payload.code &&
            ['ButtonRequest_ProtectCall', 'ButtonRequest_Other'].includes(
                firmware.uiEvent.payload.code,
            )) ||
        showManualReconnectPrompt;

    const deviceModelInternal = originalDevice?.features?.internal_model;
    // Device may be wiped during firmware type switch because Universal and Bitcoin-only firmware have different vendor headers,
    // except T1B1 and T2T1. There may be some false negatives here during custom installation.
    // TODO: Determine this in Connect.
    const deviceWillBeWiped =
        (!!shouldSwitchFirmwareType &&
            deviceModelInternal !== undefined &&
            ![DeviceModelInternal.T1B1, DeviceModelInternal.T2T1].includes(deviceModelInternal)) ||
        VERSIONS_GUARANTEED_TO_WIPE_DEVICE_ON_UPDATE.includes(getFirmwareVersion(originalDevice));

    const confirmOnDevice =
        // Show the confirmation pill before starting the installation using the "wait" or "manual" method,
        // after ReconnectDevicePrompt is closed and user selects the option to install firmware while in bootloader.
        // Also in case the device is PIN-locked at the start of the process.
        (firmware.uiEvent?.type === DEVICE.BUTTON &&
            firmware.uiEvent.payload.code !== undefined &&
            ['ButtonRequest_FirmwareUpdate', 'ButtonRequest_PinEntry'].includes(
                firmware.uiEvent.payload.code,
            )) ||
        // Show the confirmation pill right after ReconnectDevicePrompt is closed while using the "wait" or "manual" method,
        // before user selects the option to install firmware while in bootloader
        // When a PIN-protected device reconnects to normal mode after installation, PIN is requested and the pill is shown.
        // There is a false positive in case such device is wiped (including PIN) during custom installation.
        (firmware.uiEvent?.type === UI.FIRMWARE_RECONNECT &&
            (firmware.uiEvent.payload.target === 'bootloader' ||
                (firmware.uiEvent.payload.target === 'normal' &&
                    originalDevice?.features?.pin_protection &&
                    !deviceWillBeWiped)));

    const showConfirmationPill =
        !showReconnectPrompt &&
        !!firmware.uiEvent &&
        !(
            firmware.uiEvent.type === UI.FIRMWARE_PROGRESS &&
            firmware.uiEvent.payload.operation === 'downloading'
        );

    const updateStatus = useMemo<FirmwareOperationStatus>(() => {
        if (firmware.status === 'done') {
            return {
                operation: 'completed',
                progress: 100,
            };
        }

        if (firmware.uiEvent?.type === UI.FIRMWARE_PROGRESS) {
            switch (firmware.uiEvent.payload.operation) {
                case 'flashing':
                    return {
                        operation: 'installing',
                        progress: firmware.uiEvent.payload.progress,
                    };
                case 'validating':
                    return {
                        operation: 'validating',
                        progress: 100,
                    };
            }
        }

        // Automatically restarting from bootloader to normal mode at the end of non-intermediary installation:
        if (
            firmware.uiEvent?.type === UI.FIRMWARE_RECONNECT &&
            firmware.uiEvent.payload.method === 'wait'
        ) {
            return { operation: 'restarting', progress: 100 };
        }

        return { operation: null, progress: 0 };
    }, [firmware.uiEvent, firmware.status]);

    const targetFirmwareType = useMemo(() => {
        const isCurrentlyBitcoinOnly = hasBitcoinOnlyFirmware(originalDevice);
        const isBitcoinOnlyAvailable = !!originalDevice?.firmwareRelease?.release.url_bitcoinonly;

        return (isCurrentlyBitcoinOnly && !shouldSwitchFirmwareType) ||
            // Switching to Bitcoin-only:
            (!isCurrentlyBitcoinOnly && shouldSwitchFirmwareType && isBitcoinOnlyAvailable) ||
            // Bitcoin-only device:
            isBitcoinOnlyDevice(originalDevice)
            ? FirmwareType.BitcoinOnly
            : FirmwareType.Regular;
    }, [originalDevice, shouldSwitchFirmwareType]);

    const firmwareUpdate = useCallback(
        (...params: Parameters<typeof firmwareUpdateThunk>) =>
            dispatch(firmwareUpdateThunk(...params)),
        [dispatch],
    );

    const setStatus = useCallback(
        (status: FirmwareStatus | 'error') => dispatch(firmwareActions.setStatus(status)),
        [dispatch],
    );

    const resetReducer = useCallback(() => dispatch(firmwareActions.resetReducer()), [dispatch]);

    return {
        ...firmware,
        ...updateStatus,
        originalDevice,
        firmwareUpdate,
        setStatus,
        resetReducer,
        targetFirmwareType,
        showManualReconnectPrompt,
        confirmOnDevice,
        shouldSwitchFirmwareType,
        deviceWillBeWiped,
        showReconnectPrompt,
        showConfirmationPill,
    };
};
