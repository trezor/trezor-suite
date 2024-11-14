import { requireNativeModule } from 'expo-modules-core';
import { NativeModule } from 'expo';

import { NativeDevice } from './ReactNativeUsb.types';

type DeviceEvents = {
    onDeviceConnect: (device: NativeDevice | null) => void;
    onDeviceDisconnect: (device: NativeDevice | null) => void;
};

declare class ReactNativeUsbModuleDeclaration extends NativeModule<DeviceEvents> {
    open: (deviceName: string) => Promise<void>;
    close: (deviceName: string) => Promise<void>;
    claimInterface: (deviceName: string, interfaceNumber: number) => Promise<void>;
    releaseInterface: (deviceName: string, interfaceNumber: number) => Promise<void>;
    selectConfiguration: (deviceName: string, configurationValue: number) => Promise<void>;
    transferIn: (deviceName: string, endpointNumber: number, length: number) => Promise<number[]>;
    transferOut: (deviceName: string, endpointNumber: number, data: string) => Promise<void>;
}

// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
export const ReactNativeUsbModule =
    requireNativeModule<ReactNativeUsbModuleDeclaration>('ReactNativeUsb');
