/* eslint-disable require-await */
import {
    BleError,
    BleErrorCode,
    BleManager,
    Characteristic,
    Device,
    LogLevel,
    ScanOptions,
} from 'react-native-ble-plx';

const DEBUG_LOGS = true;

const debugLog = (...args: any[]) => {
    if (DEBUG_LOGS) {
        // eslint-disable-next-line no-console
        console.log('NativeBleManager: ', ...args);
    }
};

const bluetoothInfoCache: { [deviceUuid: string]: any } = {}; // Allows us to give more granulary error messages.

let connectOptions: Record<string, unknown> = {
    requestMTU: 247,
    connectionPriority: 1,
};

/**
 * Returns the instance of the Bluetooth Low Energy Manager. It initializes it only
 * when it's first needed, preventing the permission prompt happening prematurely.
 * Important: Do NOT access the _bleManager variable directly.
 * Use this function instead.
 * @returns {BleManager} - The instance of the BleManager.
 */
let _bleManager: BleManager | null = null;
export const bleManagerInstance = (): BleManager => {
    if (!_bleManager) {
        _bleManager = new BleManager();
        _bleManager.setLogLevel(LogLevel.Verbose);
    }

    return _bleManager;
};

export const NUS_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
// const NUS_CHARACTERISTIC_NOTIFY = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
// const NUS_CHARACTERISTIC_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
export const devicesUUIDs: Array<string> = [NUS_SERVICE_UUID];

const READ_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
const READ_FREQUENCY_MS = 10;

const scanOptions: ScanOptions = {};

type Base64String = string;
type DeviceMessage = { value: Base64String; timestamp: number };

export interface BLEDeviceWithMetadata {
    bleDevice: Device;
    writeUuid: string;
    notifyUuid: string;
    readOutputQueue: DeviceMessage[];
}

export interface BLEScannedDevice {
    lastSeenTimestamp: number;
    bleDevice: Device;
}

class NativeBleManager {
    bleManager: BleManager;
    private devicesScanList: BLEScannedDevice[] = [];
    public onconnect?: (device: Device) => void;
    public ondisconnect?: (device: Device) => void;

    // There could be devices that are connected to system but not to our app
    private appConnectedDevices: BLEDeviceWithMetadata[] = [];

    constructor() {
        this.bleManager = bleManagerInstance();
        this.enumerate();
    }

    private async enumerate() {
        const connectedDevices = await bleManagerInstance().connectedDevices(devicesUUIDs);
        debugLog('Connected devices on enumerate: ', connectedDevices);

        // Connect app to all devices that are already connected to the system
        connectedDevices.forEach(async device => {
            await this.connectDevice({ deviceOrId: device.id });
        });
    }

    public scanDevices = (
        scanDevicesCallback: (scannedDevices: BLEScannedDevice[]) => void,
        onError?: (error: BleError) => void,
    ) => {
        this.bleManager.startDeviceScan(devicesUUIDs, scanOptions, (error, scannedDevice) => {
            if (error) {
                debugLog('Scan error');
                console.error(error);
                if (onError) {
                    onError(error);
                }
                // TODO: is scan stopped automatically if error occurs?
            }
            if (scannedDevice) {
                debugLog('Scanned device: ', scannedDevice.id, scannedDevice.localName);

                const alreadyScannedDevice = this.devicesScanList.find(
                    d => d.bleDevice.id === scannedDevice.id,
                );
                if (alreadyScannedDevice) {
                    // Device already in the list, update the last seen timestamp
                    alreadyScannedDevice.lastSeenTimestamp = Date.now();

                    return;
                }

                this.devicesScanList.push({
                    lastSeenTimestamp: Date.now(),
                    bleDevice: scannedDevice,
                });
                // Sort by last seen timestamp so that the most recent are first
                this.devicesScanList.sort((a, b) => b.lastSeenTimestamp - a.lastSeenTimestamp);
                scanDevicesCallback(this.devicesScanList);
            }
        });
    };

    public stopDeviceScan = () => {
        this.bleManager.stopDeviceScan();
    };

