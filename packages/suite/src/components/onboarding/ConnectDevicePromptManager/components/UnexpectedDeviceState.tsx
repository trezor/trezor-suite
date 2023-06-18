import React from 'react';
import { Translation, TroubleshootingTips } from 'src/components/suite';
import {
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_BRIDGE_INSTALL,
} from 'src/components/suite/TroubleshootingTips/tips';
import { DeviceModel, pickByDeviceModel } from '@trezor/device-utils';

// todo: remove in favour of suite-components
interface UnexpectedDeviceStateProps {
    deviceStatus: any;
    deviceModel?: DeviceModel;
}

export const UnexpectedDeviceState = ({
    deviceStatus,
    deviceModel,
}: UnexpectedDeviceStateProps) => (
    <>
        {deviceStatus === 'unreadable' && (
            // User connected unreadable device
            // We don't really know what happened, show some generic help and provide link to contact a support
            <>
                <TroubleshootingTips
                    label={<Translation id="TR_YOUR_DEVICE_IS_CONNECTED_BUT_UNREADABLE" />}
                    items={[TROUBLESHOOTING_TIP_BRIDGE_STATUS, TROUBLESHOOTING_TIP_BRIDGE_INSTALL]}
                />

                {/* <Button onClick={() => TrezorConnect.disableWebUSB()}>
                        <Translation id="TR_TRY_BRIDGE" />
                    </Button> */}
            </>
        )}

        {deviceStatus === 'bootloader' && (
            // User connected the device in bootloader mode, but in order to continue it needs to be in normal mode
            <TroubleshootingTips
                label={<Translation id="TR_DEVICE_IN_BOOTLOADER" />}
                items={[
                    {
                        key: 'bootloader',
                        heading: <Translation id="TR_RECONNECT_IN_NORMAL" />,
                        description: (
                            <Translation
                                id={pickByDeviceModel(deviceModel, {
                                    default: 'FIRMWARE_CONNECT_IN_NORMAL_MODEL_NO_BUTTON',
                                    [DeviceModel.TT]: 'FIRMWARE_CONNECT_IN_NORMAL_MODEL_NO_TOUCH',
                                })}
                            />
                        ),
                    },
                ]}
            />
        )}

        {deviceStatus === 'seedless' && (
            // Seedless devices are not supported by Trezor Suite
            <TroubleshootingTips
                label={<Translation id="TR_YOUR_DEVICE_IS_SEEDLESS" />}
                items={[
                    {
                        key: 'seedless',
                        heading: <Translation id="TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_TITLE" />,
                        description: (
                            <Translation id="TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_DESCRIPTION" />
                        ),
                    },
                ]}
            />
        )}
    </>
);
