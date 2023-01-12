import { TransportAbstractInterface } from './abtract';
import type { WebUSB } from 'usb';
import {
    CONFIGURATION_ID,
    ENDPOINT_ID,
    INTERFACE_ID,
    T1HID_VENDOR,
    TREZOR_DESCS,
} from '../constants';

export class TransportUsbInterface extends TransportAbstractInterface<WebUSB, USBDevice> {
    constructor({ transportInterface }: { transportInterface: WebUSB }) {
        super({ transportInterface });

        this.transportInterface.onconnect = event => {
            this.devices = [...this.devices, ...this.createDevices([event.device])];
            this.emit('transport-interface-change', this.devices);
        };

        this.transportInterface.ondisconnect = async event => {
            if (event.device.serialNumber) {
                const index = this.devices.findIndex(d => d.path === event.device.serialNumber!);
                if (index > -1) {
                    this.devices.splice(index, 1);
                    this.emit('transport-interface-change', this.devices);
                } else {
                    console.error('device that should be removed does not exist in state'); // todo: better
                }
            } else {
                console.error('device does not have serial number'); // todo: better
            }
        };
    }

    async enumerate() {
        const devices = await this.transportInterface.getDevices();

        // todo: handle _hidDevices
        const [_hidDevices, nonHidDevices] = this.filterDevices(devices);

        this.devices = this.createDevices(nonHidDevices);

        return this.devices.map(d => d.path);
    }

    async read(path: string): Promise<ArrayBuffer> {
        const device = await this.findDevice(path);

        try {
            if (!device.opened) {
                await this.openDevice(path, false);
            }

            const res = await device.transferIn(ENDPOINT_ID, 64);

            if (!res.data) {
                throw new Error('no data');
            }
            if (res.data.byteLength === 0) {
                return this.read(path);
            }
            return res.data.buffer.slice(1);
        } catch (e) {
            if (e.message === 'Device unavailable.') {
                throw new Error('Action was interrupted.');
            } else {
                throw e;
            }
        }
    }

    async write(path: string, buffer: Buffer) {
        const device = await this.findDevice(path);

        const newArray: Uint8Array = new Uint8Array(64);
        newArray[0] = 63;
        newArray.set(new Uint8Array(buffer), 1);

        return device.transferOut(ENDPOINT_ID, newArray).then(() => {});
    }

    async openDevice(path: string, first: boolean) {
        // todo: add comment why this loop is needed

        for (let i = 0; i < 5; i++) {
            if (i > 0) {
                await new Promise(resolve => setTimeout(() => resolve(undefined), i * 200));
            }
            try {
                const device: USBDevice = this.findDevice(path);

                // note that device.open freezes desktop application if there is suite active in web also. no sync is in place yet
                try {
                    await device.open();
                } catch (err) {
                    // if user revokes usb permissions in browser we need a way how propagate that the device was technically disconnected,
                    if (err.message === 'NotFoundError: The device was disconnected') {
                        this.enumerate();
                    }
                    return;
                }

                // todo: this does not work properly yet, some bug somewhere. Need to "release" device on lowlevel
                if (first) {
                    try {
                        await device.selectConfiguration(CONFIGURATION_ID);

                        // reset fails on ChromeOS and windows
                        await device.reset();
                    } catch (error) {
                        // do nothing
                    }
                }
                // claim device for exclusive access by this app
                await device.claimInterface(INTERFACE_ID);
                break;
            } catch (e) {
                if (e.message?.includes('Unable to claim interface')) {
                    console.log('releaseDevice in acquire. is it ever called?');
                    await this.closeDevice(path);
                }
                if (i === 4) {
                    throw new Error(e);
                }
            }
        }
    }

    async closeDevice(path: string) {
        const device = this.findDevice(path);
        try {
            const interfaceId = INTERFACE_ID;
            await device.releaseInterface(interfaceId);
        } catch (err) {}

        if (device.opened) {
            return device.close();
        }
        return Promise.resolve();
    }

    private findDevice(path: string) {
        const device = this.devices.find(d => d.path === path);
        if (!device) {
            throw new Error('Action was interrupted.');
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
        return device.vendorId === T1HID_VENDOR;
    }

    private filterDevices(devices: any[]) {
        const trezorDevices = devices.filter(dev => {
            const isTrezor = TREZOR_DESCS.some(
                desc => dev.vendorId === desc.vendorId && dev.productId === desc.productId,
            );
            return isTrezor;
        });
        const hidDevices = trezorDevices.filter(dev => this.deviceIsHid(dev));
        const nonHidDevices = trezorDevices.filter(dev => !this.deviceIsHid(dev));
        return [hidDevices, nonHidDevices];
    }
}
