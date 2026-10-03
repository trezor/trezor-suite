import { getFreePort } from '@trezor/node-utils';
import {
    type AbstractApi,
    DEVICE_TYPE,
    type Descriptor,
    type DescriptorApiLevel,
    TRANSPORT_ERROR as ERRORS,
    PathInternal,
} from '@trezor/transport-common';
import { createDeferred } from '@trezor/utils';

import { CompositeApi } from './api/composite';
import { TrezordNode } from './http';

const APP_ORIGIN = 'https://old-trezors.trezor.io';
const SUITE_ORIGIN = 'https://wallet.trezor.io';

const USB_T2: DescriptorApiLevel = {
    path: PathInternal('usb-t2'),
    type: DEVICE_TYPE.TypeT2,
    apiType: 'usb',
};
// The way libusb sees a HID-only Trezor One.
const USB_T1_HID: DescriptorApiLevel = {
    path: PathInternal('usb-t1-hid'),
    type: DEVICE_TYPE.TypeT1Hid,
    apiType: 'usb',
};
const HID_T1: DescriptorApiLevel = {
    path: PathInternal('hid-0123'),
    type: DEVICE_TYPE.TypeT1Hid,
    apiType: 'usb',
};

const FEATURES_PACKET = Buffer.from('3f232300110000000c1002180020006000aa010154', 'hex');
const CALL_BODY = JSON.stringify({ protocol: 'v1', data: '3f2323000000000000' });
const READ_BODY = JSON.stringify({ protocol: 'v1' });

const muteLogger = {
    info: () => {},
    debug: () => {},
    log: () => {},
    warn: () => {},
    error: () => {},
    getLog: () => [],
};

const mockApi = (descriptors: DescriptorApiLevel[]) => {
    const methods = {
        enumerate: jest.fn(() => Promise.resolve({ success: true as const, payload: descriptors })),
        openDevice: jest.fn(() => Promise.resolve({ success: true as const, payload: undefined })),
        closeDevice: jest.fn(() => Promise.resolve({ success: true as const, payload: undefined })),
        read: jest.fn(
            (..._args: Parameters<AbstractApi['read']>): ReturnType<AbstractApi['read']> =>
                Promise.resolve({ success: true, payload: FEATURES_PACKET }),
        ),
        write: jest.fn(() => Promise.resolve({ success: true as const, payload: undefined })),
        listen: jest.fn(),
        dispose: jest.fn(),
    };
    const api = { ...methods, type: 'usb', chunkSize: 64, on: () => {} } as unknown as AbstractApi;

    return { api, methods };
};

type PostParams = {
    endpoint: string;
    origin: string;
    body?: string;
};

type SetupParams = {
    createHidApi?: () => AbstractApi;
};

const setup = async ({ createHidApi }: SetupParams = {}) => {
    const usb = mockApi([USB_T2, USB_T1_HID]);
    const hid = mockApi([HID_T1]);
    const createHidApiSpy = jest.fn(createHidApi ?? (() => hid.api));
    const trezordNode = new TrezordNode({
        api: new CompositeApi({ usbApi: usb.api, createHidApi: createHidApiSpy }),
        // @ts-expect-error
        logger: muteLogger,
        port: (await getFreePort())[0],
        hid: { origins: [APP_ORIGIN] },
    });
    await trezordNode.start();
    const url = trezordNode.server[0]?.getRouteAddress('/') ?? '/';

    const post = async ({ endpoint, origin, body }: PostParams) => {
        const response = await fetch(`${url}${endpoint}`, {
            method: 'POST',
            headers: { Origin: origin },
            body,
        });
        const text = await response.text();

        return { status: response.status, body: text ? JSON.parse(text) : undefined };
    };

    const enumerate = async (origin: string): Promise<Descriptor[]> =>
        (await post({ endpoint: 'enumerate', origin })).body;

    const findPath = async (origin: string, type: DEVICE_TYPE) =>
        (await enumerate(origin)).find(descriptor => descriptor.type === type)?.path;

    const acquireHidDevice = async () => {
        const path = await findPath(APP_ORIGIN, DEVICE_TYPE.TypeT1Hid);
        const { body } = await post({ endpoint: `acquire/${path}/null`, origin: APP_ORIGIN });

        return body.session as string;
    };

    return { trezordNode, usb, hid, createHidApiSpy, post, enumerate, findPath, acquireHidDevice };
};

