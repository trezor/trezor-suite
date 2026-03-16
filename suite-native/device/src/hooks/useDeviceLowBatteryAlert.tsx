import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import {
    DEVICE_LOW_BATTERY_PERCENTAGE_THRESHOLD,
    selectIsDeviceConnectedViaBluetoothLowOnBattery,
} from '@suite-common/device';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';

export const useDeviceLowBatteryAlert = () => {
    const isDeviceConnectedViaBluetoothLowOnBattery = useSelector(
        selectIsDeviceConnectedViaBluetoothLowOnBattery,
    );
    const { showAlert } = useAlert();

    const showLowBatteryAlertIfNecessary = useCallback(() => {
        if (isDeviceConnectedViaBluetoothLowOnBattery) {
            showAlert({
                title: <Translation id="moduleDevice.alerts.lowBattery.title" />,
                description: (
                    <Translation
                        id="moduleDevice.alerts.lowBattery.description"
                        values={{ percentage: DEVICE_LOW_BATTERY_PERCENTAGE_THRESHOLD }}
                    />
                ),
                primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            });

            return true;
        }

        return false;
    }, [isDeviceConnectedViaBluetoothLowOnBattery, showAlert]);

    return {
        showLowBatteryAlertIfNecessary,
    };
};
