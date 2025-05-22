import { DeviceModelInternal } from '@trezor/device-utils';

export type BluetoothScanStatus = 'idle' | 'running' | 'error';

export enum BluetoothFilterPolicy {
    FILTERED = 0, // accepts connections from known devices
    UNFILTERED = 1, // accepts connections from all devices (aka pairing mode)
    BOND_MEMORY_FULL = 2, // same as UNFILTERED but new connections cannot be established
}

export type BluetoothManufacturerData = {
    deviceModel: DeviceModelInternal;
    deviceColor: number; // TODO: add proper strict type, plain number is currently used in the codebase
    filterPolicy: BluetoothFilterPolicy | null;
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

export type BluetoothAdapterStatus =
    | 'unknown'
    | 'enabled'
    | 'disabled'
    | 'permission-denied'
    | 'not-compatible';
