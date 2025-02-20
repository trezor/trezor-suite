import { Switch, Tooltip } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { changePin } from 'src/actions/settings/deviceSettingsActions';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useDispatch } from 'src/hooks/suite';

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
                <Tooltip
                    isActive={isDeviceLocked}
                    content={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Switch
                        isChecked={!!pinProtection}
                        onChange={handleChange}
                        isDisabled={isDeviceLocked}
                        data-testid="@settings/device/pin-switch"
                    />
                </Tooltip>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
