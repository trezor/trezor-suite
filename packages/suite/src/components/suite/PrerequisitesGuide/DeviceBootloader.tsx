import styled from 'styled-components';
import { Translation, TroubleshootingTips } from 'src/components/suite';
import { Button } from '@trezor/components';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { TrezorDevice } from 'src/types/suite';
import { pickByDeviceModel } from '@trezor/device-utils';
import { DeviceModelInternal } from '@trezor/connect';

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
                    id={pickByDeviceModel(deviceModelInternal, {
                        default: 'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_NO_BUTTON',
                        [DeviceModelInternal.T2T1]:
                            'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_NO_TOUCH',
                    })}
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
            action: <Button onClick={gotToDeviceSettings} icon="SETTINGS" iconSize={20} />,
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
