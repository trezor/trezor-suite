import { analytics, EventType } from '@trezor/suite-analytics';

import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { Switch } from '@trezor/components';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { changePin } from 'src/actions/settings/deviceSettingsActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { SettingsSectionItem } from 'src/components/settings';

interface PinProtectionProps {
    isDeviceLocked: boolean;
}

export const PinProtection = ({ isDeviceLocked }: PinProtectionProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const pinProtection = device?.features?.pin_protection ?? null;

    const handleChange = () => {
        dispatch(changePin({ remove: !!pinProtection }));
        analytics.report({
            type: EventType.SettingsDeviceChangePinProtection,
            payload: {
                remove: pinProtection,
            },
        });
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.PinProtection}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_PIN_PROTECTION_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_PIN_PROTECTION_DESC" />}
            />
            <ActionColumn>
                <Switch
                    isChecked={!!pinProtection}
                    onChange={handleChange}
                    isDisabled={isDeviceLocked}
                    data-testid="@settings/device/pin-switch"
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
