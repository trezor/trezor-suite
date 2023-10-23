import { Translation, TroubleshootingTips } from 'src/components/suite';
import {
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_BRIDGE_INSTALL,
} from 'src/components/suite/troubleshooting/tips';
import { pickByDeviceModel } from '@trezor/device-utils';
import { DeviceModelInternal } from '@trezor/connect';

// todo: remove in favour of suite-components
interface UnexpectedDeviceStateProps {
    deviceStatus: any;
    deviceModelInternal?: DeviceModelInternal;
}

export const UnexpectedDeviceState = ({
    deviceStatus,
    deviceModelInternal,
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
                                id={pickByDeviceModel(deviceModelInternal, {
                                    default: 'FIRMWARE_CONNECT_IN_NORMAL_MODEL_NO_BUTTON',
                                    [DeviceModelInternal.T2T1]:
                                        'FIRMWARE_CONNECT_IN_NORMAL_MODEL_NO_TOUCH',
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
