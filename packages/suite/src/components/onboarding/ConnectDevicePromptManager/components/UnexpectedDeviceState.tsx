import React from 'react';
import styled from 'styled-components';
import { TroubleshootingTips } from '@onboarding-components';
import { Translation } from '@suite/components/suite';
import { ConnectedDeviceStatus } from '@onboarding-types';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const tips = [
    {
        key: '1',
        heading: 'Make sure Trezor Bridge is installed and running',
        description: 'There should be probably a link to download it somewhere',
    },
    {
        key: '3',
        heading: 'Try a different USB or port',
        description: 'Connect it directly to computer, no hubs.',
    },
    {
        key: '4',
        heading: 'Try using a different computer, if you can',
        description: 'With Trezor Bridge installed',
    },
];
interface Props {
    deviceStatus: ConnectedDeviceStatus;
    trezorModel?: number;
}
const UnexpectedDeviceState = ({ deviceStatus, trezorModel }: Props) => (
    <Wrapper>
        {deviceStatus === 'unreadable' && (
            // User connected unreadable device
            // We don't really know what happened, show some generic help and provide link to contact a support
            <>
                <TroubleshootingTips
                    label={<Translation id="TR_YOUR_DEVICE_IS_CONNECTED_BUT_UNREADABLE" />}
                    items={tips}
                />

                {/* <Button onClick={() => TrezorConnect.disableWebUSB()}>
                        <Translation id="TR_TRY_BRIDGE" />
                    </Button> */}
            </>
        )}
        {deviceStatus === 'in-bootloader' && (
            // User connected the device in bootloader mode, but in order to continue it needs to be in normal mode
            <TroubleshootingTips
                label={<Translation id="TR_DEVICE_IN_BOOTLOADER" />}
                items={[
                    {
                        key: 'bootloader',
                        heading: <Translation id="TR_RECONNECT_IN_NORMAL" />,
                        description:
                            trezorModel === 1 ? (
                                <Translation id="FIRMWARE_CONNECT_IN_NORMAL_MODEL_1" />
                            ) : (
                                <Translation id="FIRMWARE_CONNECT_IN_NORMAL_MODEL_2" />
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
                        heading: 'Seedless setup is not supported by Trezor Suite',
                        description:
                            'Devices which are set up in the seedless mode cannot access the Trezor Suite. This is to avoid catastrophic coin loss, in case an inappropriately setup device is used for a wrong purpose.',
                    },
                ]}
            />
        )}
    </Wrapper>
);

export default UnexpectedDeviceState;
