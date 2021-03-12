import React from 'react';
import styled from 'styled-components';
import { TroubleshootingTips } from '@onboarding-components';
import { Translation } from '@suite-components/Translation';
import { ConnectedDeviceStatus } from '@onboarding-types';
import {
    TROUBLESHOOTING_TIP_BRIDGE,
    TROUBLESHOOTING_TIP_USB,
    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
} from '@onboarding-components/TroubleshootingTips/tips';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;
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
                    items={[
                        TROUBLESHOOTING_TIP_BRIDGE,
                        TROUBLESHOOTING_TIP_USB,
                        TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
                    ]}
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
