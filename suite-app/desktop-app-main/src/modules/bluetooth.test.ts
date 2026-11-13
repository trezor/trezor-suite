import { type HandshakeClient } from '@suite/desktop-app-api';
import { type IpcProxyHandlerOptions } from '@trezor/ipc-proxy';
import { type BluetoothIpcApi, BluetoothTransport } from '@trezor/transport-bluetooth';
import { createDeferred } from '@trezor/utils';

import { bluetoothModuleState, init } from './bluetooth';
import { type Dependencies, type ModuleQuit } from './module';
import type { ILogger } from '../libs/logger';

const mockHelperStart = jest.fn((): Promise<void> => Promise.resolve());
const mockHelperStop = jest.fn((): Promise<void> => Promise.resolve());
const mockClientInit = jest.fn();
const mockClientGetInfo = jest.fn();
const mockProxy: { options?: IpcProxyHandlerOptions<BluetoothIpcApi> } = {};

jest.mock('child_process', () => ({ exec: jest.fn() }));

jest.mock('../ipcMain', () => ({ looselyTypedIpcMain: {} }));

jest.mock('@trezor/node-utils', () => ({
    getFreePort: jest.fn().mockResolvedValue([21327]),
}));

jest.mock('@trezor/ipc-proxy', () => ({
    createIpcProxyHandler: jest.fn((_ipcMain, _name, options) => {
        mockProxy.options = options;

        return jest.fn();
    }),
}));

jest.mock('@trezor/transport-bluetooth', () => ({
    BluetoothIpc: class {
        init = mockClientInit;
        getInfo = mockClientGetInfo;
        on = jest.fn();
        removeAllListeners = jest.fn();
    },
    BluetoothTransport: class {},
}));

jest.mock('../libs/processes/BluetoothProcess', () => ({
    BluetoothProcess: class {
        start = mockHelperStart;
        stop = mockHelperStop;
        getUrl = () => 'http://localhost:21327/';
        getToken = () => 'token';
    },
}));

const createLogger = (): ILogger => ({
    exit: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
    level: 'mute',
    config: {
        colors: false,
        writeToConsole: false,
        writeToDisk: false,
        outputFile: '',
        outputPath: '',
        logFormat: '',
        dedupeTimeout: 0,
        memoryCap: 0,
    },
    getLog: () => [],
});

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

const initModule = () => {
    const logger = createLogger();
    const module = init({ logger } as unknown as Dependencies);
    if (!module?.onLoad || !module.onQuit) throw new Error('module did not register its hooks');

    return { logger, onLoad: module.onLoad, onQuit: module.onQuit };
};

