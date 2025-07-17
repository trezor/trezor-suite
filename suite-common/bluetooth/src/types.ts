import { DeviceModelInternal } from '@trezor/device-utils';

export type BluetoothAdapterStatus =
    | 'unknown'
    | 'enabled'
    | 'disabled'
    | 'permission-denied'
    | 'not-compatible';

export type BluetoothScanStatus = 'idle' | 'running' | 'error';

export type BluetoothFilterPolicy = {
    pairing: boolean; // accepts connections from all devices
    connected: boolean; // currently connected here or elsewhere
    bond_memory_full: boolean; // new connections cannot be established
};

export type BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal;
    deviceColor: number; // TODO: add proper strict type, plain number is currently used in the codebase
    filterPolicy?: BluetoothFilterPolicy;
};

export type DeviceBluetoothConnectionStatus =
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
          error: string; // Timeout, connection aborted, ...
      };

// Do not export this outside of this suite-common package, Suite uses ist own type
// from the '@trezor/transport-bluetooth' and mobile (native) have its own type as well.
export type BluetoothDeviceCommon = {
    id: string;
    name: string;
    manufacturerData: BluetoothManufacturerData;
    lastUpdatedTimestamp: number;
    connectionStatus: DeviceBluetoothConnectionStatus;
};

export type DeviceBluetoothConnectionStatusType = DeviceBluetoothConnectionStatus['type'];
