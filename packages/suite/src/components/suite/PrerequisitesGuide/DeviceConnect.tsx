import { ReactNode } from 'react';

import { Button } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';

import { Translation, TroubleshootingTips, WebUsbButton } from 'src/components/suite';
import {
    TROUBLESHOOTING_ALL_BLUETOOTH_TIPS,
    TROUBLESHOOTING_TIP_BRIDGE_STATUS,
    TROUBLESHOOTING_TIP_CABLE,
    TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER,
    TROUBLESHOOTING_TIP_SUITE_DESKTOP,
    TROUBLESHOOTING_TIP_UDEV,
    TROUBLESHOOTING_TIP_USB,
} from 'src/components/suite/troubleshooting/tips';

import { selectConnectingDevices } from '../../../actions/bluetooth/desktopBluetoothSelectors';
import { useSelector } from '../../../hooks/suite';
import { selectHasTransportOfType, selectSuiteFlags } from '../../../reducers/suite/suiteReducer';
import {
    TroubleshootingTipsItem,
    TroubleshootingTipsWithSections,
} from '../troubleshooting/TroubleshootingTips';

type DeviceConnectProps = {
    setIsBluetoothConnectOpen: (value: true) => void;
};

export const DeviceConnect = ({ setIsBluetoothConnectOpen }: DeviceConnectProps) => {
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const { isBluetoothEnabled } = useSelector(selectSuiteFlags);
    const autoConnectingDeviceIds = useSelector(selectConnectingDevices);

    const cableItem: TroubleshootingTipsItem[] = isWebUsbTransport
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

    const getCallToActionButton = (): ReactNode => {
        if (isWebUsbTransport) {
            return (
                <WebUsbButton data-testid="@webusb-button" translationId="TR_CHECK_FOR_DEVICES" />
            );
        }

        if (isBluetoothEnabled && isDesktop()) {
            const isAutoConnecting = autoConnectingDeviceIds.length > 0;

            return (
                <Button
                    onClick={() => setIsBluetoothConnectOpen(true)}
                    icon="bluetooth"
                    variant="tertiary"
                    size="small"
                    isLoading={isAutoConnecting}
                >
                    <Translation id="TR_PAIR_NEW_BLUETOOTH_DEVICE" />
                </Button>
            );
        }

        return null;
    };

    if (isBluetoothEnabled && isDesktop()) {
        return (
            <TroubleshootingTipsWithSections
                label={<Translation id="TR_CONNECTION_TYPE" />}
                ctaLabel={<Translation id="TR_TREZOR_SAFE_7" />}
                items={{
                    cable: { items: cableItem, label: <Translation id="TR_CABLE" /> },
                    bluetooth: {
                        items: TROUBLESHOOTING_ALL_BLUETOOTH_TIPS,
                        label: <Translation id="TR_BLUETOOTH" />,
                    },
                }}
                defaultSection="cable"
                cta={getCallToActionButton()}
                data-testid="@connect-device-prompt/no-device-detected"
                toggleText={<Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />}
            />
        );
    }

    return (
        <TroubleshootingTips
            cta={getCallToActionButton()}
            ctaLabel={<Translation id="TR_TREZOR_NOT_DETECTED" />}
            items={cableItem}
            data-testid="@connect-device-prompt/no-device-detected"
            toggleText={<Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />}
        />
    );
};
