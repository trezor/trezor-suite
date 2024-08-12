import { Switch } from '@trezor/components';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useDispatch } from '../../../hooks/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { analytics, EventType } from '@trezor/suite-analytics';

interface DeviceLabelProps {
    isDeviceLocked: boolean;
}

export const HapticFeedback = ({ isDeviceLocked }: DeviceLabelProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const isSupportedDevice = device?.features?.capabilities?.includes('Capability_Haptic');

    if (!isSupportedDevice) {
        return null;
    }

    const hapticEnabled = device?.features?.haptic_feedback ?? false;

    const handleChange = async () => {
        const result = await dispatch(applySettings({ haptic_feedback: !hapticEnabled }));

        if (result?.success) {
            analytics.report({
                type: EventType.SettingsDeviceChangeHapticFeedback,
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
                <Switch
                    isChecked={hapticEnabled}
                    onChange={handleChange}
                    isDisabled={isDeviceLocked}
                    data-testid="@settings/device/haptic-switch"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