    public connectDevice = async ({
        deviceOrId,
        timeoutMs,
    }: {
        deviceOrId: Device | string;
        timeoutMs?: number;
    }): Promise<Device> => {
        let device: Device;
        debugLog(`Opening ${deviceOrId}`);

        if (typeof deviceOrId === 'string') {
            debugLog(`Trying to open device: ${deviceOrId}`);
            // await awaitsBleOn(bleManagerInstance());

            // Returns a list of known devices by their identifiers
            const devices = await bleManagerInstance().devices([deviceOrId]);
            debugLog(`Found ${devices.length} already known device(s) with given id`, {
                deviceOrId,
            });
            [device] = devices;

            if (!device) {
                // Returns a list of the peripherals currently connected to the system
                // which have discovered services, connected to system doesn't mean
                // connected to our app, we check that below.
                const connectedDevices = await bleManagerInstance().connectedDevices(devicesUUIDs);
                const connectedDevicesFiltered = connectedDevices.filter(d => d.id === deviceOrId);
                debugLog(
                    `No known device with given id. Found ${connectedDevicesFiltered.length} devices from already connected devices`,
                    { deviceOrId },
                );
                [device] = connectedDevicesFiltered;
            }

            if (!device) {
                // We still don't have a device, so we attempt to connect to it.
                debugLog(
                    `No known nor connected devices with given id. Trying to connect to device`,
                    {
                        deviceOrId,
                        timeoutMs,
                    },
                );

                // Nb ConnectionOptions dropped since it's not used internally by ble-plx.
                try {
                    device = await bleManagerInstance().connectToDevice(deviceOrId, connectOptions);
                } catch (e: any) {
                    debugLog(`Error code: ${e.errorCode}`);
                    if (e.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
                        // If the MTU update did not work, we try to connect without requesting for a specific MTU
                        connectOptions = {};
                        device = await bleManagerInstance().connectToDevice(deviceOrId);
                    } else {
                        throw e;
                    }
                }
            }

            if (!device) {
                throw new Error(`Can't open device ${device}`);
            }
        } else {
            // It was already a Device
            device = deviceOrId;
        }

        if (!(await device.isConnected())) {
            debugLog(`Device found but not connected. connecting...`, {
                timeoutMs,
                connectOptions,
            });
            try {
                await device.connect({ ...connectOptions });
            } catch (error: any) {
                debugLog(`Connect error`, { error });
                if (error.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
                    debugLog(`Device mtu=${device.mtu}, reconnecting`);
                    connectOptions = {};
                    await device.connect();
                } else if (
                    error.iosErrorCode === 14 ||
                    error.reason === 'Peer removed pairing information'
                ) {
                    debugLog(`iOS broken pairing`, {
                        device,
                        bluetoothInfoCache: bluetoothInfoCache[device.id],
                    });
                    const { deviceModel } = bluetoothInfoCache[device.id] || {};
                    const { productName } = deviceModel || {};
                    throw new Error(
                        `Peer removed pairing  ${{
                            deviceName: device.name,
                            productName,
                        }}`,
                    );
                } else {
                    throw error;
                }
            }
        }

        await device.discoverAllServicesAndCharacteristics();

        let characteristics: Characteristic[] =
            await device.characteristicsForService(NUS_SERVICE_UUID);

        // debugLog('Characteristics: ', JSON.stringify(characteristics));

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

        device.monitorCharacteristicForService(
            NUS_SERVICE_UUID,
            notifyCharacteristic.uuid,
            (error, characteristic) => {
                if (error) {
                    console.error('Error monitoring characteristic: ', error);

                    return;
                }
                if (characteristic) {
                    debugLog('Received data: ', characteristic.value);
                    if (characteristic?.value) {
                        this.addDeviceReadOutput(device.id, characteristic.value);
                    }
                } else {
                    console.error('No characteristic received');
                }
            },
        );

        this.addDeviceToAppConnectedDevices({
            bleDevice: device,
            writeUuid: writeCharacteristic.uuid,
            notifyUuid: notifyCharacteristic.uuid,
            readOutputQueue: [],
        });

        debugLog(`Device connected: ${device.id}`);
        debugLog(`Device manufacturerData: ${device.manufacturerData}`);

        this.bleManager.onDeviceDisconnected(device.id, async (error, disconnectedDevice) => {
            if (error) {
                console.error('Device disconnected error', error);
            }
            if (disconnectedDevice) {
                this.removeDeviceFromAppConnectedDevices(disconnectedDevice.id);
            }
        });

        return device;
    };

