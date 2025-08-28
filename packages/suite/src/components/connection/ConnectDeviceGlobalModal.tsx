import { useCallback, useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import {
    bluetoothActions,
    prepareSelectAllDevices,
    selectAdapterStatus,
    selectKnownDevices,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { Button, H2, Modal } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { spacings, spacingsPx } from '@trezor/theme';
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

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    max-height: calc(80vh - 86px);
    overflow-y: hidden;
    gap: ${spacingsPx.xxxxl};
`;

const HeadingWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${spacingsPx.xxl};
    max-width: 320px;
`;

export const ConnectDeviceGlobalModal = ({ onCancel }: { onCancel: () => void }) => {
    const dispatch = useDispatch();
    const [showHints, setShowHints] = useState(false);
    const scannerTimerId = useRef<TimerId | null>(null);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [shouldPairAgain, setShouldPairAgain] = useState(false);

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

    const handlePairingCancel = async (deviceId: string) => {
        await dispatch(bluetoothDisconnectDeviceThunk({ id: deviceId }));
        setSelectedDeviceId(null);
        onReScanClick();
    };

    const handleBluetoothConnectionCancel = () => {
        setSelectedDeviceId(null);
        onReScanClick();
        toggleBluetoothMode();
    };

    const onConnect = async (deviceId: string) => {
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
                onCancel={toggleBluetoothMode}
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
            />
        );
    }

    return (
        <Modal.Backdrop onClick={onCancel}>
            <Button onClick={toggleShowHints} icon="question" variant="infoLight">
                <Translation id="TR_STILL_DONT_SEE_YOUR_TREZOR" />
            </Button>
            <Modal.ModalBase
                padding={{ bottom: isBluetoothMode ? spacings.md : spacings.zero }}
                size="tiny"
                onCancel={onCancel}
            >
                <Content>
                    <HeadingWrapper>
                        <H2 align="center">
                            <Translation id="TR_CONNECT_YOUR_DEVICE" />
                        </H2>
                        {isBluetoothEnabled && (
                            <Button
                                icon={isBluetoothMode ? 'cableUsbC' : 'bluetooth'}
                                onClick={toggleBluetoothMode}
                                variant="tertiary"
                            >
                                <Translation
                                    id={
                                        isBluetoothMode
                                            ? 'TR_BLUETOOTH_TIP_CABLE_HEADER'
                                            : 'TR_PAIR_NEW_BLUETOOTH_DEVICE'
                                    }
                                />
                            </Button>
                        )}
                    </HeadingWrapper>
                    <CableConnectionAnimation isBluetoothMode={isBluetoothMode} />
                </Content>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