describe('bluetooth module', () => {
    let onQuit: ModuleQuit | undefined;

    beforeEach(() => {
        mockHelperStart.mockReset().mockResolvedValue(undefined);
        mockHelperStop.mockReset().mockResolvedValue(undefined);
        mockClientInit.mockReset().mockResolvedValue({ success: true, payload: undefined });
        mockClientGetInfo.mockReset().mockResolvedValue({ success: true, payload: {} });
    });

    afterEach(async () => {
        await onQuit?.();
        onQuit = undefined;
    });

    it('starts the helper during module init, before the renderer asks for it', async () => {
        ({ onQuit } = initModule());
        await flushPromises();

        expect(mockHelperStart).toHaveBeenCalledTimes(1);

        // The transport is published to connect only once the module is loaded.
        expect(bluetoothModuleState.getTransport()).toBeUndefined();
    });

    it('getTransportWhenStarted waits for the early start and resolves with the transport', async () => {
        const helperStart = createDeferred<void>();
        mockHelperStart.mockReturnValue(helperStart.promise);
        const { onLoad, onQuit: quit } = initModule();
        onQuit = quit;
        onLoad({} as HandshakeClient);

        let transport: BluetoothTransport | undefined;
        const waiting = bluetoothModuleState.getTransportWhenStarted().then(result => {
            transport = result;
        });
        await flushPromises();
        expect(transport).toBeUndefined();
        expect(bluetoothModuleState.getTransport()).toBeUndefined();

        helperStart.resolve();
        await waiting;

        expect(transport).toBeInstanceOf(BluetoothTransport);
        expect(bluetoothModuleState.getTransport()).toBeInstanceOf(BluetoothTransport);
    });

    it('logs a failed early start and its retry, then starts the helper again on the init request', async () => {
        mockHelperStart
            .mockRejectedValueOnce(new Error('spawn ENOENT'))
            .mockRejectedValueOnce(new Error('spawn ENOENT'));
        const { logger, onLoad, onQuit: quit } = initModule();
        onQuit = quit;
        onLoad({} as HandshakeClient);
        await flushPromises();

        expect(logger.warn).toHaveBeenCalledWith(
            '@trezor/transport-bluetooth',
            expect.stringContaining('spawn ENOENT'),
        );
        expect(logger.warn).toHaveBeenCalledTimes(2);
        expect(await bluetoothModuleState.getTransportWhenStarted()).toBeUndefined();
        expect(mockHelperStart).toHaveBeenCalledTimes(2);

        const instance = await mockProxy.options?.onCreateInstance();
        const state = { knownDevices: [] };
        await instance?.onRequest('init', [state]);

        expect(mockHelperStart).toHaveBeenCalledTimes(3);
        expect(mockClientInit).toHaveBeenCalledWith(state);
        expect(bluetoothModuleState.getTransport()).toBeInstanceOf(BluetoothTransport);
    });

    it('starts the helper again when the early start fails after the init request arrived', async () => {
        const helperStart = createDeferred<void>();
        mockHelperStart.mockReturnValueOnce(helperStart.promise);
        ({ onQuit } = initModule());

        const instance = await mockProxy.options?.onCreateInstance();
        const request = instance?.onRequest('init', [{ knownDevices: [] }]);
        await flushPromises();

        helperStart.reject(new Error('spawn ENOENT'));
        await request;

        expect(mockHelperStart).toHaveBeenCalledTimes(2);
        expect(mockClientInit).toHaveBeenCalledTimes(1);
    });

    it('does not log a start cut short by quitting as failed', async () => {
        const helperStart = createDeferred<void>();
        mockHelperStart.mockReturnValue(helperStart.promise);
        const { logger, onQuit: quit } = initModule();
        await flushPromises();

        const quitting = quit();
        await flushPromises();
        helperStart.resolve();
        await quitting;

        expect(logger.warn).not.toHaveBeenCalled();
        expect(mockHelperStart).toHaveBeenCalledTimes(1);
        expect(mockHelperStop).toHaveBeenCalledTimes(1);
    });

    it('logs the outcome of the early start once the module is loaded', async () => {
        const { logger, onLoad, onQuit: quit } = initModule();
        onQuit = quit;
        await flushPromises();
        onLoad({} as HandshakeClient);

        expect(logger.info).toHaveBeenCalledWith(
            '@trezor/transport-bluetooth',
            'Helper running at http://localhost:21327/',
        );
    });

    it('logs a failed early start again once the module is loaded', async () => {
        mockHelperStart
            .mockRejectedValueOnce(new Error('spawn ENOENT'))
            .mockRejectedValueOnce(new Error('spawn ENOENT'));
        const { logger, onLoad, onQuit: quit } = initModule();
        onQuit = quit;
        await flushPromises();
        onLoad({} as HandshakeClient);

        expect(logger.info).toHaveBeenCalledWith(
            '@trezor/transport-bluetooth',
            expect.stringContaining('early start failed: Error: spawn ENOENT'),
        );
    });

    it('reuses the early start for the init request', async () => {
        const helperStart = createDeferred<void>();
        mockHelperStart.mockReturnValue(helperStart.promise);
        ({ onQuit } = initModule());

        const instance = await mockProxy.options?.onCreateInstance();
        const request = instance?.onRequest('init', [{ knownDevices: [] }]);
        await flushPromises();
        expect(mockClientInit).not.toHaveBeenCalled();

        helperStart.resolve();
        await request;

        expect(mockHelperStart).toHaveBeenCalledTimes(1);
        expect(mockClientInit).toHaveBeenCalledTimes(1);
    });

    it('retries a failed early start once, and getTransportWhenStarted waits for the retry', async () => {
        const earlyStart = createDeferred<void>();
        const retriedStart = createDeferred<void>();
        mockHelperStart
            .mockReturnValueOnce(earlyStart.promise)
            .mockReturnValueOnce(retriedStart.promise);
        const { onLoad, onQuit: quit } = initModule();
        onQuit = quit;
        onLoad({} as HandshakeClient);

        let transport: BluetoothTransport | undefined;
        const waiting = bluetoothModuleState.getTransportWhenStarted().then(result => {
            transport = result;
        });
        earlyStart.reject(new Error('spawn ENOENT'));
        await flushPromises();

        expect(mockHelperStart).toHaveBeenCalledTimes(2);
        expect(transport).toBeUndefined();

        retriedStart.resolve();
        await waiting;

        expect(transport).toBeInstanceOf(BluetoothTransport);
    });

    it('moves the init request and connect, waiting in boot order, onto the early start retry', async () => {
        const earlyStart = createDeferred<void>();
        mockHelperStart.mockReturnValueOnce(earlyStart.promise);
        const { onLoad, onQuit: quit } = initModule();
        onQuit = quit;
        onLoad({} as HandshakeClient);

        const instance = await mockProxy.options?.onCreateInstance();
        const request = instance?.onRequest('init', [{ knownDevices: [] }]);
        const transport = bluetoothModuleState.getTransportWhenStarted();

        earlyStart.reject(new Error('spawn ENOENT'));
        await request;

        expect(mockHelperStart).toHaveBeenCalledTimes(2);
        expect(mockClientInit).toHaveBeenCalledTimes(1);
        expect(await transport).toBeInstanceOf(BluetoothTransport);
    });

    it('holds a request other than init until the start in progress settles', async () => {
        const helperStart = createDeferred<void>();
        mockHelperStart.mockReturnValue(helperStart.promise);
        ({ onQuit } = initModule());

        const instance = await mockProxy.options?.onCreateInstance();
        const request = instance?.onRequest('getInfo', []);
        await flushPromises();
        expect(mockClientGetInfo).not.toHaveBeenCalled();

        helperStart.resolve();

        expect(await request).toEqual({ success: true, payload: {} });
        expect(mockClientGetInfo).toHaveBeenCalledTimes(1);
    });
});
