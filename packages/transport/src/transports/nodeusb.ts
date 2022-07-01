import { WebUSB } from 'usb';

import { Transport, MessageFromTrezor, AcquireInput } from './abstract';
import { buildBuffers } from '../lowlevel/send';
import { receiveAndParse } from '../lowlevel/receive';
import {
    CONFIGURATION_ID,
    DEBUG_ENDPOINT_ID,
    DEBUG_INTERFACE_ID,
    ENDPOINT_ID,
    INTERFACE_ID,
    TREZOR_DESCS,
} from '../constants';

export class NodeUsbTransport extends Transport {
    name = 'NodeUsbTransport';
    webusb: WebUSB;
    _lastDevices: { path: string; device: USBDevice; debug: boolean }[] = [];

    constructor({ debug }: { debug?: boolean }) {
        super({ debug });
        this.webusb = new WebUSB({
            allowAllDevices: true,
        });
    }

    init(debug?: boolean) {
        this.debug = !!debug;
        return Promise.resolve(); // type compatibility
    }

    _filterDevices(devices: any[]) {
        const trezorDevices = devices.filter(device => {
            const isTrezor = TREZOR_DESCS.some(
                desc => device.vendorId === desc.vendorId && device.productId === desc.productId,
            );
            return isTrezor;
        });
        return trezorDevices;
    }

    async _listDevices() {
        const devices = await this.webusb.getDevices();
        this._lastDevices = this._createDevices(devices);
        return this._lastDevices;
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

    _createDevices(devices: any[]) {
        let bootloaderId = 0;

        return devices.map(device => {
            const { serialNumber } = device;
            let path = serialNumber == null || serialNumber === '' ? 'bootloader' : serialNumber;
            if (path === 'bootloader') {
                bootloaderId++;
                path += bootloaderId;
            }
            const debug = this._deviceHasDebugLink(device);
            return { path, device, debug };
        });
    }

    async _connectIn(path: string, debug: boolean, first: boolean) {
        const device: USBDevice = this._findDevice(path);
        await device.open();

        if (first) {
            await device.selectConfiguration(CONFIGURATION_ID);
            try {
                // reset fails on ChromeOS and windows
                await device.reset();
            } catch (error) {
                // do nothing
            }
        }

        const interfaceId = debug ? DEBUG_INTERFACE_ID : INTERFACE_ID;
        await device.claimInterface(interfaceId);
    }

    _findDevice(path: string) {
        const deviceO = this._lastDevices.find(d => d.path === path);
        if (deviceO == null) {
            throw new Error('Action was interrupted.');
        }
        return deviceO.device;
    }

    async _read(path: string, debug: boolean): Promise<ArrayBuffer> {
        const device = this._findDevice(path);
        const endpoint = debug ? DEBUG_ENDPOINT_ID : ENDPOINT_ID;

        try {
            if (!device.opened) {
                await this.acquire({ input: { path }, debug });
            }

            const res = await device.transferIn(endpoint, 64);

            if (!res.data) {
                throw new Error('no data');
            }
            if (res.data.byteLength === 0) {
                return this._read(path, debug);
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

    async enumerate() {
        return (await this._listDevices()).map(info => ({
            path: info.path,
            debug: info.debug,
        }));
    }

    async acquire({
        input,
        debug,
        first = false,
    }: {
        input: AcquireInput;
        debug: boolean;
        first?: boolean;
    }) {
        const { path } = input;
        for (let i = 0; i < 5; i++) {
            if (i > 0) {
                await new Promise(resolve => setTimeout(() => resolve(undefined), i * 200));
            }
            try {
                await this._connectIn(path, debug, first);
                return Promise.resolve('??');
            } catch (e) {
                // ignore
                if (i === 4) {
                    throw e;
                }
            }
        }
        return Promise.resolve('??');
    }

    async call({
        session,
        name,
        path = this._lastDevices[0]?.path || '',
        data,
        debug,
    }: {
        session: string;
        path: string;
        name: string;
        data: Record<string, unknown>;
        debug: boolean;
    }): Promise<MessageFromTrezor> {
        await this.send({ name, path, data, debug, session });
        return this.receive({ path, debug });
    }

    async send({
        path,
        data,
        debug,
        name,
    }: {
        path: string;
        data: Record<string, unknown>;
        debug: boolean;
        session: string;
        name: string;
    }) {
        const device: USBDevice = this._findDevice(path);

        const buffers = buildBuffers(this.messages!, name, data);
        for (const buffer of buffers) {
            const newArray: Uint8Array = new Uint8Array(64);
            newArray[0] = 63;
            newArray.set(new Uint8Array(buffer), 1);

            if (!device.opened) {
                await this.acquire({ input: { path }, debug });
            }

            const endpoint = debug ? DEBUG_ENDPOINT_ID : ENDPOINT_ID;
            device.transferOut(endpoint, newArray);
        }
    }

    async receive({ path, debug }: { path: string; debug: boolean }) {
        const message: MessageFromTrezor = await receiveAndParse(this.messages!, () =>
            this._read(path, debug),
        );
        return message;
    }

    async release(path: string, debug: boolean, last: boolean) {
        const device: USBDevice = await this._findDevice(path);

        const interfaceId = debug ? DEBUG_INTERFACE_ID : INTERFACE_ID;
        await device.releaseInterface(interfaceId);
        if (last) {
            await device.close();
        }
    }
}