    public getAllConnectedDevices = async () => {
        return this.appConnectedDevices.map(d => d.bleDevice);
    };

    public findDevice = (deviceId: string) => {
        return this.appConnectedDevices.find(d => d.bleDevice.id === deviceId);
    };

    public disconnectDevice = async (deviceId: string) => {
        debugLog(`Closing ${deviceId}`);
        const device = this.findDevice(deviceId);
        if (device === undefined) {
            console.error(`Device ${deviceId} not found for closing`);
            throw new Error(`Device ${deviceId} not found for closing`);
        }
        await device?.bleDevice.cancelConnection();
    };

    private addDeviceToAppConnectedDevices = (device: BLEDeviceWithMetadata) => {
        debugLog(`Adding device to app connected devices: ${device.bleDevice.id}`);
        const existingDevice = this.findDevice(device.bleDevice.id);
        if (!existingDevice) {
            this.appConnectedDevices.push(device);
            if (this.onconnect) {
                this.onconnect(device.bleDevice);
            }
        }
    };

    private removeDeviceFromAppConnectedDevices = (deviceId: string) => {
        const device = this.findDevice(deviceId);
        if (!device) {
            console.error(`Device ${deviceId} not found for removing`);

            return;
        }

        debugLog(`Removing device from app connected devices: ${device.bleDevice.id}`);
        this.appConnectedDevices = this.appConnectedDevices.filter(
            d => d.bleDevice.id !== device.bleDevice.id,
        );

        if (this.ondisconnect) {
            this.ondisconnect(device.bleDevice);
        }
    };

    private addDeviceReadOutput = (deviceId: string, value: string) => {
        const device = this.findDevice(deviceId);
        if (!device) {
            console.error(`Device ${deviceId} not found for adding read output`);
            throw new Error(`Device ${deviceId} not found for adding read output`);
        }

        debugLog(`Adding device read output: ${deviceId} ${value}`);

        device.readOutputQueue.push({ value, timestamp: Date.now() });

        // sort that oldest are last so we can use pop to read
        device.readOutputQueue.sort((a, b) => b.timestamp - a.timestamp);
    };

    public read = (deviceId: string): Promise<Base64String> => {
        debugLog(`Reading from ${deviceId}`);

        return new Promise<Base64String>((resolve, reject) => {
            const startTime = Date.now();

            // Define a function that tries to read the last element of the array
            const tryRead = () => {
                const device = this.findDevice(deviceId);
                if (!device) {
                    debugLog(`Device ${deviceId} not found for reading`);
                    reject(new Error('Device disconnected or not found.'));

                    return;
                }

                if (device.readOutputQueue.length === 0) {
                    // debugLog('No data to read received yet... waiting');
                    // If the array is empty and we have not exceeded 10 seconds, we try again
                    if (Date.now() - startTime < READ_TIMEOUT_MS) {
                        setTimeout(tryRead, READ_FREQUENCY_MS); // Wait for 10ms before trying again
                    } else {
                        // If we've waited more than 10 seconds, we reject the promise
                        reject(new Error('Read TIMEOUT: No data received in timeframe.'));
                    }
                } else {
                    const message = device.readOutputQueue.pop()!;
                    debugLog("Data received, we're reading from the queue.", message);
                    debugLog(
                        `Remaining messages in queue (${device.readOutputQueue.length}): `,
                        device.readOutputQueue,
                    );

                    // If the array is not empty, we resolve the promise with the last element
                    resolve(message.value);
                }
            };

            tryRead();
        });
    };

    public write = async (deviceId: string, message: Base64String) => {
        const device = this.findDevice(deviceId);
        if (!device) {
            console.error(`Device ${deviceId} not found for writing`);
            throw new Error(`Device ${deviceId} not found for writing`);
        }
        debugLog(`Writing to ${deviceId}: ${message}`);
        try {
            await device.bleDevice.writeCharacteristicWithResponseForService(
                NUS_SERVICE_UUID,
                device.writeUuid,
                message,
            );
            debugLog('Write successful');
        } catch (e) {
            console.error('Error writing: ', JSON.stringify(e));
        }
    };
}

export const nativeBleManager = new NativeBleManager();
