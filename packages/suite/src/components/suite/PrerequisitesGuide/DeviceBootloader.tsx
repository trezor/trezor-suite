import styled from 'styled-components';

import { isDeviceWithButtons } from '@suite-common/suite-utils';
import { IconButton } from '@trezor/components';

import { Translation, TroubleshootingTips } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { TrezorDevice } from 'src/types/suite';

const WhiteSpace = styled.div`
    min-width: 60px;
`;

interface DeviceBootloaderProps {
    device?: TrezorDevice;
}

/* User connected the device in bootloader mode, but in order to continue it needs to be in normal mode */
export const DeviceBootloader = ({ device }: DeviceBootloaderProps) => {
    const dispatch = useDispatch();

    const deviceModelInternal = device?.features?.internal_model;

    const gotToDeviceSettings = () => dispatch(goto('settings-device'));

    const tips = [
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
            action: <WhiteSpace />, // To make the layout bit nicer - prevent floating above button on the next row.
        },
        {
            key: 'wipe-or-update',
            heading: <Translation id="TR_WIPE_OR_UPDATE" />,
            description: <Translation id="TR_WIPE_OR_UPDATE_DESCRIPTION" />,
            noBullet: true,
            action: <IconButton onClick={gotToDeviceSettings} icon="settings" iconSize={20} />,
        },
    ];

    return (
        <TroubleshootingTips
            label={<Translation id="TR_DEVICE_IN_BOOTLOADER" />}
            items={tips}
            opened
        />
    );
};
