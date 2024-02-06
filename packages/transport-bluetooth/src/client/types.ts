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
    internal_model: number;
    model_variant: number;
    uuid: string;
    connected: boolean;
    timestamp: number;
    rssi: number;
    pairing_mode: boolean;
    paired: boolean;
    data: number[];
}

export interface NotificationEvent {
    adapter_state_changed: { powered: boolean };
    device_discovered: { uuid: string; devices: BluetoothDevice[] };
    device_updated: { uuid: string; devices: BluetoothDevice[] };
    device_connected: { uuid: string; devices: BluetoothDevice[] };
    device_pairing: { uuid: string; paired: boolean; pin?: string };
    device_connection_status: { uuid: string; phase: 'connecting' | 'connected' };
    device_disconnected: { uuid: string; devices: BluetoothDevice[] };
    device_read: { uuid: string; data: number[] };
}

export type DeviceConnectionStatus = { uuid: string } & (
    | { type: 'pairing'; pin?: string }
    | { type: 'paired' }
    | { type: 'connecting' }
    | { type: 'connected' }
);

type Success<P> = P extends unknown ? { success: true } : { success: true; payload: P };
type Failure = { success: false; error: string };
type ApiResponse<P = unknown> = Success<P> | Failure;

export interface BluetoothApiEvents {
    'adapter-event': boolean;
    'device-list-update': BluetoothDevice[];
    'device-connection-status': DeviceConnectionStatus;
}

type TypedManagerEvents = TypedEmitter<BluetoothApiEvents>;

export interface BluetoothIpcApi {
    getAvailability(): Promise<ApiResponse<boolean>>;
    startScan(): Promise<ApiResponse>;
    stopScan(): Promise<ApiResponse>;
    connectDevice(id: string): Promise<ApiResponse>;
    disconnectDevice(id: string): Promise<ApiResponse>;
    forgetDevice(id: string): Promise<ApiResponse>;
    on: TypedManagerEvents['on'];
    off: TypedManagerEvents['off'];
    removeAllListeners: TypedManagerEvents['removeAllListeners'];
}
