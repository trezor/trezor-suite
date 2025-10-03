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

    const { firmwareUpdate, ...rest } = useFirmwareInstallation({
        shouldSwitchFirmwareType,
    });

    const desktopFirmwareUpdate = (arg: FirmwareUpdateProps) => {
        if (isDeviceConnectedViaBluetoothLowOnBattery) {
            setShowLowBatteryModal(true);

            return;
        }
        firmwareUpdate(arg);
    };

    return {
        ...rest,
        firmwareUpdate: desktopFirmwareUpdate,
        toggleLowBatteryModal: useCallback(() => setShowLowBatteryModal(prev => !prev), []),
        showLowBatteryModal,
    };
};
