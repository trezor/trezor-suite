import { type BluetoothDeviceId } from '@trezor/connect';
import { type DeviceModelInternal } from '@trezor/device-utils';

export type BluetoothAdapterStatus =
    | 'unknown'
    | 'enabled'
    | 'disabled'
    | 'permission-denied'
    | 'not-compatible'
    | 'power-suspending';

export type BluetoothScanStatus = 'idle' | 'running' | 'error';

export type BluetoothFilterPolicy = {
    pairing: boolean; // accepts connections from all devices
    connected: boolean; // currently connected here or elsewhere
    bond_memory_full: boolean; // new connections cannot be established
    user_disconnected: boolean; // manual disconnection do the device
};

export type BluetoothAutoConnectPolicy =
    | { type: 'recently-disconnected'; timestamp: number }
    | { type: 'autoconnect-disabled' };

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
    | { type: 'pairing-canceled' }
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
// It's acceptable to use in @suite-common, where the code is still platform-agnostic, e.g. in unit tests.
export type BluetoothDeviceCommon = {
    id: BluetoothDeviceId;
    name: string;
    manufacturerData: BluetoothManufacturerData;
    lastUpdatedTimestamp: number;
    connectionStatus: DeviceBluetoothConnectionStatus;
    deviceId?: string;
};

export type DeviceBluetoothConnectionStatusType = DeviceBluetoothConnectionStatus['type'];

export type ForgetBluetoothDeviceThunkParams = {
    // This thunk must rely on `bluetoothId` directly. When this thunk is called,
    // the device may already be disconnected, and therefore, it cannot be selected from the state.
    bluetoothId: BluetoothDeviceId;
    isOsUnpairingFinished?: boolean;
};
