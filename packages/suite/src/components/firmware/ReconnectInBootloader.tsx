import React from 'react';
import { InitImg, ConnectInBootloaderImg, DisconnectImg, P, H2 } from '@firmware-components';

import { Button } from '@trezor/components';
import { Translation, WebusbButton } from '@suite-components';
import { useDevice, useFirmware, useSelector } from '@suite-hooks';
import { isWebUSB } from '@suite-utils/transport';

const Body = () => {
    const { device } = useDevice();
    const { prevDevice } = useFirmware();
    const expectedModel = prevDevice?.features?.major_version || 2;

    if (!device?.connected) {
        return (
            <>
                <ConnectInBootloaderImg model={expectedModel} />
                <H2>
                    <Translation id="TR_RECONNECT_IN_BOOTLOADER" />
                </H2>
                <P data-test="@firmware/connect-in-bootloader-message">
                    {expectedModel === 1 && <Translation id="TR_HOLD_LEFT_BUTTON" />}
                    {expectedModel !== 1 && <Translation id="TR_SWIPE_YOUR_FINGERS" />}
                </P>
            </>
        );
    }

    if (device.mode !== 'bootloader' && !device.features?.firmware_present) {
        return (
            <>
                <DisconnectImg />
                <H2 data-test="@firmware/disconnect-message">
                    <Translation id="TR_DISCONNECT_YOUR_DEVICE" />
                </H2>
                <P>
                    <Translation id="FIRMWARE_RECONNECT_BL_NEXT_STEP_DESC" />
                </P>
            </>
        );
    }
    return (
        <>
            <InitImg model={expectedModel} />
            <H2>
                <Translation id="TR_START_FIRMWARE_UPDATE" />
            </H2>
            <P>
                <Translation id="FIRMWARE_RECONNECTED_BL_NEXT_STEP_DESC" />
            </P>
        </>
    );
};

const BottomBar = () => {
    const { device } = useDevice();
    const { firmwareUpdate } = useFirmware();
    const transport = useSelector(state => state.suite.transport);

    if (device?.mode === 'bootloader') {
        return (
            <Button onClick={firmwareUpdate}>
                <Translation id="TR_START" />
            </Button>
        );
    }

    if (!device?.connected && isWebUSB(transport)) {
        return (
            <WebusbButton ready>
                <Button icon="PLUS" variant="tertiary">
                    <Translation id="TR_CHECK_FOR_DEVICES" />
                </Button>
            </WebusbButton>
        );
    }

    return null;
};

export const ReconnectInBootloaderStep = {
    Body,
    BottomBar,
};
