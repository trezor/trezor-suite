import { useCallback, useState } from 'react';

import {
    type FirmwareUpdateProps,
    type UseFirmwareInstallationParams,
    useFirmwareInstallation,
} from '@suite-common/firmware';
import { selectIsDeviceConnectedViaBluetoothLowOnBattery } from '@suite-common/wallet-core';

import { useSelector } from './useSelector';

export const useFirmwareDesktopUpdate = (
    { shouldSwitchFirmwareType }: UseFirmwareInstallationParams = {
        shouldSwitchFirmwareType: false,
    },
) => {
    const [showLowBatteryModal, setShowLowBatteryModal] = useState(false);
    const isDeviceConnectedViaBluetoothLowOnBattery = useSelector(
        selectIsDeviceConnectedViaBluetoothLowOnBattery,
    );

    const { firmwareUpdate, originalDevice, reconnectEvent, pinRequested, ...rest } =
        useFirmwareInstallation({
            shouldSwitchFirmwareType,
        });

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
    };
};
