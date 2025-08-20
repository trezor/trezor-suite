import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    FirmwareUpdateProps,
    firmwareActions,
    firmwareUpdate as firmwareUpdateThunk,
    selectFirmware,
} from '@suite-common/firmware';
import { ButtonRequest, FirmwareStatus, TrezorDevice } from '@suite-common/suite-types';
import { selectIsThpInProgress } from '@suite-common/thp';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { DEVICE, FirmwareType, UI } from '@trezor/connect';
import {
    DeviceModelInternal,
    getFirmwareVersion,
    hasBitcoinOnlyFirmware,
    isBitcoinOnlyDevice,
} from '@trezor/device-utils';

/*
There are three firmware update flows, depending on current firmware version:
- manual: devices with firmware version < 1.10.0 | 2.6.0 must be manually disconnected and reconnected in bootloader mode
- reboot_and_wait: newer devices can reboot to bootloader without manual disconnection, then user confirms installation
- reboot_and_upgrade: a device with firmware version >= 2.6.3 can reboot and upgrade in one step (not supported for reinstallation and downgrading)
*/

// TODO: Determine this in Connect.
const determineIfDeviceWillBeWiped = (
    device: TrezorDevice | undefined,
    shouldSwitchFirmwareType: boolean,
) => {
    const deviceModelInternal = device?.features?.internal_model;
    const deviceIsInitializedOrInBootloader = device?.mode !== 'initialize';
    // Changing the vendor header always results in device wipe. T1B1 and T2T1 have the same vendor header for bitcoin-only and universal firmware.
    const installationWillChangeFirmwareVendorHeader =
        !!shouldSwitchFirmwareType &&
        deviceModelInternal !== undefined &&
        ![DeviceModelInternal.T1B1, DeviceModelInternal.T2T1].includes(deviceModelInternal);
    // Faulty firmware version.
    const firmwareVersionIsGuaranteedToWipeDevice = getFirmwareVersion(device) === '1.6.1';

    return (
        deviceIsInitializedOrInBootloader &&
        (installationWillChangeFirmwareVendorHeader || firmwareVersionIsGuaranteedToWipeDevice)
    );
};

export type UseFirmwareInstallationParams =
    | {
          shouldSwitchFirmwareType?: boolean;
      }
    | undefined;

export type FirmwareOperationStatus = {
    operation: 'installing' | 'restarting' | 'thp' | 'completed' | null;
    progress: number;
};

// T1 emits ButtonRequest_ProtectCall (before bootloader) and ButtonRequest_FirmwareUpdate (in bootloader to confirm the installation) in reboot_and_wait flow:
const expectedButtonRequestsForT1: ButtonRequest[] = [
    'ButtonRequest_ProtectCall',
    'ButtonRequest_FirmwareUpdate',
];

// T2,T3 devices emit ButtonRequest_Other (before bootloader & also in bootloader before starting the installation)
// and ButtonRequest_FirmwareUpdate (to confirm the installation) in reboot_and_wait and reboot_and_upgrade flows:
const expectedButtonRequestsForT2andT3: ButtonRequest[] = [
    'ButtonRequest_Other',
    'ButtonRequest_FirmwareUpdate',
];

