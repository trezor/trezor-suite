import { useState, MouseEvent } from 'react';
import { Button } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { isDesktop, isLinux } from '@trezor/env-utils';
import { Translation, TroubleshootingTips, UdevDownload } from 'src/components/suite';
import {
    TROUBLESHOOTING_TIP_SUITE_DESKTOP,
    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
    TROUBLESHOOTING_TIP_UNREADABLE_HID,
    TROUBLESHOOTING_TIP_SUITE_DESKTOP_TOGGLE_BRIDGE,
    TROUBLESHOOTING_TIP_RECONNECT,
} from 'src/components/suite/troubleshooting/tips';
import { useDispatch } from 'src/hooks/suite';
import { notificationsActions } from '@suite-common/toast-notifications';
import type { TrezorDevice } from 'src/types/suite';

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
        data-testid="@connect-device-prompt/unreadable-udev"
    />
);

// linux desktop
const UdevDesktop = () => {
    const [response, setResponse] = useState(-1);

    const dispatch = useDispatch();

    const handleCtaClick = async (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const resp = await desktopApi.installUdevRules();

        if (resp?.success) {
            setResponse(1);
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: resp?.error || 'desktopApi not available',
                }),
            );

            setResponse(0);
        }
    };

    if (response === 1) {
        return (
            <TroubleshootingTips
                opened={false}
                label={<Translation id="TR_RECONNECT_IN_NORMAL" />}
                items={[]}
                data-testid="@connect-device-prompt/unreadable-udev"
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
            data-testid="@connect-device-prompt/unreadable-udev"
        />
    );
};

interface DeviceUnreadableProps {
    device?: TrezorDevice; // this should be actually UnreadableDevice, but it is not worth type casting
}

/**
 * Device was detected but App can't communicate with it.
 */
export const DeviceUnreadable = ({ device }: DeviceUnreadableProps) => {
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
                // closing other apps and reloading should be the first step. Either we might have made a bug and let two apps to talk
                // to device at the same time or there might be another application in the wild not really playing according to our rules
                TROUBLESHOOTING_TIP_RECONNECT,
                // if on web - try installing desktop. this takes you to using bridge which should be more powerful than WebUSB
                TROUBLESHOOTING_TIP_SUITE_DESKTOP,
                // you might have a very old device which is no longer supported current bridge
                // if on desktop - try toggling between the 2 bridges we have available
                TROUBLESHOOTING_TIP_SUITE_DESKTOP_TOGGLE_BRIDGE,
                // If even this did not work, go to support or knowledge base
                TROUBLESHOOTING_TIP_UNREADABLE_HID,
                // unfortunately we have seen reports that even old bridge might not be enough for some Windows users. So the only chance
                // is using another computer, or maybe it would be better to say another OS
                TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
            ]}
            data-testid="@connect-device-prompt/unreadable-unknown"
        />
    );
};
