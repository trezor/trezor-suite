import { type ReactNode, createContext, useContext, useState } from 'react';

import {
    prepareSelectAllDevices,
    selectKnownDevices,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { isDesktop } from '@trezor/env-utils';

import { type DesktopBluetoothDevice } from 'src/actions/bluetooth/DesktopBluetoothDevice';
import { NEARBY_DEVICES_LAST_UPDATED_LIMIT } from 'src/actions/bluetooth/filterOutNonResponsiveDevices';
import { isBluetoothDeviceReachable } from 'src/actions/bluetooth/isBluetoothDeviceReachable';
import { selectDeviceDefaultConnectionMode } from 'src/actions/device/deviceSelectors';
import { setConnectionMode } from 'src/actions/device/deviceSlice';
import { useDispatch, useSelector } from 'src/hooks/suite';

import {
    type UseBluetoothConnectionReturn,
    useBluetoothConnection,
} from '../hook/useBluetoothConnection';
import {
    type UseBluetoothScanningReturn,
    useBluetoothScanning,
} from '../hook/useBluetoothScanning';

export type ConnectionGlobalModalContextProps = UseBluetoothScanningReturn &
    UseBluetoothConnectionReturn & {
        isBluetoothMode: boolean;
        devices: DesktopBluetoothDevice[];
        shouldShowBluetoothUnPairDeviceList: boolean;
        showHints: boolean;
        shouldPairAgain: boolean;
        showRemoveFromOsBluetooth: boolean;
        openShowRemoveFromOsBluetooth: () => void;
        closeShowRemoveFromOsBluetooth: () => void;
        onReScanClick: () => void;
        toggleBluetoothMode: () => void;
        toggleShowHints: () => void;
        toggleShouldPairAgain: () => void;
    };

const ConnectionGlobalModalReactContext = createContext<ConnectionGlobalModalContextProps>({
    isBluetoothMode: false,

    devices: [],
    selectedDevice: undefined,
    notConnectedKnownDevices: [],
    notConnectedNearbyDevices: [],
    manuallyPairedConnectedDevices: [],
    shouldShowBluetoothUnPairDeviceList: false,

    showHints: false,
    shouldPairAgain: false,
    showRemoveFromOsBluetooth: false,

    onConnect: async () => {},
    handlePairingCancel: async () => {},
    onReScanClick: () => {},
    openShowRemoveFromOsBluetooth: () => {},
    closeShowRemoveFromOsBluetooth: () => {},
    toggleBluetoothMode: () => {},
    toggleShowHints: () => {},
    toggleShouldPairAgain: () => {},
});

const selectAllDevices = prepareSelectAllDevices<DesktopBluetoothDevice>();

const useConnectionGlobalModal = () => {
    const dispatch = useDispatch();
    const [showHints, setShowHints] = useState(false);
    const [shouldPairAgain, setShouldPairAgain] = useState(false);
    const [showRemoveFromOsBluetooth, setShowRemoveFromOsBluetooth] = useState(false);

    const defaultConnectionMode = useSelector(selectDeviceDefaultConnectionMode);

    const nearbyDevices = useSelector(selectNearbyDevices);
    const knownDevices = useSelector(selectKnownDevices);

    const isBluetoothMode = defaultConnectionMode === 'bluetooth' && isDesktop();

    const toggleBluetoothMode = () => {
        dispatch(setConnectionMode(isBluetoothMode ? 'cable' : 'bluetooth'));
    };

    const toggleShowHints = () => {
        setShowHints(!showHints);
    };

    const toggleShouldPairAgain = () => {
        setShouldPairAgain(!shouldPairAgain);
    };

    const openShowRemoveFromOsBluetooth = () => {
        setShouldPairAgain(false);
        setShowRemoveFromOsBluetooth(!showRemoveFromOsBluetooth);
    };

    const closeShowRemoveFromOsBluetooth = () => {
        setShowRemoveFromOsBluetooth(false);
        toggleShouldPairAgain();
    };

    const allDevices = useSelector(selectAllDevices);

    // TODO shall be refactored, now it isn't reactive on Date.now() → can render outdated result. Maybe a setInterval?
    // eslint-disable-next-line react-hooks/purity
    const lastUpdatedBoundaryTimestamp = Date.now() - NEARBY_DEVICES_LAST_UPDATED_LIMIT;

    const devices = allDevices.filter(it => {
        const isDeviceUnresponsiveForTooLong =
            it.lastUpdatedTimestamp < lastUpdatedBoundaryTimestamp;

        if (isDeviceUnresponsiveForTooLong) {
            // If the device is connected or paired (it may have been paired in the OS system directly)
            // => do not filter it based isDeviceUnresponsiveForTooLong
            return isBluetoothDeviceReachable(it);
        }

        return true;
    });

    const { onReScanClick } = useBluetoothScanning({
        bluetoothMode: isBluetoothMode,
        devices,
        setShowHints,
    });

    const {
        selectedDevice,
        notConnectedKnownDevices,
        notConnectedNearbyDevices,
        manuallyPairedConnectedDevices,
        onConnect,
        handlePairingCancel,
    } = useBluetoothConnection({
        devices,
        onReScanClick,
    });

    // special state when user is prompted to unpair the device and then pair again
    // if he has any known device but no nearby devices were found
    const shouldShowBluetoothUnPairDeviceList =
        nearbyDevices.length === 0 &&
        notConnectedKnownDevices.length >= knownDevices.length &&
        knownDevices.length > 0 &&
        shouldPairAgain;

    return {
        shouldPairAgain,
        showHints,
        isBluetoothMode,
        devices,
        selectedDevice,
        allDevices,
        toggleBluetoothMode,
        toggleShowHints,
        toggleShouldPairAgain,
        handlePairingCancel,
        onConnect,
        onReScanClick,
        openShowRemoveFromOsBluetooth,
        closeShowRemoveFromOsBluetooth,
        showRemoveFromOsBluetooth,
        notConnectedKnownDevices,
        shouldShowBluetoothUnPairDeviceList,
        notConnectedNearbyDevices,
        manuallyPairedConnectedDevices,
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
