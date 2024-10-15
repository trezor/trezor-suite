import { useDispatch } from 'react-redux';

import { FirmwareStatus } from '@suite-common/suite-types';
import { firmwareUpdate, selectFirmware, firmwareActions } from '@suite-common/wallet-core';
import { DEVICE, DeviceModelInternal, FirmwareType, UI } from '@trezor/connect';
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

type UseFirmwareParams =
    | {
          shouldSwitchFirmwareType?: boolean;
      }
    | undefined;

export const useFirmware = (
    { shouldSwitchFirmwareType }: UseFirmwareParams = { shouldSwitchFirmwareType: false },
) => {
    const { translationString } = useTranslation();
    const dispatch = useDispatch();
    const firmware = useSelector(selectFirmware);
    const transport = useSelector(state => state.suite.transport);
    const modal = useSelector(state => state.modal);
    const { device } = useDevice();

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

    const showFingerprintCheck =
        modal.context === MODAL.CONTEXT_DEVICE &&
        modal.windowType === 'ButtonRequest_FirmwareCheck';

    const deviceModelInternal = originalDevice?.features?.internal_model;
    // Device may be wiped during firmware type switch because Universal and Bitcoin-only firmware have different vendor headers,
    // except T1B1 and T2T1. There may be some false negatives here during custom installation.
    // TODO: Determine this in Connect.
    const deviceWillBeWiped =
        !!shouldSwitchFirmwareType &&
        deviceModelInternal !== undefined &&
        ![DeviceModelInternal.T1B1, DeviceModelInternal.T2T1].includes(deviceModelInternal);

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

        // Automatically restarting from bootloader to normal mode at the end of non-intermediary installation:
        if (
            firmware.uiEvent?.type === UI.FIRMWARE_RECONNECT &&
            firmware.uiEvent.payload.method === 'wait'
        ) {
            return { operation: translationString('TR_WAIT_FOR_REBOOT'), progress: 100 };
        }

        return { operation: null, progress: 0 };
    };

    const getTargetFirmwareType = () => {
        const isCurrentlyBitcoinOnly = hasBitcoinOnlyFirmware(originalDevice);
        const isBitcoinOnlyAvailable = !!originalDevice?.firmwareRelease?.release.url_bitcoinonly;

        return (isCurrentlyBitcoinOnly && !shouldSwitchFirmwareType) ||
            // Switching to Bitcoin-only:
            (!isCurrentlyBitcoinOnly && shouldSwitchFirmwareType && isBitcoinOnlyAvailable) ||
            // Bitcoin-only device:
            isBitcoinOnlyDevice(originalDevice)
            ? FirmwareType.BitcoinOnly
            : FirmwareType.Regular;
    };

    const targetFirmwareType = getTargetFirmwareType();

    return {
        ...firmware,
        ...getUpdateStatus(),
        originalDevice,
        firmwareUpdate: (...params: Parameters<typeof firmwareUpdate>) =>
            dispatch(firmwareUpdate(...params)),
        setStatus: (status: FirmwareStatus | 'error') =>
            dispatch(firmwareActions.setStatus(status)),
        resetReducer: () => dispatch(firmwareActions.resetReducer()),
        isWebUSB: isWebUsb(transport),
        showFingerprintCheck,
        targetFirmwareType,
        showManualReconnectPrompt,
        confirmOnDevice,
        shouldSwitchFirmwareType,
        deviceWillBeWiped,
        showReconnectPrompt,
        showConfirmationPill,
    };
};
