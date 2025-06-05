import { useCallback, useEffect, useRef, useState } from 'react';

import {
    bluetoothActions,
    prepareSelectAllDevices,
    selectAdapterStatus,
    selectKnownDevices,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { TimerId } from '@trezor/type-utils';

import { BluetoothLoading } from './BluetoothLoading';
import { BluetoothPairingPin } from './BluetoothPairingPin';
import { BluetoothScanningList } from './BluetoothScanningList';
import { BluetoothSelectedDevice } from './BluetoothSelectedDevice';
import { BluetoothConnectUiMode } from './bluetoothTypes';
import { BluetoothDeniedForSuite } from './errors/BluetoothDeniedForSuite';
import { BluetoothNotEnabled } from './errors/BluetoothNotEnabled';
import { BluetoothVersionNotCompatible } from './errors/BluetoothVersionNotCompatible';
import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';
import { bluetoothConnectDeviceThunk } from '../../../actions/bluetooth/bluetoothConnectDeviceThunk';
import { bluetoothDisconnectDeviceThunk } from '../../../actions/bluetooth/bluetoothDisconnectDeviceThunk';
import { bluetoothStartScanningThunk } from '../../../actions/bluetooth/bluetoothStartScanningThunk';
import { bluetoothStopScanningThunk } from '../../../actions/bluetooth/bluetoothStopScanningThunk';
import { closeModalApp } from '../../../actions/suite/routerActions';
import { useDispatch, useSelector } from '../../../hooks/suite';

const SCAN_TIMEOUT = 30_000;
const UNPAIRED_DEVICES_LAST_UPDATED_LIMIT_SECONDS = 30;

type BluetoothConnectProps = {
    uiMode: BluetoothConnectUiMode;
};

const selectAllDevices = prepareSelectAllDevices<DesktopBluetoothDevice>();

export const BluetoothConnect = ({ uiMode }: BluetoothConnectProps) => {
    const dispatch = useDispatch();

    const [waitingForFirstUpdate, setWaitingForFirstUpdate] = useState<boolean>(true);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

    const scannerTimerId = useRef<TimerId | null>(null);

    const bluetoothAdapterStatus = useSelector(selectAdapterStatus);
    const allDevices = useSelector(selectAllDevices);
    const knownDevices = useSelector(selectKnownDevices);
    const nearbyDevices = useSelector(selectNearbyDevices);

    const lastUpdatedBoundaryTimestamp =
        Date.now() / 1000 - UNPAIRED_DEVICES_LAST_UPDATED_LIMIT_SECONDS;

    const devices = allDevices.filter(it => {
        const isDeviceUnresponsiveForTooLong =
            it.lastUpdatedTimestamp < lastUpdatedBoundaryTimestamp;

        if (isDeviceUnresponsiveForTooLong) {
            // If the device is connected or paired (it may have been paired in the OS system directly)
            // => do not filter it based isDeviceUnresponsiveForTooLong

            return (
                it.connected ||
                it.paired ||
                knownDevices.some(knownDevice => knownDevice.id === it.id)
            );
        }

        return true;
    });

    const selectedDevice =
        selectedDeviceId !== null
            ? devices.find(device => device.id === selectedDeviceId)
            : undefined;

    useEffect(() => {
        dispatch(bluetoothStartScanningThunk());

        return () => {
            dispatch(bluetoothStopScanningThunk());
        };
    }, [dispatch]);

    const clearScanTimer = useCallback(() => {
        if (scannerTimerId.current !== null) {
            clearTimeout(scannerTimerId.current);
        }
    }, []);

    useEffect(() => {
        scannerTimerId.current = setTimeout(() => {
            dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
        }, SCAN_TIMEOUT);

        return clearScanTimer;
    }, [dispatch, clearScanTimer]);

    useEffect(() => {
        if (devices.length > 0) {
            clearScanTimer();
            dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
        }
    }, [devices, dispatch, clearScanTimer]);

    // When we have some knownDevices, it may happen that we get empty nearbyDevices first and then,
    // in split second, we get the update and there are some nearbyDevices present.
    // Device in knownDevices but not in the nearbyDevices is recognized as to-be-deleted,
    // and ui flickers. This small loading is here to hide that.
    useEffect(() => {
        const timeoutHandle = setTimeout(() => setWaitingForFirstUpdate(false), 100);

        return () => clearTimeout(timeoutHandle);
    }, [setWaitingForFirstUpdate]);

    const onClose = () => {
        dispatch(bluetoothActions.setBluetoothListOpen({ isOpen: false }));
    };

    const onReScanClick = () => {
        setSelectedDeviceId(null);
        dispatch(bluetoothActions.scanStatusAction({ status: 'running' }));

        clearScanTimer();
        scannerTimerId.current = setTimeout(() => {
            dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
        }, SCAN_TIMEOUT);
    };

    if (bluetoothAdapterStatus === 'disabled') {
        return <BluetoothNotEnabled onCancel={onClose} uiMode={uiMode} />;
    }

    if (bluetoothAdapterStatus === 'permission-denied') {
        return <BluetoothDeniedForSuite onCancel={onClose} uiMode={uiMode} />;
    }

    if (bluetoothAdapterStatus === 'not-compatible') {
        return <BluetoothVersionNotCompatible onCancel={onClose} uiMode={uiMode} />;
    }

    const handlePairingCancel = async (deviceId: string) => {
        await dispatch(bluetoothDisconnectDeviceThunk({ id: deviceId }));
        setSelectedDeviceId(null);
        onReScanClick();
    };

    const onConnect = async (deviceId: string) => {
        setSelectedDeviceId(deviceId);
        const result = await dispatch(bluetoothConnectDeviceThunk({ deviceId })).unwrap();

        if (result.success) {
            if (uiMode === 'card') {
                dispatch(closeModalApp());
            } else {
                onClose();
            }
        } else {
            // No additional failure handling needed, it is handled in bluetoothConnectDeviceThunk
            setSelectedDeviceId(null);
        }
    };

    if (
        selectedDevice !== undefined &&
        selectedDevice !== null &&
        selectedDevice.connectionStatus.type === 'pairing' &&
        (selectedDevice.connectionStatus?.pin?.length ?? 0) > 0
    ) {
        return (
            <BluetoothPairingPin
                device={selectedDevice}
                pairingPin={selectedDevice.connectionStatus.pin}
                onCancel={handlePairingCancel}
            />
        );
    }

    if (selectedDevice !== undefined) {
        return (
            <BluetoothSelectedDevice
                device={selectedDevice}
                onReScanClick={onReScanClick}
                onCancel={handlePairingCancel}
            />
        );
    }

    if (nearbyDevices === null || waitingForFirstUpdate) {
        return <BluetoothLoading onClose={onClose} />;
    }

    return (
        <BluetoothScanningList
            devices={devices}
            uiMode={uiMode}
            onConnect={onConnect}
            onReScanClick={onReScanClick}
            onClose={onClose}
        />
    );
};
