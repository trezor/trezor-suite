import { isDesktop } from '@trezor/env-utils';

import { Translation, TroubleshootingTips } from 'src/components/suite';
import {
    TROUBLESHOOTING_TIP_SUITE_DESKTOP,
    TROUBLESHOOTING_TIP_RESTART_COMPUTER,
    TROUBLESHOOTING_TIP_WEBUSB_ENVIRONMENT,
    TROUBLESHOOTING_ENABLE_IN_DEBUG,
    TipItem,
} from 'src/components/suite/troubleshooting/tips';

import { useBridgeDesktopApi } from '../../../hooks/suite/useBridgeDesktopApi';
import { useSelector } from '../../../hooks/suite';
import { selectIsDebugModeActive } from '../../../reducers/suite/suiteReducer';

const tipItems: TipItem[] = [
    TROUBLESHOOTING_TIP_WEBUSB_ENVIRONMENT,
    TROUBLESHOOTING_TIP_SUITE_DESKTOP,
    TROUBLESHOOTING_TIP_RESTART_COMPUTER,
] as const;

const Tips = ({ items }: { items: TipItem[] }) => (
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

const TransportDesktop = ({ items }: { items: TipItem[] }) => {
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
