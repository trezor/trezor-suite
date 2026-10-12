import { useCallback, useEffect, useRef } from 'react';

import {
    type DesktopBluetoothDevice,
    injectBluetooth,
    removeNonResponsiveNearbyDevicesThunk,
} from '@suite/bluetooth';
import { injectDispatch } from '@suite-common/redux-utils';
import { useServices } from '@trezor/dependency-injection';
import { type TimerId } from '@trezor/type-utils';

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
    const { dispatch, bluetooth } = useServices(injectDispatch, injectBluetooth);
    const scannerTimerId = useRef<TimerId | null>(null);

    const clearScanTimer = useCallback(() => {
        if (scannerTimerId.current !== null) {
            clearTimeout(scannerTimerId.current);
            scannerTimerId.current = null;
        }
    }, []);

    const onReScanClick = useCallback(() => {
        clearScanTimer();

        bluetooth.startScan();
        scannerTimerId.current = setTimeout(() => {
            setShowHints(true);
            bluetooth.setScanStatus('idle');
        }, SCAN_TIMEOUT);
    }, [bluetooth, clearScanTimer, setShowHints]);

    // starts to scan for devices when connection mode is bluetooth
    useEffect(() => {
        if (bluetoothMode) {
            bluetooth.startScan();

            return () => {
                bluetooth.stopScan();
            };
        }
    }, [bluetooth, bluetoothMode]);

    // stop scanning (visually) after 30s
    useEffect(() => {
        if (bluetoothMode) {
            scannerTimerId.current = setTimeout(() => {
                setShowHints(true);
                bluetooth.setScanStatus('idle');
            }, SCAN_TIMEOUT);
        }

        return clearScanTimer;
    }, [bluetooth, clearScanTimer, bluetoothMode, setShowHints]);

    // stop scanning when devices are found
    useEffect(() => {
        if (devices.length > 0) {
            clearScanTimer();
            bluetooth.setScanStatus('idle');
        }
    }, [bluetooth, devices, clearScanTimer]);

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
