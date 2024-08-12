import { analytics, EventType } from '@trezor/suite-analytics';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, ActionSelect, TextColumn, Translation } from 'src/components/suite';
import { useDevice, useDispatch, useLocales } from 'src/hooks/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { SettingsAnchor } from 'src/constants/suite/anchors';

// auto lock times in seconds; allowed lock times by device: <1 minute, 6 days>
const AUTO_LOCK_TIMES = {
    '1_MINUTE': 60,
    '10_MINUTES': 60 * 10,
    '1_HOUR': 60 * 60,
    '1_DAY': 60 * 60 * 24,
    '6_DAYS': 60 * 60 * 24 * 6,
} as const;

const buildAutoLockOption = (seconds: number, locale?: Locale) => ({
    label: formatDurationStrict(seconds, locale),
    value: seconds,
});

interface AutoLockProps {
    isDeviceLocked: boolean;
}

export const AutoLock = ({ isDeviceLocked }: AutoLockProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const locale = useLocales();

    const autoLockDelay = device?.features?.auto_lock_delay_ms;

    if (typeof autoLockDelay !== 'number') {
        return null;
    }

    const AUTO_LOCK_OPTIONS = {
        label: <Translation id="TR_DEVICE_SETTINGS_AFTER_DELAY" />,
        options: Object.values(AUTO_LOCK_TIMES).map(time => buildAutoLockOption(time, locale)),
    };

    const handleChange = (option: { value: number; label: string }) => {
        const value = option.value * 1000;

        dispatch(applySettings({ auto_lock_delay_ms: value }));
        analytics.report({
            type: EventType.SettingsDeviceUpdateAutoLock,
            payload: {
                value,
            },
        });
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.Autolock}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_AUTO_LOCK" />}
                description={<Translation id="TR_DEVICE_SETTINGS_AUTO_LOCK_SUBHEADING" />}
            />
            <ActionColumn>
                <ActionSelect
                    useKeyPressScroll
                    placeholder=""
                    onChange={handleChange}
                    options={[AUTO_LOCK_OPTIONS]}
                    value={AUTO_LOCK_OPTIONS.options.find(
                        option => autoLockDelay && autoLockDelay / 1000 === option.value,
                    )}
                    isDisabled={isDeviceLocked}
                    data-testid="@settings/auto-lock-select"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
