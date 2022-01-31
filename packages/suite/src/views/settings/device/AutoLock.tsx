import React from 'react';

import { Translation } from '@suite-components';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@suite-components/Settings';
import { useAnalytics, useActions, useDevice, useLocales } from '@suite-hooks';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { formatDurationStrict } from '@suite-utils/date';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

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
    const { applySettings } = useActions({
        applySettings: deviceSettingsActions.applySettings,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Autolock);

    const { device } = useDevice();
    const analytics = useAnalytics();
    const locale = useLocales();

    const autoLockDelay = device?.features?.auto_lock_delay_ms;

    if (typeof autoLockDelay !== 'number') {
        return null;
    }

    const AUTO_LOCK_OPTIONS = {
        label: <Translation id="TR_DEVICE_SETTINGS_AFTER_DELAY" />,
        options: Object.values(AUTO_LOCK_TIMES).map(time => buildAutoLockOption(time, locale)),
    };

    return (
        <SectionItem
            data-test="@settings/device/autolock"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_AUTO_LOCK" />}
                description={<Translation id="TR_DEVICE_SETTINGS_AUTO_LOCK_SUBHEADING" />}
            />
            <ActionColumn>
                <ActionSelect
                    noTopLabel
                    hideTextCursor
                    useKeyPressScroll
                    placeholder=""
                    onChange={(option: { value: number; label: string }) => {
                        const value = option.value * 1000;

                        applySettings({
                            auto_lock_delay_ms: value,
                        });
                        analytics.report({
                            type: 'settings/device/update-auto-lock',
                            payload: {
                                value,
                            },
                        });
                    }}
                    options={[AUTO_LOCK_OPTIONS]}
                    value={AUTO_LOCK_OPTIONS.options.find(
                        option => autoLockDelay && autoLockDelay / 1000 === option.value,
                    )}
                    isDisabled={isDeviceLocked}
                    data-test="@settings/auto-lock-select"
                />
            </ActionColumn>
        </SectionItem>
    );
};