export const useFirmwareInstallation = (
    { shouldSwitchFirmwareType }: UseFirmwareInstallationParams = {
        shouldSwitchFirmwareType: false,
    },
) => {
    const dispatch = useDispatch();
    const firmware = useSelector(selectFirmware);
    const device = useSelector(selectSelectedDevice);
    const isThpInProgress = useSelector(selectIsThpInProgress);

    const [reconnectEvent, buttonEvent, progressEvent] = useMemo(() => {
        if (firmware.uiEvent) {
            if (firmware.uiEvent.type === UI.FIRMWARE_RECONNECT) {
                return [firmware.uiEvent.payload];
            }
            if (firmware.uiEvent.type === DEVICE.BUTTON) {
                return [undefined, firmware.uiEvent.payload];
            }
            if (firmware.uiEvent.type === UI.FIRMWARE_PROGRESS) {
                return [undefined, undefined, firmware.uiEvent.payload];
            }
        }

        return [];
    }, [firmware.uiEvent]);

    // Device in its state before installation is cached when installation begins.
    // Until then, access device as normal.
    const originalDevice = firmware.cachedDevice || device;

    // To instruct user to reboot to bootloader manually, UI.FIRMWARE_DISCONNECT event is emitted first,
    // and UI.FIRMWARE_RECONNECT is emitted after the device disconnects.
    const showManualReconnectPrompt = reconnectEvent?.method === 'manual';

    const expectedButtonRequests =
        originalDevice?.features?.major_version === 1
            ? expectedButtonRequestsForT1
            : expectedButtonRequestsForT2andT3;

    const showReconnectPrompt =
        // For some magic reason, the `ButtonRequest_Other` is present in FW after THP pairing;
        // This causes the UI to show the reconnect prompt, despite we are already done.
        firmware.status !== 'done' &&
        ((buttonEvent?.code && expectedButtonRequests.includes(buttonEvent.code)) ||
            showManualReconnectPrompt);

    const deviceWillBeWiped = determineIfDeviceWillBeWiped(
        originalDevice,
        !!shouldSwitchFirmwareType,
    );

    const isThpConfirmationRequested = [
        'thp_pairing_request',
        'thp_connection_request',
        'thp_autoconnect_credential_request',
    ].includes(firmware.status);

    const confirmOnDevice =
        // Show the confirmation pill before starting the installation using the "wait" or "manual" method,
        // after ReconnectDevicePrompt is closed and user selects the option to install firmware while in bootloader.
        // Also, in case the device is PIN-locked at the start of the process.
        (buttonEvent?.code &&
            ['ButtonRequest_FirmwareUpdate', 'ButtonRequest_PinEntry'].includes(
                buttonEvent.code,
            )) ||
        // Show the confirmation pill right after ReconnectDevicePrompt is closed while using the "wait" or "manual" method,
        // before the user selects the option to install firmware while in bootloader
        // When a PIN-protected device reconnects to normal mode after installation, PIN is requested and the pill is shown.
        // There is a false positive in case such device is wiped (including PIN) during custom installation.
        (reconnectEvent &&
            (reconnectEvent.target === 'bootloader' ||
                (reconnectEvent.target === 'normal' &&
                    originalDevice?.features?.pin_protection &&
                    !deviceWillBeWiped))) ||
        isThpConfirmationRequested;

    const showConfirmationPill =
        (!showReconnectPrompt && progressEvent?.operation === 'downloading') ||
        isThpConfirmationRequested;

    const updateStatus = useMemo<FirmwareOperationStatus>(() => {
        if (isThpInProgress) {
            return { operation: 'thp', progress: 100 };
        }

        if (firmware.status === 'done') {
            return {
                operation: 'completed',
                progress: 100,
            };
        }

        if (progressEvent?.operation === 'flashing') {
            return {
                operation: 'installing',
                progress: progressEvent.progress,
            };
        }

        // Automatically restarting from bootloader to normal mode at the end of non-intermediary installation:
        if (reconnectEvent?.method === 'wait') {
            return { operation: 'restarting', progress: 100 };
        }

        return { operation: null, progress: 0 };
    }, [isThpInProgress, firmware.status, reconnectEvent, progressEvent]);

    const targetFirmwareType = useMemo(() => {
        const isCurrentlyBitcoinOnly = hasBitcoinOnlyFirmware(originalDevice);
        const isBitcoinOnlyAvailable =
            !!originalDevice?.firmwareReleaseConfigInfo?.isBitcoinOnlyAvailable;

        return (isCurrentlyBitcoinOnly && !shouldSwitchFirmwareType) ||
            // Switching to Bitcoin-only:
            (!isCurrentlyBitcoinOnly && shouldSwitchFirmwareType && isBitcoinOnlyAvailable) ||
            // Bitcoin-only device:
            isBitcoinOnlyDevice(originalDevice)
            ? FirmwareType.BitcoinOnly
            : FirmwareType.Universal;
    }, [originalDevice, shouldSwitchFirmwareType]);

    const firmwareUpdate = useCallback(
        (arg: FirmwareUpdateProps) => dispatch(firmwareUpdateThunk(arg)),
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
        reconnectEvent,
        buttonEvent,
        progressEvent,
    };
};
