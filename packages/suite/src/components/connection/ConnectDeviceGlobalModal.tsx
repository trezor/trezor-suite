import { useTheme } from 'styled-components';

import { selectAdapterStatus, selectIsDeviceOsUnpairingRequired } from '@suite-common/bluetooth';
import { Box, Button, Column, Modal, Row, Spinner, Text } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { borders } from '@trezor/theme';

import { selectIsUnpairingDevice } from 'src/actions/bluetooth/desktopBluetoothSelectors';
import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';

import { BluetoothAdapterStatusModal } from './BluetoothAdapterStatusModal';
import { BluetoothConnectionModal } from './BluetoothConnectionModal';
import { CantSeeTrezorModal } from './CantSeeTrezorModal';
import { CableConnectionAnimation } from './DeviceConnectionAnimation';
import { useConnectionGlobalModalContext } from './context/ConnectionGlobalModalContext';
import { BluetoothDeviceList } from '../suite/bluetooth/BluetoothDeviceList';
import { UnpairBluetoothDeviceFromOsModal } from '../suite/bluetooth/UnpairBluetoothDeviceFromOsModal';

type DontSeeTrezorPillProps = {
    onClick: () => void;
};

const DontSeeTrezorPill = ({ onClick }: DontSeeTrezorPillProps) => {
    // A little hack so we can use the subtle variant of the button instead of creating a brand new variant for a single use case
    const theme = useTheme();

    return (
        <Box backgroundColor={theme.backgroundSurfaceElevation1} borderRadius={borders.radii.full}>
            <Button onClick={onClick} icon="question" variant="info" isSubtle>
                <Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />
            </Button>
        </Box>
    );
};

type ConnectModalContentProps = {
    children?: React.ReactNode;
    isBluetoothMode: boolean;
};

const ConnectModalContent = ({ children, isBluetoothMode }: ConnectModalContentProps) => (
    <Column
        alignItems="center"
        gap={32}
        maxHeight="calc(80vh - 86px)"
        overflow="hidden"
        margin={{ top: 12, bottom: 0 }}
    >
        <Text typographyStyle="titleMedium" align="center">
            <Translation id="TR_CONNECT_UNLOCK_YOUR_DEVICE" />
        </Text>
        {children}

        <Box margin={{ top: 8 }}>
            <CableConnectionAnimation isBluetoothMode={isBluetoothMode} />
        </Box>
    </Column>
);

export const ConnectDeviceGlobalModal = ({ onCancel }: { onCancel: () => void }) => {
    const theme = useTheme();

    const {
        toggleBluetoothMode,
        toggleShowHints,
        isBluetoothMode,
        showHints,
        onConnect,
        openShowRemoveFromOsBluetooth,
        shouldShowBluetoothUnPairDeviceList,
        notConnectedKnownDevices,
        notConnectedNearbyDevices,
        showRemoveFromOsBluetooth,
        closeShowRemoveFromOsBluetooth,
        selectedDevice,
    } = useConnectionGlobalModalContext();

    const wasBluetoothDeviceWiped = useSelector(selectIsDeviceOsUnpairingRequired);
    const isUnpairingDevice = useSelector(selectIsUnpairingDevice);

    const bluetoothAdapterStatus = useSelector(selectAdapterStatus);

    if (wasBluetoothDeviceWiped || isUnpairingDevice) return null;

    if (showHints) {
        return <CantSeeTrezorModal onClose={onCancel} />;
    }

    // handle Bluetooth adapter non ideal status cases
    if (
        isBluetoothMode &&
        (bluetoothAdapterStatus === 'disabled' ||
            bluetoothAdapterStatus === 'permission-denied' ||
            bluetoothAdapterStatus === 'not-compatible')
    ) {
        return <BluetoothAdapterStatusModal onCancel={onCancel} />;
    }

    // prompt user to remove the device from OS bluetooth settings
    if (showRemoveFromOsBluetooth) {
        return <UnpairBluetoothDeviceFromOsModal onFinish={closeShowRemoveFromOsBluetooth} />;
    }

    // no nearby devices found, but there are known devices that user might troubleshoot, so let him pair again
    if (isBluetoothMode && shouldShowBluetoothUnPairDeviceList) {
        return (
            <Modal
                onCancel={onCancel}
                heading={<Translation id="TR_CONNECT_YOUR_TREZOR" />}
                description={<Translation id="TR_CONNECT_YOUR_TREZOR_DESCRIPTION" />}
                size="small"
            >
                <BluetoothDeviceList
                    deviceList={notConnectedKnownDevices}
                    onConnect={onConnect}
                    isScanning={false}
                    onPairAgain={openShowRemoveFromOsBluetooth}
                />
            </Modal>
        );
    }

    // there are nearby devices, show the list and let user connect
    if (isBluetoothMode && (notConnectedNearbyDevices.length > 0 || selectedDevice)) {
        return <BluetoothConnectionModal onClose={onCancel} />;
    }

    // scanning for nearby devices
    if (isBluetoothMode) {
        return (
            <Modal.Backdrop onClick={onCancel}>
                <DontSeeTrezorPill onClick={toggleShowHints} />
                <Modal.ModalBase size="tiny" onCancel={onCancel} onBackClick={toggleBluetoothMode}>
                    <ConnectModalContent isBluetoothMode={true}>
                        <Row gap={8} alignItems="center" justifyContent="center" height={50}>
                            <Spinner size={16} bodyColor={theme.iconAlertBlue} isGrey={false} />
                            <Text variant="info">
                                <Translation id="TR_SCAN_TREZORS_NEARBY" />
                            </Text>
                        </Row>
                    </ConnectModalContent>
                </Modal.ModalBase>
            </Modal.Backdrop>
        );
    }

    // waiting for user to connect device via wired connection
    return (
        <Modal.Backdrop onClick={onCancel}>
            <DontSeeTrezorPill onClick={toggleShowHints} />
            <Modal.ModalBase size="tiny" onCancel={onCancel}>
                <ConnectModalContent isBluetoothMode={false}>
                    {isDesktop() && (
                        <Button
                            icon="bluetooth"
                            onClick={toggleBluetoothMode}
                            variant="info"
                            size="medium"
                        >
                            <Translation id="TR_PAIR_NEW_BLUETOOTH_DEVICE" />
                        </Button>
                    )}
                </ConnectModalContent>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
