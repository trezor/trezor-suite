import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { applySettingsThunk } from '#src/actions/settings/deviceSettingsActions';

import { AutoLockSelect } from './AutoLockSelect';

// auto lock times in seconds; allowed lock times by device: <1 minute, 6 days>
const AUTO_LOCK_TIMES = {
    '1_MINUTE': 60,
    '10_MINUTES': 60 * 10,
    '1_HOUR': 60 * 60,
    '1_DAY': 60 * 60 * 24,
    '6_DAYS': 60 * 60 * 24 * 6,
} as const;

interface AutoLockProps {
    isDeviceLocked: boolean;
}

export const AutoLock = ({ isDeviceLocked }: AutoLockProps) => {
    const { device } = useDevice();
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const autoLockDelay = device?.features?.auto_lock_delay_ms;
    // A device that runs on battery has a separate auto-lock delay for that, so this one applies
    // only while it is connected to USB.
    const hasBatteryAutoLock = typeof device?.features?.auto_lock_delay_battery_ms === 'number';

    if (typeof autoLockDelay !== 'number') {
        return null;
    }

    const handleChange = (value: number) => {
        dispatch(applySettingsThunk({ auto_lock_delay_ms: value }));
        analytics.report({
            type: events.settingsDeviceUpdateAutoLockEvent.name,
            payload: {
                value,
                powerSource: 'usb',
            },
        });
    };

    return (
        <AutoLockSelect
            anchorId={SettingsAnchor.Autolock}
            title={<Translation id="TR_DEVICE_SETTINGS_AUTO_LOCK" />}
            description={
                <Translation
                    id={
                        hasBatteryAutoLock
                            ? 'TR_DEVICE_SETTINGS_AUTO_LOCK_USB_SUBHEADING'
                            : 'TR_DEVICE_SETTINGS_AUTO_LOCK_SUBHEADING'
                    }
                />
            }
            presetAutoLockTimes={Object.values(AUTO_LOCK_TIMES)}
            autoLockDelay={autoLockDelay}
            isDeviceLocked={isDeviceLocked}
            onChange={handleChange}
            data-testid="@settings/auto-lock-select"
        />
    );
};
