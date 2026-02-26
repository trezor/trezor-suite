import { Translation } from '@suite/intl';

import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';
import { useDevice } from 'src/hooks/suite/useDevice';
import { getHowToGetFromBootloaderInstructionsMap } from 'src/utils/device/bootloader';

import { TroubleshootingTipsItem } from '../troubleshooting/TroubleshootingTips';
import { UpdateGoToSettingsDescription } from '../troubleshooting/tips/UpdateGoToSettingsDescription';

/* User connected the device in bootloader mode, but in order to continue it needs to be in normal mode */
export const DeviceBootloader = () => {
    const { device } = useDevice();
    const deviceModelInternal = device?.features?.internal_model;

    const tipDescription = getHowToGetFromBootloaderInstructionsMap({ deviceModelInternal });

    const tips: TroubleshootingTipsItem[] = [
        {
            key: 'device-bootloader',
            heading: <Translation id="TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT" />,
            description: tipDescription !== null ? <Translation id={tipDescription} /> : null,
            icon: 'trezorBody',
        },
        {
            key: 'wipe-or-update',
            heading: <Translation id="TR_WIPE_OR_UPDATE" />,
            description: <UpdateGoToSettingsDescription />,
            icon: 'arrowsClockwise',
        },
    ];

    return (
        <TroubleshootingTips
            label={<Translation id="TR_DEVICE_IN_BOOTLOADER" />}
            items={tips}
            intent="warning"
        />
    );
};
