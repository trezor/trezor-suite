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

interface DeviceConnectProps {
    onBluetoothClick: () => void;
}

export const DeviceConnect = ({ onBluetoothClick }: DeviceConnectProps) => {
    const { isBluetoothEnabled } = useSelector(selectSuiteFlags);

    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const isBluetoothTransport = useSelector(selectHasTransportOfType('BluetoothTransport'));

    const isBluetooth = isBluetoothTransport && isBluetoothEnabled;

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
            cta={
                // eslint-disable-next-line no-nested-ternary
                isBluetooth ? (
                    <Button
                        variant="tertiary"
                        size="tiny"
                        onClick={e => {
                            e.stopPropagation();
                            onBluetoothClick();
                        }}
                    >
                        Connect Safe 7 via bluetooth
                    </Button>
                ) : isWebUsbTransport ? (
                    <WebUsbButton data-testid="@webusb-button" />
                ) : undefined
            }
            data-testid="@connect-device-prompt/no-device-detected"
        />
    );
};
