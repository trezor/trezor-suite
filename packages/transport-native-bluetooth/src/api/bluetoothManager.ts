import {
    type BleError,
    BleErrorCode,
    BleManager,
    type Characteristic,
    type ConnectionOptions,
    type Device,
    LogLevel,
    type State,
    type Subscription,
} from 'react-native-ble-plx';

import { EventEmitter } from 'events';

import { readMessageBuffer } from '@trezor/transport/src/utils/readMessageBuffer';
import type { TimerId } from '@trezor/type-utils';

import {
    type BluetoothDevice,
    type DeviceBatteryLevelChangeEvent,
    type DeviceConnectionStatusChangeEvent,
    type DevicePushNotificationEvent,
} from './types';
import { base64ToByteArray, toBluetoothDevice } from './utils';

type DeviceId = string;

type BleDeviceWithMetadata = {
    bleDevice: Device;
    writeCharacteristic: Characteristic;
};

const TrezorService = {
    // UUID of the Bluetooth service used to identify a BLE device as Trezor.
    uuid: '8c000001-a59b-4d58-a9ad-073df69fa1b1',
    characteristics: {
        writeUuid: '8c000002-a59b-4d58-a9ad-073df69fa1b1',
        notifyUuid: '8c000003-a59b-4d58-a9ad-073df69fa1b1',
        pushUuid: '8c000004-a59b-4d58-a9ad-073df69fa1b1',
    },
} as const;

const BatteryService = {
    // UUID of the standardized Battery service.
    uuid: '0000180f-0000-1000-8000-00805f9b34fb',
    characteristics: {
        batteryLevelUuid: '00002a19-0000-1000-8000-00805f9b34fb',
    },
} as const;

const eventNames = {
    nearbyDevicesChange: 'nearbyDevicesChange',
    deviceConnectionStatusChange: 'deviceConnectionStatusChange',
    devicePushNotification: 'devicePushNotification',
    deviceBatteryLevelChange: 'deviceBatteryLevelChange',
} as const;

const DEBUG_LOGS = false;

const debugLog = (...args: any[]) => {
    if (DEBUG_LOGS) {
        // eslint-disable-next-line no-console
        console.log('BluetoothManager', ...args);
    }
};

const errorLog = (...args: any[]) => {
    console.error('BluetoothManager', ...args);
};

class BluetoothManager {
    private bleManager: BleManager | null = null;
    private eventEmitter: EventEmitter = new EventEmitter();
    private nearbyDevices: BluetoothDevice[] = [];
    private nearbyDevicesRemovalId: TimerId | null = null;
    private connectedDevices: Record<DeviceId, BleDeviceWithMetadata> = {};
    private readBuffer = readMessageBuffer();

    private getBleManager() {
        // this ensures that Bluetooth permission is not auto-requested at iOS app startup
        if (this.bleManager === null) {
            this.bleManager = new BleManager();
            this.bleManager.setLogLevel(LogLevel.Verbose);
        }

        return this.bleManager;
    }

    public onAdapterStatusChange = (listener: (state: State) => void): Subscription =>
        this.getBleManager().onStateChange(listener, true);

    public onNearbyDevicesChange = (
        listener: (nearbyDevices: BluetoothDevice[]) => void,
    ): Subscription => this.subscribeTo(eventNames.nearbyDevicesChange, listener);

    public onDeviceConnectionStatusChange = (
        listener: (event: DeviceConnectionStatusChangeEvent) => void,
    ): Subscription => this.subscribeTo(eventNames.deviceConnectionStatusChange, listener);

    public onDevicePushNotification = (
        listener: (event: DevicePushNotificationEvent) => void,
    ): Subscription => this.subscribeTo(eventNames.devicePushNotification, listener);

    public onDeviceBatteryLevelChange = (
        listener: (event: DeviceBatteryLevelChangeEvent) => void,
    ): Subscription => this.subscribeTo(eventNames.deviceBatteryLevelChange, listener);

    private subscribeTo = (eventName: keyof typeof eventNames, listener: (arg: any) => void) => {
        this.eventEmitter.on(eventName, listener);

        return {
            remove: () => this.eventEmitter.off(eventName, listener),
        };
    };

    private emitNearbyDevicesChange = () => {
        this.eventEmitter.emit(eventNames.nearbyDevicesChange, this.nearbyDevices);
    };

