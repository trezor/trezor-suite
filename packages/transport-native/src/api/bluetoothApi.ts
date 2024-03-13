/* eslint-disable require-await */
import {
    BleErrorCode,
    BleManager,
    Device,
    LogLevel,
    ScanOptions,
    Characteristic,
} from 'react-native-ble-plx';

import { AbstractApi, AbstractApiConstructorParams } from '@trezor/transport/src/api/abstract';
import * as ERRORS from '@trezor/transport/src/errors';
import { AsyncResultWithTypedError } from '@trezor/transport/src/types';

interface ConstructorParams extends AbstractApiConstructorParams {}

interface TransportInterfaceDevice {
    session?: null | string;
    path: string;
    device: USBDevice;
}

const DEBUG_LOGS = true;

const debugLog = (...args: any[]) => {
    if (DEBUG_LOGS) {
        // eslint-disable-next-line no-console
        console.log(...args);
    }
};

const bluetoothInfoCache: { [deviceUuid: string]: any } = {}; // Allows us to give more granulary error messages.

// connectOptions is actually used by react-native-ble-plx even if comment above ConnectionOptions says it's not used
let connectOptions: Record<string, unknown> = {
    // 156 bytes to max the iOS < 10 limit (158 bytes)
    // (185 bytes for iOS >= 10)(up to 512 bytes for Android, but could be blocked at 23 bytes)
    requestMTU: 247,
    // Priority 1 = high. TODO: Check firmware update over BLE PR before merging
    connectionPriority: 1,
};

/**
 * Local error. We cast it to "device disconnected during action" from bridge as it means the same
 */
const INTERFACE_DEVICE_DISCONNECTED = 'The device was disconnected.' as const;

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
export const NUS_CHARACTERISTIC_NOTIFY = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
export const NUS_CHARACTERISTIC_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
export const devicesUUIDs: Array<string> = [NUS_SERVICE_UUID];
const READ_TIMEOUT_MS = 10000;
const READ_FREQUENCY_MS = 10;

const scanOptions: ScanOptions = {};

type Base64String = string;

class NativeBleManager {
    bleManager: BleManager;
    private devicesScanList: Device[] = [];
    public onconnect?: (device: Device) => void;
    public ondisconnect?: (device: Device) => void;
    private devicesReadOutput: {
        [deviceId: string]: { value: Base64String; timestamp: number }[];
    } = {};

    // There could be devices that are connected to system but not to our app
    appConnectedDevices: Device[] = [];

    constructor() {
        this.bleManager = bleManagerInstance();
    }

    public scanDevices = (scanDevicesCallback: (scannedDevices: Device[]) => void) => {
        this.bleManager.startDeviceScan(devicesUUIDs, scanOptions, (error, scannedDevice) => {
            if (error) {
                debugLog('Scan error');
                console.error(error);
                // TODO: is scan stopped automatically if error occurs?
            }
            if (scannedDevice) {
                debugLog('Scanned device: ', scannedDevice.id, scannedDevice.localName);

                if (this.devicesScanList.find(d => d.id === scannedDevice.id)) {
                    return;
                }

                this.devicesScanList.push(scannedDevice);
                scanDevicesCallback(this.devicesScanList);
            }
        });
    };

    public stopDeviceScan = () => {
        this.bleManager.stopDeviceScan();
    };

