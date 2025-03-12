import type { DeviceConnectionStatus } from '@trezor/transport-bluetooth';

export type FakeScanStatus = 'running' | 'done';

export type DeviceBluetoothStatus =
    | DeviceConnectionStatus
    | {
          id: string;
          type: 'found' | 'error';
      };

export type DeviceBluetoothStatusType = DeviceBluetoothStatus['type'];
