import { isDeviceWithButtons } from '@suite-common/suite-utils';

import { Translation, TroubleshootingTips } from 'src/components/suite';
import { useDevice } from 'src/hooks/suite/useDevice';

import { TroubleshootingTipsItem } from '../troubleshooting/TroubleshootingTips';
import { UpdateGoToSettingsDescription } from '../troubleshooting/tips/UpdateGoToSettingsDescription';

/* User connected the device in bootloader mode, but in order to continue it needs to be in normal mode */
export const DeviceBootloader = () => {
    const { device } = useDevice();
    const deviceModelInternal = device?.features?.internal_model;

    const tips: TroubleshootingTipsItem[] = [
        {
            key: 'device-bootloader',
            heading: <Translation id="TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT" />,
            description: (
                <Translation
                    id={
                        deviceModelInternal && isDeviceWithButtons(deviceModelInternal)
                            ? 'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_NO_BUTTON'
                            : 'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_NO_TOUCH'
                    }
                />
            ),
            noBullet: true,
        },
        {
            key: 'wipe-or-update',
            heading: <Translation id="TR_WIPE_OR_UPDATE" />,
            description: <UpdateGoToSettingsDescription />,
            noBullet: true,
        },
    ];

    return (
        <TroubleshootingTips
            label={<Translation id="TR_DEVICE_IN_BOOTLOADER" />}
            items={tips}
            initiallyIsOpen
        />
    );
};
