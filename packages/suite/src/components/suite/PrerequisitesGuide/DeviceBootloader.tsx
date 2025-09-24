import { Translation, TroubleshootingTips } from 'src/components/suite';
import { useDevice } from 'src/hooks/suite/useDevice';
import { getHowToGetFromBootloaderInstructionsMap } from 'src/utils/device/bootloader';

import { TroubleshootingTipsItem } from '../troubleshooting/TroubleshootingTips';

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
