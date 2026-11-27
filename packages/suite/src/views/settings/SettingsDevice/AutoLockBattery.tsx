import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { applySettingsThunk } from '#src/actions/settings/deviceSettingsActions';

import { AutoLockSelect } from './AutoLockSelect';

// Auto-lock times in seconds. The device allows 30 seconds to 10 minutes while on battery.
const AUTO_LOCK_BATTERY_TIMES = {
    '30_SECONDS': 30,
    '1_MINUTE': 60,
    '2_MINUTES': 60 * 2,
    '5_MINUTES': 60 * 5,
    '10_MINUTES': 60 * 10,
} as const;

type AutoLockBatteryProps = {
    isDeviceLocked: boolean;
};

export const AutoLockBattery = ({ isDeviceLocked }: AutoLockBatteryProps) => {
    const { device } = useDevice();
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const autoLockDelayBattery = device?.features?.auto_lock_delay_battery_ms;

    // Only a device that runs on battery reports this delay.
    if (typeof autoLockDelayBattery !== 'number') {
        return null;
    }

    const handleChange = (value: number) => {
        dispatch(applySettingsThunk({ auto_lock_delay_battery_ms: value }));
        analytics.report({
            type: events.settingsDeviceUpdateAutoLockEvent.name,
            payload: {
                value,
                powerSource: 'battery',
            },
        });
    };

    return (
        <AutoLockSelect
            anchorId={SettingsAnchor.AutolockBattery}
            title={<Translation id="TR_DEVICE_SETTINGS_AUTO_LOCK_BATTERY" />}
            description={<Translation id="TR_DEVICE_SETTINGS_AUTO_LOCK_BATTERY_SUBHEADING" />}
            presetAutoLockTimes={Object.values(AUTO_LOCK_BATTERY_TIMES)}
            autoLockDelay={autoLockDelayBattery}
            isDeviceLocked={isDeviceLocked}
            onChange={handleChange}
            data-testid="@settings/auto-lock-battery-select"
        />
    );
};