    public openDevice = async ({
        deviceOrId,
        // needsReconnect,
        timeoutMs,
    }: {
        deviceOrId: Device | string;
        // needsReconnect: boolean;
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

        this.bleManager.onDeviceDisconnected(device.id, async (error, disconnectedDevice) => {
            if (error) {
                console.error('Device disconnected error', error);
            }
            if (disconnectedDevice) {
                this.removeDeviceFromAppConnectedDevices(disconnectedDevice);
            }
        });

        await device.discoverAllServicesAndCharacteristics();

        let characteristics: Characteristic[] =
            await device.characteristicsForService(NUS_SERVICE_UUID);

        debugLog('Characteristics: ', JSON.stringify(characteristics));

        device.monitorCharacteristicForService(
            NUS_SERVICE_UUID,
            NUS_CHARACTERISTIC_NOTIFY,
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

        this.addDeviceToAppConnectedDevices(device);

        debugLog(`Device connected: ${device.id}`);
        debugLog(`Device manufacturerData: ${device.manufacturerData}`);

        return device;

        // TODO: handle needsReconnect
    };

    public findDevice = (deviceId: string) => {
        return this.devicesScanList.find(d => d.id === deviceId);
    };

    public closeDevice = async (deviceId: string) => {
        debugLog(`Closing ${deviceId}`);
        const device = this.findDevice(deviceId);
        if (device === undefined) {
            console.error(`Device ${deviceId} not found for closing`);
        }
        await device?.cancelConnection();
    };

    private addDeviceToAppConnectedDevices = (device: Device) => {
        debugLog(`Adding device to app connected devices: ${device.id}`);
        if (!this.appConnectedDevices.find(d => d.id === device.id)) {
            this.appConnectedDevices.push(device);
            if (this.onconnect) {
                this.onconnect(device);
            }
        }
    };

    private removeDeviceFromAppConnectedDevices = (device: Device) => {
        debugLog(`Removing device from app connected devices: ${device.id}`);
        if (this.appConnectedDevices.find(d => d.id === device.id)) {
            this.appConnectedDevices = this.appConnectedDevices.filter(d => d.id !== device.id);
            if (this.ondisconnect) {
                this.ondisconnect(device);
            }
        }
    };

    private addDeviceReadOutput = (deviceId: string, value: string) => {
        debugLog(`Adding device read output: ${deviceId} ${value}`);
        if (!this.devicesReadOutput[deviceId]) {
            this.devicesReadOutput[deviceId] = [];
        }
        this.devicesReadOutput[deviceId].push({ value, timestamp: Date.now() });
        // sort that oldest are last so when we read we can use pop
        this.devicesReadOutput[deviceId].sort((a, b) => b.timestamp - a.timestamp);
        debugLog(
            `Device read output: ${deviceId} ${JSON.stringify(this.devicesReadOutput[deviceId], null, 2)}`,
        );
    };

    public read = (deviceId: string): Promise<Base64String> => {
        debugLog(`Reading from ${deviceId}`);

        return new Promise<Base64String>((resolve, reject) => {
            const startTime = Date.now();

            // Define a function that tries to read the last element of the array
            const tryRead = () => {
                if (
                    !this.devicesReadOutput[deviceId] ||
                    this.devicesReadOutput[deviceId].length === 0
                ) {
                    // If the array is empty and we have not exceeded 10 seconds, we try again
                    if (Date.now() - startTime < READ_TIMEOUT_MS) {
                        setTimeout(tryRead, READ_FREQUENCY_MS); // Wait for 10ms before trying again
                    } else {
                        // If we've waited more than 10 seconds, we reject the promise
                        reject(new Error('Failed to read from the array within 10 seconds.'));
                    }
                } else {
                    const lastElement = this.devicesReadOutput[deviceId].pop();
                    debugLog("We're reading from the array.", JSON.stringify(lastElement, null, 2));

                    // If the array is not empty, we resolve the promise with the last element
                    resolve(lastElement?.value);
                }
            };

            tryRead();
        });
    };

    public write = async (deviceId: string, message: Base64String) => {
        const device = this.findDevice(deviceId);
        if (!device) {
            console.error(`Device ${deviceId} not found for writing`);
        }
        try {
            const messageBuffer = Buffer.from(message, 'base64');
            console.log('Buffer: ', messageBuffer);
            console.log('Buffer size: ', messageBuffer.length);
            const characteristic = await device.writeCharacteristicWithResponseForService(
                NUS_SERVICE_UUID,
                NUS_CHARACTERISTIC_TX,
                message,
            );
            debugLog('Write successful');
        } catch (e) {
            console.error('Error writing: ', JSON.stringify(e));
        }
    };
}

export const nativeBleManager = new NativeBleManager();

export class BluetoothApi extends AbstractApi {
    devices: TransportInterfaceDevice[] = [];

    constructor({ logger }: ConstructorParams) {
        super({ logger });

        nativeBleManager.onconnect = device => {
            this.devices = [...this.devices, ...this.createDevices([device])];
            this.emit(
                'transport-interface-change',
                this.devices.map(d => d.path),
            );
        };

        nativeBleManager.ondisconnect = device => {
            const index = this.devices.findIndex(d => d.path === device.id);
            if (index > -1) {
                this.devices.splice(index, 1);
                this.emit(
                    'transport-interface-change',
                    this.devices.map(d => d.path),
                );
            } else {
                this.emit('transport-interface-error', ERRORS.DEVICE_NOT_FOUND);
                this.logger.error('device that should be removed does not exist in state');
            }
        };
    }

    private createDevices(devices: Device[]): TransportInterfaceDevice[] {
        return devices.map(device => ({
            path: device.id,
            device: {
                usbVersionMajor: 1,
                usbVersionMinor: 1,
                usbVersionSubminor: 1,
                deviceClass: 0,
                deviceSubclass: 0,
                deviceProtocol: 0,
                vendorId: 1234,
                productId: 1234,
                deviceVersionMajor: 1,
                deviceVersionMinor: 0,
                deviceVersionSubminor: 0,
                manufacturerName: 'Trezor',
                productName: 'Trezor Device',
                serialNumber: 'serialNumber',
                configuration: undefined,
                configurations: [],
                opened: true,
                open: async () => {},
                close: () => nativeBleManager.closeDevice(device.id),
                forget: async () => {},
            } as any,
        }));
    }

    public async enumerate() {
        try {
            const devices = nativeBleManager.appConnectedDevices;

            this.devices = this.createDevices(devices);

            return this.success(this.devices.map(d => d.path));
        } catch (err) {
            // this shouldn't throw
            return this.unknownError(err, []);
        }
    }

    public async read(
        path: string,
    ): AsyncResultWithTypedError<
        ArrayBuffer,
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
        | typeof ERRORS.INTERFACE_DATA_TRANSFER
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof ERRORS.UNEXPECTED_ERROR
    > {
        const device = nativeBleManager.findDevice(path);
        if (!device) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            const res = await nativeBleManager.read(path);

            if (!res) {
                return this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER });
            }

            // convert base64 string to ArrayBuffer
            const data = Buffer.from(res, 'base64');

            return this.success(data);
        } catch (err) {
            if (err.message === INTERFACE_DEVICE_DISCONNECTED) {
                return this.error({ error: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION });
            }

            return this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER, message: err.message });
        }
    }

    public async write(path: string, buffer: Buffer) {
        const device = nativeBleManager.findDevice(path);
        if (!device) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }

        // Set the target chunk size
        const chunkSize = 244;
        const chunks = [];

        for (let i = 0; i < buffer.length; i += chunkSize) {
            let chunk = buffer.slice(i, i + chunkSize);

            // Check if the chunk is smaller than the target size and pad it with zeros
            if (chunk.length < chunkSize) {
                const paddingLength = chunkSize - chunk.length;
                const padding = Buffer.alloc(paddingLength, 0); // Create a buffer filled with zeros for padding
                chunk = Buffer.concat([chunk, padding]); // Concatenate the original chunk with the padding
            }

            // Convert the chunk to a base64 string
            const base64Chunk = chunk.toString('base64');
            chunks.push(base64Chunk);
        }

        try {
            for (const chunk of chunks) {
                await nativeBleManager.write(path, chunk);
            }

            return this.success(undefined);
        } catch (err) {
            return this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER, message: err.message });
        }
    }

    public async openDevice(path: string, first: boolean) {
        // BT does not need to be opened, it opened when connected
        return this.success(undefined);
    }

    public async openInternal(path: string, first: boolean) {
        return this.success(undefined);
    }

    public async closeDevice(path: string) {
        // BT does not need to be closed, it closed when disconnected

        return this.success(undefined);
    }
}
