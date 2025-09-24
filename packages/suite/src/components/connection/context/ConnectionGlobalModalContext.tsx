import {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    SCAN_TIMEOUT,
    UNPAIRED_DEVICES_LAST_UPDATED_LIMIT,
    bluetoothActions,
    prepareSelectAllDevices,
} from '@suite-common/bluetooth';
import { BluetoothDeviceId } from '@trezor/connect';
import { isDesktop } from '@trezor/env-utils';
import { TimerId } from '@trezor/type-utils';

import { DesktopBluetoothDevice } from 'src/actions/bluetooth/DesktopBluetoothDevice';
import { bluetoothConnectDeviceThunk } from 'src/actions/bluetooth/bluetoothConnectDeviceThunk';
import { bluetoothDisconnectDeviceThunk } from 'src/actions/bluetooth/bluetoothDisconnectDeviceThunk';
import { bluetoothStartScanningThunk } from 'src/actions/bluetooth/bluetoothStartScanningThunk';
import { bluetoothStopScanningThunk } from 'src/actions/bluetooth/bluetoothStopScanningThunk';
import { selectDeviceDefaultConnectionMode } from 'src/actions/device/deviceSelectors';
import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

export type ConnectionGlobalModalContextProps = {
    toggleBluetoothMode: () => void;
    toggleShowHints: () => void;
    toggleShouldPairAgain: () => void;
    devices: DesktopBluetoothDevice[];
    selectedDevice: DesktopBluetoothDevice | undefined;
    onConnect: (deviceId: BluetoothDeviceId) => Promise<void>;
    handlePairingCancel: (deviceId: BluetoothDeviceId) => Promise<void>;
    handleBluetoothConnectionCancel: () => void;
    onReScanClick: () => void;
    bluetoothMode: boolean;
    showHints: boolean;
    shouldPairAgain: boolean;
};

const ConnectionGlobalModalReactContext = createContext<ConnectionGlobalModalContextProps>({
    toggleBluetoothMode: () => {},
    toggleShowHints: () => {},
    toggleShouldPairAgain: () => {},
    devices: [],
    selectedDevice: undefined,
    onConnect: async () => {},
    handlePairingCancel: async () => {},
    handleBluetoothConnectionCancel: () => {},
    onReScanClick: () => {},
    bluetoothMode: false,
    showHints: false,
    shouldPairAgain: false,
});

const selectAllDevices = prepareSelectAllDevices<DesktopBluetoothDevice>();

const useConnectionGlobalModal = () => {
    const dispatch = useDispatch();
    const [showHints, setShowHints] = useState(false);
    const scannerTimerId = useRef<TimerId | null>(null);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [shouldPairAgain, setShouldPairAgain] = useState(false);

    const { isBluetoothEnabled } = useSelector(selectSuiteFlags);

    const defaultConnectionMode = useSelector(selectDeviceDefaultConnectionMode);

    const bluetoothMode =
        defaultConnectionMode === 'bluetooth' && isBluetoothEnabled && isDesktop();

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

    const lastUpdatedBoundaryTimestamp = Date.now() - UNPAIRED_DEVICES_LAST_UPDATED_LIMIT;

    // TODO get back to this and refactor this so it makes more sense
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
        if (bluetoothMode) {
            dispatch(bluetoothStartScanningThunk());

            return () => {
                dispatch(bluetoothStopScanningThunk());
            };
        }
    }, [dispatch, bluetoothMode]);

    const clearScanTimer = useCallback(() => {
        if (scannerTimerId.current !== null) {
            clearTimeout(scannerTimerId.current);
        }
    }, []);

    // stop scanning after 15s
    useEffect(() => {
        if (bluetoothMode)
            scannerTimerId.current = setTimeout(() => {
                setShowHints(true);
                dispatch(bluetoothActions.scanStatusAction({ status: 'idle' }));
            }, SCAN_TIMEOUT);

        return clearScanTimer;
    }, [dispatch, clearScanTimer, bluetoothMode]);

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
            dispatch(setConnectionModal(false));
        } else {
            // No additional failure handling needed, it is handled in bluetoothConnectDeviceThunk
            setSelectedDeviceId(null);
        }
    };

    // TODO dump the state
    console.log('state here');
    console.log({
        shouldPairAgain,
        showHints,
        bluetoothMode,
        devices,
        selectedDevice,
        allDevices,
    });

    return {
        shouldPairAgain,
        showHints,
        bluetoothMode,
        devices,
        selectedDevice,
        allDevices,
        toggleBluetoothMode,
        toggleShowHints,
        toggleShouldPairAgain,
        handlePairingCancel,
        handleBluetoothConnectionCancel,
        onConnect,
        onReScanClick,
    };
};

export const useConnectionGlobalModalContext = () => useContext(ConnectionGlobalModalReactContext);

type ConnectionGlobalModalProviderProps = {
    children: ReactNode;
};

export const ConnectionGlobalModalProvider = ({ children }: ConnectionGlobalModalProviderProps) => {
    const contextValue = useConnectionGlobalModal();

    return (
        <ConnectionGlobalModalReactContext.Provider value={contextValue}>
            {children}
        </ConnectionGlobalModalReactContext.Provider>
    );
};
