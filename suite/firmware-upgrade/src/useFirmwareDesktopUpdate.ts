import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceConnectedViaBluetoothLowOnBattery } from '@suite-common/device';
import {
    type FirmwareUpdateProps,
    selectFirmware,
    useFirmwareInstallation,
} from '@suite-common/firmware';
import { UI_REQUEST } from '@trezor/connect';

const INTERVAL_CHECK_SLOW_INSTALLATION_MS = 1_000;
const TIME_THRESHOLD_SLOW_INSTALLATION_MS = 30_000;
const PERCENTAGE_THRESHOLD_SLOW_INSTALLATION = 20;

export const useFirmwareDesktopUpdate = () => {
    const [showLowBatteryModal, setShowLowBatteryModal] = useState(false);
    const firmware = useSelector(selectFirmware);
    const isDeviceConnectedViaBluetoothLowOnBattery = useSelector(
        selectIsDeviceConnectedViaBluetoothLowOnBattery,
    );

    const { firmwareUpdate, originalDevice, reconnectEvent, pinRequested, ...rest } =
        useFirmwareInstallation();

    const [isSlow, setIsSlow] = useState(false);
    const [startTime, setStartTime] = useState<null | number>(null);

    useEffect(() => {
        if (
            !startTime &&
            firmware.uiEvent?.type === UI_REQUEST.FIRMWARE_PROGRESS &&
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
                    firmware.uiEvent?.type === UI_REQUEST.FIRMWARE_PROGRESS &&
                    firmware.uiEvent.payload.progress < PERCENTAGE_THRESHOLD_SLOW_INSTALLATION
                ) {
                    setIsSlow(true);
                    clearInterval(interval);
                }
            }
        }, INTERVAL_CHECK_SLOW_INSTALLATION_MS);

        return () => clearInterval(interval);
    }, [startTime, isSlow, firmware.uiEvent]);

    const desktopFirmwareUpdate = (arg: FirmwareUpdateProps) => {
        if (isDeviceConnectedViaBluetoothLowOnBattery) {
            setShowLowBatteryModal(true);

            return;
        }

        firmwareUpdate(arg);
    };

    // NOTE: Asume that when the device is restarting back to normal mode and is PIN protected, the PIN will be requested and hence display "device modal"
    const restartingToNormalWithPinProtection =
        rest.operation === 'restarting' &&
        reconnectEvent &&
        reconnectEvent.target === 'normal' &&
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
