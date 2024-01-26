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
        expect(spy1).toHaveBeenCalledWith('ActualResponse-arg-1', 'ActualResponse-arg-2');

        const spy2 = jest.fn();
        proxy.on('test-api-event', spy2);

        await proxy.emit('test-api-event');
        expect(spy1).toHaveBeenCalledTimes(2);
        expect(spy2).toHaveBeenCalledTimes(1);

        proxy.off('test-api-event', spy1);
        await proxy.emit('test-api-event');
        expect(spy1).toHaveBeenCalledTimes(2); // listener was removed, number of calls is still the same
        expect(spy2).toHaveBeenCalledTimes(2);

        const spy3 = jest.fn();
        proxy.on('test-api-event', spy3);
        proxy.removeAllListeners('test-api-event');
        await proxy.emit('test-api-event');
        // all listener removed, number of calls is still the same
        expect(spy1).toHaveBeenCalledTimes(2);
        expect(spy2).toHaveBeenCalledTimes(2);
        expect(spy3).toHaveBeenCalledTimes(0);
    });

    it('proper proxy event removing', async () => {
        const proxy = await createIpcProxy<TestApi>('TestApi');
        const spyFoo = jest.fn();
        const spyBar = jest.fn();

        // toString's of these two mock functions are equal anyway,
        // but this return value below is real-life case
        spyFoo.toString = () => 'function () { [native code] }';
        spyBar.toString = () => 'function () { [native code] }';

        proxy.on('test-api-event', spyFoo);
        await proxy.emit('test-api-event');
        expect(spyFoo).toHaveBeenCalledTimes(1);
        expect(spyBar).toHaveBeenCalledTimes(0);

        proxy.on('test-api-event', spyBar);
        await proxy.emit('test-api-event');
        expect(spyFoo).toHaveBeenCalledTimes(2);
        expect(spyBar).toHaveBeenCalledTimes(1);

        proxy.off('test-api-event', spyBar);
        await proxy.emit('test-api-event');
        expect(spyFoo).toHaveBeenCalledTimes(3);
        expect(spyBar).toHaveBeenCalledTimes(1);

        proxy.off('test-api-event', spyFoo);
        await proxy.emit('test-api-event');
        expect(spyFoo).toHaveBeenCalledTimes(3);
        expect(spyBar).toHaveBeenCalledTimes(1);
    });

    it('multiple proxy instances', async () => {
        const proxy1 = await createIpcProxy<TestApi>('TestApi');
        const proxy2 = await createIpcProxy<TestApi>('TestApi');

        const spy1 = jest.fn();
        const spy2 = jest.fn();

        proxy1.on('foo', spy1);
        proxy2.on('foo', spy2);

        await proxy1.emit('foo');
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(0);

        await proxy2.emit('foo');
        await proxy2.emit('foo');
        expect(spy1).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(2);
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
