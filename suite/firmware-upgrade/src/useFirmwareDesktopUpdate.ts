import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { waitForConnectedDeviceThunk } from '@suite-common/device';
import {
    type FirmwareUpdateProps,
    selectFirmware,
    selectIsFirmwareDeviceLowOnBattery,
    useFirmwareInstallation,
} from '@suite-common/firmware';
import { useDispatch } from '@suite-common/redux-utils';
import { UI_EVENTS } from '@trezor/connect';

import { adoptFirmwareUpdatedDeviceThunk } from './adoptFirmwareUpdatedDeviceThunk';

const INTERVAL_CHECK_SLOW_INSTALLATION_MS = 1_000;
const TIME_THRESHOLD_SLOW_INSTALLATION_MS = 30_000;
const PERCENTAGE_THRESHOLD_SLOW_INSTALLATION = 20;

export const useFirmwareDesktopUpdate = () => {
    const dispatch = useDispatch();
    const [showLowBatteryModal, setShowLowBatteryModal] = useState(false);
    const firmware = useSelector(selectFirmware);
    const isDeviceConnectedViaBluetoothLowOnBattery = useSelector(
        selectIsFirmwareDeviceLowOnBattery,
    );

    const { firmwareUpdate, originalDevice, reconnectEvent, pinRequested, ...rest } =
        useFirmwareInstallation();

    const [isSlow, setIsSlow] = useState(false);
    const [startTime, setStartTime] = useState<null | number>(null);

    useEffect(() => {
        if (
            !startTime &&
            firmware.uiEvent?.type === UI_EVENTS.FIRMWARE_PROGRESS &&
            firmware.uiEvent.payload.operation === 'start-flashing'
        ) {
            setStartTime(new Date().getTime());
        }
    }, [firmware.uiEvent, startTime]);

    useEffect(() => {
        if (!startTime || isSlow) {
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();

            if (now - startTime > TIME_THRESHOLD_SLOW_INSTALLATION_MS) {
                if (
                    firmware.uiEvent?.type === UI_EVENTS.FIRMWARE_PROGRESS &&
                    firmware.uiEvent.payload.progress < PERCENTAGE_THRESHOLD_SLOW_INSTALLATION
                ) {
                    setIsSlow(true);
                    clearInterval(interval);
                }
            }
        }, INTERVAL_CHECK_SLOW_INSTALLATION_MS);

        return () => clearInterval(interval);
    }, [startTime, isSlow, firmware.uiEvent]);

    const desktopFirmwareUpdate = async (updateProps: FirmwareUpdateProps) => {
        if (isDeviceConnectedViaBluetoothLowOnBattery) {
            setShowLowBatteryModal(true);

            return;
        }

        const updateResult = await firmwareUpdate(updateProps);

        // `@trezor/connect` only returns once it has seen the device reconnect and released it, so
        // the update is over — but the store is filled from the connect event, which travels
        // separately, so the device may not be an entry here yet. Wait for it rather than race it.
        //
        // The path connect reports is where it last had the device, which is the answer whenever
        // the reboot did not re-enumerate it elsewhere; the wait falls back to whichever device is
        // the only one on that transport when it did.
        //
        // A device that never turns up (a failed update, an unplugged device) times out, and is
        // taken back by `useFirmwareDeviceTrackingListener` instead when it eventually reconnects.
        const apiType = originalDevice?.descriptor.apiType;

        if (!apiType) {
            return;
        }

        const { connectResponse } = updateResult.payload ?? {};
        // Only a successful call reports where it last had the device.
        const path = connectResponse?.success ? connectResponse.device?.path : undefined;

        const updatedDevice = await dispatch(
            waitForConnectedDeviceThunk({ apiType, path }),
        ).unwrap();

        if (updatedDevice) {
            dispatch(adoptFirmwareUpdatedDeviceThunk({ device: updatedDevice }));
        }
    };

    // NOTE: Asume that when the device is restarting back to normal mode and is PIN protected, the PIN will be requested and hence display "device modal"
    const restartingToNormalWithPinProtection =
        rest.operation === 'restarting' &&
        reconnectEvent?.target === 'normal' &&
        originalDevice?.features?.pin_protection &&
        // NOTE: when the device is wiped, the PIN is also wiped
        !rest.deviceWillBeWiped;

    return {
        ...rest,
        originalDevice,
        firmwareUpdate: desktopFirmwareUpdate,
        toggleLowBatteryModal: useCallback(() => setShowLowBatteryModal(prev => !prev), []),
        showLowBatteryModal,
        reconnectEvent,
        showReconnectPrompt: rest.showReconnectPrompt || restartingToNormalWithPinProtection,
        pinRequested: pinRequested || restartingToNormalWithPinProtection,
        isSlow,
    };
};
