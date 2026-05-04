import type { Logger } from '@trezor/transport-abstract';
import type { TypedEmitter } from '@trezor/utils';

export type { Logger } from '@trezor/transport-abstract';

export interface TrezorBluetoothSettings {
    url: string;
    logger?: Logger;
    timeout?: number;
    writeWithResponse?: boolean;
    writeWithDelay?: boolean;
}

export type BluetoothInfo = {
    state: BluetoothAdapterState;
    api_version: string;
    build: string;
    adapter_info: string;
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
     *      [0]: advertising type:
     *             0      - advertising with whitelist
     *             | 0x01 - without whitelist (pairing mode)
     *             | 0x02 - bond memory is full. cannot bond another device
     *             | 0x04 - device currently connected here or elsewhere
     *      [1]: device color
     *      [2]: device code (see MODEL_BLE_CODE)
     */
    data: number[]; // advertisement data bytes
    connected: boolean;
    connectionStatus: DeviceConnectionStatus;
    lastUpdatedTimestamp: number; // last known activity from the device (discovery, advertisements)
    paired?: boolean; // known (linux, windows), unknown (macos)
    rssi?: number; // signal strength
}

export type BluetoothAdapterState = 'enabled' | 'disabled' | 'permission-denied';

export type NotificationCharacteristic = 'read' | 'trezor-push-notification' | 'battery-level';

export interface NotificationEvent {
    adapter_state_changed: { state: BluetoothAdapterState };
    device_discovered: { id: string; devices: BluetoothDevice[] };
    device_updated: { id: string; devices: BluetoothDevice[] };
    device_connected: { id: string; devices: BluetoothDevice[] };
    device_connection_status: { device: BluetoothDevice };
    device_disconnected: { id: string; devices: BluetoothDevice[] };
    device_read: { id: string; characteristic: NotificationCharacteristic; data: number[] };
    open_bluetooth_settings: { id: string }; // see linux.rs/pair_with_timeout()
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

type Success<P> = P extends undefined ? { success: true } : { success: true; payload: P };
type Failure = { success: false; error: string };
export type IpcResponse<P = undefined> = Success<P> | Failure;

export interface BluetoothIpcEvents {
    'adapter-event': BluetoothAdapterState;
    'device-list-update': BluetoothDevice[];
    'device-update': BluetoothDevice;
    'open-bluetooth-settings': { id: string };
}

type TypedManagerEvents = TypedEmitter<BluetoothIpcEvents>;

export interface BluetoothIpcState {
    knownDevices: BluetoothDevice[];
}

export interface BluetoothIpcApi {
    init(state?: BluetoothIpcState): Promise<IpcResponse>;
    getInfo(): Promise<IpcResponse<BluetoothInfo>>;
    dispose(): Promise<IpcResponse>;
    startScan(): Promise<IpcResponse>;
    stopScan(): Promise<IpcResponse>;
    connectDevice(id: string): Promise<IpcResponse>;
    disconnectDevice(id: string): Promise<IpcResponse>;
    /**
     * Forget device by its Bluetooth Id. Supported only on Windows.
     */
    forgetDevice(id: string): Promise<IpcResponse>;
    on: TypedManagerEvents['on'];
    off: TypedManagerEvents['off'];
    removeAllListeners: TypedManagerEvents['removeAllListeners'];
}
