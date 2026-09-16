/* WARNING! This file should be imported ONLY in tests! */

import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import { AbstractApiTransport, type UsbApi } from '@trezor/transport-common';

import * as settingsStore from './src/data/settingsStore';

// Initialize settings store so tests reaching settingsStore.get() (via
// BackendManager, firmwareInfo, etc.) don't trip the pre-set() throw.
settingsStore.set(parseConnectSettings({}));

// mock of navigator.usb
const createTransportApi = (override = {}) =>
    ({
        chunkSize: 0,
        enumerate: () => Promise.resolve({ success: true, payload: [{ path: '1' }] }),
        on: () => {},
        off: () => {},
        once: () => {},
        openDevice: (path: string) => Promise.resolve({ success: true, payload: [{ path }] }),
        closeDevice: () => Promise.resolve({ success: true }),
        write: () => Promise.resolve({ success: true }),
        read: () =>
            Promise.resolve({
                success: true,
                payload: Buffer.from('3f232300110000000c1002180020006000aa010154', 'hex'), // partial proto.Features
                // payload: Buffer.from('3f23230002000000060a046d656f77', 'hex'), // proto.Success
            }),
        listen: () => {},
        dispose: () => {},
        type: 'usb',
        ...override,
    }) as unknown as UsbApi;

// Internal helper: pure DI means connect only ever receives Transport instances,
// so the class form is no longer part of the public test surface — it stays here
const createTestTransportClass = (apiMethods = {}): any =>
    class TestTransport extends AbstractApiTransport {
        name = 'TestTransport' as any;

        constructor(params: ConstructorParameters<typeof AbstractApiTransport>[0]) {
            super({ ...params, api: createTransportApi(apiMethods) });
        }
    };

export const createTestTransport = (apiMethods = {}): any =>
    new (createTestTransportClass(apiMethods))({ id: 'foo-bar-id', messages: {} });

declare global {
    var JestMocks: {
        createTestTransport: typeof createTestTransport;
    };

    type TestFixtures<TestedMethod extends (...args: any) => any> = {
        description: string;
        input: Parameters<TestedMethod>;
        output: ReturnType<TestedMethod>;
    }[];
}

global.JestMocks = {
    createTestTransport,
};
