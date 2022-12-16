import React, { useState } from 'react';

import { isDesktop } from '@suite-utils/env';
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
import type { TrezorDevice } from '@suite-types';

import { notificationsActions } from '@suite-common/toast-notifications';
import { desktopApi } from '@trezor/suite-desktop-api';
import { Button } from '@trezor/components';
import { isLinux } from '@trezor/env-utils';

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
        data-test="@connect-device-prompt/unreadable-udev"
    />
);

// linux desktop
const UdevDesktop = () => {
    const [response, setResponse] = useState(-1);

    const { addToast } = useActions({
        addToast: notificationsActions.addToast,
    });

    const handleCtaClick = async (event: React.MouseEvent) => {
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
    };

    if (response === 1) {
        return (
            <TroubleshootingTips
                opened={false}
                label={<Translation id="TR_RECONNECT_IN_NORMAL" />}
                items={[]}
                data-test="@connect-device-prompt/unreadable-udev"
            />
        );
    }

    return (
        <TroubleshootingTips
            opened={response === 0}
            label={<Translation id="TR_TROUBLESHOOTING_UNREADABLE_UDEV" />}
            cta={
                <Button onClick={handleCtaClick}>
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
            data-test="@connect-device-prompt/unreadable-udev"
        />
    );
};

interface DeviceUnreadableProps {
    device?: TrezorDevice; // this should be actually UnreadableDevice, but it is not worth type casting
    isWebUsbTransport: boolean;
}

// We don't really know what happened, show some generic help and provide link to contact a support
export const DeviceUnreadable = ({ device, isWebUsbTransport }: DeviceUnreadableProps) => {
    if (isWebUsbTransport) {
        // only install bridge will help (webusb + HID device)
        return (
            <TroubleshootingTips
                label={<Translation id="TR_TROUBLESHOOTING_UNREADABLE_WEBUSB" />}
                items={[TROUBLESHOOTING_TIP_BRIDGE_STATUS, TROUBLESHOOTING_TIP_BRIDGE_INSTALL]}
                offerWebUsb
                data-test="@connect-device-prompt/unreadable-hid"
            />
        );
    }

    // this error is dispatched by trezord when udev rules are missing
    if (isLinux() && device?.error === 'LIBUSB_ERROR_ACCESS') {
        return <> {isDesktop() ? <UdevDesktop /> : <UdevWeb />}</>;
    }

    return (
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
            offerWebUsb={isWebUsbTransport}
            data-test="@connect-device-prompt/unreadable-unknown"
        />
    );
};
