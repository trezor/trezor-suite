import { useCallback, useState } from 'react';

import {
    type FirmwareOperationStatus,
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

    const { firmwareUpdate, reconnectEvent, operation, progress, ...rest } =
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

    const restartingToBootloader = reconnectEvent && reconnectEvent.target === 'bootloader';

    const updateOperation: FirmwareOperationStatus =
        operation === 'restarting'
            ? {
                  operation: 'restarting',
                  progress: restartingToBootloader ? 0 : progress,
              }
            : {
                  operation,
                  progress,
              };

    return {
        ...rest,
        firmwareUpdate: desktopFirmwareUpdate,
        toggleLowBatteryModal: useCallback(() => setShowLowBatteryModal(prev => !prev), []),
        showLowBatteryModal,
        reconnectEvent,
        // NOTE: on desktop, set the progress during restart to 0, when device is just going to the bootloader
        ...updateOperation,
    };
};
