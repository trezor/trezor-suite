import { injectDesktopAnalytics } from '@suite/analytics';
import { selectConnectingDevices } from '@suite/bluetooth';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { Modal } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';

import { useConnectionGlobalModalContext } from './context/ConnectionGlobalModalContext';
import { useSelector } from '../../hooks/suite';
import { BluetoothPairingPin } from '../suite/bluetooth/BluetoothPairingPin';
import { BluetoothScanningList } from '../suite/bluetooth/BluetoothScanningList';
import { BluetoothSelectedDevice } from '../suite/bluetooth/BluetoothSelectedDevice';

type BluetoothConnectionModalProps = {
    onClose: () => void;
};

const selectedDeviceConnectionTypes = ['connecting', 'pairing'];

export const BluetoothConnectionModal = ({ onClose }: BluetoothConnectionModalProps) => {
    const { analytics } = useServices(injectDesktopAnalytics);
    const { handlePairingCancel, onReScanClick, selectedDevice } =
        useConnectionGlobalModalContext();
    const connectingDevices = useSelector(selectConnectingDevices);

    const handleClose = () => {
        if (selectedDevice) {
            analytics.report({
                type: events.deviceConnectionDeviceFoundEvent.name,
                payload: {
                    option: 'close',
                },
            });
        }
        onClose();
    };

    if (
        selectedDevice?.connectionStatus.type === 'pairing' &&
        (selectedDevice.connectionStatus?.pin?.length ?? 0) > 0
    ) {
        return (
            <BluetoothPairingPin
                device={selectedDevice}
                pairingPin={selectedDevice.connectionStatus.pin}
                onCancel={() => handlePairingCancel(selectedDevice.id)}
            />
        );
    }

    if (
        selectedDevice !== undefined &&
        (selectedDeviceConnectionTypes.includes(selectedDevice.connectionStatus.type) ||
            connectingDevices.includes(selectedDevice.id))
    ) {
        return (
            <BluetoothSelectedDevice
                device={selectedDevice}
                onCancel={handleClose}
                onReScanClick={onReScanClick}
            />
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
