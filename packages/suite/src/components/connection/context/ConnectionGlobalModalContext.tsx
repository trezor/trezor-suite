import { ReactNode, createContext, useContext, useState } from 'react';

import {
    prepareSelectAllDevices,
    selectKnownDevices,
    selectNearbyDevices,
} from '@suite-common/bluetooth';
import { isDesktop } from '@trezor/env-utils';

import { DesktopBluetoothDevice } from 'src/actions/bluetooth/DesktopBluetoothDevice';
import { NEARBY_DEVICES_LAST_UPDATED_LIMIT } from 'src/actions/bluetooth/filterOutNonResponsiveDevices';
import { isBluetoothDeviceConnected } from 'src/actions/bluetooth/isBluetoothDeviceConnected';
import { selectDeviceDefaultConnectionMode } from 'src/actions/device/deviceSelectors';
import { setConnectionMode } from 'src/actions/device/deviceSlice';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

import {
    useBluetoothConnection,
    UseBluetoothConnectionReturn,
} from '../hook/useBluetoothConnection';
import { useBluetoothScanning, UseBluetoothScanningReturn } from '../hook/useBluetoothScanning';

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
    shouldShowBluetoothUnPairDeviceList: false,

    showHints: false,
    shouldPairAgain: false,
    showRemoveFromOsBluetooth: false,

    onConnect: async () => {},
    handlePairingCancel: async () => {},
    handleBluetoothConnectionCancel: () => {},
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

    const { isBluetoothEnabled } = useSelector(selectSuiteFlags);

    const defaultConnectionMode = useSelector(selectDeviceDefaultConnectionMode);

    const nearbyDevices = useSelector(selectNearbyDevices);
    const knownDevices = useSelector(selectKnownDevices);

    const isBluetoothMode =
        defaultConnectionMode === 'bluetooth' && isBluetoothEnabled && isDesktop();

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

    const lastUpdatedBoundaryTimestamp = Date.now() - NEARBY_DEVICES_LAST_UPDATED_LIMIT;

    const devices = allDevices.filter(it => {
        const isDeviceUnresponsiveForTooLong =
            it.lastUpdatedTimestamp < lastUpdatedBoundaryTimestamp;

        if (isDeviceUnresponsiveForTooLong) {
            // If the device is connected or paired (it may have been paired in the OS system directly)
            // => do not filter it based isDeviceUnresponsiveForTooLong
            return isBluetoothDeviceConnected(it);
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
        onConnect,
        handlePairingCancel,
        handleBluetoothConnectionCancel,
    } = useBluetoothConnection({
        devices,
        onReScanClick,
        toggleBluetoothMode,
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
        handleBluetoothConnectionCancel,
        onConnect,
        onReScanClick,
        openShowRemoveFromOsBluetooth,
        closeShowRemoveFromOsBluetooth,
        showRemoveFromOsBluetooth,
        notConnectedKnownDevices,
        shouldShowBluetoothUnPairDeviceList,
        notConnectedNearbyDevices,
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
