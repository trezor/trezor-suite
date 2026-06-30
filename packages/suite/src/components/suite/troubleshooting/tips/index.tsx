import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { isDesktop, isLinux, isWeb } from '@trezor/env-utils';
import {
    ArrowLineDownIcon,
    ArrowsClockwiseIcon,
    CableUsbCIcon,
    CpuIcon,
    DesktopIcon,
    GearIcon,
    TabsIcon,
    TrezorPasswordIcon,
    TrezorSafe5Icon,
} from '@trezor/icons';
import { TREZOR_SUPPORT_DEVICE_URL } from '@trezor/urls';

import { SuiteDesktopTip } from './BridgeTip';
import { UdevDescription } from './UdevDescription';
import { type TroubleshootingTipsItem } from '../TroubleshootingTipsItem';

export const TROUBLESHOOTING_TIP_WEBUSB_ENVIRONMENT: TroubleshootingTipsItem = {
    key: 'webusb-environment',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_BROWSER_WEBUSB_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_BROWSER_WEBUSB_DESCRIPTION" />,
    hide: !isWeb() || 'usb' in navigator,
};

export const TROUBLESHOOTING_TIP_UNREADABLE_HID: TroubleshootingTipsItem = {
    key: 'unreadable-hid',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_UNREADABLE_HID_TITLE" />,
    description: (
        <Translation
            id="TR_TROUBLESHOOTING_TIP_UNREADABLE_HID_DESCRIPTION"
            values={{
                a: chunks => <TrezorLink href={TREZOR_SUPPORT_DEVICE_URL}>{chunks}</TrezorLink>,
            }}
        />
    ),
    icon: CpuIcon,
};

export const TROUBLESHOOTING_TIP_SUITE_DESKTOP: TroubleshootingTipsItem = {
    key: 'suite-desktop',
    heading: <SuiteDesktopTip />,
    hide: !isWeb(),
    icon: DesktopIcon,
};

export const TROUBLESHOOTING_TIP_CABLE: TroubleshootingTipsItem = {
    key: 'cable',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_CABLE_TITLE" />,
    icon: CableUsbCIcon,
};

export const TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER: TroubleshootingTipsItem = {
    key: 'different-computer',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER_TITLE" />,
    icon: ArrowsClockwiseIcon,
};

export const TROUBLESHOOTING_TIP_RESTART_COMPUTER: TroubleshootingTipsItem = {
    key: 'restartComputer',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_DESCRIPTION" />,
    icon: ArrowsClockwiseIcon,
};

export const TROUBLESHOOTING_ENABLE_IN_DEBUG: TroubleshootingTipsItem = {
    key: 'enableInDebug',
    heading: <>You may have disabled bridge in the debug settings.</>,
    description: <>Try to enable it. You know, ... with the switch.</>,
    icon: GearIcon,
    hide: isWeb(),
};

export const TROUBLESHOOTING_TIP_UDEV: TroubleshootingTipsItem = {
    key: 'udev',
    heading: <Translation id="TR_UDEV_DOWNLOAD_TITLE" />,
    description: <UdevDescription />,
    icon: ArrowLineDownIcon,
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
    icon: ArrowsClockwiseIcon,
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
    icon: TabsIcon,
};

export const TROUBLESHOOTING_TIP_DEVICE_TURNED_ON_UNLOCKED: TroubleshootingTipsItem = {
    key: 'trezor-turned-on-unlocked',
    heading: <Translation id="TR_BLUETOOTH_DEVICE_TURNED_ON_UNLOCKED_HEADING" />,
    icon: TrezorPasswordIcon,
};

export const TROUBLESHOOTING_TIP_MANUAL_PAIRING_GUIDE: TroubleshootingTipsItem = {
    key: 'manually-pair-device-guide',
    heading: <Translation id="TR_BLUETOOTH_MANUAL_PAIR_DEVICE_GUIDE_HEADING" />,
    description: <Translation id="TR_BLUETOOTH_MANUAL_PAIR_DEVICE_GUIDE_DESCRIPTION" />,
    icon: TrezorSafe5Icon,
};

export const TROUBLESHOOTING_ALL_BLUETOOTH_TIPS: TroubleshootingTipsItem[] = [
    TROUBLESHOOTING_TIP_DEVICE_TURNED_ON_UNLOCKED,
    TROUBLESHOOTING_TIP_MANUAL_PAIRING_GUIDE,
];