    private updateDeviceConnectionStatusChange = (event: DeviceConnectionStatusChangeEvent) => {
        const { deviceId, connectionStatus } = event;
        if (
            connectionStatus.type === 'pairing-canceled' ||
            connectionStatus.type === 'pairing-error'
        ) {
            // If pairing is canceled or fails, the device vanishes and is no longer connectable.
            this.nearbyDevices = this.nearbyDevices.filter(d => d.id !== deviceId);
        } else {
            this.nearbyDevices = this.nearbyDevices.map(d =>
                d.id === deviceId
                    ? { ...d, lastUpdatedTimestamp: Date.now(), connectionStatus }
                    : d,
            );
        }
        this.eventEmitter.emit(eventNames.deviceConnectionStatusChange, event);
        this.emitNearbyDevicesChange();
    };

    private emitDevicePushNotification = (event: DevicePushNotificationEvent) => {
        this.eventEmitter.emit(eventNames.devicePushNotification, event);
    };

    private emitDeviceBatteryLevelChange = (event: DeviceBatteryLevelChangeEvent) => {
        this.eventEmitter.emit(eventNames.deviceBatteryLevelChange, event);
    };

    public startDeviceScan = (errorHandler?: (error: BleError) => void) => {
        this.getBleManager().startDeviceScan(
            [TrezorService.uuid],
            { allowDuplicates: true }, // ensures we get frequent scan updates even on iOS
            (error, scannedDevice) => {
                if (error) {
                    errorLog('Scan error', error);
                    this.stopStaleNearbyDevicesRemoval();
                    errorHandler?.(error);
                }
                if (scannedDevice) {
                    debugLog(`Scanned device ${scannedDevice}`);
                    const nearbyDevice = toBluetoothDevice(scannedDevice);
                    const nearbyDeviceIndex = this.nearbyDevices.findIndex(
                        d => d.id === nearbyDevice.id,
                    );
                    if (nearbyDeviceIndex >= 0) {
                        // @ts-expect-error: indexing with noUncheckedIndexedAccess
                        const oldNearbyDevice: BluetoothDevice =
                            this.nearbyDevices[nearbyDeviceIndex];
                        nearbyDevice.connectionStatus = oldNearbyDevice.connectionStatus;
                        this.nearbyDevices[nearbyDeviceIndex] = nearbyDevice;
                        if (
                            nearbyDevice.manufacturerData[0] !== oldNearbyDevice.manufacturerData[0]
                        ) {
                            this.emitNearbyDevicesChange();
                        }
                    } else {
                        this.nearbyDevices.unshift(nearbyDevice);
                        this.emitNearbyDevicesChange();
                    }
                }
            },
        );
        this.startStaleNearbyDevicesRemoval();
    };

    public stopDeviceScan = () => {
        this.stopStaleNearbyDevicesRemoval();
        this.getBleManager().stopDeviceScan();
    };

    private startStaleNearbyDevicesRemoval = () => {
        if (!this.nearbyDevicesRemovalId) {
            this.removeStaleNearbyDevices();
        }
    };

    private stopStaleNearbyDevicesRemoval = () => {
        if (this.nearbyDevicesRemovalId) {
            clearTimeout(this.nearbyDevicesRemovalId);
            this.nearbyDevicesRemovalId = null;
        }
    };

    private removeStaleNearbyDevices = () => {
        debugLog('Removing stale nearby devices');
        this.nearbyDevicesRemovalId = setTimeout(this.removeStaleNearbyDevices, 1000);

        if (this.nearbyDevices.length === 0) {
            return;
        }

        // Since we get frequent scan updates, we can filter disconnected devices quite aggressively.
        const disconnectedCutoffTimestamp = Date.now() - 3_000;
        const filteredNearbyDevices = this.nearbyDevices.filter(
            ({ lastUpdatedTimestamp, connectionStatus: { type: status } }) =>
                status !== 'disconnected' || lastUpdatedTimestamp > disconnectedCutoffTimestamp,
        );
        if (filteredNearbyDevices.length !== this.nearbyDevices.length) {
            this.nearbyDevices = filteredNearbyDevices;
            this.emitNearbyDevicesChange();
        }
    };

    public isDeviceConnected = (deviceId: DeviceId): boolean =>
        this.connectedDevices[deviceId] !== undefined;

    public getConnectedDeviceIds = () => Object.keys(this.connectedDevices);

