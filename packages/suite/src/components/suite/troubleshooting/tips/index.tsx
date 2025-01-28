import { ReactNode } from 'react';

import { Text } from '@trezor/components';
import { isAndroid, isDesktop, isLinux, isWeb } from '@trezor/env-utils';
import { TREZOR_SUPPORT_DEVICE_URL } from '@trezor/urls';

import { TrezorLink } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';

import { BridgeStatus, BridgeToggle, SuiteDesktopTip, Wrapper } from './BridgeTip';
import { UdevDescription } from './UdevDescription';

export type TipItem = {
    key: string;
    heading: ReactNode;
    description: ReactNode;
    hide?: boolean;
};

export const TROUBLESHOOTING_TIP_BRIDGE_STATUS: TipItem = {
    key: 'bridge-status',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_BRIDGE_STATUS_TITLE" />,
    description: <BridgeStatus />,
    hide: !isWeb(),
};

export const TROUBLESHOOTING_TIP_WEBUSB_ENVIRONMENT: TipItem = {
    key: 'webusb-environment',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_BROWSER_WEBUSB_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_BROWSER_WEBUSB_DESCRIPTION" />,
    hide: !isWeb(),
};

export const TROUBLESHOOTING_TIP_UNREADABLE_HID: TipItem = {
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

export const TROUBLESHOOTING_TIP_SUITE_DESKTOP: TipItem = {
    key: 'suite-desktop',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_SUITE_DESKTOP_TITLE" />,
    description: <SuiteDesktopTip />,
    hide: !isWeb(),
};

export const TROUBLESHOOTING_TIP_SUITE_DESKTOP_TOGGLE_BRIDGE: TipItem = {
    key: 'suite-desktop',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_SUITE_DESKTOP_TOGGLE_BRIDGE_TITLE" />,
    description: <BridgeToggle />,
    hide: isWeb() || isAndroid(),
};

export const TROUBLESHOOTING_TIP_CABLE: TipItem = {
    key: 'cable',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_CABLE_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_CABLE_DESCRIPTION" />,
};

export const TROUBLESHOOTING_TIP_USB: TipItem = {
    key: 'usbPort',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_USB_PORT_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_USB_PORT_DESCRIPTION" />,
    hide: isAndroid(),
};

export const TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER: TipItem = {
    key: 'differentComputer',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_COMPUTER_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_COMPUTER_DESCRIPTION" />,
};

export const TROUBLESHOOTING_TIP_RESTART_COMPUTER: TipItem = {
    key: 'restartComputer',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_DESCRIPTION" />,
};

export const TROUBLESHOOTING_ENABLE_IN_DEBUG: TipItem = {
    key: 'enableInDebug',
    heading: (
        <>
            You may have <Text variant="destructive">disabled bridge in the debug</Text> settings.
        </>
    ),
    description: <>Try to enable it. You know, ... with the switch.</>,
    hide: isWeb(),
};

export const TROUBLESHOOTING_TIP_UDEV: TipItem = {
    key: 'udev',
    heading: <Translation id="TR_UDEV_DOWNLOAD_TITLE" />,
    description: <UdevDescription />,
    hide: !isLinux(),
};

export const TROUBLESHOOTING_TIP_RECONNECT: TipItem = {
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

export const TROUBLESHOOTING_TIP_CLOSE_ALL_TABS = {
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
