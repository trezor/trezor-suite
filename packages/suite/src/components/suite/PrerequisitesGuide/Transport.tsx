import { Translation, TroubleshootingTips } from 'src/components/suite';
import {
    TROUBLESHOOTING_TIP_SUITE_DESKTOP,
    TROUBLESHOOTING_TIP_RESTART_COMPUTER,
    TROUBLESHOOTING_TIP_WEBUSB_ENVIRONMENT,
} from 'src/components/suite/troubleshooting/tips';

export const Transport = () => (
    // No transport layer (bridge/webUSB) is available
    // On web it makes sense to
    // - offer downloading Trezor Suite desktop, or
    // - use a browser that supports WebUSB
    // Desktop app should have Bridge transport layer available as it is built-in, if it is not available we fucked up something.
    <TroubleshootingTips
        label={<Translation id="TR_TROUBLESHOOTING_DEVICE_NOT_DETECTED" />}
        items={[
            TROUBLESHOOTING_TIP_WEBUSB_ENVIRONMENT,
            TROUBLESHOOTING_TIP_SUITE_DESKTOP,
            TROUBLESHOOTING_TIP_RESTART_COMPUTER,
        ]}
        data-testid="@connect-device-prompt/bridge-not-running"
    />
);
