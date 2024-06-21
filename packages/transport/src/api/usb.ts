import { AbstractApi, AbstractApiConstructorParams, DEVICE_TYPE } from './abstract';
import { AsyncResultWithTypedError, DescriptorApiLevel } from '../types';
import {
    CONFIGURATION_ID,
    ENDPOINT_ID,
    INTERFACE_ID,
    T1_HID_VENDOR,
    TREZOR_USB_DESCRIPTORS,
    WEBUSB_BOOTLOADER_PRODUCT,
} from '../constants';
import { createTimeoutPromise } from '@trezor/utils';

import * as ERRORS from '../errors';

interface ConstructorParams extends AbstractApiConstructorParams {
    usbInterface: USB;
    forceReadSerialOnConnect?: boolean;
}

interface TransportInterfaceDevice {
    session?: null | string;
    path: string;
    device: USBDevice;
}

/**
 * Local error. We cast it to "device disconnected during action" from bridge as it means the same
 */
const INTERFACE_DEVICE_DISCONNECTED = 'The device was disconnected.' as const;

export class UsbApi extends AbstractApi {
    chunkSize = 64;

    protected devices: TransportInterfaceDevice[] = [];
    protected usbInterface: ConstructorParams['usbInterface'];
    private forceReadSerialOnConnect?: boolean;

    constructor({ usbInterface, logger, forceReadSerialOnConnect }: ConstructorParams) {
        super({ logger });

        this.usbInterface = usbInterface;
        this.forceReadSerialOnConnect = forceReadSerialOnConnect;
    }

    public listen() {
        this.usbInterface.onconnect = async event => {
            this.logger?.debug(`usb: onconnect: ${this.formatDeviceForLog(event.device)}`);
            const [_hidDevices, nonHidDevices] = this.filterDevices([event.device]);

            _hidDevices.forEach(() => {
                // hidDevices that do not support webusb. these are very very old. we used to emit unreadable
                // device for these but I am not sure if it is still worth the effort.
                this.logger?.error(
                    `usb: unreadable hid device connected. device: ${this.formatDeviceForLog(event.device)}`,
                );
            });
            if (nonHidDevices.length) {
                this.devices = [...this.devices, ...(await this.createDevices(nonHidDevices))];
                this.emit('transport-interface-change', this.devicesToDescriptors());
            }
        };

        this.usbInterface.ondisconnect = event => {
            const { device } = event;
            if (!device.serialNumber) {
                this.logger?.debug(
                    `usb: ondisconnect: device without serial number:, ${device.productName}, ${device.manufacturerName}`,
                );

                // trezor devices have serial number 468E58AE386B5D2EA8C572A2 or 000000000000000000000000 (for bootloader devices)
                return;
            }

            const index = this.devices.findIndex(d => d.path === device.serialNumber);
            if (index > -1) {
                this.devices.splice(index, 1);
                this.emit('transport-interface-change', this.devicesToDescriptors());
            } else {
                // todo: this doesn't make sense. this error is fired for disconnected dongles, keyboards etc. we are not consuming transport-interface-error anywhere so it doesn't matter, it is just useless
                this.emit('transport-interface-error', ERRORS.DEVICE_NOT_FOUND);
                this.logger?.error('usb: device that should be removed does not exist in state');
            }
        };
    }

    private formatDeviceForLog(device: USBDevice) {
        return JSON.stringify({
            productName: device.productName,
            manufacturerName: device.manufacturerName,
            serialNumber: device.serialNumber,
            vendorId: device.vendorId,
            productId: device.productId,
            deviceVersionMajor: device.deviceVersionMajor,
            deviceVersionMinor: device.deviceVersionMinor,
            opened: device.opened,
            deviceProtocol: device.deviceProtocol,
            deviceClass: device.deviceClass,
            deviceSubclass: device.deviceSubclass,
            usbVersionMajor: device.usbVersionMajor,
            usbVersionMinor: device.usbVersionMinor,
            usbVersionSubminor: device.usbVersionSubminor,
        });
    }

    private matchDeviceType(device: USBDevice) {
        const isBootloader = device.productId === WEBUSB_BOOTLOADER_PRODUCT;
        if (device.deviceVersionMajor === 2) {
            if (isBootloader) {
                return DEVICE_TYPE.TypeT2Boot;
            } else {
                return DEVICE_TYPE.TypeT2;
            }
        } else {
            if (isBootloader) {
                return DEVICE_TYPE.TypeT1WebusbBoot;
            } else {
                return DEVICE_TYPE.TypeT1Webusb;
            }
        }
    }