describe('http: HID-only Trezor One devices', () => {
    it('reports the version that announces HID support', async () => {
        const { trezordNode, post } = await setup();

        expect((await post({ endpoint: '', origin: SUITE_ORIGIN })).body).toMatchObject({
            version: '3.3.0',
        });

        await trezordNode.stop();
    });

    it('loads the HID backend only for the allowed origin', async () => {
        const { trezordNode, createHidApiSpy, enumerate } = await setup();

        expect(await enumerate(SUITE_ORIGIN)).toMatchObject([
            { type: DEVICE_TYPE.TypeT2 },
            { type: DEVICE_TYPE.TypeT1Hid },
        ]);
        expect(createHidApiSpy).not.toHaveBeenCalled();

        expect(await enumerate(APP_ORIGIN)).toMatchObject([
            { type: DEVICE_TYPE.TypeT2 },
            { type: DEVICE_TYPE.TypeT1Hid },
        ]);
        expect(createHidApiSpy).toHaveBeenCalledTimes(1);

        await trezordNode.stop();
    });

    it.each([
        ['another allowed origin', SUITE_ORIGIN],
        ['the allowed host over http', 'http://old-trezors.trezor.io'],
        ['a subdomain of the allowed host', 'https://evil.old-trezors.trezor.io'],
    ])('refuses to open the device for %s without touching it', async (_, origin) => {
        const { trezordNode, usb, hid, enumerate, findPath, post } = await setup();

        // Before the HID backend is loaded the device is listed by the USB api.
        const usbListedPath = await findPath(origin, DEVICE_TYPE.TypeT1Hid);
        expect(await post({ endpoint: `acquire/${usbListedPath}/null`, origin })).toEqual({
            status: 400,
            body: { error: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE },
        });

        await enumerate(APP_ORIGIN);
        const hidListedPath = await findPath(origin, DEVICE_TYPE.TypeT1Hid);
        expect(hidListedPath).not.toBe(usbListedPath);
        expect(await post({ endpoint: `acquire/${hidListedPath}/null`, origin })).toEqual({
            status: 400,
            body: { error: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE },
        });

        expect(usb.methods.openDevice).not.toHaveBeenCalled();
        expect(hid.methods.openDevice).not.toHaveBeenCalled();

        await trezordNode.stop();
    });

    it('lets the allowed origin use the device', async () => {
        const { trezordNode, hid, acquireHidDevice, post } = await setup();

        const session = await acquireHidDevice();

        expect(hid.methods.openDevice).toHaveBeenCalledWith(HID_T1.path, {
            reset: false,
            signal: expect.any(AbortSignal),
        });
        expect(
            await post({ endpoint: `call/${session}`, origin: APP_ORIGIN, body: CALL_BODY }),
        ).toMatchObject({ status: 200, body: { protocol: 'v1' } });
        expect(
            await post({ endpoint: `post/${session}`, origin: APP_ORIGIN, body: CALL_BODY }),
        ).toMatchObject({ status: 200 });
        expect(
            await post({ endpoint: `read/${session}`, origin: APP_ORIGIN, body: READ_BODY }),
        ).toMatchObject({ status: 200, body: { protocol: 'v1' } });
        expect(await post({ endpoint: `release/${session}`, origin: APP_ORIGIN })).toEqual({
            status: 200,
            body: { session },
        });
        expect(hid.methods.closeDevice).toHaveBeenCalledTimes(1);

        await trezordNode.stop();
    });

    it('hides the session of the allowed origin from every other origin', async () => {
        const { trezordNode, hid, acquireHidDevice, enumerate, post } = await setup();
        const session = await acquireHidDevice();
        hid.methods.read.mockClear();
        hid.methods.write.mockClear();
        const sessionNotFound = { status: 400, body: { error: ERRORS.SESSION_NOT_FOUND } };

        expect(
            await post({ endpoint: `call/${session}`, origin: SUITE_ORIGIN, body: CALL_BODY }),
        ).toEqual(sessionNotFound);
        expect(
            await post({ endpoint: `post/${session}`, origin: SUITE_ORIGIN, body: CALL_BODY }),
        ).toEqual(sessionNotFound);
        expect(
            await post({ endpoint: `read/${session}`, origin: SUITE_ORIGIN, body: READ_BODY }),
        ).toEqual(sessionNotFound);
        expect(await post({ endpoint: `release/${session}`, origin: SUITE_ORIGIN })).toEqual(
            sessionNotFound,
        );

        expect(hid.methods.read).not.toHaveBeenCalled();
        expect(hid.methods.write).not.toHaveBeenCalled();
        expect(hid.methods.closeDevice).not.toHaveBeenCalled();
        expect(await enumerate(APP_ORIGIN)).toContainEqual(
            expect.objectContaining({ type: DEVICE_TYPE.TypeT1Hid, session }),
        );

        await trezordNode.stop();
    });

    it('does not let another origin take the session over', async () => {
        const { trezordNode, hid, acquireHidDevice, findPath, post } = await setup();
        const session = await acquireHidDevice();
        const path = await findPath(SUITE_ORIGIN, DEVICE_TYPE.TypeT1Hid);

        expect(
            await post({ endpoint: `acquire/${path}/${session}`, origin: SUITE_ORIGIN }),
        ).toEqual({ status: 400, body: { error: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE } });
        expect(hid.methods.openDevice).toHaveBeenCalledTimes(1);
        expect(
            await post({ endpoint: `call/${session}`, origin: APP_ORIGIN, body: CALL_BODY }),
        ).toMatchObject({ status: 200 });

        await trezordNode.stop();
    });

    it('does not let another origin abort a call in progress', async () => {
        const { trezordNode, hid, acquireHidDevice, post } = await setup();
        const session = await acquireHidDevice();
        const deviceResponse = createDeferred<Awaited<ReturnType<typeof hid.methods.read>>>();
        const readStarted = createDeferred();
        hid.methods.read.mockImplementationOnce(() => {
            readStarted.resolve();

            return deviceResponse.promise;
        });

        const call = post({ endpoint: `call/${session}`, origin: APP_ORIGIN, body: CALL_BODY });
        await readStarted.promise;

        expect(await post({ endpoint: `abort/${session}`, origin: SUITE_ORIGIN })).toEqual({
            status: 400,
            body: { error: ERRORS.SESSION_NOT_FOUND },
        });

        deviceResponse.resolve({ success: true, payload: FEATURES_PACKET });
        expect(await call).toMatchObject({ status: 200, body: { protocol: 'v1' } });

        await trezordNode.stop();
    });

    it('lets the allowed origin abort its own call', async () => {
        const { trezordNode, hid, acquireHidDevice, post } = await setup();
        const session = await acquireHidDevice();
        const readStarted = createDeferred();
        hid.methods.read.mockImplementationOnce(
            (...[, options]: Parameters<AbstractApi['read']>) =>
                new Promise(resolve => {
                    readStarted.resolve();
                    options?.signal?.addEventListener('abort', () =>
                        resolve({
                            success: false,
                            error: { code: ERRORS.ABORTED_BY_SIGNAL },
                        }),
                    );
                }),
        );

        const call = post({ endpoint: `call/${session}`, origin: APP_ORIGIN, body: CALL_BODY });
        await readStarted.promise;

        expect(await post({ endpoint: `abort/${session}`, origin: APP_ORIGIN })).toEqual({
            status: 200,
            body: { success: true },
        });
        expect(await call).toMatchObject({
            status: 400,
            body: { error: ERRORS.ABORTED_BY_SIGNAL },
        });

        await trezordNode.stop();
    });

    it('keeps other devices available to every allowed origin', async () => {
        const { trezordNode, usb, enumerate, findPath, post } = await setup();
        await enumerate(APP_ORIGIN);
        const path = await findPath(SUITE_ORIGIN, DEVICE_TYPE.TypeT2);

        const acquired = await post({ endpoint: `acquire/${path}/null`, origin: SUITE_ORIGIN });
        expect(acquired.status).toBe(200);
        expect(usb.methods.openDevice).toHaveBeenCalledTimes(1);
        expect(
            await post({
                endpoint: `call/${acquired.body.session}`,
                origin: SUITE_ORIGIN,
                body: CALL_BODY,
            }),
        ).toMatchObject({ status: 200 });
        expect(
            await post({ endpoint: `release/${acquired.body.session}`, origin: SUITE_ORIGIN }),
        ).toMatchObject({ status: 200 });

        await trezordNode.stop();
    });

    it('keeps the device unreadable for everyone when the HID backend fails to load', async () => {
        const { trezordNode, usb, findPath, post } = await setup({
            createHidApi: () => {
                throw new Error('Cannot find module node-hid');
            },
        });

        const path = await findPath(APP_ORIGIN, DEVICE_TYPE.TypeT1Hid);

        expect(await post({ endpoint: `acquire/${path}/null`, origin: APP_ORIGIN })).toEqual({
            status: 400,
            body: { error: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE },
        });
        expect(usb.methods.openDevice).not.toHaveBeenCalled();

        await trezordNode.stop();
    });
});
