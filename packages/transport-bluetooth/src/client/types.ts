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

export interface BluetoothDevice {
    name: string;
    connected: boolean;
    address: string;
    uuid: string;
}

export interface NotificationEvent {
    AdapterStateChanged: { powered: boolean };
    DeviceDiscovered: { uuid: string; devices: BluetoothDevice[] };
    DeviceConnected: { uuid: string; devices: BluetoothDevice[] };
    DeviceConnecting: { phase: string; device: BluetoothDevice };
    DeviceDisconnected: { uuid: string; devices: BluetoothDevice[] };
    DeviceRead: { device: BluetoothDevice; data: number[] };
}
