import React from 'react';
import styled from 'styled-components';
import { Translation, TroubleshootingTips } from '@suite-components';
import {
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_BRIDGE_INSTALL,
} from '@suite-components/TroubleshootingTips/tips';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

// todo: remove in favour of suite-components
interface Props {
    deviceStatus: any;
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
                        heading: <Translation id="TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_TITLE" />,
                        description: (
                            <Translation id="TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_DESCRIPTION" />
                        ),
                    },
                ]}
            />
        )}
    </Wrapper>
);

export default UnexpectedDeviceState;
