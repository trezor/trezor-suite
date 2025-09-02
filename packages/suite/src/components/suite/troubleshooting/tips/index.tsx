import { Text } from '@trezor/components';
import { isAndroid, isDesktop, isLinux, isWeb } from '@trezor/env-utils';
import { TREZOR_SUPPORT_DEVICE_URL, TREZOR_SUPPORT_RESET_PIN } from '@trezor/urls';

import { TrezorLink } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';

import { BridgeStatus, BridgeToggle, SuiteDesktopTip, Wrapper } from './BridgeTip';
import { UdevDescription } from './UdevDescription';
import { TroubleshootingTipsItem } from '../TroubleshootingTips';

export const TROUBLESHOOTING_TIP_BRIDGE_STATUS: TroubleshootingTipsItem = {
    key: 'bridge-status',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_TRANSPORT_STATUS_TITLE" />,
    description: <BridgeStatus />,
    hide: !isWeb(),
};

export const TROUBLESHOOTING_TIP_WEBUSB_ENVIRONMENT: TroubleshootingTipsItem = {
    key: 'webusb-environment',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_BROWSER_WEBUSB_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_BROWSER_WEBUSB_DESCRIPTION" />,
    hide: !isWeb(),
};

export const TROUBLESHOOTING_TIP_UNREADABLE_HID: TroubleshootingTipsItem = {
    key: 'unreadable-hid',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_UNREADABLE_HID_TITLE" />,
    description: (
        <Wrapper>
            <Translation
                id="TR_TROUBLESHOOTING_TIP_UNREADABLE_HID_DESCRIPTION"
                values={{
                    a: chunks => (
                        <TrezorLink variant="underline" href={TREZOR_SUPPORT_DEVICE_URL}>
                            {chunks}
                        </TrezorLink>
                    ),
                }}
            />
        </Wrapper>
    ),
};

export const TROUBLESHOOTING_TIP_SUITE_DESKTOP: TroubleshootingTipsItem = {
    key: 'suite-desktop',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_SUITE_DESKTOP_TITLE" />,
    description: <SuiteDesktopTip />,
    hide: !isWeb(),
};

export const TROUBLESHOOTING_TIP_SUITE_DESKTOP_TOGGLE_BRIDGE: TroubleshootingTipsItem = {
    key: 'suite-desktop-toggle',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_SUITE_DESKTOP_TOGGLE_ALT_TITLE" />,
    description: <BridgeToggle />,
    hide: isWeb() || isAndroid(),
};

export const TROUBLESHOOTING_TIP_CABLE: TroubleshootingTipsItem = {
    key: 'cable',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_CABLE_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_CABLE_DESCRIPTION" />,
};

export const TROUBLESHOOTING_TIP_USB: TroubleshootingTipsItem = {
    key: 'usbPort',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_USB_PORT_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_USB_PORT_DESCRIPTION" />,
    hide: isAndroid(),
};

export const TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER: TroubleshootingTipsItem = {
    key: 'lostPin',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_PIN_LOST_TITLE" />,
    description: (
        <Translation
            id="TR_TROUBLESHOOTING_TIP_PIN_LOST_DESCRIPTION"
            values={{
                a: chunks => (
                    <TrezorLink variant="underline" href={TREZOR_SUPPORT_RESET_PIN}>
                        {chunks}
                    </TrezorLink>
                ),
            }}
        />
    ),
};

export const TROUBLESHOOTING_TIP_RESTART_COMPUTER: TroubleshootingTipsItem = {
    key: 'restartComputer',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_DESCRIPTION" />,
};

export const TROUBLESHOOTING_ENABLE_IN_DEBUG: TroubleshootingTipsItem = {
    key: 'enableInDebug',
    heading: (
        <>
            You may have <Text variant="destructive">disabled bridge in the debug</Text> settings.
        </>
    ),
    description: <>Try to enable it. You know, ... with the switch.</>,
    hide: isWeb(),
};

export const TROUBLESHOOTING_TIP_UDEV: TroubleshootingTipsItem = {
    key: 'udev',
    heading: <Translation id="TR_UDEV_DOWNLOAD_TITLE" />,
    description: <UdevDescription />,
    hide: !isLinux(),
};

export const TROUBLESHOOTING_TIP_RECONNECT: TroubleshootingTipsItem = {
    key: 'device-reconnect',
    heading: <Translation id="TR_RECONNECT_YOUR_DEVICE" />,
    description: (
        <Translation
            id={
                isDesktop()
                    ? 'TR_RECONNECT_DEVICE_DESCRIPTION_DESKTOP'
                    : 'TR_RECONNECT_DEVICE_DESCRIPTION'
            }
        />
    ),
};

export const TROUBLESHOOTING_TIP_CLOSE_ALL_TABS: TroubleshootingTipsItem = {
    key: 'device-acquire',
    heading: <Translation id="TR_TROUBLESHOOTING_CLOSE_TABS" />,
    description: (
        <Translation
            id={
                isDesktop()
                    ? 'TR_TROUBLESHOOTING_CLOSE_TABS_DESCRIPTION_DESKTOP'
                    : 'TR_TROUBLESHOOTING_CLOSE_TABS_DESCRIPTION'
            }
        />
    ),
};

const TROUBLESHOOTING_TIP_DEVICE_TURNED_ON_UNLOCKED: TroubleshootingTipsItem = {
    key: 'trezor-turned-on-unlocked',
    heading: <Translation id="TR_BLUETOOTH_DEVICE_TURNED_ON_UNLOCKED_HEADING" />,
    icon: 'power',
};

const TROUBLESHOOTING_TIP_MANUAL_PAIRING_GUIDE: TroubleshootingTipsItem = {
    key: 'manually-pair-device-guide',
    heading: <Translation id="TR_BLUETOOTH_MANUAL_PAIR_DEVICE_GUIDE_HEADING" />,
    description: <Translation id="TR_BLUETOOTH_MANUAL_PAIR_DEVICE_GUIDE_DESCRIPTION" />,
    icon: 'trezorSafe5',
};

export const TROUBLESHOOTING_ALL_BLUETOOTH_TIPS: TroubleshootingTipsItem[] = [
    TROUBLESHOOTING_TIP_DEVICE_TURNED_ON_UNLOCKED,
    TROUBLESHOOTING_TIP_MANUAL_PAIRING_GUIDE,
];
