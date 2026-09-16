import { UsbApi, UsbApiLegacy } from '@trezor/transport-common';

import { NodeUsbTransport } from './nodeusb';

// Mock both native addons so no test ever dlopens a real usb binary. Each factory records that its
// addon was loaded; the WebUSB stubs enumerate nothing.
const mockLoaded = { usb: false, legacy: false };
jest.mock('usb', () => {
    mockLoaded.usb = true;

    return {
        WebUSB: class MockUsb {
            getDevices = () => Promise.resolve([]);
        },
    };
});
jest.mock('usb-legacy', () => {
    mockLoaded.legacy = true;

    return {
        WebUSB: class MockUsbLegacy {
            getDevices = () => Promise.resolve([]);
        },
    };
});

// the transports' private api, and its usb interface, are reached only to drive the addon load
const getApi = (transport: NodeUsbTransport) =>
    transport['api'] as unknown as { usbInterface: { getDevices: () => Promise<unknown> } };

describe('NodeUsbTransport usb implementation selection', () => {
    it('defaults to legacy usb 2.x (UsbApiLegacy) when usbImplementation is omitted', () => {
        const transport = new NodeUsbTransport({ id: 'test' });

        expect(transport['api']).toBeInstanceOf(UsbApiLegacy);
        expect(transport['api']).not.toBeInstanceOf(UsbApi);
    });

    it("uses nusb (UsbApi) for usbImplementation 'nusb'", () => {
        const transport = new NodeUsbTransport({ id: 'test', usbImplementation: 'nusb' });

        expect(transport['api']).toBeInstanceOf(UsbApi);
        expect(transport['api']).not.toBeInstanceOf(UsbApiLegacy);
    });

    it("uses legacy usb 2.x (UsbApiLegacy) for usbImplementation 'legacy'", () => {
        const transport = new NodeUsbTransport({ id: 'test', usbImplementation: 'legacy' });

        expect(transport['api']).toBeInstanceOf(UsbApiLegacy);
        expect(transport['api']).not.toBeInstanceOf(UsbApi);
    });

    it('loads only the selected addon, and only on first use', async () => {
        const legacy = new NodeUsbTransport({ id: 'test', usbImplementation: 'legacy' });
        const nusb = new NodeUsbTransport({ id: 'test', usbImplementation: 'nusb' });
        expect(mockLoaded).toEqual({ usb: false, legacy: false });

        await getApi(legacy).usbInterface.getDevices();
        expect(mockLoaded).toEqual({ usb: false, legacy: true });

        await getApi(nusb).usbInterface.getDevices();
        expect(mockLoaded).toEqual({ usb: true, legacy: true });
    });
});
