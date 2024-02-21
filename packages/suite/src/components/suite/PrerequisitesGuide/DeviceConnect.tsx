import { Translation, TroubleshootingTips, WebUsbButton } from 'src/components/suite';
import {
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_BRIDGE_USE,
    TROUBLESHOOTING_TIP_CABLE,
    TROUBLESHOOTING_TIP_USB,
    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
    TROUBLESHOOTING_TIP_UDEV,
} from 'src/components/suite/troubleshooting/tips';

interface DeviceConnectProps {
    isWebUsbTransport: boolean;
}

export const DeviceConnect = ({ isWebUsbTransport }: DeviceConnectProps) => {
    const items = isWebUsbTransport
        ? [
              TROUBLESHOOTING_TIP_UDEV,
              TROUBLESHOOTING_TIP_CABLE,
              TROUBLESHOOTING_TIP_USB,
              TROUBLESHOOTING_TIP_BRIDGE_USE,
          ]
        : [
              TROUBLESHOOTING_TIP_BRIDGE_STATUS,
              TROUBLESHOOTING_TIP_UDEV,
              TROUBLESHOOTING_TIP_CABLE,
              TROUBLESHOOTING_TIP_USB,
              TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
          ];

    return (
        <TroubleshootingTips
            label={<Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />}
            items={items}
            offerWebUsb={isWebUsbTransport}
            cta={isWebUsbTransport ? <WebUsbButton data-test-id="@webusb-button" /> : undefined}
            data-test-id="@connect-device-prompt/no-device-detected"
        />
    );
};
