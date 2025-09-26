import { selectNearbyDevices } from '@suite-common/bluetooth';
import { Modal } from '@trezor/components';

import { selectConnectingDevices } from 'src/actions/bluetooth/desktopBluetoothSelectors';
import { Translation } from 'src/components/suite/Translation';
import { BluetoothPairingPin } from 'src/components/suite/bluetooth/BluetoothPairingPin';
import { BluetoothScanningList } from 'src/components/suite/bluetooth/BluetoothScanningList';
import { BluetoothSelectedDevice } from 'src/components/suite/bluetooth/BluetoothSelectedDevice';
import { useSelector } from 'src/hooks/suite';

import { useConnectionGlobalModalContext } from './context/ConnectionGlobalModalContext';
import { UnpairBluetoothDeviceFromOsModal } from '../suite/bluetooth/UnpairBluetoothDeviceFromOsModal';

type BluetoothConnectionModalProps = {
    onClose: () => void;
};

const selectedDeviceConnectionTypes = ['connecting', 'pairing'];

export const BluetoothConnectionModal = ({ onClose }: BluetoothConnectionModalProps) => {
    const {
        handlePairingCancel,
        onReScanClick,
        onConnect,
        devices,
        selectedDevice,
        showRemoveFromOsBluetooth,
        closeShowRemoveFromOsBluetooth,
    } = useConnectionGlobalModalContext();
    const connectingDevices = useSelector(selectConnectingDevices);
    const nearbyDevices = useSelector(selectNearbyDevices);

    if (showRemoveFromOsBluetooth) {
        return <UnpairBluetoothDeviceFromOsModal onFinish={closeShowRemoveFromOsBluetooth} />;
    }

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
                onCancel={onClose}
                heading={<Translation id="TR_CONNECT_YOUR_TREZOR" />}
                description={<Translation id="TR_CONNECT_YOUR_TREZOR_DESCRIPTION" />}
                size="small"
            >
                <BluetoothSelectedDevice device={selectedDevice} onReScanClick={onReScanClick} />
            </Modal>
        );
    }

    // show result of scanning and let user connect
    if (devices.length > 0 && !selectedDevice && nearbyDevices && nearbyDevices.length > 0) {
        return (
            <Modal
                onCancel={onClose}
                heading={<Translation id="TR_CONNECT_YOUR_TREZOR" />}
                description={<Translation id="TR_CONNECT_YOUR_TREZOR_DESCRIPTION" />}
                size="small"
            >
                is it this for fuck sake?
                <BluetoothScanningList
                    devices={devices}
                    onConnect={onConnect}
                    onReScanClick={onReScanClick}
                />
            </Modal>
        );
    }
    console.log('hello?');

    return null;
};
