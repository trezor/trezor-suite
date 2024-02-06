import type { TypedEmitter } from '@trezor/utils';

export interface Logger {
    debug(...args: any): void;
    log(...args: any): void;
    warn(...args: any): void;
    error(...args: any): void;
}

export interface TrezorBleSettings {
    logger?: Logger;
    timeout?: number;
}

export type BluetoothInfo = {
    powered: boolean;
    api_version: string;
    adapter_info: string;
    adapter_version: number;
};

// see: ./src/server/device.rs impl serde::Serialize for TrezorDevice
export interface BluetoothDevice {
    name: string;
    id: string; // changes after second connection (linux)
    address: string; // changes after pairing (linux), unknown on macos
    connected: boolean;
    lastUpdatedTimestamp: number;
    rssi: number;
    paired: boolean;
    data: number[];
}

export interface NotificationEvent {
    adapter_state_changed: { powered: boolean };
    device_discovered: { id: string; devices: BluetoothDevice[] };
    device_updated: { id: string; devices: BluetoothDevice[] };
    device_connected: { id: string; devices: BluetoothDevice[] };
    device_pairing: { id: string; paired: boolean; pin?: string };
    device_connection_status: { id: string; phase: 'connecting' | 'connected' };
    device_disconnected: { id: string; devices: BluetoothDevice[] };
    device_read: { id: string; data: number[] };
}

// IpcApi related types
export type DeviceConnectionStatus = { id: string } & (
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