    public connectDevice = async ({
        deviceId,
        timeoutMs = 5_000,
    }: {
        deviceId: DeviceId;
        timeoutMs?: number;
    }): Promise<Device> => {
        debugLog(`Connecting device ${deviceId}`);
        this.updateDeviceConnectionStatusChange({
            deviceId,
            connectionStatus: { type: 'connecting' },
        });

        let device: Device;

        // Get a list of known devices by their identifiers.
        const devices = await this.getBleManager().devices([deviceId]);
        debugLog(`Found ${devices.length} already known device(s)`);
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        [device] = devices;

        if (!device) {
            // Get a list of the peripherals currently connected to the system which have discovered
            // services. Connected to system doesn't mean connected to our app, we check that below.
            const connectedDevices = await this.getBleManager().connectedDevices([
                TrezorService.uuid,
            ]);
            const matchingConnectedDevices = connectedDevices.filter(d => d.id === deviceId);
            debugLog(`Found ${matchingConnectedDevices.length} already connected device(s)`);
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            [device] = matchingConnectedDevices;
        }

        const connectionOptions: ConnectionOptions = {
            requestMTU: 247,
            timeout: timeoutMs,
        };

        if (!device) {
            // We still don't have a device, so we attempt to connect to it.
            debugLog(`Trying to connect to device ${deviceId}`, connectionOptions);

            try {
                device = await this.getBleManager().connectToDevice(deviceId, connectionOptions);
            } catch (error: any) {
                debugLog(`Connect error`, { error });
                if (error.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
                    // If the MTU change did not work, try connecting without requesting it.
                    device = await this.getBleManager().connectToDevice(deviceId);
                } else {
                    this.handleConnectionError(deviceId, error);
                    throw error;
                }
            }
        }

        if (!device) {
            throw new Error(`Cannot find device ${deviceId}`);
        }

        if (!(await device.isConnected())) {
            debugLog('Device found but not connected. Connecting...', connectionOptions);
            try {
                await device.connect(connectionOptions);
            } catch (error: any) {
                debugLog(`Connect error`, { error });
                if (error.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
                    debugLog(`Device mtu=${device.mtu}, reconnecting`);
                    await device.connect();
                } else {
                    this.handleConnectionError(deviceId, error);
                    throw error;
                }
            }
        }

        await this.discoverAndTestCharacteristics(device);

        this.getBleManager().onDeviceDisconnected(device.id, this.handleDeviceDisconnected);

        debugLog(`Device ${device.id} connected`);
        this.updateDeviceConnectionStatusChange({
            deviceId: device.id,
            connectionStatus: { type: 'connected' },
        });

        return device;
    };

    private handleConnectionError = (deviceId: DeviceId, error: any) => {
        errorLog('Error connecting to device', error);
        if (
            error.iosErrorCode === 14 /* CBError.Code.peerRemovedPairingInformation */ ||
            error.reason === 'Peer removed pairing information'
        ) {
            this.updateDeviceConnectionStatusChange({
                deviceId,
                connectionStatus: { type: 'pairing-error', error: error.message },
            });
        } else {
            this.updateDeviceConnectionStatusChange({
                deviceId,
                connectionStatus: { type: 'connection-error', error: error.message },
            });
        }
    };

    private discoverAndTestCharacteristics = async (device: Device) => {
        await device.discoverAllServicesAndCharacteristics();

        const trezorCharacteristics = await device.characteristicsForService(TrezorService.uuid);
        const batteryCharacteristics = await device.characteristicsForService(BatteryService.uuid);

        let writeCharacteristic: Characteristic | undefined;
        let notifyCharacteristic: Characteristic | undefined;
        let pushCharacteristic: Characteristic | undefined;
        let batteryCharacteristic: Characteristic | undefined;

        for (const characteristic of trezorCharacteristics) {
            if (characteristic.uuid === TrezorService.characteristics.writeUuid) {
                debugLog('Found write characteristic', characteristic.uuid);
                writeCharacteristic = characteristic;
            } else if (characteristic.uuid === TrezorService.characteristics.notifyUuid) {
                debugLog('Found notify characteristic', characteristic.uuid);
                notifyCharacteristic = characteristic;
            } else if (characteristic.uuid === TrezorService.characteristics.pushUuid) {
                debugLog('Found push characteristic', characteristic.uuid);
                pushCharacteristic = characteristic;
            }
        }
        for (const characteristic of batteryCharacteristics) {
            if (characteristic.uuid === BatteryService.characteristics.batteryLevelUuid) {
                debugLog('Found battery characteristic', characteristic.uuid);
                batteryCharacteristic = characteristic;
            }
        }

        if (!writeCharacteristic) {
            throw new Error('Write characteristic not found.');
        }
        if (!notifyCharacteristic) {
            throw new Error('Notify characteristic not found.');
        }
        if (!pushCharacteristic) {
            throw new Error('Push characteristic not found.');
        }
        if (!batteryCharacteristic) {
            throw new Error('Battery characteristic not found.');
        }

        try {
            await this.attemptToWriteAfterConnect(device, writeCharacteristic);
        } catch (error: any) {
            debugLog(`Device ${device.id} pairing canceled`);
            this.updateDeviceConnectionStatusChange({
                deviceId: device.id,
                connectionStatus: { type: 'pairing-canceled' },
            });
            // If a pairing request is first accepted on the device but later rejected on the host,
            // the bluetooth connection might stay open, and thus we have to cancel it explicitly.
            await device.cancelConnection();
            throw error;
        }

        this.monitorCharacteristic(notifyCharacteristic, 'notify', (value: string) => {
            this.readBuffer.onMessage(device.id, Buffer.from(value, 'base64'));
        });
        this.monitorCharacteristic(pushCharacteristic, 'push', (value: string) => {
            this.emitDevicePushNotification({
                deviceId: device.id,
                data: base64ToByteArray(value),
            });
        });
        this.monitorCharacteristic(batteryCharacteristic, 'battery', (value: string) => {
            this.emitDeviceBatteryLevelChange({
                deviceId: device.id,
                data: base64ToByteArray(value),
            });
        });

        debugLog(`Adding device ${device.id} to connected devices`);
        this.connectedDevices[device.id] = {
            bleDevice: device,
            writeCharacteristic,
        };
    };

