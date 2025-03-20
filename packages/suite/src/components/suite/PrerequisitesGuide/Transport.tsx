import { isDesktop } from '@trezor/env-utils';

import { Translation, TroubleshootingTips } from 'src/components/suite';
import {
    TROUBLESHOOTING_ENABLE_IN_DEBUG,
    TROUBLESHOOTING_TIP_RESTART_COMPUTER,
    TROUBLESHOOTING_TIP_SUITE_DESKTOP,
    TROUBLESHOOTING_TIP_WEBUSB_ENVIRONMENT,
} from 'src/components/suite/troubleshooting/tips';

import { useSelector } from '../../../hooks/suite';
import { useBridgeDesktopApi } from '../../../hooks/suite/useBridgeDesktopApi';
import { selectIsDebugModeActive } from '../../../reducers/suite/suiteReducer';
import { TroubleshootingTipsItem } from '../troubleshooting/TroubleshootingTips';

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
        label={<Translation id="TR_TROUBLESHOOTING_DEVICE_NOT_DETECTED" />}
        items={items}
        data-testid="@connect-device-prompt/bridge-not-running"
    />
);

const TransportDesktop = ({ items }: { items: TroubleshootingTipsItem[] }) => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const { bridgeProcess } = useBridgeDesktopApi();

    const itemsForDesktop = [...items];

    if (isDebugModeActive && !bridgeProcess.process) {
        itemsForDesktop.push(TROUBLESHOOTING_ENABLE_IN_DEBUG);
    }

    return <Tips items={itemsForDesktop} />;
};

export const Transport = () =>
    isDesktop() ? <TransportDesktop items={tipItems} /> : <Tips items={tipItems} />;
