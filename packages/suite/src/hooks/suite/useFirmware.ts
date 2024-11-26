import { useMemo } from 'react';

import { FirmwareStatus } from '@suite-common/suite-types';
import { firmwareUpdate, selectFirmware, firmwareActions } from '@suite-common/wallet-core';
import { DEVICE, DeviceModelInternal, FirmwareType, UI } from '@trezor/connect';
import {
    getFirmwareVersion,
    hasBitcoinOnlyFirmware,
    isBitcoinOnlyDevice,
} from '@trezor/device-utils';

import { MODAL } from 'src/actions/suite/constants';
import { useSelector } from 'src/hooks/suite';
import { isWebUsb } from 'src/utils/suite/transport';

const VERSIONS_GUARANTEED_TO_WIPE_DEVICE_ON_UPDATE: ReturnType<typeof getFirmwareVersion>[] = [
    '1.6.1',
];

type UseFirmwareParams =
    | {
          shouldSwitchFirmwareType?: boolean;
      }
    | undefined;

export const useFirmware = (params: UseFirmwareParams = {}) => {
    const transport = useSelector(state => state.suite.transport);
    const modal = useSelector(state => state.modal);
    const firmwareInstallation = useFirmwareInstallation(params);

    const showFingerprintCheck =
        modal.context === MODAL.CONTEXT_DEVICE &&
        modal.windowType === 'ButtonRequest_FirmwareCheck';

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

    const getUpdateStatus = () => {
        if (firmware.status === 'done') {
            return {
                operation: translationString('TR_FIRMWARE_STATUS_INSTALLATION_COMPLETED'),
                progress: 100,
            };
        }

        return null;
    }, [operation, translationString]);

    return {
        ...firmwareInstallation,
        isWebUSB: isWebUsb(transport),
        showFingerprintCheck,
    };
};
