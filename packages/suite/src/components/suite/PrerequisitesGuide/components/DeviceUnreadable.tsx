import React from 'react';
import styled from 'styled-components';
import { isLinux } from '@suite-utils/env';
import { Translation, TroubleshootingTips } from '@suite-components';
import {
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_BRIDGE_INSTALL,
    TROUBLESHOOTING_TIP_UDEV,
    TROUBLESHOOTING_TIP_CABLE,
    TROUBLESHOOTING_TIP_USB,
    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
} from '@suite-components/TroubleshootingTips/tips';
import type { TrezorDevice } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

interface Props {
    device?: TrezorDevice; // this should be actually UnreadableDevice, but it is not worth type casting
    webusb: boolean;
}

// We don't really know what happened, show some generic help and provide link to contact a support
const DeviceUnreadable = ({ device, webusb }: Props) => {
    if (webusb) {
        // only install bridge will help (webusb + HID device)
        return (
            <Wrapper data-test="@connect-device-prompt/unreadable-hid">
                <TroubleshootingTips
                    label={<Translation id="TR_TROUBLESHOOTING_UNREADABLE_WEBUSB" />}
                    items={[TROUBLESHOOTING_TIP_BRIDGE_STATUS, TROUBLESHOOTING_TIP_BRIDGE_INSTALL]}
                    offerWebUsb
                />
            </Wrapper>
        );
    }
    // this error is dispatched by trezord when udev rules are missing
    if (isLinux() && device?.error === 'LIBUSB_ERROR_ACCESS') {
        // missing udev rules
        return (
            <Wrapper data-test="@connect-device-prompt/unreadable-udev">
                <TroubleshootingTips
                    label={<Translation id="TR_TROUBLESHOOTING_UNREADABLE_UDEV" />}
                    items={[TROUBLESHOOTING_TIP_UDEV]}
                />
            </Wrapper>
        );
    }

    return (
        <Wrapper data-test="@connect-device-prompt/unreadable-unknown">
            <TroubleshootingTips
                label={
                    <Translation
                        id="TR_TROUBLESHOOTING_UNREADABLE_UNKNOWN"
                        values={{ error: device?.error }}
                    />
                }
                items={[
                    TROUBLESHOOTING_TIP_CABLE,
                    TROUBLESHOOTING_TIP_USB,
                    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
                ]}
                offerWebUsb={webusb}
            />
        </Wrapper>
    );
};

export default DeviceUnreadable;
