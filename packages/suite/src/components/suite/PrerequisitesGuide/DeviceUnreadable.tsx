import { selectSelectedDevice } from '@suite-common/wallet-core';
import { isLinux } from '@trezor/env-utils';

import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';
import {
    TROUBLESHOOTING_TIP_CLOSE_ALL_TABS,
    TROUBLESHOOTING_TIP_RECONNECT,
    TROUBLESHOOTING_TIP_SUITE_DESKTOP,
    TROUBLESHOOTING_TIP_UDEV,
    TROUBLESHOOTING_TIP_UNREADABLE_HID,
} from 'src/components/suite/troubleshooting/tips';
import { useSelector } from 'src/hooks/suite';

/**
 * Device was detected but @trezor/connect was not able to communicate with it. Reasons could be:
 * - initial read from device (GetFeatures) failed because of some de-synchronization or clash with another application
 * - device can't be communicated with using currently used transport (eg. hid / node bridge + webusb)
 * - missing udev rule on linux
 */
export const DeviceUnreadable = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    // generic troubleshooting tips
    const items = [];

    // this error is dispatched by trezord when udev rules are missing
    if (isLinux() && selectedDevice?.error === 'LIBUSB_ERROR_ACCESS') {
        items.push(TROUBLESHOOTING_TIP_UDEV);
    }

    // only for unreadable HID devices
    if (selectedDevice?.hid) {
        // If even this did not work, go to support or knowledge base
        // 'If the last time you updated your device firmware was in 2019 and earlier please follow instructions in <a>the knowledge base</a>',
        items.push(TROUBLESHOOTING_TIP_UNREADABLE_HID);
        // if on web - try installing desktop. this takes you to using bridge which should be more powerful than WebUSB.
        // at the time of writing this, there is still an option to opt-in for legacy bridge in suite-desktop which can
        // communicate with this device. see the next troubleshooting point
        items.push(TROUBLESHOOTING_TIP_SUITE_DESKTOP);
    } else {
        // it might also be unreadable because device was acquired on transport layer by another app and never released.
        // this should be rather exceptional case that happens only when sessions synchronization is broken or other app
        // is not cooperating with us
        items.push(TROUBLESHOOTING_TIP_CLOSE_ALL_TABS);
        // closing other apps and reloading should be the first step. Either we might have made a bug and let two apps to talk
        // to device at the same time or there might be another application in the wild not really playing according to our rules
        items.push(TROUBLESHOOTING_TIP_RECONNECT);
        // if on web - try installing desktop. this takes you to using bridge which should be more powerful than WebUSB
        items.push(TROUBLESHOOTING_TIP_SUITE_DESKTOP);
    }

    return (
        <TroubleshootingTips
            intent="warning"
            items={items}
            data-testid="@connect-device-prompt/unreadable-unknown"
        />
    );
};
