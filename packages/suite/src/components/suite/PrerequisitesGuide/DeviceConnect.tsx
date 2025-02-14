import { Button } from '@trezor/components';

import { Translation, TroubleshootingTips, WebUsbButton } from 'src/components/suite';
import {
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_CABLE,
    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
    TROUBLESHOOTING_TIP_SUITE_DESKTOP,
    TROUBLESHOOTING_TIP_UDEV,
    TROUBLESHOOTING_TIP_USB,
} from 'src/components/suite/troubleshooting/tips';

import { useSelector } from '../../../hooks/suite';
import { selectHasTransportOfType, selectSuiteFlags } from '../../../reducers/suite/suiteReducer';

const CallToActionButton = ({ onBluetoothClick }: { onBluetoothClick: () => void }) => {
    const { isBluetoothEnabled } = useSelector(selectSuiteFlags);
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));

    if (isBluetoothEnabled) {
        return (
            <Button
                variant="tertiary"
                size="tiny"
                onClick={e => {
                    e.stopPropagation();
                    onBluetoothClick();
                }}
            >
                <Translation id="TR_CONNECT_BLUETOOTH_BUTTON" />
            </Button>
        );
    }

    if (isWebUsbTransport) {
        return <WebUsbButton data-testid="@webusb-button" />;
    }

    return null;
};

interface DeviceConnectProps {
    onBluetoothClick: () => void;
}

export const DeviceConnect = ({ onBluetoothClick }: DeviceConnectProps) => {
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));

    const items = isWebUsbTransport
        ? [
              TROUBLESHOOTING_TIP_UDEV,
              TROUBLESHOOTING_TIP_CABLE,
              TROUBLESHOOTING_TIP_USB,
              TROUBLESHOOTING_TIP_SUITE_DESKTOP,
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
            cta={<CallToActionButton onBluetoothClick={onBluetoothClick} />}
            data-testid="@connect-device-prompt/no-device-detected"
        />
    );
};
