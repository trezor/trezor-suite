import { Flex, H3, Modal, Text } from '@trezor/components';

import { DesktopBluetoothDevice } from 'src/actions/bluetooth/DesktopBluetoothDevice';
import { BluetoothPairingPin } from 'src/components/suite/bluetooth/BluetoothPairingPin';
import { BluetoothScanningList } from 'src/components/suite/bluetooth/BluetoothScanningList';
import { BluetoothSelectedDevice } from 'src/components/suite/bluetooth/BluetoothSelectedDevice';

import { BluetoothDeviceList } from '../suite/bluetooth/BluetoothDeviceList';

type BluetoothConnectionModalProps = {
    devices: DesktopBluetoothDevice[];
    selectedDevice: DesktopBluetoothDevice | undefined;
    nearbyDevices: DesktopBluetoothDevice[] | null;
    knownDevices: DesktopBluetoothDevice[] | null;
    shouldPairAgain: boolean;
    onPairingCancel: (deviceId: string) => Promise<void>;
    onRescanClick: () => void;
    onConnect: (deviceId: string) => Promise<void>;
    onCancel: () => void;
};

type BluetoothModalConnectionHeadingProps = {
    heading: string;
    description: string;
};

const BluetoothModalConnectionHeading = ({
    heading,
    description,
}: BluetoothModalConnectionHeadingProps) => (
    <Flex direction="column">
        <H3>{heading}</H3>
        <Text typographyStyle="hint" variant="tertiary">
            {description}
        </Text>
    </Flex>
);

export const BluetoothConnectionModal = ({
    devices,
    nearbyDevices,
    knownDevices,
    selectedDevice,
    onPairingCancel,
    onRescanClick,
    onConnect,
    onCancel,
}: BluetoothConnectionModalProps) => {
    if (
        selectedDevice !== undefined &&
        selectedDevice !== null &&
        selectedDevice.connectionStatus.type === 'pairing' &&
        (selectedDevice.connectionStatus?.pin?.length ?? 0) > 0
    ) {
        return (
            <Modal
                onCancel={() => onPairingCancel(selectedDevice.id)}
                heading={
                    <BluetoothModalConnectionHeading
                        heading="Connect your Trezor"
                        description="Please select a device to connect."
                    />
                }
            >
                <BluetoothPairingPin
                    device={selectedDevice}
                    pairingPin={selectedDevice.connectionStatus.pin}
                />
            </Modal>
        );
    }

    if (selectedDevice !== undefined) {
        return (
            <Modal
                onCancel={onCancel}
                heading={
                    <BluetoothModalConnectionHeading
                        heading="Connect your Trezor"
                        description="Please select a device to connect."
                    />
                }
            >
                <BluetoothSelectedDevice device={selectedDevice} onReScanClick={onRescanClick} />
            </Modal>
        );
    }

    // show result of scanning and let user connect
    if (devices.length > 0 && !selectedDevice && nearbyDevices && nearbyDevices.length > 0) {
        return (
            <Modal
                onCancel={onCancel}
                heading={
                    <BluetoothModalConnectionHeading
                        heading="Connect your Trezor"
                        description="Please select a device to connect."
                    />
                }
            >
                <BluetoothScanningList
                    devices={devices}
                    onConnect={onConnect}
                    onReScanClick={onRescanClick}
                />
            </Modal>
        );
    }

    // if there are no nearby devices, but we do have a know devices or cant connect -> pair again
    if (nearbyDevices && nearbyDevices.length === 0 && knownDevices && knownDevices.length > 0) {
        return (
            <Modal
                onCancel={onCancel}
                heading={
                    <BluetoothModalConnectionHeading
                        heading="Pair your Trezor again"
                        description="There might be some problem we can’t detect, please try pairing your Trezor again."
                    />
                }
            >
                <BluetoothDeviceList
                    deviceList={knownDevices}
                    onConnect={onConnect}
                    isScanning={false}
                />
            </Modal>
        );
    }

    return null;
};
