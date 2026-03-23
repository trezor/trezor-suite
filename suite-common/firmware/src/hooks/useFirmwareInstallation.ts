import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import {
    type ButtonRequest,
    type FirmwareStatus,
    type TrezorDevice,
} from '@suite-common/suite-types';
import { THP_BUTTON_REQUESTS_NAMES, selectThpStep } from '@suite-common/thp';
import {
    DEVICE,
    type Device,
    type DeviceButtonRequestPayload,
    FirmwareType,
    UI_REQUEST,
} from '@trezor/connect';
import {
    DeviceModelInternal,
    getFirmwareVersion,
    hasBitcoinOnlyFirmware,
    isBitcoinOnlyDevice,
} from '@trezor/device-utils';
import { isArrayMember } from '@trezor/utils';

import { firmwareActions } from '../firmwareActions';
import { selectFirmware, selectSwitchFirmwareType } from '../firmwareReducer';
import { type FirmwareUpdateProps, firmwareUpdate as firmwareUpdateThunk } from '../firmwareThunks';

/*
There are three firmware update flows, depending on current firmware version:
- manual: devices with firmware version < 1.10.0 | 2.6.0 must be manually disconnected and reconnected in bootloader mode
- reboot_and_wait: newer devices can reboot to bootloader without manual disconnection, then user confirms installation
- reboot_and_upgrade: a device with firmware version >= 2.6.3 can reboot and upgrade in one step (not supported for reinstallation and downgrading)
*/

// TODO: Determine this in Connect.
const determineIfDeviceWillBeWiped = (
    device: TrezorDevice | undefined,
    switchFirmwareType: boolean,
) => {
    const deviceModelInternal = device?.features?.internal_model;
    const deviceIsInitializedOrInBootloader = device?.mode !== 'initialize';
    // Changing the vendor header always results in device wipe. T1B1 and T2T1 have the same vendor header for bitcoin-only and universal firmware.
    const installationWillChangeFirmwareVendorHeader =
        !!switchFirmwareType &&
        deviceModelInternal !== undefined &&
        ![DeviceModelInternal.T1B1, DeviceModelInternal.T2T1].includes(deviceModelInternal);
    // Faulty firmware version.
    const firmwareVersionIsGuaranteedToWipeDevice = getFirmwareVersion(device) === '1.6.1';

    return (
        deviceIsInitializedOrInBootloader &&
        (installationWillChangeFirmwareVendorHeader || firmwareVersionIsGuaranteedToWipeDevice)
    );
};

