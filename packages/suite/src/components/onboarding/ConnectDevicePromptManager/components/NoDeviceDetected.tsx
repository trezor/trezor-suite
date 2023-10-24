import { Translation } from 'src/components/suite/Translation';
import { TroubleshootingTips } from 'src/components/suite';
import {
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_BRIDGE_INSTALL,
    TROUBLESHOOTING_TIP_UDEV,
    TROUBLESHOOTING_TIP_CABLE,
    TROUBLESHOOTING_TIP_USB,
    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
} from 'src/components/suite/troubleshooting/tips';

interface NoDeviceDetectedProps {
    offerWebUsb: boolean;
}

export const NoDeviceDetected = ({ offerWebUsb }: NoDeviceDetectedProps) => (
    <TroubleshootingTips
        label={<Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />}
        items={[
            TROUBLESHOOTING_TIP_BRIDGE_STATUS,
            TROUBLESHOOTING_TIP_BRIDGE_INSTALL,
            TROUBLESHOOTING_TIP_UDEV,
            TROUBLESHOOTING_TIP_CABLE,
            TROUBLESHOOTING_TIP_USB,
            TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
        ]}
        offerWebUsb={offerWebUsb}
    />
);
