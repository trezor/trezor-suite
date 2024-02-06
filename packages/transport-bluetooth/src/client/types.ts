import type { TypedEmitter } from '@trezor/utils';

export interface BluetoothDevice {
    id: string;
    name: string;
    macAddress: string; // changes after pairing (linux), unknown on macos
    data: number[]; // advertisement data bytes
    connected: boolean;
    connectionStatus: DeviceConnectionStatus;
    lastUpdatedTimestamp: number; // last known activity from the device (discovery, advertisements)
    paired?: boolean; // known (linux, windows), unknown (macos)
    rssi?: number; // signal strength
}

// IpcApi related types
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
    'adapter-event': boolean;
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
