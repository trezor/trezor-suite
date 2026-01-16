import { Translation } from '@suite/intl';
import { Modal } from '@trezor/components';
import { EventTypeShared, analytics } from '@trezor/suite-analytics';

import { selectConnectingDevices } from 'src/actions/bluetooth/desktopBluetoothSelectors';
import { BluetoothPairingPin } from 'src/components/suite/bluetooth/BluetoothPairingPin';
import { BluetoothScanningList } from 'src/components/suite/bluetooth/BluetoothScanningList';
import { BluetoothSelectedDevice } from 'src/components/suite/bluetooth/BluetoothSelectedDevice';
import { useSelector } from 'src/hooks/suite';

import { useConnectionGlobalModalContext } from './context/ConnectionGlobalModalContext';

type BluetoothConnectionModalProps = {
    onClose: () => void;
};

const selectedDeviceConnectionTypes = ['connecting', 'pairing'];

export const BluetoothConnectionModal = ({ onClose }: BluetoothConnectionModalProps) => {
    const { handlePairingCancel, onReScanClick, selectedDevice } =
        useConnectionGlobalModalContext();
    const connectingDevices = useSelector(selectConnectingDevices);

    const handleClose = () => {
        if (selectedDevice) {
            analytics.report({
                type: EventTypeShared.DeviceConnectionDeviceFound,
                payload: {
                    option: 'close',
                },
            });
        }
        onClose();
    };

    if (
        selectedDevice !== undefined &&
        selectedDevice !== null &&
        selectedDevice.connectionStatus.type === 'pairing' &&
        (selectedDevice.connectionStatus?.pin?.length ?? 0) > 0
    ) {
        return (
            <Modal
                onCancel={() => handlePairingCancel(selectedDevice.id)}
                heading={<Translation id="TR_CONNECT_YOUR_TREZOR" />}
                description={<Translation id="TR_CONNECT_YOUR_TREZOR_DESCRIPTION" />}
            >
                <BluetoothPairingPin
                    device={selectedDevice}
                    pairingPin={selectedDevice.connectionStatus.pin}
                />
            </Modal>
        );
    }

    if (
        selectedDevice !== undefined &&
        (selectedDeviceConnectionTypes.includes(selectedDevice.connectionStatus.type) ||
            connectingDevices.includes(selectedDevice.id))
    ) {
        return (
            <Modal
                onCancel={handleClose}
                heading={<Translation id="TR_CONNECT_YOUR_TREZOR" />}
                description={<Translation id="TR_CONNECT_YOUR_TREZOR_DESCRIPTION" />}
                width={600}
            >
                <BluetoothSelectedDevice device={selectedDevice} onReScanClick={onReScanClick} />
            </Modal>
        );
    }

    return (
        <Modal
            onCancel={handleClose}
            heading={<Translation id="TR_CONNECT_YOUR_TREZOR" />}
            description={<Translation id="TR_CONNECT_YOUR_TREZOR_DESCRIPTION" />}
            width={600}
        >
            <BluetoothScanningList />
        </Modal>
    );
};
