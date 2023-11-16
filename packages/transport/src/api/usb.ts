import { AbstractApi, AbstractApiConstructorParams } from './abstract';
import { AsyncResultWithTypedError } from '../types';
import {
    CONFIGURATION_ID,
    ENDPOINT_ID,
    INTERFACE_ID,
    T1_HID_VENDOR,
    TREZOR_USB_DESCRIPTORS,
} from '../constants';
import { createTimeoutPromise } from '@trezor/utils';

import * as ERRORS from '../errors';

interface ConstructorParams extends AbstractApiConstructorParams {
    usbInterface: USB;
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
    devices: TransportInterfaceDevice[] = [];
    usbInterface: ConstructorParams['usbInterface'];

    constructor({ usbInterface, logger }: ConstructorParams) {
        super({ logger });

        this.usbInterface = usbInterface;

        if (!this.usbInterface) {
            return;
        }

        this.usbInterface.onconnect = event => {
            this.devices = [...this.devices, ...this.createDevices([event.device])];
            this.emit(
                'transport-interface-change',
                this.devices.map(d => d.path),
            );
        };

        this.usbInterface.ondisconnect = event => {
            const { device } = event;
            if (!device.serialNumber) {
                // this should never happen, if it does, it means, that there is something that passes
                // filters (TREZOR_USB_DESCRIPTORS) but does not have serial number. this could indicate error in fw
                this.emit('transport-interface-error', ERRORS.DEVICE_UNREADABLE);
                this.logger.error('device does not have serial number');
                return;
            }

            const index = this.devices.findIndex(d => d.path === device.serialNumber);
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

    public async enumerate() {
        try {
            const devices = await this.usbInterface.getDevices();

            const [hidDevices, nonHidDevices] = this.filterDevices(devices);

            if (hidDevices.length) {
                // hidDevices that do not support webusb. these are very very old. we used to emit unreadable
                // device for these but I am not sure if it is still worth the effort.
                this.logger.error('unreadable hid device connected');
            }
            this.devices = this.createDevices(nonHidDevices);

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
        const device = this.findDevice(path);
        if (!device) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            const res = await device.transferIn(ENDPOINT_ID, 64);

            if (!res.data) {
                return this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER });
            }

            return this.success(res.data.buffer);
        } catch (err) {
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
            const result = await device.transferOut(ENDPOINT_ID, newArray);
            if (result.status !== 'ok') {
                // should not happen, but could be source of troubles so lets observe it
                this.logger.error(
                    'transport',
                    'usbInterface',
                    'write',
                    'result.status',
                    result.status,
                );
                throw new Error('transfer out status not ok');
            }
            return this.success(undefined);
        } catch (err) {
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
            const res = await this.openInternal(path, first);
            if (res.success) {
                return res;
            }
            await createTimeoutPromise(100 * i);
        }
        return this.openInternal(path, first);
    }

    public async openInternal(path: string, first: boolean) {
        const device = this.findDevice(path);
        if (!device) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            await device.open();
        } catch (err) {
            return this.error({
                error: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
                message: err.message,
            });
        }

        if (first) {
            try {
                await device.selectConfiguration(CONFIGURATION_ID);
                // reset fails on ChromeOS and windows
                await device.reset();
            } catch (err) {
                // empty
            }
        }
        try {
            // claim device for exclusive access by this app
            await device.claimInterface(INTERFACE_ID);
        } catch (err) {
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

        if (device.opened) {
            try {
                const interfaceId = INTERFACE_ID;
                await device.releaseInterface(interfaceId);
            } catch (err) {
                // ignore
            }
        }
        if (device.opened) {
            try {
                await device.close();
            } catch (err) {
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

        return nonHidDevices.map(device => {
            // path is just serial number
            // more bootloaders => number them, hope for the best
            const { serialNumber } = device;
            let path = serialNumber == null || serialNumber === '' ? 'bootloader' : serialNumber;
            if (path === 'bootloader') {
                bootloaderId++;
                path += bootloaderId;
            }
            return { path, device };
        });
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
}
