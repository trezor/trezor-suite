import type { TypedEmitter } from '@trezor/utils';

export interface Logger {
    info(...args: any[]): void;
    debug(...args: any[]): void;
    log(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
}

export interface TrezorBluetoothSettings {
    url: string;
    logger?: Logger;
    timeout?: number;
}

export type BluetoothInfo = {
    state: BluetoothAdapterState;
    api_version: string;
    adapter_info: string;
    adapter_version: number;
};

// see: ./src/server/device.rs
export interface BluetoothDevice {
    id: string;
    name: string;
    macAddress: string; // changes after pairing (linux), unknown on macos

    /**
     * Manufacturer Specific Data:
     *
     * Bytes:
     *      [0]: fist byte is advertising type.
     *             0 - advertising with whitelist,
     *             1 - without whitelist (pairing mode),
     *             2 - also pairing mode but bond memory is full, cannot bond another dive
     *      [1]: second is device color (interpreted same way as from Device Fetures)
     *      [2-6]: four remaining bytes represent internal device name, i.e. T3W1
     */
    data: number[]; // advertisement data bytes
    connected: boolean;
    connectionStatus: DeviceConnectionStatus;
    lastUpdatedTimestamp: number; // last known activity from the device (discovery, advertisements)
    paired?: boolean; // known (linux, windows), unknown (macos)
    rssi?: number; // signal strength
}

export type BluetoothAdapterState = 'enabled' | 'disabled' | 'permission-denied';

export interface NotificationEvent {
    adapter_state_changed: { state: BluetoothAdapterState };
    device_discovered: { id: string; devices: BluetoothDevice[] };
    device_updated: { id: string; devices: BluetoothDevice[] };
    device_connected: { id: string; devices: BluetoothDevice[] };
    device_connection_status: BluetoothDevice;
    device_disconnected: { id: string; devices: BluetoothDevice[] };
    device_read: { id: string; data: number[] };
    device_settings_ui: undefined; // dispatched by linux pairing process
    device_removed: { id: string };
}

// IpcApi related types
// see: ./src/server/device.rs
export type DeviceConnectionStatus =
    | { type: 'disconnected' }
    | { type: 'pairing'; pin?: string }
    | { type: 'paired' }
    | { type: 'connecting' }
    | { type: 'connected' }
    | {
          type: 'pairing-error'; // This device cannot be paired ever again (new macAddress, new device)
          error: string;
      }
    | {
          type: 'connection-error'; // Out-of-range, offline, in the faraday cage, ...
          error: string;
      };

type Success<P> = P extends unknown ? { success: true } : { success: true; payload: P };
type Failure = { success: false; error: string };
type IpcResponse<P = unknown> = Success<P> | Failure;

export interface BluetoothIpcEvents {
    'adapter-event': BluetoothAdapterState;
    'device-list-update': BluetoothDevice[];
    'device-update': BluetoothDevice;
}

type TypedManagerEvents = TypedEmitter<BluetoothIpcEvents>;

export interface BluetoothIpcState {
    knownDevices: BluetoothDevice[];
}

export interface BluetoothIpcApi {
    init(state?: BluetoothIpcState): Promise<IpcResponse>;
    dispose(): Promise<IpcResponse>;
    startScan(): Promise<IpcResponse>;
    stopScan(): Promise<IpcResponse>;
    connectDevice(id: string): Promise<IpcResponse>;
    disconnectDevice(id: string): Promise<IpcResponse>;
    forgetDevice(id: string): Promise<IpcResponse>;
    on: TypedManagerEvents['on'];
    off: TypedManagerEvents['off'];
    removeAllListeners: TypedManagerEvents['removeAllListeners'];
}
