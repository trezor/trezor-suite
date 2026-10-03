import {
    type AbstractApi,
    DEVICE_TYPE,
    type DescriptorApiLevel,
    TRANSPORT_ERROR as ERRORS,
    PathInternal,
} from '@trezor/transport-common';

import { CompositeApi } from './composite';

const USB_T2_PATH = PathInternal('usb-t2');
const USB_T1_HID_PATH = PathInternal('usb-t1-hid');
const HID_PATH = PathInternal('hid-0123');

const USB_T2: DescriptorApiLevel = { path: USB_T2_PATH, type: DEVICE_TYPE.TypeT2, apiType: 'usb' };
// The way libusb sees a HID-only Trezor One.
const USB_T1_HID: DescriptorApiLevel = {
    path: USB_T1_HID_PATH,
    type: DEVICE_TYPE.TypeT1Hid,
    apiType: 'usb',
};
const HID_T1: DescriptorApiLevel = { path: HID_PATH, type: DEVICE_TYPE.TypeT1Hid, apiType: 'usb' };

const mockApi = (descriptors: DescriptorApiLevel[]) => {
    const listeners: ((descriptors: DescriptorApiLevel[]) => void)[] = [];
    const methods = {
        enumerate: jest.fn(() => Promise.resolve({ success: true as const, payload: descriptors })),
        openDevice: jest.fn(() => Promise.resolve({ success: true as const, payload: undefined })),
        closeDevice: jest.fn(() => Promise.resolve({ success: true as const, payload: undefined })),
        read: jest.fn(() => Promise.resolve({ success: true as const, payload: Buffer.alloc(64) })),
        write: jest.fn(() => Promise.resolve({ success: true as const, payload: undefined })),
        listen: jest.fn(),
        dispose: jest.fn(),
    };
    const api = {
        ...methods,
        type: 'usb',
        chunkSize: 64,
        on: (_event: string, listener: (descriptors: DescriptorApiLevel[]) => void) =>
            listeners.push(listener),
    } as unknown as AbstractApi;

    return {
        api,
        methods,
        emitChange: (changed: DescriptorApiLevel[]) =>
            listeners.forEach(listener => listener(changed)),
    };
};

const setup = () => {
    const usb = mockApi([USB_T2, USB_T1_HID]);
    const hid = mockApi([HID_T1]);
    const createHidApi = jest.fn(() => hid.api);
    const composite = new CompositeApi({ usbApi: usb.api, createHidApi });

    return { composite, usb, hid, createHidApi };
};

describe(CompositeApi.name, () => {
    it('does not load the HID api until it is enabled', async () => {
        const { composite, createHidApi } = setup();

        expect(await composite.enumerate()).toEqual({
            success: true,
            payload: [USB_T2, USB_T1_HID],
        });
        expect(createHidApi).not.toHaveBeenCalled();
    });

    it('never lets the USB api open a HID-only device', async () => {
        const { composite, usb } = setup();
        await composite.enumerate();

        expect(await composite.openDevice(USB_T1_HID_PATH)).toEqual({
            success: false,
            error: { code: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE },
        });
        expect(usb.methods.openDevice).not.toHaveBeenCalled();
    });

    it('lists the device through the HID api once enabled, instead of the USB one', async () => {
        const { composite, createHidApi } = setup();
        await composite.enumerate();

        const [first, second] = await Promise.all([composite.enableHid(), composite.enableHid()]);

        expect(first).toBe(true);
        expect(second).toBe(true);
        expect(createHidApi).toHaveBeenCalledTimes(1);
        expect(await composite.enumerate()).toEqual({ success: true, payload: [USB_T2, HID_T1] });
    });

    it('keeps serving USB devices when the HID api cannot be created', async () => {
        const { composite, usb, createHidApi } = setup();
        createHidApi.mockImplementation(() => {
            throw new Error('Cannot find module node-hid');
        });

        expect(await composite.enableHid()).toBe(false);
        expect(await composite.enableHid()).toBe(false);
        expect(createHidApi).toHaveBeenCalledTimes(1);
        expect(await composite.enumerate()).toEqual({
            success: true,
            payload: [USB_T2, USB_T1_HID],
        });
        expect(await composite.openDevice(USB_T2_PATH)).toEqual({
            success: true,
            payload: undefined,
        });
        expect(usb.methods.openDevice).toHaveBeenCalledWith(USB_T2_PATH, undefined);
    });

    it('treats a HID api that cannot enumerate as unavailable', async () => {
        const { composite, hid } = setup();
        hid.methods.enumerate.mockResolvedValueOnce({
            success: false,
            error: { code: ERRORS.UNEXPECTED_ERROR },
        } as never);

        expect(await composite.enableHid()).toBe(false);
        expect(hid.methods.dispose).toHaveBeenCalledTimes(1);
        expect(await composite.openDevice(HID_PATH)).toEqual({
            success: false,
            error: { code: ERRORS.DEVICE_NOT_FOUND },
        });
    });

    it('routes device calls by path', async () => {
        const { composite, usb, hid } = setup();
        await composite.enableHid();
        const packet = Buffer.alloc(64);

        await composite.openDevice(HID_PATH, { reset: true });
        await composite.write(HID_PATH, packet);
        await composite.read(HID_PATH);
        await composite.closeDevice(HID_PATH);
        await composite.openDevice(USB_T2_PATH);
        await composite.write(USB_T2_PATH, packet);
        await composite.read(USB_T2_PATH);
        await composite.closeDevice(USB_T2_PATH);

        expect(hid.methods.openDevice).toHaveBeenCalledWith(HID_PATH, { reset: true });
        expect(hid.methods.write).toHaveBeenCalledWith(HID_PATH, packet, undefined);
        expect(hid.methods.read).toHaveBeenCalledWith(HID_PATH, undefined);
        expect(hid.methods.closeDevice).toHaveBeenCalledWith(HID_PATH, undefined);
        expect(usb.methods.openDevice).toHaveBeenCalledTimes(1);
        expect(usb.methods.write).toHaveBeenCalledWith(USB_T2_PATH, packet, undefined);
        expect(usb.methods.read).toHaveBeenCalledWith(USB_T2_PATH, undefined);
        expect(usb.methods.closeDevice).toHaveBeenCalledWith(USB_T2_PATH, undefined);
    });

    it('keeps the devices of one api listed when the other one fails to enumerate', async () => {
        const { composite, usb, hid } = setup();
        await composite.enableHid();
        await composite.enumerate();

        usb.methods.enumerate.mockResolvedValueOnce({
            success: false,
            error: { code: ERRORS.UNEXPECTED_ERROR },
        } as never);
        expect(await composite.enumerate()).toEqual({ success: true, payload: [USB_T2, HID_T1] });

        hid.methods.enumerate.mockResolvedValueOnce({
            success: false,
            error: { code: ERRORS.UNEXPECTED_ERROR },
        } as never);
        expect(await composite.enumerate()).toEqual({ success: true, payload: [USB_T2, HID_T1] });
    });

    it('emits the merged list whenever either api reports a change', async () => {
        const { composite, usb, hid } = setup();
        const onChange = jest.fn();
        composite.on('transport-interface-change', onChange);
        composite.listen();
        await composite.enableHid();

        expect(hid.methods.listen).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenLastCalledWith([HID_T1]);

        usb.emitChange([USB_T2, USB_T1_HID]);
        expect(onChange).toHaveBeenLastCalledWith([USB_T2, HID_T1]);

        hid.emitChange([]);
        expect(onChange).toHaveBeenLastCalledWith([USB_T2]);
    });
});
