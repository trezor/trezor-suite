import { useCallback, useEffect, useRef } from 'react';

import { bluetoothActions } from '@suite-common/bluetooth';
import { type TimerId } from '@trezor/type-utils';

import { type DesktopBluetoothDevice } from 'src/actions/bluetooth/DesktopBluetoothDevice';
import { bluetoothStartScanningThunk } from 'src/actions/bluetooth/bluetoothStartScanningThunk';
import { bluetoothStopScanningThunk } from 'src/actions/bluetooth/bluetoothStopScanningThunk';
import { removeNonResponsiveNearbyDevicesThunk } from 'src/actions/bluetooth/removeNonResponsiveNearbyDevicesThunk';
import { useDispatch } from 'src/hooks/suite';

type UseBluetoothScanningProps = {
    bluetoothMode: boolean;
    devices: DesktopBluetoothDevice[];
    setShowHints: (value: boolean) => void;
};

export type UseBluetoothScanningReturn = {
    onReScanClick: () => void;
};

const SCAN_TIMEOUT = 30_000;

export const useBluetoothScanning = ({
    bluetoothMode,
    devices,
    setShowHints,
}: UseBluetoothScanningProps): UseBluetoothScanningReturn => {
    const dispatch = useDispatch();
    const scannerTimerId = useRef<TimerId | null>(null);

    const clearScanTimer = useCallback(() => {
        if (scannerTimerId.current !== null) {
            clearTimeout(scannerTimerId.current);
            scannerTimerId.current = null;
        }
    }, []);

    const onReScanClick = useCallback(() => {
        clearScanTimer();

        dispatch(bluetoothStartScanningThunk());
        scannerTimerId.current = setTimeout(() => {
            setShowHints(true);
            dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
        }, SCAN_TIMEOUT);
    }, [dispatch, clearScanTimer, setShowHints]);

    // starts to scan for devices when connection mode is bluetooth
    useEffect(() => {
        if (bluetoothMode) {
            dispatch(bluetoothStartScanningThunk());

            return () => {
                dispatch(bluetoothStopScanningThunk());
            };
        }
    }, [dispatch, bluetoothMode]);

    // stop scanning (visually) after 30s
    useEffect(() => {
        if (bluetoothMode) {
            scannerTimerId.current = setTimeout(() => {
                setShowHints(true);
                dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
            }, SCAN_TIMEOUT);
        }

        return clearScanTimer;
    }, [dispatch, clearScanTimer, bluetoothMode, setShowHints]);

    // stop scanning when devices are found
    useEffect(() => {
        if (devices.length > 0) {
            clearScanTimer();
            dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
        }
    }, [devices, dispatch, clearScanTimer]);

    // Cleanup timer on unmount
    useEffect(
        () => () => {
            clearScanTimer();
        },
        [clearScanTimer],
    );

    // currently we need to check periodically for non-responsive devices and filter them out
    // we do not get update from bluetooth adapter when device is non responsive
    useEffect(() => {
        function updateNonResponsiveDevices() {
            dispatch(removeNonResponsiveNearbyDevicesThunk());
        }

        if (bluetoothMode) {
            const interval = setInterval(updateNonResponsiveDevices, 1_000);

            return () => clearInterval(interval);
        }
    }, [dispatch, bluetoothMode]);

    return {
        onReScanClick,
    };
};
