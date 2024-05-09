import TrezorConnect from '@trezor/connect';
import { analytics, EventType } from '@trezor/suite-analytics';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useSelector } from '../../../hooks/suite';

interface DeviceLabelProps {
    isDeviceLocked: boolean;
}

export const Brightness = ({ isDeviceLocked }: DeviceLabelProps) => {
    const { device } = useDevice();

    const showDebugMenu = useSelector(state => state.suite.settings.debug.showDebugMenu);

    const isSupportedDevice = device?.features?.capabilities?.includes('Capability_Brightness');

    if (!showDebugMenu || !isSupportedDevice) {
        return null;
    }

    const handleClick = async () => {
        const result = await TrezorConnect.setBrightness({});
        if (result.success) {
            analytics.report({
                type: EventType.SettingsDeviceChangeBrightness,
                payload: {},
            });
        }
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.PinProtection}>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_BRIGHTNESS_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_BRIGHTNESS_DESC" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={handleClick}
                    isDisabled={isDeviceLocked}
                    variant="secondary"
                    data-test="@settings/device/brightness-switch"
                >
                    <Translation id="TR_DEVICE_SETTINGS_BRIGHTNESS_BUTTON" />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
