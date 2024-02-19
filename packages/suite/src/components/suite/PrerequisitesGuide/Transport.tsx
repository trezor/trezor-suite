import { Translation, TroubleshootingTips } from 'src/components/suite';
import {
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_BRIDGE_INSTALL,
    TROUBLESHOOTING_TIP_RESTART_COMPUTER,
} from 'src/components/suite/troubleshooting/tips';

export const Transport = () => (
    // No transport layer (bridge/webUSB) is available
    // On web it makes sense to offer downloading Trezor Bridge
    // Desktop app should have Bridge transport layer available as it is built-in, if it is not available we fucked up something.
    <TroubleshootingTips
        label={<Translation id="TR_TROUBLESHOOTING_BRIDGE_IS_NOT_RUNNING" />}
        items={[
            TROUBLESHOOTING_TIP_BRIDGE_STATUS,
            TROUBLESHOOTING_TIP_BRIDGE_INSTALL,
            TROUBLESHOOTING_TIP_RESTART_COMPUTER,
        ]}
        data-test-id="@connect-device-prompt/bridge-not-running"
    />
);