    private devicesToDescriptors(): DescriptorApiLevel[] {
        return this.devices.map(d => ({
            path: d.path,
            type: this.matchDeviceType(d.device),
            product: d.device.productId,
        }));
    }

    public async enumerate() {
        try {
            this.logger?.debug('usb: enumerate');
            const devices = await this.usbInterface.getDevices();

            const [hidDevices, nonHidDevices] = this.filterDevices(devices);
            this.logger?.debug(
                `usb: enumerate done. connected devices.length: ${devices.length}. trezor old (hid) devices: ${hidDevices.length}. trezor devices: ${nonHidDevices.length}`,
            );

            hidDevices.forEach(d => {
                // hidDevices that do not support webusb. these are very very old. we used to emit unreadable
                // device for these but I am not sure if it is still worth the effort.
                this.logger?.error(
                    `usb: unreadable hid device connected. device: ${this.formatDeviceForLog(d)}`,
                );
            });

            this.devices = await this.createDevices(nonHidDevices);

            return this.success(this.devicesToDescriptors());
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
        const device = this.findDevice(path);
        if (!device) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            this.logger?.debug('usb: device.transferIn');
            const res = await device.transferIn(ENDPOINT_ID, 64);
            this.logger?.debug(
                `usb: device.transferIn done. status: ${res.status}, byteLength: ${res.data?.byteLength}. device: ${this.formatDeviceForLog(device)}`,
            );

            if (!res.data) {
                return this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER });
            }

