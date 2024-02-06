import type { TypedEmitter } from '@trezor/utils';

export interface BluetoothDevice {
    name: string;
    id: string;
    data: number[]; // advertisement data bytes
    connected: boolean;
    timestamp?: number; // last know activity from the device (discovery, advertisements)
    paired?: boolean; // known (linux, windows), unknown (macos)
}

// IpcApi related types
export type DeviceConnectionStatus = { uuid: string } & (
    | { type: 'pairing'; pin?: string }
    | { type: 'paired' }
    | { type: 'connecting' }
    | { type: 'connected' }
);

type Success<P> = P extends unknown ? { success: true } : { success: true; payload: P };
type Failure = { success: false; error: string };
type IpcResponse<P = unknown> = Success<P> | Failure;

export interface BluetoothIpcEvents {
    'adapter-event': boolean;
    'device-list-update': BluetoothDevice[];
    'device-connection-status': DeviceConnectionStatus;
}

type TypedManagerEvents = TypedEmitter<BluetoothIpcEvents>;

export interface BluetoothIpcState {
    knownDevices: BluetoothDevice[];
}

export interface BluetoothIpcApi {
    init(state?: BluetoothIpcState): Promise<IpcResponse>;
    startScan(): Promise<IpcResponse>;
    stopScan(): Promise<IpcResponse>;
    connectDevice(id: string): Promise<IpcResponse>;
    disconnectDevice(id: string): Promise<IpcResponse>;
    forgetDevice(id: string): Promise<IpcResponse>;
    on: TypedManagerEvents['on'];
    off: TypedManagerEvents['off'];
    removeAllListeners: TypedManagerEvents['removeAllListeners'];
}
