import TrezorConnect from '@trezor/connect';
import { EventType, analytics } from '@trezor/suite-analytics';

import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';

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
                    isTooltipActive={isDeviceLocked}
                    tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Translation id="TR_DEVICE_SETTINGS_BRIGHTNESS_BUTTON" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