    private attemptToWriteAfterConnect = async (
        device: Device,
        writeCharacteristic: Characteristic,
    ) => {
        const timeoutId = setTimeout(() => {
            // If we don't receive the write response in time, assume there is pairing in progress.
            this.updateDeviceConnectionStatusChange({
                deviceId: device.id,
                connectionStatus: { type: 'pairing' },
            });
        }, 500);

        try {
            await writeCharacteristic.writeWithResponse(
                Buffer.from('Proof of connection').toString('base64'),
            );
        } finally {
            clearTimeout(timeoutId);
        }
    };

    private monitorCharacteristic = (
        characteristicToMonitor: Characteristic,
        name: 'notify' | 'push' | 'battery',
        callback: (value: string) => void,
    ) =>
        characteristicToMonitor.monitor((error, characteristic) => {
            if (error) {
                debugLog(`Error monitoring ${name} characteristic:`, error);
            } else if (characteristic) {
                const { deviceID, value } = characteristic;
                debugLog(`Received ${name} characteristic data:`, value);
                if (value) {
                    debugLog(`Processing message for device ${deviceID}:`, value);
                    callback(value);
                }
            }
        });

    public disconnectDevice = ({ deviceId }: { deviceId: DeviceId }) => {
        debugLog(`Disconnecting device ${deviceId}`);

        const device = this.connectedDevices[deviceId];
        if (device) {
            return device.bleDevice.cancelConnection();
        }
    };

    private handleDeviceDisconnected = (error: BleError | null, device: Device | null) => {
        if (error) {
            errorLog('Device disconnected error', error);
        }
        if (device) {
            debugLog(`Device ${device.id} disconnected`);
            this.readBuffer.cancelRead(device.id);
            this.nearbyDevices = this.nearbyDevices.filter(d => d.id !== device.id);
            delete this.connectedDevices[device.id];

            this.emitNearbyDevicesChange();
            this.updateDeviceConnectionStatusChange({
                deviceId: device.id,
                connectionStatus: { type: 'disconnected' },
            });
        }
    };

    public read = (deviceId: DeviceId, signal?: AbortSignal) => {
        debugLog('Reading from', deviceId);

        const device = this.connectedDevices[deviceId];
        if (!device) {
            throw new Error('Device disconnected or not found.');
        }

        return this.readBuffer.read(deviceId, signal);
    };

    public cancelRead = (deviceId: DeviceId) => {
        this.readBuffer.cancelRead(deviceId);
    };

    public write = async (deviceId: DeviceId, message: Buffer) => {
        const device = this.connectedDevices[deviceId];
        if (!device) {
            throw new Error(`Device ${deviceId} not found for writing`);
        }

        debugLog('Writing to', deviceId, message);
        try {
            await device.writeCharacteristic.writeWithoutResponse(message.toString('base64'));
            debugLog('Write successful');
        } catch (error) {
            errorLog('Write failed', JSON.stringify(error));
        }
    };
}

export const bluetoothManager = new BluetoothManager();