            return this.success(res.data.buffer);
        } catch (err) {
            this.logger?.error(`usb: device.transferIn error ${err}`);
            if (err.message === INTERFACE_DEVICE_DISCONNECTED) {
                return this.error({ error: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION });
            }

            return this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER, message: err.message });
        }
    }

    public async write(path: string, buffer: Buffer) {
        const device = this.findDevice(path);
        if (!device) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }

        const newArray = new Uint8Array(64);
        newArray.set(new Uint8Array(buffer));

        try {
            // https://wicg.github.io/webusb/#ref-for-dom-usbdevice-transferout
            this.logger?.debug('usb: device.transferOut');
            const result = await device.transferOut(ENDPOINT_ID, newArray);
            this.logger?.debug(
                `usb: device.transferOut done. device: ${this.formatDeviceForLog(device)}`,
            );

            if (result.status !== 'ok') {
                this.logger?.error(`usb: device.transferOut status not ok: ${result.status}`);
                throw new Error('transfer out status not ok');
            }

            return this.success(undefined);
        } catch (err) {
            this.logger?.error(`usb: device.transferOut error ${err}`);
            if (err.message === INTERFACE_DEVICE_DISCONNECTED) {
                return this.error({ error: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION });
            }

            return this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER, message: err.message });
        }
    }

    public async openDevice(path: string, first: boolean) {
        // note: multiple retries to open device. reason:  when another window acquires device, changed session
        // is broadcasted to other clients. they are responsible for releasing interface, which takes some time.
        // if there is only one client working with device, this will succeed using only one attempt.

        // note: why for instead of scheduleAction from @trezor/utils with attempts param. this.openInternal does not throw
        // I would need to throw artificially which is not nice.
        for (let i = 0; i < 5; i++) {
            this.logger?.debug(`usb: openDevice attempt ${i}`);
            const res = await this.openInternal(path, first);
            if (res.success) {
                return res;
            }

            await createTimeoutPromise(100 * i);
        }

        return this.openInternal(path, first);
    }

    private async openInternal(path: string, first: boolean) {
        const device = this.findDevice(path);
        if (!device) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            this.logger?.debug(`usb: device.open`);
            await device.open();
            this.logger?.debug(`usb: device.open done. device: ${this.formatDeviceForLog(device)}`);
        } catch (err) {
            this.logger?.error(`usb: device.open error ${err}`);

            return this.error({
                error: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
                message: err.message,
            });
        }

        if (first) {
            try {
                this.logger?.debug(`usb: device.selectConfiguration ${CONFIGURATION_ID}`);
                await device.selectConfiguration(CONFIGURATION_ID);
                this.logger?.debug(
                    `usb: device.selectConfiguration done: ${CONFIGURATION_ID}. device: ${this.formatDeviceForLog(device)}`,
                );
            } catch (err) {
                this.logger?.error(
                    `usb: device.selectConfiguration error ${err}. device: ${this.formatDeviceForLog(device)}`,
                );
            }
            try {
                // reset fails on ChromeOS and windows
                this.logger?.debug('usb: device.reset');
                await device.reset();
                this.logger?.debug(
                    `usb: device.reset done. device: ${this.formatDeviceForLog(device)}`,
                );
            } catch (err) {
                this.logger?.error(
                    `usb: device.reset error ${err}. device: ${this.formatDeviceForLog(device)}`,
                );
                // empty
            }
        }
        try {
            this.logger?.debug(`usb: device.claimInterface: ${INTERFACE_ID}`);
            // claim device for exclusive access by this app
            await device.claimInterface(INTERFACE_ID);
            this.logger?.debug(
                `usb: device.claimInterface done: ${INTERFACE_ID}. device: ${this.formatDeviceForLog(device)}`,
            );
        } catch (err) {
            this.logger?.error(
                `usb: device.claimInterface error ${err}. device: ${this.formatDeviceForLog(device)}`,
            );

            return this.error({
                error: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
                message: err.message,
            });
        }

        return this.success(undefined);
    }

    public async closeDevice(path: string) {
        const device = this.findDevice(path);
        if (!device) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }

        this.logger?.debug(`usb: closeDevice. device.opened: ${device.opened}`);

        if (device.opened) {
            try {
                const interfaceId = INTERFACE_ID;
                this.logger?.debug(`usb: device.releaseInterface: ${interfaceId}`);
                await device.releaseInterface(interfaceId);
                this.logger?.debug(
                    `usb: device.releaseInterface done: ${interfaceId}. device: ${this.formatDeviceForLog(device)}`,
                );
            } catch (err) {
                this.logger?.error(
                    `usb: releaseInterface error ${err}. device: ${this.formatDeviceForLog(device)}`,
                );
                // ignore
            }
        }
        if (device.opened) {
            try {
                this.logger?.debug(`usb: device.close`);
                await device.close();
                this.logger?.debug(
                    `usb: device.close done. device: ${this.formatDeviceForLog(device)}`,
                );
            } catch (err) {
                this.logger?.debug(
                    `usb: device.close error ${err}. device: ${this.formatDeviceForLog(device)}`,
                );

                return this.error({
                    error: ERRORS.INTERFACE_UNABLE_TO_CLOSE_DEVICE,
                    message: err.message,
                });
            }
        }

        return this.success(undefined);
    }

    private findDevice(path: string) {
        const device = this.devices.find(d => d.path === path);
        if (!device) {
            return;
        }

        return device.device;
    }

    private createDevices(nonHidDevices: USBDevice[]) {
        let bootloaderId = 0;

        return Promise.all(
            nonHidDevices.map(async device => {
                this.logger?.debug(`usb: creating device ${this.formatDeviceForLog(device)}`);

                if (this.forceReadSerialOnConnect) {
                    // try to load serialNumber. if this doesn't succeed, we can still continue normally. the only problem is that multiple devices
                    // connected at the same time will not be properly distinguished.
                    await this.loadSerialNumber(device);
                }

                // path is just serial number
                // more bootloaders => number them, hope for the best
                const { serialNumber } = device;
                let path =
                    serialNumber == null || serialNumber === '' ? 'bootloader' : serialNumber;
                if (path === 'bootloader') {
                    this.logger?.debug('usb: device without serial number!');
                    bootloaderId++;
                    path += bootloaderId;
                }

                return { path, device };
            }),
        );
    }

    /*
     * depending on OS (and specific usb drivers), it might be required to open device in order to read serial number.
     * https://github.com/node-usb/node-usb/issues/546
     */
    private async loadSerialNumber(device: USBDevice) {
        try {
            this.logger?.debug(`usb: loadSerialNumber`);
            await device.open();

            // load serial number.
            await device
                // @ts-expect-error: this is not part of common types between webusb and usb.
                .getStringDescriptor(device.device.deviceDescriptor.iSerialNumber);

            this.logger?.debug(`usb: loadSerialNumber done, serialNumber: ${device.serialNumber}`);
            await device.close();
        } catch (err) {
            this.logger?.error(`usb: loadSerialNumber error ${err}`);
        }
    }

    private deviceIsHid(device: USBDevice) {
        return device.vendorId === T1_HID_VENDOR;
    }

    private filterDevices(devices: USBDevice[]) {
        const trezorDevices = devices.filter(dev => {
            const isTrezor = TREZOR_USB_DESCRIPTORS.some(
                desc => dev.vendorId === desc.vendorId && dev.productId === desc.productId,
            );

            return isTrezor;
        });
        const hidDevices = trezorDevices.filter(dev => this.deviceIsHid(dev));
        const nonHidDevices = trezorDevices.filter(dev => !this.deviceIsHid(dev));

        return [hidDevices, nonHidDevices];
    }

    public dispose() {
        if (this.usbInterface) {
            this.usbInterface.onconnect = null;
            this.usbInterface.ondisconnect = null;
        }
    }
}
