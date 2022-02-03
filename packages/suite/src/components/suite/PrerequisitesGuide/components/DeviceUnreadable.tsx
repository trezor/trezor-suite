import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { isLinux, isDesktop } from '@suite-utils/env';
import { Translation, TroubleshootingTips } from '@suite-components';
import UdevDownload from '@suite-components/UdevDownload';
import {
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_BRIDGE_INSTALL,
    TROUBLESHOOTING_TIP_CABLE,
    TROUBLESHOOTING_TIP_USB,
    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
} from '@suite-components/TroubleshootingTips/tips';
import { useActions } from '@suite-hooks';
import * as notificationActions from '@suite-actions/notificationActions';
import type { TrezorDevice } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

interface Props {
    device?: TrezorDevice; // this should be actually UnreadableDevice, but it is not worth type casting
    webusb: boolean;
}

// linux web
const UdevWeb = () => (
    <TroubleshootingTips
        label={<Translation id="TR_TROUBLESHOOTING_UNREADABLE_UDEV" />}
        items={[
            {
                key: 'udev-about',
                noBullet: true,
                description: <Translation id="TR_UDEV_DOWNLOAD_DESC" />,
            },
            {
                key: 'udev-download',
                noBullet: true,
                description: <UdevDownload />,
            },
        ]}
    />
);

// linux desktop
const UdevDesktop = () => {
    const { addToast } = useActions({
        addToast: notificationActions.addToast,
    });
    const [response, setResponse] = useState(-1);
    if (response === 1) {
        return (
            <TroubleshootingTips
                opened={false}
                label={<Translation id="TR_RECONNECT_IN_NORMAL" />}
                items={[]}
            />
        );
    }
    return (
        <TroubleshootingTips
            opened={response === 0}
            label={<Translation id="TR_TROUBLESHOOTING_UNREADABLE_UDEV" />}
            cta={
                <Button
                    onClick={async event => {
                        event.preventDefault();
                        event.stopPropagation();
                        const resp = await desktopApi.installUdevRules();
                        if (resp?.success) {
                            setResponse(1);
                        } else {
                            addToast({
                                type: 'error',
                                error: resp?.error || 'desktopApi not available',
                            });
                            setResponse(0);
                        }
                    }}
                >
                    <Translation id="TR_TROUBLESHOOTING_UDEV_INSTALL_TITLE" />
                </Button>
            }
            items={[
                {
                    key: 'udev-about',
                    description: <Translation id="TR_UDEV_DOWNLOAD_DESC" />,
                    noBullet: true,
                },
                {
                    key: 'udev-download',
                    description: <UdevDownload />,
                    noBullet: true,
                },
            ]}
        />
    );
};

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
        return (
            <Wrapper data-test="@connect-device-prompt/unreadable-udev">
                {isDesktop() ? <UdevDesktop /> : <UdevWeb />}
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
