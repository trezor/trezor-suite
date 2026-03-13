import { NativeModule } from 'expo';
import { requireNativeModule } from 'expo-modules-core';

import { NativeDevice } from './ReactNativeUsb.types';

type DeviceEvents = {
    onDeviceConnect: (device: NativeDevice | null) => void;
    onDeviceDisconnect: (device: NativeDevice | null) => void;
};

declare class ReactNativeUsbModuleDeclaration extends NativeModule<DeviceEvents> {
    getDevices: () => Promise<NativeDevice[]>;
    open: (deviceName: string) => Promise<void>;
    reset: (deviceName: string) => Promise<void>;
    close: (deviceName: string) => Promise<void>;
    claimInterface: (deviceName: string, interfaceNumber: number) => Promise<void>;
    releaseInterface: (deviceName: string, interfaceNumber: number) => Promise<void>;
    transferIn: (deviceName: string, endpointNumber: number, length: number) => Promise<Uint8Array>;
    transferOut: (deviceName: string, endpointNumber: number, data: Uint8Array) => Promise<void>;
    setPriorityMode: (isInPriorityMode: boolean) => void;
}

// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
export const ReactNativeUsbModule =
    requireNativeModule<ReactNativeUsbModuleDeclaration>('ReactNativeUsb');
