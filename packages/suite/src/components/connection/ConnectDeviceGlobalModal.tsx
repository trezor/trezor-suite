import { useCallback, useEffect, useRef, useState } from 'react';

import { useTheme } from 'styled-components';

import {
    bluetoothActions,
    prepareSelectAllDevices,
    selectAdapterStatus,
    selectKnownDevices,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { Box, Button, Column, Modal, Row, Spinner, Text } from '@trezor/components';
import { BluetoothDeviceId } from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';
import { borders } from '@trezor/theme';
import { TimerId } from '@trezor/type-utils';

import { DesktopBluetoothDevice } from 'src/actions/bluetooth/DesktopBluetoothDevice';
import { bluetoothConnectDeviceThunk } from 'src/actions/bluetooth/bluetoothConnectDeviceThunk';
import { bluetoothDisconnectDeviceThunk } from 'src/actions/bluetooth/bluetoothDisconnectDeviceThunk';
import { bluetoothStartScanningThunk } from 'src/actions/bluetooth/bluetoothStartScanningThunk';
import { bluetoothStopScanningThunk } from 'src/actions/bluetooth/bluetoothStopScanningThunk';
import {
    selectIsUnpairingDevice,
    selectUnpairedDeviceNeedsManualOsRemoval,
} from 'src/actions/bluetooth/desktopBluetoothSelectors';
import { selectDeviceDefaultConnectionMode } from 'src/actions/device/deviceSelectors';
import { setConnectionMode } from 'src/actions/device/deviceSlice';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

import { BluetoothAdapterStatusModal } from './BluetoothAdapterStatusModal';
import { BluetoothConnectionModal } from './BluetoothConnectionModal';
import { CantSeeTrezorModal } from './CantSeeTrezorModal';
import { CableConnectionAnimation } from './DeviceConnectionAnimation';

const SCAN_TIMEOUT = 30_000;
const UNPAIRED_DEVICES_LAST_UPDATED_LIMIT = 15_000;

const selectAllDevices = prepareSelectAllDevices<DesktopBluetoothDevice>();

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
    const dispatch = useDispatch();
    const [showHints, setShowHints] = useState(false);
    const scannerTimerId = useRef<TimerId | null>(null);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [shouldPairAgain, setShouldPairAgain] = useState(false);
    const theme = useTheme();

    const wasBluetoothDeviceWiped = useSelector(selectUnpairedDeviceNeedsManualOsRemoval);
    const isUnpairingDevice = useSelector(selectIsUnpairingDevice);

    const { isBluetoothEnabled } = useSelector(selectSuiteFlags);
    const bluetoothAdapterStatus = useSelector(selectAdapterStatus);

    const defaultConnectionMode = useSelector(selectDeviceDefaultConnectionMode);

    const isBluetoothMode = defaultConnectionMode === 'bluetooth';

    const bluetoothMode = isBluetoothMode && isBluetoothEnabled && isDesktop();

    const toggleBluetoothMode = () => {
        dispatch(setConnectionMode(bluetoothMode ? 'cable' : 'bluetooth'));
    };

    const toggleShowHints = () => {
        setShowHints(!showHints);
    };

    const toggleShouldPairAgain = () => {
        setShouldPairAgain(!shouldPairAgain);
    };

    const allDevices = useSelector(selectAllDevices);
    const nearbyDevices = useSelector(selectNearbyDevices);
    const knownDevices = useSelector(selectKnownDevices);

    const lastUpdatedBoundaryTimestamp = Date.now() - UNPAIRED_DEVICES_LAST_UPDATED_LIMIT;

    const devices = allDevices.filter(it => {
        const isDeviceUnresponsiveForTooLong =
            it.lastUpdatedTimestamp < lastUpdatedBoundaryTimestamp;

        if (isDeviceUnresponsiveForTooLong) {
            // If the device is connected or paired (it may have been paired in the OS system directly)
            // => do not filter it based isDeviceUnresponsiveForTooLong

            return it.connected;
        }

        return true;
    });

    const selectedDevice =
        selectedDeviceId !== null
            ? devices.find(device => device.id === selectedDeviceId)
            : undefined;

    // starts to scan for devices when connection mode is bluetooth
    useEffect(() => {
        if (isBluetoothMode) dispatch(bluetoothStartScanningThunk());

        return () => {
            dispatch(bluetoothStopScanningThunk());
        };
    }, [dispatch, isBluetoothMode]);

    const clearScanTimer = useCallback(() => {
        if (scannerTimerId.current !== null) {
            clearTimeout(scannerTimerId.current);
        }
    }, []);

    // stop scanning after 15s
    useEffect(() => {
        if (isBluetoothMode)
            scannerTimerId.current = setTimeout(() => {
                setShowHints(true);
                dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
            }, SCAN_TIMEOUT);

        return clearScanTimer;
    }, [dispatch, clearScanTimer, isBluetoothMode]);

    useEffect(() => {
        if (devices.length > 0) {
            clearScanTimer();
            dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
        }
    }, [devices, dispatch, clearScanTimer]);

    const onReScanClick = () => {
        setSelectedDeviceId(null);
        clearScanTimer();

        dispatch(bluetoothStartScanningThunk());
        scannerTimerId.current = setTimeout(() => {
            setShowHints(true);
            dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
        }, SCAN_TIMEOUT);
    };

    const handlePairingCancel = async (deviceId: BluetoothDeviceId) => {
        await dispatch(bluetoothDisconnectDeviceThunk({ id: deviceId }));
        setSelectedDeviceId(null);
        onReScanClick();
    };

    const handleBluetoothConnectionCancel = () => {
        setSelectedDeviceId(null);
        onReScanClick();
        toggleBluetoothMode();
    };

    const onConnect = async (deviceId: BluetoothDeviceId) => {
        setSelectedDeviceId(deviceId);
        const result = await dispatch(bluetoothConnectDeviceThunk({ deviceId })).unwrap();

        if (result.success) {
            onCancel();
        } else {
            // No additional failure handling needed, it is handled in bluetoothConnectDeviceThunk
            setSelectedDeviceId(null);
        }
    };

    if (wasBluetoothDeviceWiped || isUnpairingDevice) return null;

    if (showHints) {
        return (
            <CantSeeTrezorModal
                isBluetoothMode={isBluetoothMode}
                onRescan={onReScanClick}
                onGoBack={toggleShowHints}
                onClose={onCancel}
                onStillDontWork={toggleShouldPairAgain}
            />
        );
    }

    // handle Bluetooth adapter status cases
    if (
        bluetoothMode &&
        (bluetoothAdapterStatus === 'disabled' ||
            bluetoothAdapterStatus === 'permission-denied' ||
            bluetoothAdapterStatus === 'not-compatible')
    ) {
        return (
            <BluetoothAdapterStatusModal
                bluetoothAdapterStatus={bluetoothAdapterStatus}
                onCancel={onCancel}
            />
        );
    }

    if (bluetoothMode && devices.length > 0) {
        return (
            <BluetoothConnectionModal
                nearbyDevices={nearbyDevices}
                knownDevices={knownDevices}
                devices={devices}
                selectedDevice={selectedDevice}
                shouldPairAgain={shouldPairAgain}
                onPairingCancel={handlePairingCancel}
                onRescanClick={onReScanClick}
                onConnect={onConnect}
                onCancel={handleBluetoothConnectionCancel}
                onClose={onCancel}
            />
        );
    }

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
