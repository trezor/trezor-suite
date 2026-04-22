import { events } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import TrezorConnect from '@trezor/connect';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useAnalytics } from 'src/support/useAnalytics';

interface DeviceLabelProps {
    isDeviceLocked: boolean;
}

export const Brightness = ({ isDeviceLocked }: DeviceLabelProps) => {
    const { device } = useDevice();
    const analytics = useAnalytics();
    const isSupportedDevice = device?.features?.capabilities?.includes('Capability_Brightness');

    if (!isSupportedDevice) {
        return null;
    }

    const handleClick = async () => {
        const result = await TrezorConnect.setBrightness({});
        if (result.success) {
            analytics.report({
                type: events.settingsDeviceChangeBrightnessEvent.name,
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
                    intent="brand"
                    data-testid="@settings/device/brightness-switch"
                    isTooltipActive={isDeviceLocked}
                    tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Translation id="TR_DEVICE_SETTINGS_BRIGHTNESS_BUTTON" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
