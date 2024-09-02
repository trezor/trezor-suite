import TrezorConnect from '@trezor/connect';
import { analytics, EventType } from '@trezor/suite-analytics';
import { SectionItem } from 'src/components/suite';
import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { useDevice } from '../../../hooks/suite';

interface DeviceLabelProps {
    isDeviceLocked: boolean;
}

export const Brightness = ({ isDeviceLocked }: DeviceLabelProps) => {
    const { device } = useDevice();

    const isSupportedDevice = device?.features?.capabilities?.includes('Capability_Brightness');

    if (!isSupportedDevice) {
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
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_BRIGHTNESS_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_BRIGHTNESS_DESC" />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={handleClick}
                    isDisabled={isDeviceLocked}
                    variant="primary"
                    data-testid="@settings/device/brightness-switch"
                >
                    <Translation id="TR_DEVICE_SETTINGS_BRIGHTNESS_BUTTON" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