export type FirmwareOperationStatus = {
    operation: 'installing' | 'restarting' | 'completed' | null;
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

type ShouldShowReconnectPromptParams = {
    buttonEvent: (DeviceButtonRequestPayload & { device: Device }) | undefined;
    firmwareStatus: 'error' | FirmwareStatus;
    originalDevice: TrezorDevice | undefined;
};

const shouldShowReconnectPrompt = ({
    buttonEvent,
    originalDevice,
    firmwareStatus,
}: ShouldShowReconnectPromptParams) => {
    if (buttonEvent?.code === undefined) {
        return false;
    }

    if (firmwareStatus === 'done') {
        return false;
    }

    // For some magic reason, the `ButtonRequest_Other` is present in FW after THP pairing;
    // This causes the UI to show the reconnect prompt, despite we are already done.
    const isThpButtonEvent =
        buttonEvent.code === 'ButtonRequest_Other' &&
        buttonEvent?.name !== undefined &&
        isArrayMember(buttonEvent?.name, THP_BUTTON_REQUESTS_NAMES);

    if (isThpButtonEvent) {
        return false;
    }

    const expectedButtonRequests =
        originalDevice?.features?.major_version === 1
            ? expectedButtonRequestsForT1
            : expectedButtonRequestsForT2andT3;

    return expectedButtonRequests.includes(buttonEvent.code);
};

export const useFirmwareInstallation = () => {
    const dispatch = useDispatch();
    const firmware = useSelector(selectFirmware);
    const device = useSelector(selectSelectedDevice);
    const thpStep = useSelector(selectThpStep);
    const switchFirmwareType = useSelector(selectSwitchFirmwareType);

    const [reconnectEvent, buttonEvent, progressEvent] = useMemo(() => {
        if (firmware.uiEvent) {
            if (firmware.uiEvent.type === UI_REQUEST.FIRMWARE_RECONNECT) {
                return [firmware.uiEvent.payload];
            }
            if (firmware.uiEvent.type === DEVICE.BUTTON) {
                return [undefined, firmware.uiEvent.payload];
            }
            if (firmware.uiEvent.type === UI_REQUEST.FIRMWARE_PROGRESS) {
                return [undefined, undefined, firmware.uiEvent.payload];
            }
        }

        return [];
    }, [firmware.uiEvent]);

    // Device in its state before installation is cached when installation begins.
    // Until then, access device as normal.
    const originalDevice = firmware.cachedDevice || device;

    // To instruct user to reboot to bootloader manually, UI.FIRMWARE_DISCONNECT event is emitted first,
    // and UI_REQUEST.FIRMWARE_RECONNECT is emitted after the device disconnects.
    const showManualReconnectPrompt = reconnectEvent?.method === 'manual';
    const deviceIsWaitingForConfirmationToInitiateConnection =
        reconnectEvent?.method === 'auto' && reconnectEvent.target === 'bootloader';
    const pinRequested = Boolean(
        buttonEvent?.code && ['ButtonRequest_PinEntry'].includes(buttonEvent.code),
    );

    const showReconnectPrompt =
        shouldShowReconnectPrompt({
            buttonEvent,
            firmwareStatus: firmware.status,
            originalDevice,
        }) ||
        showManualReconnectPrompt ||
        deviceIsWaitingForConfirmationToInitiateConnection ||
        pinRequested;

    const deviceWillBeWiped = determineIfDeviceWillBeWiped(originalDevice, !!switchFirmwareType);

    const isThpConfirmationRequested = thpStep === 'ConfirmOnlyConnection';

    const confirmOnDevice =
        // Show the confirmation pill before starting the installation using the "wait" or "manual" method,
        // after ReconnectDevicePrompt is closed and user selects the option to install firmware while in bootloader.
        // Also, in case the device is PIN-locked at the start of the process.
        (buttonEvent?.code && ['ButtonRequest_FirmwareUpdate'].includes(buttonEvent.code)) ||
        pinRequested ||
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
        isThpConfirmationRequested ||
        firmware.uiEvent?.type === UI_REQUEST.FIRMWARE_RECONNECT ||
        firmware.uiEvent?.type === 'button';

    const updateStatus = useMemo<FirmwareOperationStatus>(() => {
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
        if (reconnectEvent?.method === 'wait' || reconnectEvent?.method === 'auto') {
            return {
                operation: 'restarting',
                // NOTE: when restarting to bootloader, set the progress to 0 (can't be finished yet)
                progress: reconnectEvent && reconnectEvent.target === 'bootloader' ? 0 : 100,
            };
        }

        if (!progressEvent && firmware.status !== 'started') {
            return { operation: null, progress: 100 };
        }

        return { operation: null, progress: 0 };
    }, [firmware.status, progressEvent, reconnectEvent]);

    const targetFirmwareType = useMemo(() => {
        const isCurrentlyBitcoinOnly = hasBitcoinOnlyFirmware(originalDevice);
        const isBitcoinOnlyAvailable =
            !!originalDevice?.firmwareReleaseConfigInfo?.isBitcoinOnlyAvailable;

        return (isCurrentlyBitcoinOnly && !switchFirmwareType) ||
            // Switching to Bitcoin-only:
            (!isCurrentlyBitcoinOnly && switchFirmwareType && isBitcoinOnlyAvailable) ||
            // Bitcoin-only device:
            isBitcoinOnlyDevice(originalDevice)
            ? FirmwareType.BitcoinOnly
            : FirmwareType.Universal;
    }, [originalDevice, switchFirmwareType]);

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
        switchFirmwareType,
        deviceWillBeWiped,
        showReconnectPrompt,
        showConfirmationPill,
        reconnectEvent,
        buttonEvent,
        pinRequested,
        progressEvent,
        deviceIsWaitingForConfirmationToInitiateConnection,
    };
};
