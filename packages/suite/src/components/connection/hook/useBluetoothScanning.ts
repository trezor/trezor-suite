import { useCallback, useEffect, useRef } from 'react';

import { SCAN_TIMEOUT, bluetoothActions } from '@suite-common/bluetooth';
import { TimerId } from '@trezor/type-utils';

import { DesktopBluetoothDevice } from 'src/actions/bluetooth/DesktopBluetoothDevice';
import { bluetoothStartScanningThunk } from 'src/actions/bluetooth/bluetoothStartScanningThunk';
import { bluetoothStopScanningThunk } from 'src/actions/bluetooth/bluetoothStopScanningThunk';
import { useDispatch } from 'src/hooks/suite';

export type UseBluetoothScanningProps = {
    bluetoothMode: boolean;
    devices: DesktopBluetoothDevice[];
    setShowHints: (value: boolean) => void;
};

export type UseBluetoothScanningReturn = {
    onReScanClick: () => void;
};

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

    // stop scanning after 15s
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

    return {
        onReScanClick,
    };
};
