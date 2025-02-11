import {
    BleErrorCode,
    BleManager,
    Characteristic,
    ConnectionOptions,
    Device,
    LogLevel,
    ScanOptions,
    State,
    Subscription,
} from 'react-native-ble-plx';

import { EventEmitter } from 'events';

import { IntervalId } from '@trezor/type-utils';

import { BluetoothDevice, DeviceConnectionStatusChangeEvent } from './types';

type Base64String = string;

type DeviceMessage = {
    value: Base64String;
    timestamp: number;
};

type BleDeviceWithMetadata = {
    bleDevice: Device;
    writeUuid: string;
    notifyUuid: string;
    readOutputQueue: DeviceMessage[];
};

const eventNames = {
    deviceConnectionStatusChange: 'deviceConnectionStatusChange',
    nearbyDevicesChange: 'nearbyDevicesChange',
};

// UUID of the Bluetooth service used to identify a BLE device as Trezor.
const SERVICE_UUID = '8c000001-a59b-4d58-a9ad-073df69fa1b1';

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
    private nearbyDevicesRemovalId: IntervalId | null = null;
    private connectedDevices: BleDeviceWithMetadata[] = [];

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
    ): Subscription => {
        this.eventEmitter.on(eventNames.nearbyDevicesChange, listener);

        return {
            remove: () => this.eventEmitter.off(eventNames.nearbyDevicesChange, listener),
        };
    };

    private emitNearbyDevicesChange = () => {
        this.eventEmitter.emit(eventNames.nearbyDevicesChange, this.nearbyDevices);
    };

    public onDeviceConnectionStatusChange = (
        listener: (event: DeviceConnectionStatusChangeEvent) => void,
    ): Subscription => {
        this.eventEmitter.on(eventNames.deviceConnectionStatusChange, listener);

        return {
            remove: () => this.eventEmitter.off(eventNames.deviceConnectionStatusChange, listener),
        };
    };

    private updateDeviceConnectionStatusChange = (event: DeviceConnectionStatusChangeEvent) => {
        const { deviceId, connectionStatus } = event;
        this.nearbyDevices = this.nearbyDevices.map(d =>
            // Make sure that pairing-error is the final state, reconnecting is not possible.
            d.id === deviceId && d.connectionStatus.type !== 'pairing-error'
                ? { ...d, lastUpdatedTimestamp: Date.now(), connectionStatus }
                : d,
        );
        // TODO: Do not emit any other events when the connection status is pairing-error?
        this.eventEmitter.emit(eventNames.deviceConnectionStatusChange, event);
        this.emitNearbyDevicesChange();
    };

    public startDeviceScan = () => {
        const options: ScanOptions = {
            allowDuplicates: true, // ensures we get frequent scan updates even on iOS
        };
        this.getBleManager().startDeviceScan([SERVICE_UUID], options, (error, scannedDevice) => {
            if (error) {
                errorLog('Scan error', error);
                this.stopStaleNearbyDevicesRemoval();
            }
            if (scannedDevice) {
                debugLog(`Scanned device ${scannedDevice}`);
                const nearbyDeviceIndex = this.nearbyDevices.findIndex(
                    d => d.id === scannedDevice.id,
                );
                if (nearbyDeviceIndex >= 0) {
                    this.nearbyDevices[nearbyDeviceIndex] = {
                        ...this.nearbyDevices[nearbyDeviceIndex],
                        lastUpdatedTimestamp: Date.now(),
                    };
                } else {
                    const manufacturerDataBytes = Buffer.from(
                        scannedDevice.manufacturerData ?? '',
                        'base64',
                    );
                    this.nearbyDevices.unshift({
                        id: scannedDevice.id,
                        name: scannedDevice.name ?? 'Unknown',
                        // Bluetooth company identifier is not expected to be present
                        manufacturerData: Array.from(manufacturerDataBytes).slice(2),
                        lastUpdatedTimestamp: Date.now(),
                        connectionStatus: { type: 'disconnected' },
                    });
                    this.emitNearbyDevicesChange();
                }
            }
        });
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

        const now = Date.now();
        // Since we get frequent scan updates, we can filter disconnected devices quite aggressively.
        const disconnectedCutoffTimestamp = now - 3_000;
        // Pairing requests timeout after 30 seconds on both platforms.
        const pairingErrorCutoffTimestamp = now - 30_000;

        const filteredNearbyDevices = this.nearbyDevices.filter(
            ({ lastUpdatedTimestamp, connectionStatus: { type: status } }) =>
                (status !== 'disconnected' && status !== 'pairing-error') ||
                (status === 'disconnected' && lastUpdatedTimestamp > disconnectedCutoffTimestamp) ||
                (status === 'pairing-error' && lastUpdatedTimestamp > pairingErrorCutoffTimestamp),
        );
        if (filteredNearbyDevices.length !== this.nearbyDevices.length) {
            this.nearbyDevices = filteredNearbyDevices;
            this.emitNearbyDevicesChange();
        }
    };

    public getAllConnectedDevices = () => this.connectedDevices.map(d => d.bleDevice);

    public findConnectedDevice = (deviceId: string) =>
        this.connectedDevices.find(d => d.bleDevice.id === deviceId);

    public connectDevice = async ({
        deviceId,
        timeoutMs = 5_000,
    }: {
        deviceId: string;
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
        [device] = devices;

        if (!device) {
            // Get a list of the peripherals currently connected to the system which have discovered
            // services. Connected to system doesn't mean connected to our app, we check that below.
            const connectedDevices = await this.getBleManager().connectedDevices([SERVICE_UUID]);
            const matchingConnectedDevices = connectedDevices.filter(d => d.id === deviceId);
            debugLog(`Found ${matchingConnectedDevices.length} already connected device(s)`);
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

        this.getBleManager().onDeviceDisconnected(device.id, (error, disconnectedDevice) => {
            if (error) {
                errorLog('Device disconnected error', error);
            }
            if (disconnectedDevice) {
                this.removeConnectedDevice(disconnectedDevice.id);
                this.updateDeviceConnectionStatusChange({
                    deviceId: disconnectedDevice.id,
                    connectionStatus: { type: 'disconnected' },
                });
            }
        });

        debugLog(`Device ${device.id} connected`);
        this.updateDeviceConnectionStatusChange({
            deviceId: device.id,
            connectionStatus: { type: 'connected' },
        });

        return device;
    };

    private handleConnectionError(deviceId: string, error: any) {
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
    }

    private discoverAndTestCharacteristics = async (device: Device) => {
        await device.discoverAllServicesAndCharacteristics();

        const characteristics: Characteristic[] =
            await device.characteristicsForService(SERVICE_UUID);
        if (characteristics.length === 0) {
            throw new Error(
                'No device characteristics found. Make sure the device is connected and has the correct service UUID.',
            );
        }

        let writeCharacteristic: Characteristic | undefined;
        let notifyCharacteristic: Characteristic | undefined;
        for (const characteristic of characteristics) {
            if (characteristic.isWritableWithoutResponse) {
                debugLog('Found write characteristic: ', characteristic.uuid);
                writeCharacteristic = characteristic;
            } else if (characteristic.isNotifiable) {
                debugLog('Found notify characteristic: ', characteristic.uuid);
                notifyCharacteristic = characteristic;
            } else {
                debugLog('Found other unknown characteristic: ', characteristic.uuid);
            }
        }

        if (!writeCharacteristic) {
            throw new Error('Write characteristic not found.');
        }
        if (!notifyCharacteristic) {
            throw new Error('Notify characteristic not found.');
        }

        try {
            await this.attemptToWriteAfterConnect(device, writeCharacteristic.uuid);
        } catch (error: any) {
            debugLog(`Device ${device.id} pairing canceled`);
            this.updateDeviceConnectionStatusChange({
                deviceId: device.id,
                connectionStatus: { type: 'pairing-error', error: error.message },
            });
            // If a pairing request is first accepted on the device but later rejected on the host,
            // the bluetooth connection might stay open, and thus we have to cancel it explicitly.
            await device.cancelConnection();
            throw error;
        }

        device.monitorCharacteristicForService(
            SERVICE_UUID,
            notifyCharacteristic.uuid,
            (error, characteristic) => {
                if (error) {
                    debugLog('Error monitoring characteristic', error);
                } else if (characteristic) {
                    debugLog('Received data', characteristic.value);
                    if (characteristic?.value) {
                        this.addDeviceReadOutput(device.id, characteristic.value);
                    }
                } else {
                    errorLog('No characteristic received');
                }
            },
        );

        this.addConnectedDevice({
            bleDevice: device,
            writeUuid: writeCharacteristic.uuid,
            notifyUuid: notifyCharacteristic.uuid,
            readOutputQueue: [],
        });
    };

    private attemptToWriteAfterConnect = async (device: Device, writeUuid: string) => {
        const timeoutId = setTimeout(() => {
            // If we don't receive the write response in time, assume there is pairing in progress.
            this.updateDeviceConnectionStatusChange({
                deviceId: device.id,
                connectionStatus: { type: 'pairing' },
            });
        }, 500);

        try {
            await device.writeCharacteristicWithResponseForService(
                SERVICE_UUID,
                writeUuid,
                Buffer.from('Proof of connection').toString('base64'),
            );
        } finally {
            clearTimeout(timeoutId);
        }
    };

    private addConnectedDevice = (device: BleDeviceWithMetadata) => {
        debugLog(`Adding device ${device.bleDevice.id} to connected devices`);
        const existingDevice = this.findConnectedDevice(device.bleDevice.id);
        if (!existingDevice) {
            this.connectedDevices.push(device);
        }
    };

    private removeConnectedDevice = (deviceId: string) => {
        const existingDevice = this.findConnectedDevice(deviceId);
        if (existingDevice) {
            debugLog(`Removing device ${existingDevice.bleDevice.id} from connected devices`);
            this.nearbyDevices = this.nearbyDevices.filter(d => d.id !== deviceId);
            this.connectedDevices = this.connectedDevices.filter(d => d.bleDevice.id !== deviceId);
            this.emitNearbyDevicesChange();
        }
    };

    private addDeviceReadOutput = (deviceId: string, value: string) => {
        const device = this.findConnectedDevice(deviceId);
        if (!device) {
            throw new Error(`Device ${deviceId} not found for adding read output`);
        }

        debugLog('Adding device read output', deviceId, value);
        // Use performance.now() since Date.now() is not precise enough for correct sort order.
        device.readOutputQueue.push({ value, timestamp: performance.now() });
        // Sort the messages so that we may use pop() to read them in chronological order.
        device.readOutputQueue.sort((a, b) => b.timestamp - a.timestamp);
    };

    public read = (deviceId: string): Promise<Base64String> => {
        debugLog('Reading from', deviceId);

        return new Promise<Base64String>((resolve, reject) => {
            const startTime = Date.now();

            // Define a function that tries to read the last element of the array
            const tryRead = () => {
                const device = this.findConnectedDevice(deviceId);
                if (!device) {
                    reject(new Error('Device disconnected or not found.'));

                    return;
                }

                if (device.readOutputQueue.length === 0) {
                    debugLog('No data to read received yet... waiting');
                    // If the array is empty, and we have not exceeded read timeout, we try again
                    if (Date.now() - startTime < 60_000) {
                        setTimeout(tryRead, 10); // Wait a while before trying again
                    } else {
                        // If we've waited more than 60 seconds, we reject the promise
                        reject(new Error('Read TIMEOUT: No data received in timeframe.'));
                    }
                } else {
                    const message = device.readOutputQueue.pop()!;
                    debugLog('Reading from the message queue', message);
                    debugLog(device.readOutputQueue.length, 'remaining message(s) in the queue');

                    // If the array is not empty, we resolve the promise with the last element
                    resolve(message.value);
                }
            };

            tryRead();
        });
    };

    public write = async (deviceId: string, message: Base64String) => {
        const device = this.findConnectedDevice(deviceId);
        if (!device) {
            throw new Error(`Device ${deviceId} not found for writing`);
        }

        debugLog('Writing to', deviceId, message);
        try {
            await device.bleDevice.writeCharacteristicWithResponseForService(
                SERVICE_UUID,
                device.writeUuid,
                message,
            );
            debugLog('Write successful');
        } catch (error) {
            errorLog('Write failed', JSON.stringify(error));
        }
    };
}

export const bluetoothManager = new BluetoothManager();
