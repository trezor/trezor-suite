import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import TrezorConnect from '@trezor/connect';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

interface DeviceLabelProps {
    isDeviceLocked: boolean;
}

export const Brightness = ({ isDeviceLocked }: DeviceLabelProps) => {
    const { device } = useDevice();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
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
