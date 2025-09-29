import { useTheme } from 'styled-components';

import { selectAdapterStatus } from '@suite-common/bluetooth';
import { Box, Button, Column, Modal, Row, Spinner, Text } from '@trezor/components';
import { borders } from '@trezor/theme';

import {
    selectIsUnpairingDevice,
    selectUnpairedDeviceNeedsManualOsRemoval,
} from 'src/actions/bluetooth/desktopBluetoothSelectors';
import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

import { BluetoothAdapterStatusModal } from './BluetoothAdapterStatusModal';
import { BluetoothConnectionModal } from './BluetoothConnectionModal';
import { CantSeeTrezorModal } from './CantSeeTrezorModal';
import { CableConnectionAnimation } from './DeviceConnectionAnimation';
import { useConnectionGlobalModalContext } from './context/ConnectionGlobalModalContext';
import { BluetoothDeviceList } from '../suite/bluetooth/BluetoothDeviceList';

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
        devices,
        bluetoothMode,
        showHints,
        shouldPairAgain,
        handleBluetoothConnectionCancel,
        onConnect,
        openShowRemoveFromOsBluetooth,
        shouldShowBluetoothUnPairDeviceList,
        notConnectedKnownDevices,
    } = useConnectionGlobalModalContext();

    const wasBluetoothDeviceWiped = useSelector(selectUnpairedDeviceNeedsManualOsRemoval);
    const isUnpairingDevice = useSelector(selectIsUnpairingDevice);

    const { isBluetoothEnabled } = useSelector(selectSuiteFlags);
    const bluetoothAdapterStatus = useSelector(selectAdapterStatus);

    if (wasBluetoothDeviceWiped || isUnpairingDevice) return null;

    if (showHints) {
        return <CantSeeTrezorModal onClose={onCancel} />;
    }

    // handle Bluetooth adapter status cases
    if (
        bluetoothMode &&
        (bluetoothAdapterStatus === 'disabled' ||
            bluetoothAdapterStatus === 'permission-denied' ||
            bluetoothAdapterStatus === 'not-compatible')
    ) {
        return <BluetoothAdapterStatusModal onCancel={onCancel} />;
    }

    // no nearby devices found, but we have some known devices, allow user to pair again
    if (bluetoothMode && shouldShowBluetoothUnPairDeviceList) {
        return (
            <Modal
                onCancel={handleBluetoothConnectionCancel}
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

    // we found some devices, show the list
    if ((bluetoothMode && devices.length > 0) || (bluetoothMode && shouldPairAgain)) {
        return <BluetoothConnectionModal onClose={onCancel} />;
    }

    if (bluetoothMode) {
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

    return (
        <Modal.Backdrop onClick={onCancel}>
            <DontSeeTrezorPill onClick={toggleShowHints} />
            <Modal.ModalBase size="tiny" onCancel={onCancel}>
                <ConnectModalContent isBluetoothMode={false}>
                    {isBluetoothEnabled && (
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
