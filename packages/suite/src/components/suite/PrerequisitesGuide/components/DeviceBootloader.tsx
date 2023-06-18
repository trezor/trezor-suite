import React from 'react';
import styled from 'styled-components';
import { Translation, TroubleshootingTips } from 'src/components/suite';
import { Button } from '@trezor/components';
import { useActions } from 'src/hooks/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import { TrezorDevice } from 'src/types/suite';
import { DeviceModel, getDeviceModel, pickByDeviceModel } from '@trezor/device-utils';

const WhiteSpace = styled.div`
    min-width: 60px;
`;

interface DeviceBootloaderProps {
    device?: TrezorDevice;
}

/* User connected the device in bootloader mode, but in order to continue it needs to be in normal mode */
export const DeviceBootloader = ({ device }: DeviceBootloaderProps) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const deviceModel = getDeviceModel(device);

    const tips = [
        {
            key: 'device-bootloader',
            heading: <Translation id="TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT" />,
            description: (
                <Translation
                    id={pickByDeviceModel(deviceModel, {
                        default: 'TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT_IN_NORMAL_NO_BUTTON',
                        [DeviceModel.TT]:
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
            action: (
                <Button
                    onClick={() => {
                        goto('settings-device');
                    }}
                    icon="SETTINGS"
                    size={20}
                />
            ),
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
