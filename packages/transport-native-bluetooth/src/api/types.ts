export type DeviceConnectionStatus =
    | { type: 'disconnected' }
    | { type: 'pairing' }
    | { type: 'paired' }
    | { type: 'connecting' }
    | { type: 'connected' }
    | { type: 'pairing-error'; error: string }
    | { type: 'connection-error'; error: string };

export type DeviceConnectionStatusChangeEvent = {
    deviceId: string;
    connectionStatus: DeviceConnectionStatus;
};

export interface BluetoothDevice {
    id: string;
    name: string;
    manufacturerData: number[];
    lastUpdatedTimestamp: number;
    connectionStatus: DeviceConnectionStatus;
}
