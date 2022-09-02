import { EventEmitter } from 'events';

import { exposeIpcProxy } from '../proxy-generator';
import { createIpcProxyHandler } from '../proxy-handler';
import { createIpcProxy } from '../proxy';
import { ipcRenderer, ipcMain, exposeInMainWorld } from './mockedElectron';

class TestApi extends EventEmitter {
    field = 'some-static-field';

    noArgMethod() {
        return 1;
    }
    oneArgMethod(arg: number) {
        return Promise.resolve(arg.toString());
    }
    twoArgMethod(arg1: boolean, arg2: boolean) {
        return `String ${arg1} ${arg2}`;
    }
}

describe('proxy', () => {
    beforeAll(() => {
        // this is electron-preload context
        // create window.TestApi proxy bridge
        exposeInMainWorld(...exposeIpcProxy(ipcRenderer, ['TestApi']));
    });

    beforeEach(() => {
        ipcRenderer.removeAllListeners();
        ipcMain.removeAllListeners();
        jest.clearAllMocks();

        // this is electron-main context
        createIpcProxyHandler<TestApi>(ipcMain, 'TestApi', {
            onCreateInstance: () => {
                const api = new TestApi();
                return {
                    onRequest: (method, params) => {
                        if (method === 'oneArgMethod') {
                            return api[method](...params);
                        }
                        // unfortunately still needs type-casting
                        // return api[method](...params);
                        return (api[method] as any)(...params);
                    },
                    onAddListener: (eventName, listener) => api.on(eventName, listener),
                    onRemoveListener: eventName => api.removeAllListeners(eventName),
                };
            },
        });
    });

    it('proxy request', async () => {
        const proxy = await createIpcProxy<TestApi>('TestApi');
        const result = await proxy.oneArgMethod(1);
        expect(result).toBe('1');

        try {
            // @ts-expect-error
            await proxy.notFoundMethod();
        } catch (error) {
            expect(error.message).toMatch('is not a function');
        }
    });

    it('proxy events', async () => {
        // const ipcEventName = 'TestApi/event-listener/some-event';
        const spy1 = jest.fn();
        const proxy = await createIpcProxy<TestApi>('TestApi');
        proxy.on('test-api-event', spy1);
        // NOTE: emit fn is async in proxy
        await proxy.emit('test-api-event', 'ActualResponse-arg-1', 'ActualResponse-arg-2');
        expect(spy1).toBeCalledWith('ActualResponse-arg-1', 'ActualResponse-arg-2');

        const spy2 = jest.fn();
        proxy.on('test-api-event', spy2);

        await proxy.emit('test-api-event');
        expect(spy1).toBeCalledTimes(2);
        expect(spy2).toBeCalledTimes(1);

        proxy.off('test-api-event', spy1);
        await proxy.emit('test-api-event');
        expect(spy1).toBeCalledTimes(2); // listener was removed, number of calls is still the same
        expect(spy2).toBeCalledTimes(2);

        const spy3 = jest.fn();
        proxy.on('test-api-event', spy3);
        proxy.removeAllListeners('test-api-event');
        await proxy.emit('test-api-event');
        // all listener removed, number of calls is still the same
        expect(spy1).toBeCalledTimes(2);
        expect(spy2).toBeCalledTimes(2);
        expect(spy3).toBeCalledTimes(0);
    });

    it('invalid channel', async () => {
        try {
            await createIpcProxy<TestApi>('TestApi-2');
        } catch (error) {
            expect(error.message).toMatch(
                'Proxy name TestApi-2 not registered in electron preload',
            );
        }
    });

    it('window.ipcProxy is not defined', async () => {
        // @ts-expect-error
        window.ipcProxy = undefined;

        try {
            await createIpcProxy<TestApi>('TestApi');
        } catch (error) {
            expect(error.message).toMatch('ipcProxy not found');
        }
    });

    it('unregister proxy handler', async () => {
        exposeInMainWorld(
            ...exposeIpcProxy(ipcRenderer, ['TestApi-new'], { proxyName: 'customIpcProxy' }),
        );

        const api = new TestApi();
        const unregister = createIpcProxyHandler<TestApi>(ipcMain, 'TestApi-new', {
            onCreateInstance: () => ({
                onRequest: (method, params) => (api[method] as any)(...params),
            }),
        });

        await createIpcProxy<TestApi>('TestApi-new', { proxyName: 'customIpcProxy' });

        expect(ipcMain.eventNames().length).toEqual(1);

        unregister();

        expect(ipcMain.eventNames().length).toEqual(0);
    });
});
