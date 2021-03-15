import React from 'react';
import TrezorConnect from 'trezor-connect';
import styled from 'styled-components';
import { Text } from '@onboarding-components';
import { Button } from '@trezor/components';
import { Translation } from '@suite/components/suite';
import { ConnectedDeviceStatus } from '@onboarding-types';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;
`;

interface Props {
    deviceStatus: ConnectedDeviceStatus;
}
const UnexpectedDeviceState = ({ deviceStatus }: Props) => {
    return (
        <Wrapper>
            {deviceStatus === 'unreadable' && (
                <>
                    {/* User connected unreadable device
                    We don't really know what happened, show some generic help and provide link to contact a support */}
                    <Text>
                        <Translation id="TR_YOUR_DEVICE_IS_CONNECTED_BUT_UNREADABLE" />
                    </Text>
                    <Button onClick={() => TrezorConnect.disableWebUSB()}>
                        <Translation id="TR_TRY_BRIDGE" />
                    </Button>
                </>
            )}
            {deviceStatus === 'in-bootloader' && (
                <Text>
                    {/* User connected the device in bootloader mode, but in order to continue it needs to be in normal mode */}
                    <Translation id="TR_CONNECTED_DEVICE_IS_IN_BOOTLOADER" />
                </Text>
            )}
            {deviceStatus === 'seedless' && (
                <Text>
                    {/* Seedless devices are not supported by Trezor Suite */}
                    <Translation id="TR_YOUR_DEVICE_IS_SEEDLESS" />
                </Text>
            )}
        </Wrapper>
    );
};

export default UnexpectedDeviceState;
