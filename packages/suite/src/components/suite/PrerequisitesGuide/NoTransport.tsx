import { selectIsDebugModeActive } from '@suite/settings';
import { isDesktop } from '@trezor/env-utils';

import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';
import { type TroubleshootingTipsItem } from 'src/components/suite/troubleshooting/TroubleshootingTipsItem';
import {
    TROUBLESHOOTING_ENABLE_IN_DEBUG,
    TROUBLESHOOTING_TIP_RESTART_COMPUTER,
    TROUBLESHOOTING_TIP_SUITE_DESKTOP,
    TROUBLESHOOTING_TIP_WEBUSB_ENVIRONMENT,
} from 'src/components/suite/troubleshooting/tips';
import { useSelector } from 'src/hooks/suite';
import { useBridgeDesktopApi } from 'src/hooks/suite/useBridgeDesktopApi';

const tipItems: TroubleshootingTipsItem[] = [
    TROUBLESHOOTING_TIP_WEBUSB_ENVIRONMENT,
    TROUBLESHOOTING_TIP_SUITE_DESKTOP,
    TROUBLESHOOTING_TIP_RESTART_COMPUTER,
] as const;

const Tips = ({ items }: { items: TroubleshootingTipsItem[] }) => (
    // No transport layer (bridge/webUSB) is available
    // On web it makes sense to
    // - offer downloading Trezor Suite desktop, or
    // - use a browser that supports WebUSB
    // Desktop app should have Bridge transport layer available as it is built-in, if it is not available we fucked up something.
    <TroubleshootingTips
        intent="warning"
        items={items}
        data-testid="@connect-device-prompt/bridge-not-running"
    />
);

const TransportDesktop = ({ items }: { items: TroubleshootingTipsItem[] }) => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const { bridgeProcess } = useBridgeDesktopApi();

    if (isDebugModeActive && !bridgeProcess.process) {
        items.push(TROUBLESHOOTING_ENABLE_IN_DEBUG);
    }

    return <Tips items={items} />;
};

export const NoTransport = () =>
    isDesktop() ? <TransportDesktop items={tipItems} /> : <Tips items={tipItems} />;
