import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { Switch, Tooltip } from '@trezor/components';
import { ActionColumn, TextColumn } from '@trezor/product-components';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

interface DeviceLabelProps {
    isDeviceLocked: boolean;
}

export const HapticFeedback = ({ isDeviceLocked }: DeviceLabelProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const analytics = useAnalytics();
    const isSupportedDevice = device?.features?.capabilities?.includes('Capability_Haptic');

    if (!isSupportedDevice) {
        return null;
    }

    const hapticEnabled = device?.features?.haptic_feedback ?? false;

    const handleChange = async () => {
        const result = await dispatch(applySettings({ haptic_feedback: !hapticEnabled }));

        if (result?.success) {
            analytics.report({
                type: events.settingsDeviceChangeHapticFeedbackEvent.name,
                payload: { value: !hapticEnabled },
            });
        }
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.PinProtection}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_HAPTIC_FEEDBACK_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_HAPTIC_FEEDBACK_DESC" />}
            />
            <ActionColumn>
                <Tooltip
                    isActive={isDeviceLocked}
                    content={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Switch
                        isChecked={hapticEnabled}
                        onChange={handleChange}
                        isDisabled={isDeviceLocked}
                        data-testid="@settings/device/haptic-switch"
                    />
                </Tooltip>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
