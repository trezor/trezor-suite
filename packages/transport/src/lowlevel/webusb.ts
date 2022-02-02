/// <reference types="w3c-web-usb" />

import { EventEmitter } from 'events';

const T1HID_VENDOR = 0x534c;

const TREZOR_DESCS = [
    // TREZOR v1
    // won't get opened, but we can show error at least
    { vendorId: 0x534c, productId: 0x0001 },
    // TREZOR webusb Bootloader
    { vendorId: 0x1209, productId: 0x53c0 },
    // TREZOR webusb Firmware
    { vendorId: 0x1209, productId: 0x53c1 },
];

const CONFIGURATION_ID = 1;
const INTERFACE_ID = 0;
const ENDPOINT_ID = 1;
const DEBUG_INTERFACE_ID = 1;
const DEBUG_ENDPOINT_ID = 2;

export default class WebUsbPlugin {
    allowsWriteAndEnumerate = true;
    configurationId = CONFIGURATION_ID;
    debug = false;
    debugEndpointId = DEBUG_ENDPOINT_ID;
    debugInterfaceId = DEBUG_INTERFACE_ID;
    name = 'WebUsbPlugin';
    normalEndpointId = ENDPOINT_ID;
    normalInterfaceId = INTERFACE_ID;
    requestNeeded = true;
    unreadableHidDevice = false;
    unreadableHidDeviceChange = new EventEmitter();
    usb?: USB;
    version = '';

    init(debug?: boolean) {
        this.debug = !!debug;
        const { usb } = navigator;
        if (!usb) {
            throw new Error('WebUSB is not available on this browser.');
        } else {
            this.usb = usb;
        }
    }

    _deviceHasDebugLink(device: USBDevice) {
        try {
            const iface = device.configurations[0].interfaces[DEBUG_INTERFACE_ID].alternates[0];
            return (
                iface.interfaceClass === 255 &&
                iface.endpoints[0].endpointNumber === DEBUG_ENDPOINT_ID
            );
        } catch (e) {
            return false;
        }
    }

    _deviceIsHid(device: USBDevice) {
        return device.vendorId === T1HID_VENDOR;
    }

    async _listDevices() {
        let bootloaderId = 0;
        const devices = await this.usb!.getDevices();
        const trezorDevices = devices.filter(dev => {
            const isTrezor = TREZOR_DESCS.some(
                desc => dev.vendorId === desc.vendorId && dev.productId === desc.productId,
            );
            return isTrezor;
        });
        const hidDevices = trezorDevices.filter(dev => this._deviceIsHid(dev));
        const nonHidDevices = trezorDevices.filter(dev => !this._deviceIsHid(dev));

        this._lastDevices = nonHidDevices.map(device => {
            // path is just serial number
            // more bootloaders => number them, hope for the best
            const { serialNumber } = device;
            let path = serialNumber == null || serialNumber === '' ? 'bootloader' : serialNumber;
            if (path === 'bootloader') {
                bootloaderId++;
                path += bootloaderId;
            }
            const debug = this._deviceHasDebugLink(device);
            return { path, device, debug };
        });

        const oldUnreadableHidDevice = this.unreadableHidDevice;
        this.unreadableHidDevice = hidDevices.length > 0;

        if (oldUnreadableHidDevice !== this.unreadableHidDevice) {
            this.unreadableHidDeviceChange.emit('change');
        }

        return this._lastDevices;
    }

    _lastDevices: Array<{ path: string; device: USBDevice; debug: boolean }> = [];

    async enumerate() {
        return (await this._listDevices()).map(info => ({
            path: info.path,
            debug: info.debug,
        }));
    }

    _findDevice(path: string) {
        const deviceO = this._lastDevices.find(d => d.path === path);
        if (deviceO == null) {
            throw new Error('Action was interrupted.');
        }
        return deviceO.device;
    }

    async send(path: string, data: ArrayBuffer, debug: boolean) {
        const device: USBDevice = await this._findDevice(path);

        const newArray: Uint8Array = new Uint8Array(64);
        newArray[0] = 63;
        newArray.set(new Uint8Array(data), 1);

        if (!device.opened) {
            await this.connect(path, debug, false);
        }

        const endpoint = debug ? this.debugEndpointId : this.normalEndpointId;

        return device.transferOut(endpoint, newArray).then(() => {});
    }

    async receive(path: string, debug: boolean): Promise<ArrayBuffer> {
        const device: USBDevice = await this._findDevice(path);
        const endpoint = debug ? this.debugEndpointId : this.normalEndpointId;

        try {
            if (!device.opened) {
                await this.connect(path, debug, false);
            }

            const res = await device.transferIn(endpoint, 64);

            if (!res.data) {
                throw new Error('no data');
            }
            if (res.data.byteLength === 0) {
                return this.receive(path, debug);
            }
            return res.data.buffer.slice(1);
        } catch (e) {
            // @ts-ignore
            if (e.message === 'Device unavailable.') {
                throw new Error('Action was interrupted.');
            } else {
                throw e;
            }
        }
    }

    async connect(path: string, debug: boolean, first: boolean) {
        for (let i = 0; i < 5; i++) {
            if (i > 0) {
                await new Promise(resolve => setTimeout(() => resolve(undefined), i * 200));
            }
            try {
                return await this._connectIn(path, debug, first);
            } catch (e) {
                // ignore
                if (i === 4) {
                    throw e;
                }
            }
        }
    }

    async _connectIn(path: string, debug: boolean, first: boolean) {
        const device: USBDevice = await this._findDevice(path);
        await device.open();

        if (first) {
            await device.selectConfiguration(this.configurationId);
            try {
                // reset fails on ChromeOS and windows
                await device.reset();
            } catch (error) {
                // do nothing
            }
        }

        const interfaceId = debug ? this.debugInterfaceId : this.normalInterfaceId;
        await device.claimInterface(interfaceId);
    }

    async disconnect(path: string, debug: boolean, last: boolean) {
        const device: USBDevice = await this._findDevice(path);

        const interfaceId = debug ? this.debugInterfaceId : this.normalInterfaceId;
        await device.releaseInterface(interfaceId);
        if (last) {
            await device.close();
        }
    }

    async requestDevice() {
        // I am throwing away the resulting device, since it appears in enumeration anyway
        await this.usb!.requestDevice({ filters: TREZOR_DESCS });
    }
}
